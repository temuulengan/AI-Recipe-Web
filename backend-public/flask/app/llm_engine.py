import os
import re
import json
from typing import List, Optional

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from pydantic import BaseModel, Field

# ==========================================
# 1. 설정 및 전역 변수
# ==========================================

# Docker 컨테이너 내부 경로 설정 (환경에 맞게 수정 가능)
VECTOR_STORE_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "faiss_index")
EMBEDDING_MODEL = "text-embedding-3-small"

# 전역 변수 (메모리 로드용)
vector_store = None
retriever = None

# ==========================================
# 2. 데이터 모델 (Pydantic)
# ==========================================

class RecipeDetail(BaseModel):
    name: str = Field(description="Original recipe name")
    url: str = Field(description="Recipe URL")
    category: str = Field(description="Nationality/Category")
    ingredients: List[str] = Field(description="List of ingredients with quantities")
    steps: List[str] = Field(description="Detailed cooking steps")

class ChefOutput(BaseModel):
    # 검색 실패 시 억지 생성을 막기 위한 플래그
    found_match: bool = Field(description="True if a suitable recipe was found among candidates, False otherwise.")
    best_recipe: Optional[RecipeDetail] = Field(
        description="The SINGLE best matching recipe. Set to null/empty if found_match is False."
    )
    selection_reason: str = Field(
        description="Why this recipe was chosen OR why no suitable recipe was found."
    )

# ==========================================
# 3. 유틸리티 함수
# ==========================================

def detect_language(text: str) -> str:
    """입력 텍스트의 언어를 감지합니다 (한글 포함 여부)."""
    if re.search("[가-힣]", text):
        return "Korean"
    return "English"

def format_docs_for_selection(docs) -> str:
    """검색된 문서를 1단계 Selector가 읽기 편한 포맷으로 변환"""
    formatted = ""
    for i, doc in enumerate(docs):
        url = doc.metadata.get("url", "")
        if not url:
            url = doc.metadata.get("source", "")
        formatted += f"[Candidate {i+1}]\nURL: {url}\nContent: {doc.page_content}\n---\n"
    return formatted

# ==========================================
# 4. 초기화 함수 (서버 시작 시 호출)
# ==========================================

def load_data_from_db(db_session=None):
    """
    서버 시작 시 호출되어 FAISS 인덱스를 메모리에 로드합니다.
    """
    global vector_store, retriever
    
    print(f"🔍 [LLM Engine] FAISS 인덱스 로딩 중... 경로: {VECTOR_STORE_PATH}")

    if not os.path.exists(VECTOR_STORE_PATH):
        print(f"🚨 [LLM Engine] 오류: '{VECTOR_STORE_PATH}' 폴더를 찾을 수 없습니다.")
        return

    try:
        api_key = os.environ.get("OPENAI_API_KEY")
        if not api_key:
            print("🚨 [LLM Engine] OPENAI_API_KEY가 환경 변수에 없습니다.")
            return

        embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL, openai_api_key=api_key)
        
        # 로컬 FAISS 인덱스 로드
        vector_store = FAISS.load_local(
            VECTOR_STORE_PATH, 
            embeddings, 
            allow_dangerous_deserialization=True
        )
        
        # Retriever 생성 (Selector에게 충분한 후보군 제공을 위해 k=10 설정)
        retriever = vector_store.as_retriever(search_kwargs={"k": 10})
        print("✅ [LLM Engine] FAISS 인덱스 로드 완료! (k=10)")
        
    except Exception as e:
        print(f"🚨 [LLM Engine] FAISS 로드 중 오류: {e}")

# ==========================================
# 5. 파이프라인 단계별 함수 (Stage 1, 2, 3)
# ==========================================

def run_stage1_selector(docs, user_question, model_name):
    """[1단계] 후보군 중에서 최적의 레시피 1개 선정 (없으면 거절)"""
    llm = ChatOpenAI(model=model_name, temperature=0, openai_api_key=os.environ.get("OPENAI_API_KEY"))
    parser = JsonOutputParser(pydantic_object=ChefOutput)

    # found_match 로직이 포함된 프롬프트
    template = """
    Role: Executive Head Chef & Food Critic.
    Task: You are given {num_docs} candidate recipes. Select the ONE best recipe that perfectly matches the [User Question].

    **Process**:
    1. **Analyze**: Read the [User Question] (e.g., 'Vegan American dish') and Candidates (e.g., Kimchi fried rice) carefully.
    2. **Compare & Assess**: Evaluate if *any* candidate is a genuinely good match for the user's intent.
    3. **Decision**:
        - If a **PERFECT** match is found, set 'found_match' to True and extract the details.
        - If **NO** candidate is even a *close* match (e.g., user asks for 'Vegan' but all docs contain 'Meat', or asks for 'American' but all docs are 'Korean'), set 'found_match' to **False**.

    **Rules**:
    - Ignore recipes that are irrelevant or have empty content.
    - If the category is wrong in the doc, correct it when extracting the data.
    - **CRITICAL**: If 'found_match' is False, set 'best_recipe' to null/empty and use the 'selection_reason' to explain *why* no suitable recipe was chosen. DO NOT invent a recipe or select a non-matching one.
    
    [User Question]: {question}
    [Candidate Documents]:
    {context}
    
    [Format Instructions]: {format_instructions}
    """
    
    chain = ChatPromptTemplate.from_template(template) | llm | parser
    
    return chain.invoke({
        "num_docs": len(docs),
        "question": user_question,
        "context": format_docs_for_selection(docs),
        "format_instructions": parser.get_format_instructions()
    })

def run_stage2_generator(extracted_data, user_question, model_name):
    """[2단계] JSON 데이터를 그대로 포맷팅 및 번역 (창의성 0%, Strict Mode)"""
    # temperature를 0으로 설정하여 무작위성을 완전히 제거
    llm = ChatOpenAI(model=model_name, temperature=0, openai_api_key=os.environ.get("OPENAI_API_KEY"))

    recipe_info = extracted_data['best_recipe']
    reason = extracted_data['selection_reason']
    
    # [디버깅] 실제로 1단계에서 넘어온 데이터가 무엇인지 콘솔에서 확인 (서버 로그용)
    print(f"\n🔍 [Debug] Stage 2로 넘어온 원본 데이터:\n{json.dumps(recipe_info, indent=2, ensure_ascii=False)}\n")

    template = """
    Role: Technical Data Translator & Formatter. (NOT a Chef)
    Task: Convert the provided [JSON Data] into a specific Markdown format in ENGLISH.

    **CRITICAL RULES (VIOLATION = FAIL)**:
    1. **NO CREATIVITY**: Do NOT generate, invent, or hallucinate any new ingredients or steps.
    2. **STRICT TRANSLATION**: Only translate the values inside the JSON into English.
    3. **QUANTITY**: If the JSON does not specify quantities (e.g., "salt"), write ONLY "Salt". Do NOT guess "1 tsp Salt".
    4. **INTEGRITY**: If the JSON 'steps' list has 3 items, your output MUST have exactly 3 steps.

    **Input Data**:
    {recipe_data}

    **Target Output Format**:
    
    ### 🍳 {recipe_name} [[Link]]({recipe_url})
    
    **Cuisine**: {recipe_category}
    
    **Ingredients**:
    (List items exactly as found in JSON 'ingredients')
    
    **👨‍🍳 Instructions**:
    (List items exactly as found in JSON 'steps')
    
    ---
    ### 🌟 Selection Reason
    {selection_reason}
    
    [User Question]: {question}
    """
    
    chain = ChatPromptTemplate.from_template(template) | llm | StrOutputParser()
    
    # 프롬프트에 변수를 더 명확하게 분리해서 주입
    return chain.invoke({
        "question": user_question,
        "selection_reason": reason,
        "recipe_name": recipe_info.get('name', 'No Name'),
        "recipe_url": recipe_info.get('url', '#'),
        "recipe_category": recipe_info.get('category', 'Unknown'),
        "recipe_data": json.dumps(recipe_info, ensure_ascii=False), # 전체 데이터도 참조용으로 제공
    })

def run_stage3_translator(english_recipe_text, target_lang, model_name):
    """[3단계] 최종 언어로 번역"""
    llm = ChatOpenAI(model=model_name, temperature=0.3, openai_api_key=os.environ.get("OPENAI_API_KEY"))

    template = """
    You are a professional Translator & Executive Head Chef.
    Your GOAL is to translate the provided [Recipe Text] into **{language}** perfectly.

    **CRITICAL TRANSLATION RULES**:
    1. **Translate EVERYTHING**: You must translate NOT ONLY the headers but also the **Ingredient List**, **Step-by-step Instructions**, and especially the **Selection Reason** at the bottom.
    2. **Selection Reason**: The text under "Selection Reason" or "Chef's Pick" MUST be translated into {language}. Do not leave it in English.
    3. **Ingredients & Steps**: Translate ingredient names and cooking actions into natural {language} terms (e.g., '1 tsp' -> '1 작은술', 'Drain' -> '물기를 빼다').
    4. **Tone**: Use a polite and warm Chef's tone (e.g., Korean: "~하세요", "~입니다").
    5. **Format**: Keep the Markdown structure (###, **, -) and emojis exactly as they are.

    **[Input Recipe Text]**:
    {text}
    
    **[Output in {language}]**:
    """
    
    chain = ChatPromptTemplate.from_template(template) | llm | StrOutputParser()
    
    return chain.invoke({
        "language": target_lang,
        "text": english_recipe_text
    })

# ==========================================
# 6. 메인 호출 함수 (외부 인터페이스)
# ==========================================

def get_recipe_recommendations(question: str, model_type: str = "4o_mini"):
    """
    사용자 질문을 받아 3단계 파이프라인(Selection -> Generation -> Translation)을 실행합니다.
    """
    global retriever

    # 1. 초기화 확인
    if not retriever:
        load_data_from_db()
        if not retriever:
            return question, "죄송합니다. 레시피 데이터베이스를 불러오지 못했습니다."

    # 모델 선택
    current_model = "gpt-4o-mini" if model_type == "4o_mini" else "gpt-3.5-turbo"
    
    try:
        # 2. 언어 감지
        target_lang = detect_language(question)
        
        # 3. 문서 검색 (Retrieval)
        retrieved_docs = retriever.invoke(question)
        
        # 내용이 너무 짧은 문서는 필터링
        valid_docs = [doc for doc in retrieved_docs if len(doc.page_content.strip()) >= 30]

        if not valid_docs:
            if target_lang == "Korean":
                return question, "죄송합니다. 관련된 레시피 정보를 찾을 수 없습니다."
            return question, "Sorry, I couldn't find any relevant recipe information."

        # 4. Pipeline 실행
        
        # [Stage 1] Selector
        selection_result = run_stage1_selector(valid_docs, question, current_model)
        if not selection_result:
            return question, "적절한 레시피를 선별하지 못했습니다."

        # 거부 응답 처리 (조건 불일치 시)
        if not selection_result.get('found_match', False):
            reason = selection_result.get('selection_reason', '')
            if target_lang == "Korean":
                return question, f"😔 요청하신 조건에 맞는 레시피를 찾지 못했습니다.\n이유: {reason}"
            else:
                return question, f"😔 No suitable recipe found for your request.\nReason: {reason}"

        # [Stage 2] Generator (English Base)
        english_draft = run_stage2_generator(selection_result, question, current_model)

        # [Stage 3] Translator (Target Language)
        final_response = run_stage3_translator(english_draft, target_lang, current_model)

        return question, final_response

    except Exception as e:
        print(f"🚨 [LLM Engine] 생성 중 오류: {e}")
        return question, f"오류가 발생했습니다: {str(e)}"



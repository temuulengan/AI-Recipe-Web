import os
import jwt  # PyJWT (JWT 검증용)
import functools
from flask import Flask, request, jsonify, abort, session # session 추가됨
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

# --- 1. 확장 프로그램 초기화 ---
db = SQLAlchemy()

# --- 2. JWT 공개키 및 환경 변수 로드 ---
JWT_PUBLIC_KEY_PATH = os.environ.get("JWT_PUBLIC_KEY_PATH")
JWT_AUDIENCE = os.environ.get("JWT_AUDIENCE")
JWT_ISSUER = os.environ.get("JWT_ISSUER")
PUBLIC_KEY = None

try:
    if JWT_PUBLIC_KEY_PATH:
        with open(JWT_PUBLIC_KEY_PATH, 'r') as f:
            PUBLIC_KEY = f.read()
        print("✅ Flask: JWT 공개키 로드 성공")
    else:
        print("🚨 Flask: JWT_PUBLIC_KEY_PATH 환경 변수가 설정되지 않았습니다.")
except Exception as e:
    print(f"🚨 Flask: JWT 공개키 로드 실패! {e}")

# --- 3. JWT '보안 검문소' 데코레이터 ---
def jwt_required(f):
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        if not PUBLIC_KEY:
            return jsonify({"error": "JWT 공개키가 서버에 설정되지 않았습니다.", "code": 500, "name": "Internal Server Error"}), 500

        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization 헤더가 없거나 'Bearer' 타입이 아닙니다.", "code": 401, "name": "Unauthorized"}), 401
        
        token = auth_header.split(" ")[1]

        try:
            decoded_token = jwt.decode(
                token,
                PUBLIC_KEY,
                algorithms=["RS256"],
                audience=JWT_AUDIENCE,
                issuer=JWT_ISSUER
            )
            user_id = decoded_token.get("sub")
            if not user_id:
                 return jsonify({"error": "토큰에 'sub' (user_id) 클레임이 없습니다.", "code": 401, "name": "Unauthorized"}), 401
            
            kwargs['user_id'] = user_id

        except jwt.ExpiredSignatureError:
            return jsonify({"error": "토큰이 만료되었습니다.", "code": 401, "name": "Unauthorized"}), 401
        except jwt.InvalidTokenError as e:
            return jsonify({"error": f"토큰이 유효하지 않습니다: {str(e)}", "code": 401, "name": "Unauthorized"}), 401

        return f(*args, **kwargs)
    return decorated_function

# --- 4. Flask 앱 팩토리 ---
def create_app():
    app = Flask(__name__)
    CORS(app, supports_credentials=True) # 쿠키/세션 사용을 위해 supports_credentials=True 필요

    # 모든 HTTP 에러를 JSON으로 반환
    @app.errorhandler(HTTPException)
    def handle_exception(e):
        """Return JSON instead of HTML for HTTP errors."""
        # start with the correct headers and status code from the error
        response = e.get_response()
        # replace the body with JSON
        response.data = jsonify({
            "error": e.description,
            "code": e.code,
            "name": e.name
        }).data
        response.content_type = "application/json"
        return response



    # [중요] 세션 사용을 위한 시크릿 키 설정
    # 환경 변수가 없으면 기본값 사용 (보안상 프로덕션에서는 .env에 꼭 넣으세요)
    app.secret_key = os.environ.get("FLASK_SECRET_KEY", "dev-secret-key-change-in-prod")
    
    # DB 설정
    app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    db.init_app(app)

    from . import models, llm_engine

    with app.app_context():
        # db.create_all() 제거 - 마이그레이션으로 대체
        llm_engine.load_data_from_db(db.session)

    # --- 5. API 엔드포인트 ---

    @app.get("/llm/health")
    def health():
        try:
            db.session.execute(db.text("SELECT 1"))
            db_status = "connected"
        except Exception as e:
            db_status = f"disconnected: {e}"
        return jsonify({
            "status": "ok", 
            "message": "LLM Service is running",
            "database": db_status
        }), 200

    @app.post("/llm/generate")
    @jwt_required
    def generate_recipes_secure(user_id):
        """
        [로그인 사용자용 API]
        - 횟수 제한 없음
        - gpt-4o-mini 모델 사용
        """
        data = request.json
        question = data.get("question")
        if not question:
            return jsonify({"error": "질문(question)이 필요합니다."}), 400

        print(f"✅ [로그인] 사용자 '{user_id}' 질문 수신: {question}")

        try:
            # 1. LLM 엔진 호출 (동일한 모델 사용)
            structured_query, final_recipes = llm_engine.get_recipe_recommendations(
                question, 
                model_type="4o_mini"
            )

            # 2. DB에 검색 기록 저장
            new_log = models.SearchHistory(
                user_id=str(user_id),
                user_query=question,
                structured_query={"query": structured_query},  # 딕셔너리로 감싸서 JSONB 호환
                search_results={"response": final_recipes}
            )
            db.session.add(new_log)

            # 3. 사용자 LLM 카운트 증가
            user = models.User.query.get(str(user_id))
            if user:
                user.llm_count = (user.llm_count or 0) + 1
                db.session.add(user)  # 변경사항 추적

            db.session.commit()

            return jsonify({"success": True, "results": final_recipes}), 200
        
        except Exception as e:
            db.session.rollback()
            print(f"🚨 /llm/generate 오류 발생: {e}")
            return jsonify({"error": "서버 오류가 발생했습니다.", "details": str(e)}), 500

    @app.post("/llm/generate/anonymous")
    def generate_recipes_anonymous():
        """
        [비로그인 사용자용 API]
        - 세션(쿠키) 기반 10회 제한
        - gpt-4o-mini 모델 사용 (로그인 유저와 동일)
        """
        data = request.json
        question = data.get("question")
        if not question:
            return jsonify({"error": "질문(question)이 필요합니다."}), 400

        # 1. 세션에서 횟수 확인 (기본값 0)
        current_count = session.get('search_count', 0)
        
        print(f"✅ [비로그인] 세션 요청 (현재 횟수: {current_count}/10): {question}")

        # 2. 횟수 제한 체크 (10회 이상이면 차단)
        if current_count >= 10:
            return jsonify({
                "error": "무료 체험 횟수(10회)를 모두 소진했습니다. 더 이용하시려면 로그인해주세요.",
                "remaining_queries": 0
            }), 429

        try:
            # 3. LLM 엔진 호출 (로그인 유저와 똑같은 모델 사용)
            structured_query, final_recipes = llm_engine.get_recipe_recommendations(
                question, 
                model_type="4o_mini" # 모델 통일
            )

            # 5. DB 로그 저장
            new_history_log = models.SearchHistory(
                user_id="anonymous_session", 
                user_query=question,
                structured_query={"query": structured_query},  # 딕셔너리로 감싸서 JSONB 호환
                search_results={"response": final_recipes}
            )
            db.session.add(new_history_log)
            db.session.commit()

            # 4. 세션 횟수 증가 및 저장
            session['search_count'] = current_count + 1
            session.permanent = True

            return jsonify({
                "success": True, 
                "results": final_recipes,
                "remaining_queries": 10 - session['search_count']
            }), 200

        except Exception as e:
            db.session.rollback()
            print(f"🚨 /llm/generate/anonymous 오류 발생: {e}")
            return jsonify({"error": "서버 오류가 발생했습니다.", "details": str(e)}), 500

    @app.get("/llm/history")
    @jwt_required
    def get_search_history(user_id):
        """
        [로그인 사용자용 API]
        사용자의 검색 기록 조회
        
        Query Parameters:
        - limit: 조회할 개수 (기본값: 10, 최대: 100)
        - offset: 건너뛸 개수 (기본값: 0)
        - include_results: 검색 결과 포함 여부 (기본값: false)
        """
        try:
            # 쿼리 파라미터 가져오기
            limit = min(int(request.args.get('limit', 10)), 100)
            offset = int(request.args.get('offset', 0))
            include_results = request.args.get('include_results', 'false').lower() == 'true'

            # 검색 기록 조회
            query = models.SearchHistory.query\
                .filter_by(user_id=str(user_id))\
                .order_by(models.SearchHistory.created_at.desc())
            
            # 전체 개수 조회
            total_count = query.count()
            
            # 페이지네이션 적용
            history_records = query.limit(limit).offset(offset).all()

            # 응답 데이터 구성
            history_list = []
            for record in history_records:
                item = {
                    'id': record.id,
                    'user_query': record.user_query,
                    'structured_query': record.structured_query,
                    'created_at': record.created_at.isoformat() if record.created_at else None
                }
                
                # include_results가 true일 때만 검색 결과 포함
                if include_results:
                    item['search_results'] = record.search_results
                
                history_list.append(item)

            return jsonify({
                "success": True,
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "history": history_list
            }), 200

        except ValueError as e:
            return jsonify({"error": "잘못된 파라미터 값입니다.", "details": str(e)}), 400
        except Exception as e:
            print(f"🚨 /llm/history 오류 발생: {e}")
            return jsonify({"error": "서버 오류가 발생했습니다.", "details": str(e)}), 500

    @app.get("/llm/history/<int:history_id>")
    @jwt_required
    def get_search_history_detail(user_id, history_id):
        """
        [로그인 사용자용 API]
        특정 검색 기록 상세 조회
        """
        try:
            # 검색 기록 조회 (본인의 기록만 조회 가능)
            record = models.SearchHistory.query\
                .filter_by(id=history_id, user_id=str(user_id))\
                .first()

            if not record:
                return jsonify({"error": "검색 기록을 찾을 수 없습니다."}), 404

            return jsonify({
                "success": True,
                "history": record.to_dict()
            }), 200

        except Exception as e:
            print(f"🚨 /llm/history/{history_id} 오류 발생: {e}")
            return jsonify({"error": "서버 오류가 발생했습니다.", "details": str(e)}), 500

    @app.delete("/llm/history/<int:history_id>")
    @jwt_required
    def delete_search_history(user_id, history_id):
        """
        [로그인 사용자용 API]
        특정 검색 기록 삭제
        """
        try:
            # 검색 기록 조회 (본인의 기록만 삭제 가능)
            record = models.SearchHistory.query\
                .filter_by(id=history_id, user_id=str(user_id))\
                .first()

            if not record:
                return jsonify({"error": "검색 기록을 찾을 수 없습니다."}), 404

            db.session.delete(record)
            db.session.commit()

            return jsonify({
                "success": True,
                "message": "검색 기록이 삭제되었습니다."
            }), 200

        except Exception as e:
            db.session.rollback()
            print(f"🚨 /llm/history/{history_id} 삭제 오류 발생: {e}")
            return jsonify({"error": "서버 오류가 발생했습니다.", "details": str(e)}), 500

    @app.delete("/llm/history")
    @jwt_required
    def delete_all_search_history(user_id):
        """
        [로그인 사용자용 API]
        사용자의 모든 검색 기록 삭제
        """
        try:
            # 사용자의 모든 검색 기록 삭제
            deleted_count = models.SearchHistory.query\
                .filter_by(user_id=str(user_id))\
                .delete()

            db.session.commit()

            return jsonify({
                "success": True,
                "message": f"{deleted_count}개의 검색 기록이 삭제되었습니다.",
                "deleted_count": deleted_count
            }), 200

        except Exception as e:
            db.session.rollback()
            print(f"🚨 /llm/history 전체 삭제 오류 발생: {e}")
            return jsonify({"error": "서버 오류가 발생했습니다.", "details": str(e)}), 500

    return app

app = create_app()

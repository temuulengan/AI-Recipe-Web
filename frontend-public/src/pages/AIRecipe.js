// AIRecipe.jsx
import React, { useState, useRef, useEffect } from "react";
import { generateRecipe, fetchHistory, fetchHistoryDetail, deleteHistory } from '../utils/llmApi';
import { useLocation, useNavigate } from "react-router-dom";
import { BsBookmark, BsTrash, BsPencilSquare } from "react-icons/bs";
import { GiMagicLamp } from "react-icons/gi";
import { IoSend } from "react-icons/io5";
import ReactMarkdown from 'react-markdown';
import "./AIRecipe.css";

function AIRecipe() {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [currentHistoryId, setCurrentHistoryId] = useState(null);
  const [showCopiedNotification, setShowCopiedNotification] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const messagesEndRef = useRef(null);
  const autoRespondedRef = useRef(null);
  const textareaRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  const handleTextareaResize = (e) => {
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';

    // Scroll to bottom when typing in chat mode to prevent input from covering messages
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Load history from backend on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (token) {
      loadHistoryList(token);
    }
  }, []);

  const loadHistoryList = async (token) => {
    setIsLoadingHistory(true);
    try {
      const response = await fetchHistory(token, 50, 0, false);
      if (response.success && response.history) {
        setHistoryList(response.history);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadHistoryDetail = async (historyId) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetchHistoryDetail(historyId, token);
      if (response.success && response.history) {
        const history = response.history;

        // Convert backend history to messages format
        const msgs = [
          { type: "user", content: history.user_query },
          { type: "ai", content: history.search_results?.response || "No results available" }
        ];

        setMessages(msgs);
        setCurrentHistoryId(historyId);
      }
    } catch (err) {
      console.error('Failed to load history detail:', err);
      alert('Failed to load conversation history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistory = async (historyId) => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token');
    if (!token) return;

    if (!window.confirm('Delete this conversation? This cannot be undone.')) return;

    try {
      const response = await deleteHistory(historyId, token);
      if (response.success) {
        // Remove from list
        setHistoryList(prev => prev.filter(h => h.id !== historyId));

        // Clear current conversation if it was deleted
        if (currentHistoryId === historyId) {
          setMessages([]);
          setPrompt("");
          setCurrentHistoryId(null);
        }
      } else {
        alert('Failed to delete history');
      }
    } catch (err) {
      console.error('Failed to delete history:', err);
      alert('Failed to delete history');
    }
  };

  const handleAIRequest = async (overridePrompt = null) => {
    const promptToUse = overridePrompt || prompt.trim();
    if (!promptToUse) return;

    const token = localStorage.getItem('accessToken') || localStorage.getItem('jwt') || localStorage.getItem('token');

    if (!token) {
      alert('로그인이 필요한 기능입니다. 먼저 로그인해주세요.');
      return;
    }

    // Add user message
    const userMessage = { type: "user", content: promptToUse };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setPrompt("");
    setIsLoading(true);
    setCurrentHistoryId(null); // Clear current history when creating new conversation

    try {
      const aiResponse = await generateRecipe(promptToUse, token);

      let aiMessage;
      if (aiResponse && aiResponse.results) {
        aiMessage = { type: "ai", content: aiResponse.results };
      } else if (aiResponse && aiResponse.error) {
        aiMessage = { type: "ai", content: `❗️ ${aiResponse.error}` };
      } else {
        aiMessage = { type: "ai", content: "❗️ 알 수 없는 오류가 발생했습니다." };
      }

      const afterAiMessages = [...newMessages, aiMessage];
      setMessages(afterAiMessages);

      // Reload history list to show the new conversation
      await loadHistoryList(token);
    } catch (err) {
      const errorMessage = { type: "ai", content: `❗️ API 요청 실패: ${err?.message || err}` };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle incoming state from navigation
  useEffect(() => {
    if (!location?.state) return;

    const { prompt: incomingPrompt } = location.state;

    if (incomingPrompt && autoRespondedRef.current !== incomingPrompt) {
      autoRespondedRef.current = incomingPrompt;

      // Clear current conversation and start new one
      setMessages([]);
      setCurrentHistoryId(null);

      // Trigger AI generation with incoming prompt
      handleAIRequest(incomingPrompt);
    }

    // Clear the navigation state
    navigate(location.pathname, { replace: true, state: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAIRequest();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setPrompt("");
    setCurrentHistoryId(null);
    setIsLoading(false);
  };

  const handleCopyToClipboard = async () => {
    try {
      const conversationText = messages
        .map((msg) => `${msg.type === 'user' ? 'You' : 'AI'}:\n${msg.content}`)
        .join('\n\n');

      await navigator.clipboard.writeText(conversationText);
      setShowCopiedNotification(true);
      setTimeout(() => setShowCopiedNotification(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    }
  };

  const handleWritePost = () => {
    navigate('/community', { state: { createPost: true } });
  };

  return (
    <div className="ai-recipe-layout">
      <aside className="ai-sessions-column">
        <div className="sessions-header">
          <h3>History</h3>
          <button className="new-chat-small-btn" onClick={handleNewChat} title="New chat">
            <GiMagicLamp />
          </button>
        </div>

        <div className="sessions-list">
          {isLoadingHistory ? (
            <div className="no-sessions">Loading history...</div>
          ) : historyList.length === 0 ? (
            <div className="no-sessions">No history yet — start a chat to create one.</div>
          ) : (
            historyList.map((h) => (
              <div
                key={h.id}
                className={`session-item ${h.id === currentHistoryId ? "active" : ""}`}
                onClick={() => loadHistoryDetail(h.id)}
              >
                <div className="session-meta">
                  <div className="session-name">{h.user_query.substring(0, 50)}{h.user_query.length > 50 ? '...' : ''}</div>
                  <div className="session-date">{new Date(h.created_at).toLocaleString()}</div>
                </div>
                <div className="session-actions">
                  <button
                    className="session-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteHistory(h.id);
                    }}
                    title="Delete history"
                  >
                    <BsTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="ai-main-column">
        <div className="ai-header">
          <h1 className="ai-recipe-title">
            <GiMagicLamp className="ai-icon" /> AI Recipe Recommendations
          </h1>
          <p className="ai-recipe-description">
            Describe what you're craving or what ingredients you have, and our AI will find the perfect recipes for you
          </p>
        </div>

        <div className="ai-body">
          {messages.length === 0 ? (
            <>
              <textarea
                ref={textareaRef}
                className="ai-recipe-input"
                placeholder="e.g., 'I have chicken and vegetables, want something healthy for dinner'"
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  handleTextareaResize(e);
                }}
                onKeyPress={handleKeyPress}
              />

              <div className="ai-recipe-buttons">
                <button className="ai-btn recommend-btn" onClick={() => handleAIRequest()}>
                  <GiMagicLamp className="btn-icon" /> Get AI Recommendations
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="chat-messages">
                {messages.map((message, index) => (
                  <div key={index} className={`chat-message ${message.type}`}>
                    <div className="message-content">
                      {message.type === 'ai' ? (
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      ) : (
                        message.content
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="chat-message ai loading">
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="chat-input-container">
                <textarea
                  ref={textareaRef}
                  className="chat-input"
                  placeholder="Ask another recipe question..."
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    handleTextareaResize(e);
                  }}
                  onKeyPress={handleKeyPress}
                />
                <button
                  className="send-btn"
                  onClick={() => handleAIRequest()}
                  disabled={!prompt.trim() || isLoading}
                  title="Send"
                >
                  <IoSend className="send-icon" />
                </button>
              </div>

              <div className="chat-actions">
                <button className="action-btn copy-btn" onClick={handleCopyToClipboard}>
                  <BsBookmark className="btn-icon" /> Copy to Clipboard
                </button>
                <button className="action-btn write-post-btn" onClick={handleWritePost}>
                  <BsPencilSquare className="btn-icon" /> Write Post
                </button>
                <button className="action-btn new-chat-btn" onClick={handleNewChat}>
                  <GiMagicLamp className="btn-icon" /> New Chat
                </button>
              </div>

              {/* Copy notification popup */}
              {showCopiedNotification && (
                <div className="copy-notification">
                  ✓ Copied to Clipboard
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default AIRecipe;

// Central API client for the NestJS backend used by the frontend
export const API_BASE = 'https://api.findflavor.site/api/v1';
export const API_DOMAIN = 'https://api.findflavor.site';

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

async function request(path, { method = 'GET', body = null, token = null, isJson = true, headers = {} } = {}) {
  const url = `${API_BASE}${path}`;
  const opts = { method, headers: { ...headers } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) {
    if (isJson) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    } else {
      // assume FormData or pre-encoded body
      opts.body = body;
    }
  }

  const res = await fetch(url, opts);
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }

  // Handle 401 Unauthorized - attempt token refresh
  if (res.status === 401 && path !== '/auth/refresh') {
    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(newToken => {
        // Retry with new token
        return request(path, { method, body, token: newToken, isJson, headers });
      });
    }

    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh endpoint
      const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!refreshRes.ok) {
        throw new Error('Token refresh failed');
      }

      const refreshData = await refreshRes.json();
      const newAccessToken = refreshData.accessToken;

      // Update tokens in localStorage
      localStorage.setItem('accessToken', newAccessToken);
      if (refreshData.refreshToken) {
        localStorage.setItem('refreshToken', refreshData.refreshToken);
      }

      // Update user data if needed
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify(user));

      // Process queued requests
      processQueue(null, newAccessToken);

      // Retry original request with new token
      return request(path, { method, body, token: newAccessToken, isJson, headers });

    } catch (refreshError) {
      // Refresh failed - clear storage and redirect to login
      processQueue(refreshError, null);
      localStorage.clear();
      window.location.href = '/login';
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }

  if (!res.ok) {
    // Handle 401 Unauthorized - clear tokens and redirect
    if (res.status === 401) {
      console.warn('🔒 Token expired or invalid. Clearing authentication...');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');

      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        alert('Your session has expired. Please log in again.');
        window.location.href = '/login';
      }
    }

    const err = (data && data.message) ? data.message : (data || res.statusText);
    const error = new Error(err || 'API request failed');
    error.status = res.status;
    error.body = data;
    throw error;
  }
  return data;
}

// --- Auth ---
export async function registerUser(payload) {
  return request('/auth/register', { method: 'POST', body: payload });
}

export async function loginUser(payload) {
  return request('/auth/login', { method: 'POST', body: payload });
}

export async function logout(refreshToken, token) {
  return request('/auth/logout', { method: 'POST', body: { refreshToken }, token });
}

export async function refreshAccessToken(refreshToken) {
  return request('/auth/refresh', { method: 'POST', body: { refreshToken } });
}

export async function getAuthMe(token) {
  return request('/auth/me', { method: 'GET', token });
}

export async function getMyProfile(token) {
  return request('/me', { method: 'GET', token });
}

export async function updateMyProfile(payload, token) {
  return request('/me', { method: 'PATCH', body: payload, token });
}

export async function changePassword(payload, token) {
  return request('/me/password', { method: 'PUT', body: payload, token });
}

export async function deleteMyAccount(token) {
  return request('/me', { method: 'DELETE', token });
}

// --- Boards ---
export async function listBoards({ page = 1, limit = 20, prefix = '', search = '', token = null } = {}) {
  const q = `?page=${page}&limit=${limit}` + (prefix ? `&prefix=${encodeURIComponent(prefix)}` : '') + (search ? `&search=${encodeURIComponent(search)}` : '');
  return request(`/boards${q}`, { method: 'GET', token });
}

export async function createBoard(formData, token) {
  return request('/boards', { method: 'POST', body: formData, token, isJson: false });
}

export async function getBoard(boardId, token = null) {
  return request(`/boards/${boardId}`, { method: 'GET', token });
}

export async function updateBoard(boardId, payload, token) {
  return request(`/boards/${boardId}`, { method: 'PATCH', body: payload, token });
}

export async function deleteBoard(boardId, token) {
  return request(`/boards/${boardId}`, { method: 'DELETE', token });
}

// --- Comments ---
export async function createComment(boardId, payload, token) {
  return request(`/boards/${boardId}/comments`, { method: 'POST', body: payload, token });
}

export async function listComments(boardId, { page = 1, limit = 20 } = {}) {
  return request(`/boards/${boardId}/comments?page=${page}&limit=${limit}`, { method: 'GET' });
}

export async function updateComment(boardId, commentId, payload, token) {
  return request(`/boards/${boardId}/comments/${commentId}`, { method: 'PATCH', body: payload, token });
}

export async function deleteComment(boardId, commentId, token) {
  return request(`/boards/${boardId}/comments/${commentId}`, { method: 'DELETE', token });
}

// --- Ratings ---
export async function postRating(boardId, payload, token) {
  return request(`/boards/${boardId}/rating`, { method: 'POST', body: payload, token });
}

export async function getAverageRating(boardId) {
  return request(`/boards/${boardId}/rating`, { method: 'GET' });
}

export async function getMyRating(boardId, token) {
  return request(`/boards/${boardId}/rating/my`, { method: 'GET', token });
}

export async function deleteRating(boardId, token) {
  return request(`/boards/${boardId}/rating`, { method: 'DELETE', token });
}

export async function getAllRatings(boardId) {
  return request(`/boards/${boardId}/rating/all`, { method: 'GET' });
}

// --- Chat Sessions ---
export async function listChatSessions(token) {
  return request('/chat-sessions', { method: 'GET', token });
}

export async function createChatSession(payload, token) {
  return request('/chat-sessions', { method: 'POST', body: payload, token });
}

export async function getChatSession(sessionId, token) {
  return request(`/chat-sessions/${sessionId}`, { method: 'GET', token });
}

export async function updateChatSession(sessionId, payload, token) {
  return request(`/chat-sessions/${sessionId}`, { method: 'PATCH', body: payload, token });
}

export async function deleteChatSession(sessionId, token) {
  return request(`/chat-sessions/${sessionId}`, { method: 'DELETE', token });
}

// --- Admin ---
export async function listUsers(token) {
  return request('/admin/users', { method: 'GET', token });
}

export async function getUserById(id, token) {
  return request(`/admin/users/${id}`, { method: 'GET', token });
}

export async function updateUserById(id, payload, token) {
  return request(`/admin/users/${id}`, { method: 'PUT', body: payload, token });
}

export async function deleteUserById(id, token) {
  return request(`/admin/users/${id}`, { method: 'DELETE', token });
}

export async function getLogs({ source = '', path = '', limit = 100 } = {}, token) {
  const q = `?limit=${limit}` + (source ? `&source=${encodeURIComponent(source)}` : '') + (path ? `&path=${encodeURIComponent(path)}` : '');
  return request(`/admin/logs${q}`, { method: 'GET', token });
}

const apiClient = {
  registerUser,
  loginUser,
  logout,
  refreshAccessToken,
  getAuthMe,
  getMyProfile,
  updateMyProfile,
  changePassword,
  deleteMyAccount,
  listBoards,
  createBoard,
  getBoard,
  updateBoard,
  deleteBoard,
  createComment,
  listComments,
  updateComment,
  deleteComment,
  postRating,
  getAverageRating,
  getMyRating,
  deleteRating,
  getAllRatings,
  listChatSessions,
  createChatSession,
  getChatSession,
  updateChatSession,
  deleteChatSession,
  listUsers,
  getUserById,
  updateUserById,
  deleteUserById,
  getLogs,
};

export default apiClient;

// src/utils/llmApi.js

const API_BASE = 'https://api.findflavor.site';

export async function generateRecipe(question, jwtToken) {
  const response = await fetch(`${API_BASE}/llm/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    },
    body: JSON.stringify({ question }),
  });
  return response.json();
}

export async function fetchHistory(jwtToken, limit = 10, offset = 0, includeResults = false) {
  const url = `${API_BASE}/llm/history?limit=${limit}&offset=${offset}&include_results=${includeResults}`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${jwtToken}` },
  });
  return response.json();
}

export async function fetchHistoryDetail(historyId, jwtToken) {
  const response = await fetch(`${API_BASE}/llm/history/${historyId}`, {
    headers: { 'Authorization': `Bearer ${jwtToken}` },
  });
  return response.json();
}

export async function deleteHistory(historyId, jwtToken) {
  const response = await fetch(`${API_BASE}/llm/history/${historyId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${jwtToken}` },
  });
  return response.json();
}

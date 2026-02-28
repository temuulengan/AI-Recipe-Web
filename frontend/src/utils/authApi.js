// src/utils/authApi.js
export async function loginUser(user_id, password) {
  const response = await fetch('https://api.findflavor.site/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id, password }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Login failed');
  }
  return response.json();
}

export async function deleteUser(jwt) {
  const response = await fetch('https://api.findflavor.site/api/v1/me', {
    method: 'DELETE',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`
    },
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to delete account');
  }
  // API returns 204 No Content, so no body to parse
  return null;
}

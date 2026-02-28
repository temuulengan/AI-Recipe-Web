export function getUser() {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function isAdmin() {
  const u = getUser();
  return !!u && u.role === 'ADMIN';
}

export function setUser(u) {
  localStorage.setItem('user', JSON.stringify(u));
}

export function clearUser() {
  localStorage.removeItem('user');
}

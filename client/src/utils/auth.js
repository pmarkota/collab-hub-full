export const isAuthenticated = () => {
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return !!(token && user);
};

// Add other auth-related utilities if needed
export const getUser = () => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

export const getToken = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;

  // If token starts with 'Bearer ', remove it
  return token.startsWith("Bearer ") ? token : `Bearer ${token}`;
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

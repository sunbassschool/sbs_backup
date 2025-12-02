// src/services/tokenService.js
export const TokenService = {
  getJwt() {
    return localStorage.getItem("jwt") || null;
  },

  getRefresh() {
    return localStorage.getItem("refreshToken") || null;
  },

  save({ jwt, refreshToken }) {
    if (jwt) localStorage.setItem("jwt", jwt);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
  },

  clear() {
    localStorage.removeItem("jwt");
    localStorage.removeItem("refreshToken");
  },

  isValid(jwt) {
    if (!jwt) return false;
    try {
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      return Date.now() < payload.exp * 1000;
    } catch (e) {
      return false;
    }
  }
};

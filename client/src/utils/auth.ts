export const saveToken = (
  token: string
) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token");
};

export const LOGOUT_EVENT = "finora:logout";

export const logout = () => {
  localStorage.removeItem("token");
  window.dispatchEvent(new Event(LOGOUT_EVENT));
};

export const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

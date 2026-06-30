import api from "../utils/config";

export const login = async (staffId: string, password: string) => {
  const response = await api.post("/auth/login", { staffId, password });
  localStorage.setItem("access_token", response.data.access_token);
  localStorage.setItem("refresh_token", response.data.refresh_token);
  return response.data;
};

export const loginWithToken = async (token: string) => {
  const response = await api.post("/auth/login-with-token", { token });
  localStorage.setItem("access_token", response.data.access_token);
  localStorage.setItem("refresh_token", response.data.refresh_token);
  return response.data;
};

export const resetPassword = async (newPassword: string) => {
  const response = await api.patch("/auth/reset-password", { newPassword });
  return response.data;
};

export const forgotPassword = async (email: string) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

export const resetPasswordWithToken = async (
  token: string,
  newPassword: string
) => {
  const response = await api.patch("/auth/reset-password-with-token", {
    token,
    newPassword,
  });
  return response.data;
};

export const logout = async () => {
  const refresh_token = localStorage.getItem("refresh_token") ?? undefined;
  await api.post("/auth/logout", { refresh_token }).catch(() => {});
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("mustResetPassword");
  localStorage.removeItem("user");
};

export const refreshToken = async (): Promise<string> => {
  const refresh_token = localStorage.getItem("refresh_token");
  if (!refresh_token) throw new Error("No refresh token");
  const response = await api.post("/auth/refresh", { refresh_token });
  localStorage.setItem("access_token", response.data.access_token);
  localStorage.setItem("refresh_token", response.data.refresh_token);
  return response.data.access_token;
};

export const getSecurityQuestions = async () => {
  const response = await api.get("/auth/security-questions");
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get("/user/profile");
  return response.data;
};

export const createRequisition = async (data: any) => {
  const response = await api.post("/user/requisitions", data);
  return response.data;
};

export const getRequisitions = async () => {
  const response = await api.get("/user/requisitions");
  return response.data;
};

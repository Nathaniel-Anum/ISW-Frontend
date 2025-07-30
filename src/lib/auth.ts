import api from "../utils/config";

export const login = async (staffId: string, password: string) => {
  const response = await api.post("/auth/login", { staffId, password });
  localStorage.setItem("access_token", response.data.access_token);
  localStorage.setItem(
    "mustResetPassword",
    response.data.mustResetPassword.toString()
  );
  return response.data;
};

export const loginWithToken = async (token: string) => {
  const response = await api.post("/auth/login-with-token", { token });
  localStorage.setItem("access_token", response.data.access_token);
  localStorage.setItem(
    "mustResetPassword",
    response.data.mustResetPassword.toString()
  );
  return response.data;
};

export const resetPassword = async (
  newPassword: string,
  securityQuestion?: string,
  securityAnswer?: string
) => {
  const response = await api.patch("/auth/reset-password", {
    newPassword,
    securityQuestion,
    securityAnswer,
  });
  return response.data;
};

export const forgotPassword = async (email: string, securityAnswer: string) => {
  const response = await api.post("/auth/forgot-password", {
    email,
    securityAnswer,
  });
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
  await api.post("/auth/logout");
  localStorage.removeItem("access_token");
  localStorage.removeItem("mustResetPassword");
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

import http from "./http";

export async function fetchProfile() {
  const { data } = await http.get("/api/auth/profile");
  return data;
}

export async function registerUser(userData) {
  const { data } = await http.post("/api/auth/register", userData);
  return data;
}

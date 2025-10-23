import http from "./http";

export async function fetchProfile() {
  const { data } = await http.get("/api/auth/profile");
  return data;
}





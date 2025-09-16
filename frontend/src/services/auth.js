import API from "./api";

export async function login(email, password) {
  const res = await API.post("/login", { email, password });
  const token = res.data.access_token;
  localStorage.setItem("token", token); // save token for later
  return res.data;
}

export function getToken() {
  return localStorage.getItem("token");
}

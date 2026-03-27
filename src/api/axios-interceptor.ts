import axios from "axios";

const Instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL + "/api",
  withCredentials: true,
});

// Attach Better Auth session cookie / token on every request
Instance.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("session");
    if (raw) {
      const session = typeof raw === "string" ? JSON.parse(raw) : raw;
      const token = session?.token;
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
  } catch {
    // localStorage not available (SSR) — skip
  }
  return config;
});

// Redirect to signin on 401
Instance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== "undefined") {
      window.location.href = "/signin";
    }
    return Promise.reject(err);
  }
);

export default Instance;

import { demoApi, demoModeKey } from "../demo";

export const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:3001";
export const tokenKey = "nexaflow-token";

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  if (localStorage.getItem(demoModeKey) === "true") {
    return demoApi(path, options) as T;
  }

  const token = localStorage.getItem(tokenKey);
  const response = await fetch(`${apiUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const error = (await response
      .json()
      .catch(() => ({ message: "Erro na API." }))) as { message?: string };
    throw new Error(error.message || "Erro na API.");
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

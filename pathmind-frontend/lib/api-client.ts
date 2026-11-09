const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiClientError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
    this.name = "ApiClientError";
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * Thin fetch wrapper: always sends cookies (httpOnly JWT cookies set by the
 * backend), and on a 401 transparently attempts one refresh + retry before
 * giving up — so a normal page load never bounces a user to /login just
 * because their 15-minute access token expired mid-session.
 */
async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (res.status === 401 && !isRetry && path !== "/auth/refresh") {
    const refreshed = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
    });
    if (refreshed.ok) {
      return request<T>(path, options, true);
    }
  }

  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.blob();

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload && String(payload.error)) ||
      `Request failed with status ${res.status}`;
    throw new ApiClientError(res.status, message, payload);
  }

  return payload as T;
}

export const apiClient = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { method: "GET", signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: "POST", body, signal }),
  patch: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: "PATCH", body, signal }),
  put: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: "PUT", body, signal }),
  del: <T>(path: string, signal?: AbortSignal) =>
    request<T>(path, { method: "DELETE", signal }),
};

/**
 * Fetches a binary response (currently the certificate PDF) and triggers a
 * browser download. Kept separate from `apiClient` because the response is not
 * JSON and must not go through the JSON error-shape parsing above.
 */
export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const res = await fetch(`${API_URL}${path}`, { method: "GET", credentials: "include" });
  if (!res.ok) {
    throw new ApiClientError(res.status, "Download failed");
  }

  // Prefer the server's filename; it already sanitises the topic.
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = /filename="?([^";]+)"?/.exec(disposition);
  const filename = match?.[1] ?? fallbackName;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function downloadBlob(path: string, body?: unknown): Promise<Blob> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) throw new ApiClientError(res.status, "Calendar export failed");
  return res.blob();
}

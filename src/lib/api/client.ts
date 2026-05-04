export interface ApiConfig {
  baseURL: string;
}

export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

const config: ApiConfig = {
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
};

export function getApiBaseURL(): string {
  return config.baseURL;
}

function buildUrl(path: string): string {
  const base = config.baseURL.replace(/\/+$/, "");
  const pathNormalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${pathNormalized}`;
}

interface FetchOptions extends RequestInit {
  token?: string;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { token, headers: extraHeaders, ...fetchInit } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(extraHeaders as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(path), {
    ...fetchInit,
    headers,
  });

  let data: T;
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else {
    data = (await response.text()) as T;
  }

  return {
    data,
    status: response.status,
    ok: response.ok,
  };
}

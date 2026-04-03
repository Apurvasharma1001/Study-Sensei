export interface ApiEnvelope<T> {
  data: T;
}

export type UnauthorizedBehavior = "returnNull" | "throw";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = Omit<RequestInit, "body" | "credentials" | "method"> & {
  body?: FormData | Record<string, unknown> | undefined;
  on401?: UnauthorizedBehavior;
};

function isApiErrorPayload(payload: unknown): payload is {
  error?: string;
  code?: string;
} {
  return typeof payload === "object" && payload !== null;
}

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== "undefined" && value instanceof FormData;
}

async function readResponsePayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return await response.json();
  }

  const text = await response.text();
  return text.length > 0 ? text : null;
}

async function request<T>(
  method: string,
  url: string,
  options: RequestOptions = {},
): Promise<T | null> {
  const { body, headers, on401 = "throw", ...init } = options;
  const requestHeaders = new Headers(headers);
  let requestBody: BodyInit | undefined;

  if (isFormData(body)) {
    requestBody = body;
  } else if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
    requestBody = JSON.stringify(body);
  }

  const response = await fetch(url, {
    ...init,
    method,
    credentials: "include",
    headers: requestHeaders,
    body: requestBody,
  });

  const payload = await readResponsePayload(response);
  if (response.status === 401 && on401 === "returnNull") {
    return null;
  }

  if (!response.ok) {
    const message =
      isApiErrorPayload(payload) && typeof payload.error === "string"
        ? payload.error
        : response.statusText || "Request failed";

    throw new ApiError(
      message,
      response.status,
      isApiErrorPayload(payload) ? payload.code : undefined,
      payload,
    );
  }

  return payload as T;
}

export async function apiGet<T>(
  url: string,
  options: { on401?: UnauthorizedBehavior } = {},
): Promise<T | null> {
  return await request<T>("GET", url, options);
}

export async function apiSend<TResponse, TBody = Record<string, unknown>>(
  method: "POST" | "PATCH" | "DELETE",
  url: string,
  body?: TBody | FormData,
): Promise<TResponse> {
  const result = await request<TResponse>(method, url, {
    body:
      body instanceof FormData
        ? body
        : (body as Record<string, unknown> | undefined),
  });

  return result as TResponse;
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong",
): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }

  return fallback;
}

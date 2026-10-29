/*
 * The one place the app talks HTTP to the Laravel API.
 *
 * Dual mode on purpose (decision D8): with NEXT_PUBLIC_API_URL unset the app behaves exactly
 * as it always has, reading its content from src/data through lib/content. Set it and the
 * same functions read from the API instead. Both paths stay in the build until the
 * localStorage path is retired in one commit, so a broken API can never strand the demo.
 */

/** Trailing slash stripped once, so callers can write paths with a leading slash. */
const BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

/** True when the app should read from the API rather than from the bundled seed. */
export const apiMode = () => BASE !== "";

/** `https://api.nclexbase.com/api/v1` — the version lives in the path, never in a header. */
export const apiUrl = (path: string) => `${BASE}/api/v1${path.startsWith("/") ? path : `/${path}`}`;

/**
 * Sanctum's CSRF cookie. It sits outside the versioned prefix, so it is built from the base.
 *
 * Laravel sets an `XSRF-TOKEN` cookie and expects it echoed back in `X-XSRF-TOKEN` on every
 * write. Both the cookie and the session cookie are scoped to the host without the port, so
 * the SPA and the API can run on different ports of localhost during development.
 */
export async function csrf(): Promise<void> {
  if (!apiMode() || readCookie("XSRF-TOKEN")) return;
  await fetch(`${BASE}/sanctum/csrf-cookie`, { credentials: "include", headers: { Accept: "application/json" } });
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const hit = document.cookie.split("; ").find((c) => c.startsWith(`${name}=`));
  // Laravel URL-encodes the token when it sets the cookie.
  return hit ? decodeURIComponent(hit.slice(name.length + 1)) : undefined;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    /** Laravel's field errors, when the failure was a validation one. */
    readonly errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Retries are for idempotent reads only; a POST must never be sent twice. */
  retries?: number;
}

/**
 * Sanctum authenticates the SPA with a session cookie, so every request is credentialed and
 * no token is ever handed to JavaScript. A native client sends a bearer token to the same
 * routes instead — see docs/MOBILE_READINESS.md.
 */
export async function api<T>(path: string, { body, retries, ...init }: ApiOptions = {}): Promise<T> {
  const method = init.method ?? (body === undefined ? "GET" : "POST");
  const attempts = retries ?? (method === "GET" ? 2 : 0);

  // Anything that changes state needs the CSRF cookie in place before it is sent.
  if (method !== "GET" && method !== "HEAD") await csrf();

  let lastError: unknown;
  for (let attempt = 0; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(apiUrl(path), {
        ...init,
        method,
        credentials: "include",
        headers: {
          Accept: "application/json",
          ...(body === undefined ? {} : { "Content-Type": "application/json" }),
          ...xsrfHeader(method),
          ...init.headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      // A 5xx is worth one more try; a 4xx is the caller's answer and must surface at once.
      if (res.status >= 500 && attempt < attempts) {
        lastError = new ApiError(res.status, `The server failed (${res.status}).`);
        continue;
      }

      if (!res.ok) throw await toError(res);
      if (res.status === 204) return undefined as T;

      return (await res.json()) as T;
    } catch (err) {
      // Network failures (offline, DNS, CORS) throw rather than resolve.
      if (err instanceof ApiError && err.status < 500) throw err;
      lastError = err;
    }
  }

  throw lastError instanceof Error ? lastError : new ApiError(0, "The server could not be reached.");
}

function xsrfHeader(method: string): Record<string, string> {
  if (method === "GET" || method === "HEAD") return {};
  const token = readCookie("XSRF-TOKEN");
  return token ? { "X-XSRF-TOKEN": token } : {};
}

async function toError(res: Response): Promise<ApiError> {
  let message = `Request failed (${res.status}).`;
  let errors: Record<string, string[]> | undefined;

  try {
    // Laravel's envelope is {message, errors?} for every failure, including validation.
    const body = (await res.json()) as { message?: string; errors?: Record<string, string[]> };
    if (body.message) message = body.message;
    errors = body.errors;
  } catch {
    // A proxy error page is not JSON; the status is all we have.
  }

  return new ApiError(res.status, message, errors);
}

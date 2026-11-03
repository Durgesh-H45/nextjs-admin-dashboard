const NEST_API_BASE = (
  process.env.NEST_API_URL || 'https://nestjs-postgres-prisma.onrender.com'
).replace(/\/+$/, '');

export const AUTH_COOKIE_NAME = 'admin_auth_token';

interface BackendFetchOptions extends RequestInit {
  timeoutMs?: number;
}

export async function fetchFromBackend(endpoint: string, options: BackendFetchOptions = {}) {
  const { timeoutMs = 70000, ...fetchOptions } = options;
  const url = `${NEST_API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const controller = new AbortController();
  const startTime = Date.now();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers || {}),
      },
    });

    const durationMs = Date.now() - startTime;
    clearTimeout(timeoutId);

    // Handle 204 No Content or empty bodies
    if (res.status === 204) {
      return {
        ok: true,
        status: 204,
        data: null,
        durationMs,
        coldStart: durationMs > 3000,
      };
    }

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    return {
      ok: res.ok,
      status: res.status,
      data,
      durationMs,
      coldStart: durationMs > 3000,
    };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    const isAbort = error instanceof Error && error.name === 'AbortError';

    return {
      ok: false,
      status: isAbort ? 504 : 503,
      data: {
        message: isAbort
          ? 'Backend request timed out (Render free tier may still be spinning up).'
          : 'Could not connect to NestJS backend. Check server status or NEST_API_URL.',
      },
      durationMs,
      coldStart: durationMs > 3000,
    };
  }
}

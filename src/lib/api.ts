// API client with caching
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export async function cachedFetch<T>(
  url: string,
  options?: RequestInit,
  cacheDuration: number = CACHE_DURATION
): Promise<T> {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < cacheDuration) {
    return cached.data as T;
  }

  // Add 30-second timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('Request timeout after 30s'), 30000);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    cache.set(cacheKey, { data, timestamp: Date.now() });

    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);
    // Don't log AbortErrors as they are expected during cleanup
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('API fetch error:', error);
    }
    throw error;
  }
}

// Clear cache
export function clearCache(): void {
  cache.clear();
}

// Clear specific cache entry
export function clearCacheEntry(url: string): void {
  const keysToDelete: string[] = [];
  cache.forEach((_, key) => {
    if (key.startsWith(url)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => cache.delete(key));
}

// API helper functions
export async function apiGet<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<T> {
  const url = new URL(endpoint, window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  return cachedFetch<T>(url.toString());
}

export async function apiPost<T>(
  endpoint: string,
  data: any
): Promise<T> {
  const url = new URL(endpoint, window.location.origin);

  // Add 30-second timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort('Request timeout after 30s'), 30000);

  try {
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorDetail = `HTTP error! status: ${response.status}`;
      try {
        const errorBody = await response.json();
        if (errorBody?.error) {
          errorDetail = errorBody.error;
        }
      } catch {}
      throw new Error(errorDetail);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    // Don't log AbortErrors as they are expected during cleanup
    if (error instanceof Error && error.name !== 'AbortError') {
      console.error('API post error:', error);
    }
    throw error;
  }
}

// Python server health check with TTL cache
let pythonServerAvailable: boolean | null = null;
let healthCheckTimestamp = 0;
const HEALTH_CHECK_TTL = 60000; // 60 seconds

export async function checkPythonServerHealth(): Promise<boolean> {
  // Return cached result if within TTL
  if (pythonServerAvailable !== null && Date.now() - healthCheckTimestamp < HEALTH_CHECK_TTL) {
    return pythonServerAvailable;
  }

  try {
    const response = await fetch('/api/health', {
      signal: AbortSignal.timeout(2000)
    });
    pythonServerAvailable = response.ok;
    healthCheckTimestamp = Date.now();
    return response.ok;
  } catch {
    pythonServerAvailable = false;
    healthCheckTimestamp = Date.now();
    return false;
  }
}

export function isPythonServerAvailable(): boolean {
  return pythonServerAvailable === true;
}

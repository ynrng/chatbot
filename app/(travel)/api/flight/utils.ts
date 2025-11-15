

import { rateLimitedFetch } from "@/lib/rateLimiter";

export async function fetcherFlight(url: string, headers?: any, options?: any) {
  const apiKey = process.env.AERO_API_KEY;
  if (!apiKey) {
    return new Response("Server configuration error: missing AEROAPI_KEY", { status: 500 }).json();
  }

  const res = await rateLimitedFetch(url, {
    headers: {
      ...headers,
      'x-apikey': apiKey,
    },
    ...options
  },);

  return res.json();
};

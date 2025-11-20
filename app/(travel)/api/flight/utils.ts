
import { auth } from "@/app/(auth)/auth";
import { rateLimitedFetch } from "@/lib/rateLimiter";

export async function fetcherFlight(url: string, headers?: any, options?: any) {


  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = process.env.AERO_API_KEY;
  if (!apiKey) {
    return new Response("Server configuration error: missing AEROAPI_KEY", { status: 500 }).json();
  }
  console.log('[fetch]flightaware:', 'https://aeroapi.flightaware.com/aeroapi'+url);

  const res = await rateLimitedFetch('https://aeroapi.flightaware.com/aeroapi'+url, {
    headers: {
      ...headers,
      'x-apikey': apiKey,
    },
    ...options
  },);

  return res.json();
};

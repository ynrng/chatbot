
import { auth } from "@/app/(auth)/auth";
import { rateLimitedFetch } from "@/lib/rateLimiter";

export async function fetchRRT(url: string ) {

  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = process.env.RRT_API_USER;
  const pwd = process.env.RRT_API_PWD;

  const token = Buffer.from(`${user}:${pwd}`).toString("base64");

  console.log('fetchRRT:', url);
  const res = await fetch(`https://api.rtt.io/api/v1${url}`, {
    headers: {
      "Authorization": `Basic ${token}`
    }
  });
  if (!res.ok) {
    // throw new Error(`RRT API request failed: ${res.status} ${res.statusText}`);
    return new Response(`RRT API request failed: ${res.status} ${res.statusText}`, { status: res.status });
  }
  return res.json();
}


// Helper: do Overpass query and return features
export async function fetchOverpass(query: string) {

  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = 'https://overpass-api.de/api/interpreter';
  console.log('[fetch]Overpass query:', url, query);
  const body = `data=${encodeURIComponent(query)}`;


  const resp = await rateLimitedFetch(url, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    // body: new URLSearchParams({ data: query })
  });
  let result = await resp.json();
  // let result = fake_data;
  return result;
}

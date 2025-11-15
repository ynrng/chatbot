// import { auth } from "@/app/(auth)/auth";


import { auth } from "@/app/(auth)/auth";
import { fetcherInternal } from "@/lib/utils";

import datasearch from './fake.search.json';
import dataservice from './fake.service.json';


export async function fetchRRT(url: string ) {

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const user = process.env.RRT_API_USER;
  const pwd = process.env.RRT_API_PWD;

  const token = Buffer.from(`${user}:${pwd}`).toString("base64");

  console.log('fetchRRT:', url);
  // /json/search/<station>
  // /json/search/<station>/to/<toStation>
  // /json/search/<station>/<year>/<month>/<day>
  // /json/search/<station>/<year>/<month>/<day>/<time>
  // /json/service/<serviceUid>/<year>/<month>/<day>
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

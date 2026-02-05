
import { auth } from "@/app/(auth)/auth";
import {
  getWordles,
  createWordle
} from "@/db/queries";
import { Wordle, } from "@/db/schema";



export async function GET(request: Request) {

  const res = await getWordles();

  return Response.json(res)
}



export async function POST(request: Request) {


  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (error) {
    return new Response("Invalid JSON in request body", { status: 400 });
  }

  if (!body.id || typeof body.id !== "string") {
    return new Response("Missing or invalid word", { status: 400 });
  }


  let f: Wordle = {
    id: body.id.toLowerCase(),
    explain: ""
  };

  console.log("Saving wordle:", f, body);
  try {
    await createWordle(f);
  } catch (error) {
    console.error("Failed to save wordle");
    return new Response("Failed to save wordle", { status: 500 });
  }

  return Response.json({});
}

// export async function DELETE(request: Request) {
//   // const { searchParams } = new URL(request.url);

//   if (!request.body) {
//     return new Response("Not Found", { status: 404 });
//   }

//   const session = await auth();

//   if (!session || !session.user) {
//     return new Response("Unauthorized", { status: 401 });
//   }

// }

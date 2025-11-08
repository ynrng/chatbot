// import { auth } from "@/app/(auth)/auth";
// import { getChatsByUserId } from "@/db/queries";

// export async function GET() {
// const session = await auth();

// if (!session || !session.user) {
//     return Response.json("Unauthorized!", { status: 401 });
// }

// const chats = await getChatsByUserId({ id: session.user.id! });
// return Response.json(chats);
// }
export async function POST(request: Request) { }

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}


import { getTrains, } from "@/db/queries";

export async function GET(request: Request) {

  try {
    let records = await getTrains();
    console.log("train records:", records.length);

    return Response.json(records);
  } catch (err) {
    console.error("Failed to fetch rrt", err);

  }

  return Response.json({});
}

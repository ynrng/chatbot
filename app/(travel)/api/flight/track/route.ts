
import data from './fake.flight.track.json';

export async function GET() {
  return Response.json(data);
}

import { getAllLiveChannels } from "./getLiveChannels";
import { channels } from "./channels";

export async function GET(request: Request) {
  const liveChannels = await getAllLiveChannels(channels);
  return new Response(JSON.stringify(liveChannels));
}

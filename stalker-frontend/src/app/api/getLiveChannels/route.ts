import { getAllLiveChannels } from "./getLiveChannels";
import { channels } from "./channels";

export async function GET(request: Request) {
    try {
        const liveChannels = await getAllLiveChannels(channels);
        return new Response(JSON.stringify(liveChannels));
    }catch{
        return new Response("Error, Youtube Rate Limit reached!", { status: 500 });
    }
}

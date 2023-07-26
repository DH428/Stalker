import { VtuberData } from "@/types/vtuberData";

const API_BASE_URL = "http://localhost:3001/api";

export async function fetchVtuberData(): Promise<VtuberData[]> {
  const response = await fetch(`${API_BASE_URL}/data`);
  const data = await response.json();
  const vtuberData: VtuberData[] = [];

  for (const vtuberURL of Object.keys(data)) {
    const vtuber = data[vtuberURL];
    const videoDetails = vtuber.video_details;
    //get highquality thumbnail if not present use the default one
    const videoThumbnailURL = videoDetails.thumbnails[4].url || videoDetails.thumbnails[0].url;
    const authorIconURL = videoDetails.author.thumbnails[2].url || videoDetails.author.thumbnails[0].url;

    vtuberData.push({
      channelURL: vtuber.url_channel,
      title: videoDetails.title,
      vodPath: vtuber.vod_path,
      thumbnailURL: videoThumbnailURL,
      author: {
        name: videoDetails.author.name,
        iconURL: authorIconURL,
      },
      isLive: videoDetails.liveBroadcastDetails.isLiveNow,
    });
  }
  return vtuberData;
}



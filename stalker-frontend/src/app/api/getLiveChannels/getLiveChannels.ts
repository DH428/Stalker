import { channels } from "./channels";
import {
  LiveStream,
  YoutubeAPIResponse,
  Channel,
  YoutubeAPIChannelResponse,
} from "./types";
import axios from "axios";

const API_KEY = process.env.YOUTUBE_API_KEY;

async function request<TResponse>(
  url: string,
  config: RequestInit = {}
  // This function is async, it will return a Promise:
): Promise<TResponse> {
  // Inside, we call the `fetch` function with
  // a URL and config given:
  return fetch(url, config)
    .then((response) => response.json())
    .then((data) => data as TResponse);
}

async function axiosRequest<TResponse>(
  url: string,
  config: {
    params?: { [key: string]: string };
  } = {}
  // This function is async, it will return a Promise:
): Promise<TResponse> {
  // Inside, we call the `fetch` function with
  // a URL and config given:
  return axios.get(url, config).then((response) => response.data);
}

async function getLiveStreamID(channelId: string): Promise<LiveStream> {
  const channelResult = await request<YoutubeAPIResponse>(
    "https://www.googleapis.com/youtube/v3/search?" +
      new URLSearchParams({
        key: API_KEY!,
        type: "video",
        eventType: "live",
        channelId: channelId,
      })
  );

  if (!channelResult) return { isLive: false };
  if (channelResult.items.length === 0) return { isLive: false };
  const streamId = channelResult.items[0].id.videoId;

  return { isLive: true, streamId };
}

export async function getAllLiveChannels(channels: Channel[]) {
  const liveChannels = await Promise.all(
    channels.map(async (channel) => {
      const channelId = await getChannelId(channel.url);
      if (!channelId) return null;
      const { isLive, streamId } = await getLiveStreamID(channelId);
      if (!streamId) return null;
      return { stream: { isLive, streamId }, ...channel };
    })
  );

  const filteredChannels = liveChannels.filter((channel) => channel !== null);
  return filteredChannels;
}

export async function getChannelId(channelURL: string) {
  const response = await axiosRequest<YoutubeAPIChannelResponse>(
    "https://www.googleapis.com/youtube/v3/search",
    {
      params: {
        part: "id",
        q: channelURL,
        type: "channel",
        key: API_KEY!,
      },
    }
  );
  if (response.items.length === 0) return null;
  const channelId = response.items[0].id.channelId;
  return channelId;
}

(async () => {
  const c = await getAllLiveChannels(channels)
  console.log(c)
})()
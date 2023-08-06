export type LiveStream = {
  isLive: boolean;
  streamId?: string;
};

export type LiveChannel = {
  channelId: string;
  stream: LiveStream;
};

export type Channel = {
  name: string;
  url: string;
};

export type YoutubeAPIResponse = {
  kind: string;
  etag: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: { id: { kind: string; videoId: string } }[];
};

export type YoutubeAPIChannelResponse = {
  kind: string;
  etag: string;
  nextPageToken: string;
  regionCode: string;
  pageInfo: {
    totalResults: number;
    resultsPerPage: number;
  };
  items: {
    id: {
      kind: string;
      channelId: string;
    };
  }[];
};

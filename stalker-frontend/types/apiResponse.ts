export type APIResponse = {
    url_channel : string,
    video_details: {
        title: string,
        description: string,
        video_url: string,
        thumbnails: {
            url: string,
            width: number,
            height: number
        }[],
        author: {
            name: string,
            channel_url: string,
            thumbnails: {
                url: string,
            }[]
        }
        liveBroadcastDetails: {
            isLiveNow: boolean,
        }
        subprocess: {} | null
    }
}
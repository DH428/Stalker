export type VtuberData = {
    channelURL: string,
    title: string,
    thumbnailURL: string,
    author: {
        name: string,
        iconURL: string,
    },
    isRecording?: boolean,
    isLive: boolean,
    vodPath: string,
}

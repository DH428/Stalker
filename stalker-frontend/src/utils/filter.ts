import { VtuberData } from "../types/vtuberData";

type FilterCriteria = {
    isLive: boolean,
    channelName: string,
};


export function filterVtuber(vtubers: VtuberData[], criteria: FilterCriteria): VtuberData[]{
    return vtubers.filter((vtuber) => {
        if (criteria.isLive && !vtuber.isLive) return false;
        if (criteria.channelName && !vtuber.channelURL.includes(criteria.channelName)) return false;
        return true;
    });
}

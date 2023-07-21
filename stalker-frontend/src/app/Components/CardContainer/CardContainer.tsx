import React from 'react'
import { VtuberData } from '@/app/types/vtuberData'
import Card from '../Card/Card'

import { nanoid } from 'nanoid'

type CardContainerProps = {
    vtubers: VtuberData[],
    title: "Live Now" | "Upcoming" | "Recorded",
}

const titleMaps = {
    "Live Now": "🔴Live Now",
    "Upcoming": "🔵Upcoming",
    "Recorded": "🟢Recorded"
}

const CardContainer: React.FC<CardContainerProps> = ({ vtubers, title }) => {
    const mappedTitle = titleMaps[title]

    function renderCards(vtubers: VtuberData[]) {
        return vtubers.map((vtuber) => {
            const { channelURL, title, thumbnailURL, isLive, author, isRecording } = vtuber
            return (
               <Card
                    key={nanoid()}
                    channelURL={channelURL} 
                    title={title} 
                    thumbnailURL={thumbnailURL} 
                    isLive={isLive} 
                    author={author} 
                    isRecording={isRecording}
                />
            )
        })
    };



    return (
        <>
            <div className="flex-1 translate-x-[7.5%] flex max-h-[300px] w-[80%] max-w-[80vw] mt-48">
                <div className='max-h-8 min-h-8 -translate-y-8 w-64 text-center font font-semibold rounded-t-lg  bg-black bg-opacity-25'>
                    {mappedTitle}
                </div>
                <div className="absolute flex overflow-x-auto align-middle pb-6 pt-8 w-full rounded-r-2xl rounded-b-2xl shadow-[inset_0_-1px_8px_rgba(0,0,0,0.6)] bg-black bg-opacity-25">
                    {renderCards(vtubers)}
                </div>
            </div>
        </>
    )
}

export default CardContainer;
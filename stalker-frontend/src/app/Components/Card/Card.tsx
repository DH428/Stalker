"use client"

import React from 'react'
import styles from './Card.module.css'
import { VtuberData } from '@/types/vtuberData';
import { motion } from 'framer-motion';


const Card: React.FC<VtuberData> = ({channelURL, title, thumbnailURL, isLive, author, isRecording}) => { 

    const parseTitle = (title: string, length: number) => {
        if (title?.length > length) {
            return title.slice(0, length) + "..."
        }
        return title
    };

    const parsedTitle = parseTitle(title, 50);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 0, backgroundBlendMode: "color-dodge"}}
            animate={{ opacity: 1, y: 0, backgroundBlendMode: "normal"}}
            transition={{ duration: 0.75, delay: 0.1}}
            className={`relative min-w-[400px] mx-10 mb-4 h-56 w-96 rounded-2xl bg-contain drop-shadow-lg transition-all duration-500 hover:!translate-y-1 hover:!cursor-pointer`} onClick={() => {
            window.location.href = channelURL
        }}>            
            <div className="absolute inset-0 z-20 flex flex-col justify-between p-4">
                <div className="flex flex-col">
                    <div className="flex space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-neutral-900">
                            <img src={author.iconURL} alt="Youtube Thumbnail" className="w-8 h-8 rounded-full"/>
                        </div>
                        <div className="flex flex-col">
                            <div className="text-md font-bold text-neutral-100">{author.name}</div>
                            <div className="text-xs font-medium text-neutral-400">{isLive ? "🔴LIVE NOW" : "PREMIERE"}</div>
                        </div>
                    </div>
                    <div className={`text-2xl font-semibold text-center translate-y-12 ${isLive ? styles['rainbow-animation'] : ""}`}>{parsedTitle}</div>
                </div>

            </div>
            <div className="absolute inset-0 z-10 bg-black bg-opacity-[85%] rounded-2xl h-full backdrop-blur-[2px]"/>
            <div
                className="absolute inset-0 h-full w-full bg-contain bg-no-repeat drop-shadow-lg rounded-2xl"
                style={{ backgroundImage: `url(${thumbnailURL})` }}
            />
        </motion.div>
    )
}

export default Card;
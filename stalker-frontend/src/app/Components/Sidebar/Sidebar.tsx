import { VtuberData } from '@/types/vtuberData';
import { nanoid } from 'nanoid';
import React from 'react';

type SidebarProps = {
    vtubers: VtuberData[]
}

const Sidebar: React.FC<SidebarProps> = ({ vtubers }) => {


    function renderLiveStreamers() {
        if (vtubers.length == 0) return (<p className=' font-semibold'>empty 😭</p>)

        return vtubers.map((vtuber) => {
            return (
                <label key={nanoid()}
                    tabIndex={0}
                    className="btn btn-ghost btn-circle 
                                avatar duration-250
                                transition-all hover:scale-110"
                    onClick={() => window.location.href = vtuber.channelURL
                    }>
                    <div className="w-24 rounded-full">
                        <img src={vtuber.author.iconURL} />
                    </div>
                </label>
            )
        }
        )
    }

    return (
        <div className="bg-[#000] bg-opacity-25
                        text-white h-screen
                        max-h-screen w-32 flex flex-col
                        items-center space-y-48 top-8 shadow-lg">
            <nav className="flex flex-wrap">
                <ul className="space-y-4 flex flex-col mt-8 overflow-y-auto">
                    <label tabIndex={0} className="btn btn-ghost btn-circle">
                        <div className="w-24">🔴Live</div>
                    </label>
                    {renderLiveStreamers()}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;

import { nanoid } from 'nanoid';
import React from 'react';



type SidebarProps = {
    liveStreamers : {
        iconURL: string,
        name: string,
        channelURL: string        
    }[]
}

const Sidebar : React.FC<SidebarProps> = ({liveStreamers}) => {


    function renderLiveStreamers() {
        return liveStreamers.map((streamer) => {
            const {channelURL, iconURL, name} = streamer
            return (
                <label key={nanoid()} tabIndex={0} className="btn btn-ghost btn-circle avatar" onClick={() => window.location.href = channelURL}>
                    <div className="w-24 rounded-full">
                        <img src={iconURL} />
                    </div>
                </label>
            )
        }
    )}

    return (
        <div className="bg-gray-800 text-white h-screen max-h-screen w-32 flex flex-col items-center space-y-48 top-8 shadow-lg">
            <nav className="flex flex-wrap">
                <ul className="space-y-4 flex flex-col mt-8">
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

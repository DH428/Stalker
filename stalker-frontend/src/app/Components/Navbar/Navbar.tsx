"use client"

import React from 'react'



function Navbar() {
    return (
        <div className="flex flex-wrap overflow-hidden bg-[#09080f] w-full h-16 drop-shadow-xl justify-center ">
            <div className='flex items-center bg-[#161420] rounded-l-md max-h-12 mt-2'>
                <input type="text" placeholder="Search Channel" className="input input-ghost w-full max-w-xs " />
            </div>
            <div className='flex items-center p-2 rounded-r-md max-h-12 mt-2 w-14 bg-[#262535] opacity-70 hover:opacity-100 '>
                <img src="/searchIcon.svg" width={50} height={50} className='scale-75' />
            </div>
        </div>
    )
}

export default Navbar
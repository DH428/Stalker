"use client"

import React from 'react'



function Navbar() {
    return (
        <div className="navbar backdrop-blur-xl z-30 shadow-xl sticky top-0">
            <div className="flex-1">
                <a className="btn btn-ghost normal-case text-xl">VToober Stalker</a>
            </div>
            <div className="flex-none gap-2">
                <div className="form-control">
                    <input type="text" placeholder="Search" className="input input-bordered w-24 md:w-auto mr-4" />
                </div>
                <div className="dropdown dropdown-end">
                    <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
                        <div className="w-10 rounded-full">
                            <img src="/android-chrome-192x192.png" />
                        </div>
                    </label>
                    <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 font-bold">
                        <li>
                            <a className="justify-between">
                                Stop stalking
                                <span className="badge badge-primary text-white">cringe</span>
                            </a>
                        </li>
                        <li><a>GET OUT</a></li>
                        <li><a>IM CALLING THE COPS</a></li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default Navbar
"use client"
import Navbar from "./Components/Navbar/Navbar";
import CardContainer from "./Components/CardContainer/CardContainer";
import Sidebar from "./Components/Sidebar/Sidebar";
import { useEffect, useState } from "react";
import { filterVtuber } from "@/utils/filter";
import { fetchVtuberData } from "@/utils/fetchVtubers";
import { VtuberData } from "@/types/vtuberData";
import { useInterval } from "usehooks-ts";
import { ToastContainer, toast } from 'react-toastify';

export default function Home() {
  const [vtubers, setVtubers] = useState<VtuberData[]>([]);
  //first fetch
  useEffect(() => {
    fetchVtuberData()
      .then((data: VtuberData[]) => {
        setVtubers(data);
    });
  }, [])

  //refetch evey 5 minutes
  useInterval(() => {
    fetchVtuberData()
      .then((data: VtuberData[]) => {
        setVtubers(data);
    });
  }, 1000 * 60 * 5); //refetch evey 5 minutes

  const [searchCriteria, setSearchCriteria] = useState("");
  const filteredVtubers = filterVtuber(vtubers, {channelName: searchCriteria})
  const liveVtubers = filterVtuber(vtubers, {isLive: true})

  return (
    <>
      <div className="h-screen flex flex-col">
        <main className="flex overflow-auto flex-wrap w-screen h-screen">
          <Navbar setSearchCriteria={setSearchCriteria} />
          <div className="flex w-screen flex-row min-h-screen max-h-screen overflow-y-hidden">
            <Sidebar vtubers={liveVtubers} />
            <CardContainer title="Recorded" vtubers={filteredVtubers} />
          </div>
        </main>
      </div>
    </>
  )
}

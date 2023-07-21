"use client"
import Card from "./Components/Card/Card";
import Navbar from "./Components/Navbar/Navbar";
import CardContainer from "./Components/CardContainer/CardContainer";
import Sidebar from "./Components/Sidebar/Sidebar";
import { VtuberData } from "./types/vtuberData";


export default function Home() {

  /**
   * TODO: Replace this with a list of cards from the backend
   */
  const channelURL = "https://www.youtube.com/channel/UCMwGHR0BTZuLsmjY_NT5Pwg"
  const title = "【SCHEDULE & FREE CHAT】"
  const thumbnail = {
    url: "https://i.ytimg.com/vi/c7K6RInG3Dw/maxresdefault.jpg?v=648f8b9f",
    width: 1920,
    height: 1080
  }
  const isLiveNow = false
  const author = {
    name: "Ninomae Ina'nis Ch. hololive-EN",
    thumbnail: {
      url: "https://yt3.ggpht.com/f4uYWHJxiGwyXm8NUlm818N1MRnywtgL6wM8JdWqWsKBzI7v1eg8dxDWG7igkWuukUSiufydqPg=s176-c-k-c0x00ffffff-no-rj",
      width: 176,
      height: 176
    }
  }

  const channelURL2 = "https://www.youtube.com/channel/UCL_qhgtOy0dy1Agp8vkySQg"
  const title2 = "【ONLY UP!】so hiiiiiiiiiigh, so hiiiiiiiigh..."
  const thumbnail2 = {
    url: "https://i.ytimg.com/vi/BGOtt5DJ6ZQ/maxresdefault.jpg?v=64970f19",
    width: 1920,
    height: 1080
  }
  const isLiveNow2 = true
  const author2 = {
    name: "Takanashi Kiara Ch. hololive-EN",
    thumbnail: {
      url: "https://yt3.ggpht.com/w7TKJYU7zmamFmf-WxfahCo_K7Bg2__Pk-CCBNnbewMG-77OZLqJO9MLvDAmH9nEkZH8OkWgSQ=s176-c-k-c0x00ffffff-no-nd-rj",
      width: 176,
      height: 176
    }
  }

  const vtubers : VtuberData[] = [
    {
      channelURL: channelURL,
      title: title,
      thumbnailURL: thumbnail.url,
      isLive: false,
      isRecording: false,
      author: {
        name: author.name,
        iconURL: author.thumbnail.url
      }
    },
    {
      channelURL: channelURL,
      title: title,
      thumbnailURL: thumbnail.url,
      isLive: true,
      isRecording: false,
      author: {
        name: author.name,
        iconURL: author.thumbnail.url
      }
    },
    {
      channelURL: channelURL,
      title: title,
      thumbnailURL: thumbnail.url,
      isLive: true,
      isRecording: true,
      author: {
        name: author.name,
        iconURL: author.thumbnail.url
      }
    },
    {
      channelURL: channelURL2,
      title: title2,
      thumbnailURL: thumbnail2.url,
      isLive: true,
      isRecording: false,
      author: {
        name: author.name,
        iconURL: author.thumbnail.url
      }
    },
    {
      channelURL: channelURL2,
      title: title2,
      thumbnailURL: thumbnail2.url,
      isLive: false,
      isRecording: false,
      author: {
        name: author.name,
        iconURL: author.thumbnail.url
      }
    },
    
  ];


  return (
    <>
      <div className="h-screen flex flex-col">

        <main className="flex overflow-auto flex-wrap w-screen h-screen">

          <Navbar />
          <div className="flex w-screen flex-row min-h-screen max-h-screen">
            <Sidebar liveStreamers={[
              { iconURL: "/android-chrome-192x192.png", name: "ina", channelURL: "https://www.youtube.com/channel/UCMwGHR0BTZuLsmjY_NT5Pwg" },
              { iconURL: "https://yt3.ggpht.com/8B_T08sx8R7XVi5Mwx_l9sjQm5FGWGspeujSvVDvd80Zyr-3VvVTRGVLOnBrqNRxZp6ZeXAV=s176-c-k-c0x00ffffff-no-nd-rj", name: "cali", channelURL: "https://www.youtube.com/channel/UCL_qhgtOy0dy1Agp8vkySQg" }
            ]} />
            <CardContainer title="Recorded" vtubers={vtubers} />
          </div>
        </main>
      </div>
    </>
  )
}

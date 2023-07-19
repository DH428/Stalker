"use client"
import Card from "./Components/Card/Card";
import Navbar from "./Components/Navbar/Navbar";
import CardContainer from "./Components/CardContainer/CardContainer";


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

  const cards = [<>
    <Card
      channelURL={channelURL}
      title={title}
      thumbnail={thumbnail}
      isLiveNow={isLiveNow}
      author={author}
      isRecording={false}
    />
    <Card
      channelURL={channelURL}
      title={title}
      thumbnail={thumbnail}
      isLiveNow={true}
      author={author}
      isRecording={false}
    />
    <Card
      channelURL={channelURL}
      title={title}
      thumbnail={thumbnail}
      isLiveNow={true}
      author={author}
      isRecording={true}
    />
    <Card
      channelURL={channelURL2}
      title={title2}
      thumbnail={thumbnail2}
      isLiveNow={true}
      author={author2}
      isRecording={true}
    />        <Card
      channelURL={channelURL2}
      title={title2}
      thumbnail={thumbnail2}
      isLiveNow={true}
      author={author2}
      isRecording={true}
    />        <Card
      channelURL={channelURL2}
      title={title2}
      thumbnail={thumbnail2}
      isLiveNow={true}
      author={author2}
      isRecording={true}
    /></>
  ]


  return (
    <>
      <div className="h-screen flex flex-col">
        <Navbar />
        <main className="flex overflow-auto flex-wrap w-screen h-screen">
          <div className="flex w-screen flex-col min-h-screen max-h-screen">
            <CardContainer title="Live Now" cards={cards} />
            <CardContainer title="Recorded" cards={cards} />
          </div>
        </main>
      </div>
    </>
  )
}

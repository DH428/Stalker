import './globals.css'
import { Inter } from 'next/font/google'
import Navbar from './Components/Navbar/Navbar'


const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'VTuber Stalker',
  description: 'Sergej if you read this you are gay',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <svg className="absolute overflow-hidden h-screen blur-[100px] opacity-[6%] top-0 left-0" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#FF0066" d="M52,-39.8C55.2,-24.5,37.2,-6.7,25,15.7C12.8,38.2,6.4,65.2,-3.1,67C-12.6,68.8,-25.2,45.3,-30.5,26.9C-35.8,8.4,-33.7,-4.9,-27.4,-22.1C-21.2,-39.2,-10.6,-60,6.9,-64C24.4,-68,48.8,-55.1,52,-39.8Z" transform="translate(100 100)" />
        </svg>

        <svg className="absolute overflow-hidden h-screen blur-[100px] opacity-[6%] translate-y-[10%] scale-75 translate-x-[85%] max-h-[100vh] top-0 left-0" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <path fill="#2EC0FF" d="M50.6,-63.6C63.3,-60.3,69.9,-42.6,70.2,-26.4C70.5,-10.2,64.5,4.4,57.1,15.9C49.7,27.4,40.9,35.8,31.2,46.1C21.4,56.4,10.7,68.6,-3.4,73.3C-17.5,77.9,-35,75.1,-42.3,64C-49.6,52.9,-46.7,33.6,-50.2,17.6C-53.6,1.6,-63.3,-11.1,-65.6,-26.7C-67.9,-42.3,-62.8,-60.9,-50.6,-64.3C-38.5,-67.8,-19.2,-56.1,-0.2,-55.9C18.9,-55.6,37.8,-66.9,50.6,-63.6Z" transform="translate(100 100)" />
        </svg>
        {children}
      </body>
    </html>
  )
}

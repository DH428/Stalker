import React from 'react'


type CardContainerProps = {
    cards: JSX.Element[],
    title: "🔴Live Now" | "Live Now" | "Upcoming" | "Recorded",
}

const CardContainer: React.FC<CardContainerProps> = ({ cards, title }) => {
    title = title == "Live Now" ? "🔴Live Now" : title
    return (
        <>
            <div className="flex-1 translate-x-[12.5%] flex max-h-[300px] w-[80%] mt-48">
                <div className='max-h-8 min-h-8 -translate-y-8 w-64 text-center font font-semibold rounded-t-lg  bg-black bg-opacity-25'>
                    {title}
                </div>
                <div className="absolute flex overflow-x-auto align-middle pb-6 pt-8 w-full rounded-r-2xl rounded-b-2xl shadow-[inset_0_-1px_8px_rgba(0,0,0,0.6)] bg-black bg-opacity-25">
                    {cards.map((card, _) => {
                        return (
                            <>
                                {card}
                            </>
                        )
                    })}
                </div>
            </div>
        </>
    )
}

export default CardContainer;
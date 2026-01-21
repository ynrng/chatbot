

export default function Home() {
  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] place-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {
          ['/movie', '/chat', '/countdown','/flight','/train',
          '/wordle',
          ].map((v) => (
            <a
          className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
          href={v}
          key={v}
          target="_self"
            rel="noopener noreferrer"
          >
          {v}
          </a>
          ))
        }
      </main>
    </div>
  );
}

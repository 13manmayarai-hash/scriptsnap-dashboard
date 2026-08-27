export default function Footer() {
  return (
    <footer className="border-t border-[#E3E0D7] bg-[#F9F8F4] px-6 py-10 lg:px-10">
      <div className="mx-auto flex max-w-[1380px] flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <div className="text-[16px] font-semibold text-[#20201E]">ScriptSnap</div>
          <p className="mt-1 text-[12px] text-[#918D84]">Built solo by a YouTube Shorts creator.</p>
        </div>
        <div className="flex gap-7 text-[12px] text-[#706E68]">
          <a href="/privacy" className="rounded transition hover:text-[#20201E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage">Privacy</a>
          <a href="/terms" className="rounded transition hover:text-[#20201E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage">Terms</a>
          <a href="#" className="rounded transition hover:text-[#20201E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage">Contact</a>
        </div>
      </div>
    </footer>
  )
}

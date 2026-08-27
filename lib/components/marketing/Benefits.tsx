import { Feature } from './Shared'

export default function Benefits() {
  return (
    <section className="border-t border-[#E2DFD6] bg-[#F1EFE8]">
      <div className="mx-auto grid max-w-[1380px] grid-cols-1 divide-y divide-[#DDD9CF] px-6 py-0 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-10">
        <Feature number="01" title="Write faster" description="Turn a topic into a full script and content kit in under a minute, not an afternoon." />
        <Feature number="02" title="Sound like yourself" description="Trained on your own back-catalog, so every script sounds like you, not a generic AI voice." />
        <Feature number="03" title="Post with confidence" description="Every script is checked against YouTube's Community Guidelines before you post — copyright, monetization risk, all of it." />
      </div>
    </section>
  )
}

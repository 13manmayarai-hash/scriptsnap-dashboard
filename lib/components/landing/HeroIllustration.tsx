import Image from 'next/image'

// Two supplied assets, layered: a decorative watercolor wash sits behind
// the character at roughly its own footprint (not a giant fixed box, so
// it can't overwhelm the column), and the character renders on top of it.
// Both PNGs carry real alpha transparency — no flattening, no checkerboard.
//
// This always sits in the hero's right grid column (never a full-width
// stacked block), so it just fills that column at every viewport width
// rather than capping to a fixed pixel max-width tuned for a mobile stack.
export default function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[145%] w-[145%] -translate-x-1/2 -translate-y-1/2 opacity-90"
        aria-hidden="true"
      >
        <Image src="/hero-bg-decoration.png" alt="" fill className="object-contain" priority sizes="45vw" />
      </div>
      <Image
        src="/hero-character.png"
        alt="Illustration of a smiling creator in a backwards cap and hoodie, arms crossed"
        width={525}
        height={672}
        priority
        sizes="45vw"
        className="relative z-10 h-auto w-full object-contain"
      />
    </div>
  )
}

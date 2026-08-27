import Image from 'next/image'

// Two supplied assets, layered: a decorative watercolor wash sits behind
// the character at roughly its own footprint (not a giant fixed box, so
// it can't overwhelm the column on narrow screens), and the character
// renders on top of it. Both PNGs carry real alpha transparency — no
// flattening, no checkerboard.
export default function HeroIllustration() {
  return (
    <div className="relative mx-auto w-full max-w-[320px] sm:max-w-[380px] lg:max-w-none lg:w-full">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2 opacity-90"
        aria-hidden="true"
      >
        <Image src="/hero-bg-decoration.png" alt="" fill className="object-contain" priority sizes="(max-width: 640px) 380px, 45vw" />
      </div>
      <Image
        src="/hero-character.png"
        alt="Illustration of a smiling creator in a backwards cap and hoodie, arms crossed"
        width={525}
        height={672}
        priority
        sizes="(max-width: 640px) 320px, 45vw"
        className="relative z-10 h-auto w-full object-contain"
      />
    </div>
  )
}

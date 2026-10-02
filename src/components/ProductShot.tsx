import Image from "next/image";

export type ShotName = "admin" | "cabins" | "emar" | "pos" | "counselor" | "checkin" | "bunk-notes";

/**
 * A real screen from the demo camp, captured by scripts/capture-screenshots.ts.
 * Framed like a browser window so it reads as the product, not a stock photo.
 */
export default function ProductShot({ name, alt, caption, priority = false }: { name: ShotName; alt: string; caption?: string; priority?: boolean }) {
  return (
    <figure className="space-y-3">
      <div className="overflow-hidden rounded-2xl border-2 border-stone-200 bg-white shadow-xl">
        <div className="flex items-center gap-1.5 border-b border-stone-200 bg-stone-100 px-4 py-2.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
        </div>
        <picture>
          <source media="(max-width: 640px)" srcSet={`/screenshots/${name}-mobile.png`} />
          <Image src={`/screenshots/${name}.png`} alt={alt} width={2560} height={1720} priority={priority} className="h-auto w-full" sizes="(max-width: 1152px) 100vw, 1152px" />
        </picture>
      </div>
      {caption && <figcaption className="text-center text-xs font-semibold text-stone-500 sm:text-sm">{caption}</figcaption>}
    </figure>
  );
}

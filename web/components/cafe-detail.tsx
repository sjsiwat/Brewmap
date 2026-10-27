import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  MapPin,
  ParkingCircle,
  PawPrint,
  Star,
} from "lucide-react";
import type { Cafe } from "@/lib/cafes";
import { formatPrice, osmEmbedUrl, osmViewUrl } from "@/lib/cafes";
import { DistanceFromOrigin } from "@/components/location-origin";
import { Reveal } from "@/components/reveal";

interface Fact {
  label: string;
  value: string;
  icon: typeof Clock;
}

export function CafeDetail({ cafe }: { cafe: Cafe }) {
  const facts: Fact[] = [
    { label: "Hours", value: cafe.hours, icon: Clock },
    {
      label: "Rating",
      value: `${cafe.rating.toFixed(1)} · ${cafe.reviewCount} reviews`,
      icon: Star,
    },
    { label: "Pet friendly", value: cafe.petFriendly ? "Yes" : "No", icon: PawPrint },
    { label: "Parking", value: cafe.parking ? "Yes" : "No", icon: ParkingCircle },
  ];

  return (
    <section className="border-b border-line">
      <div className="mx-auto max-w-6xl px-6 py-16 md:px-10 md:py-20">
        <Reveal>
          <Link
            href="/cafes"
            className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] text-muted transition-colors hover:text-rust focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust"
          >
            <ArrowLeft size={14} aria-hidden />
            All cafés
          </Link>

          <p className="mt-8 flex items-center gap-1.5 font-mono text-xs uppercase tracking-[0.16em] text-rust">
            <MapPin size={13} aria-hidden />
            {cafe.area} · {cafe.address}
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl tracking-tight text-ink sm:text-5xl">
            {cafe.name}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
            {cafe.specialty}. Flavor profile: {cafe.flavor.toLowerCase()}.
            Atmosphere: {cafe.atmosphere.toLowerCase()}.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 font-mono text-[0.65rem] uppercase tracking-[0.1em] text-muted">
            <span>{formatPrice(cafe.priceAvg)}</span>
            <DistanceFromOrigin lat={cafe.lat} lng={cafe.lng} />
            {cafe.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-12">
          <Reveal delay={0.05} className="lg:col-span-5">
            <dl className="border-t border-ink">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-center justify-between gap-4 border-b border-line py-4"
                >
                  <dt className="flex items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.12em] text-muted">
                    <fact.icon size={14} aria-hidden />
                    {fact.label}
                  </dt>
                  <dd className="text-right text-sm text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={0.1} className="lg:col-span-7">
            <div className="border border-line bg-paper-raised">
              <div className="flex items-center justify-between border-b border-line px-5 py-3">
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-muted">
                  Location
                </span>
                <a
                  href={osmViewUrl(cafe.lat, cafe.lng)}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[0.65rem] uppercase tracking-[0.16em] text-rust hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rust"
                >
                  View larger map
                </a>
              </div>
              <iframe
                title={`Map showing the location of ${cafe.name}`}
                src={osmEmbedUrl(cafe.lat, cafe.lng)}
                loading="lazy"
                className="h-72 w-full border-0 sm:h-80"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

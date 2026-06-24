import { MapPlaceholder } from "@/components/placeholders/MapPlaceholder";
import { GOOGLE_MAPS_URL, INSTITUTION_ADDRESS } from "@/lib/constants";

export function Location() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div className="scroll-reveal" data-reveal="left">
            <p className="section-eyebrow">Localização</p>
            <h2 className="section-title mt-3 text-3xl font-bold sm:text-4xl">
              Atendimento institucional em Paranaguá
            </h2>
            <p className="section-copy mt-6 text-lg leading-8">
              {INSTITUTION_ADDRESS}
            </p>
            {/* TODO: Replace # with a validated Google Maps URL. */}
            <a
              href={GOOGLE_MAPS_URL}
              className="btn-base btn-primary mt-8"
            >
              Ver no mapa
            </a>
          </div>
          <div className="scroll-reveal" data-reveal="right">
            <MapPlaceholder className="card-simple w-full p-2" />
          </div>
        </div>
      </div>
    </section>
  );
}

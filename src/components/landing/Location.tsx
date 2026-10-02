import { MapPlaceholder } from "@/components/placeholders/MapPlaceholder";
import { GOOGLE_MAPS_URL, INSTITUTION_ADDRESS } from "@/lib/constants";

export function Location() {
  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[90rem] px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
          <div className="scroll-reveal" data-reveal="left">
            <p className="section-eyebrow">Localização</p>
            <h2 className="section-title mt-4 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-5xl">
              Atendimento institucional em Paranaguá
            </h2>
            <p className="section-copy mt-6 max-w-xl text-base leading-8 sm:text-lg">
              {INSTITUTION_ADDRESS}
            </p>
            <a
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
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

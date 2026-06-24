import Image from "next/image";
import { PARTNER_COMPANIES } from "@/lib/constants";

export function PartnerCompanies() {
  return (
    <div className="card-simple scroll-reveal mt-12 p-6 sm:p-8" data-reveal="up">
      <div className="max-w-3xl">
        <h3 className="text-2xl font-bold text-[var(--inat-primary)]">
          Empresas que caminham com o INAT
        </h3>
        <p className="section-copy mt-3 text-base leading-7">
          O INAT conta com a parceria de empresas que acreditam na formação
          profissional, na inclusão social e no desenvolvimento de novos
          talentos para o mercado de trabalho.
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PARTNER_COMPANIES.map((company) => (
          <article
            key={company.name}
            className="card-muted flex min-h-32 items-center gap-4 p-5"
          >
            {/* TODO: Render official logos from /public/partners/ when available. */}
            <div className="grid size-16 shrink-0 place-items-center rounded-full bg-white text-xs font-bold text-[var(--inat-secondary)] shadow-[inset_0_0_0_1px_var(--inat-line)]">
              {company.logo ? (
                <Image
                  src={company.logo}
                  alt={`Logo ${company.name}`}
                  width={96}
                  height={64}
                  className="max-h-10 w-auto object-contain"
                />
              ) : (
                "Logo"
              )}
            </div>
            <div>
              <h4 className="font-semibold text-[var(--inat-primary)]">
                {company.name}
              </h4>
              <p className="section-copy mt-1 text-sm">
                Espaço reservado para empresa parceira.
              </p>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

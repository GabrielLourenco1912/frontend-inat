import Link from "next/link";
import { Icon } from "@/components/design-system/Icon";
import { PageHeader, Sheet } from "@/components/design-system/PortalPrimitives";

export default function AccessDeniedPage() {
  return (
    <>
      <PageHeader eyebrow="Permissão" title="Você não tem acesso a este conteúdo" description="Sua sessão continua ativa. O menu mostra somente as áreas disponíveis para o seu vínculo atual." />
      <Sheet accent className="grid min-h-80 place-items-center p-8 text-center">
        <div>
          <span className="mx-auto grid size-12 place-items-center bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]">
            <Icon name="shield" className="size-6" />
          </span>
          <h2 className="mt-5 text-lg font-semibold">Acesso restrito pelo seu perfil</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--inat-muted)]">
            Se você acredita que deveria acessar esta área, peça à equipe do INAT para conferir seu vínculo e suas permissões.
          </p>
          <Link href="/sistema" className="portal-button portal-button-primary mt-6">
            <Icon name="arrow-left" className="size-4" />
            Voltar à central do dia
          </Link>
        </div>
      </Sheet>
    </>
  );
}

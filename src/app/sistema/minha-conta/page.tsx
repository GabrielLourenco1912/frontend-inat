import { LogoutButton } from "@/components/portal/LogoutButton";
import { DefinitionList, PageHeader, Sheet, StatusMark } from "@/components/design-system/PortalPrimitives";
import { requireActor } from "@/lib/auth/session";

export default async function AccountPage() {
  const actor = await requireActor();
  return (
    <>
      <PageHeader eyebrow="Conta e sessão" title="Minha conta" description="Dados de identificação, vínculos e informações da sessão atual." action={<LogoutButton />} />
      <div className="grid gap-5 xl:grid-cols-[0.72fr_1.28fr]">
        <Sheet accent className="p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-14 place-items-center bg-[var(--inat-ink)] text-sm font-bold text-white">{actor.initials}</span>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">{actor.name}</h2>
              <p className="mt-1 truncate text-sm text-[var(--inat-muted)]">{actor.email}</p>
            </div>
          </div>
          <div className="mt-6 border-t border-[var(--inat-line)] pt-5">
            <StatusMark tone={actor.status === "Ativo" ? "success" : "warning"}>{actor.status}</StatusMark>
            <p className="mt-3 text-sm leading-6 text-[var(--inat-muted)]">A identidade, os vínculos e os módulos do portal são carregados do backend. Listas vazias representam o estado real da base.</p>
          </div>
        </Sheet>
        <Sheet>
          <DefinitionList
            columns={2}
            items={[
              { label: "Nome", value: actor.name },
              { label: "E-mail", value: actor.email },
              { label: "Perfil principal", value: actor.roleLabel },
              { label: "Papéis acumulados", value: actor.roles.join(" · ") || "Nenhum papel atribuído", mono: true },
              { label: "Último acesso", value: actor.lastAccess },
              { label: "Estado da conta", value: <StatusMark>{actor.status}</StatusMark> },
            ]}
          />
        </Sheet>
      </div>
    </>
  );
}

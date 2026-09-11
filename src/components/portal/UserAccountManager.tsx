"use client";

import { ListPagination } from "@/components/design-system/ListPagination";
import type { Pagination } from "@/lib/pagination";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import {
  EmptyState,
  PageHeader,
  StatusMark,
  type StatusTone,
} from "@/components/design-system/PortalPrimitives";
import type { UserAccountStatus, UserResponse } from "@/lib/api/contracts";
import {
  apiRequest,
  deleteResource,
  putJson,
  requestErrorMessage,
} from "@/lib/api/client";
import type { Person, RoleRecord, UserRole } from "@/lib/api/domain-contracts";
import { apiLabel, formatDateTime } from "@/lib/api/format";
import { hasPersonType } from "@/lib/people/person-types";

type UserAccountManagerProps = {
  users: UserResponse[];
  pagination?: Pagination;
  people: Person[];
  roles: RoleRecord[];
  roleAssignments: Record<string, UserRole[]>;
};

type StatusPresentation = {
  label: string;
  tone: StatusTone;
  description: string;
};

const statusPresentation: Record<UserAccountStatus, StatusPresentation> = {
  ACTIVE: {
    label: "Ativo",
    tone: "success",
    description:
      "A conta possui e-mail confirmado, pode entrar no portal e os papéis atribuídos determinam os módulos disponíveis.",
  },
  INVITED: {
    label: "Convidado",
    tone: "warning",
    description:
      "A conta fica sem acesso até confirmar o e-mail. Salvar este estado remove uma confirmação anterior e revoga as sessões existentes.",
  },
  LOCKED: {
    label: "Bloqueado",
    tone: "danger",
    description:
      "Um bloqueio definido aqui é administrativo e não expira. A conta perde o acesso e todas as sessões são revogadas.",
  },
  DISABLED: {
    label: "Desativado",
    tone: "danger",
    description:
      "A conta não pode entrar nem usar seus papéis. Sessões são revogadas e e-mails de notificação ainda pendentes são cancelados.",
  },
};

function statusDescription(user: UserResponse, previewStatus: UserAccountStatus) {
  if (previewStatus === "LOCKED" && user.status === "LOCKED" && user.lockedUntil) {
    return (
      "Bloqueio automático até " +
      formatDateTime(user.lockedUntil) +
      ". Depois desse horário, o backend restaura automaticamente o estado anterior."
    );
  }
  return statusPresentation[previewStatus].description;
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function UserAccountManager({
  users,
  people,
  roles,
  roleAssignments,
  pagination,
}: UserAccountManagerProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(users[0]?.id ?? "");
  const [previewStatus, setPreviewStatus] = useState<UserAccountStatus>(
    users[0]?.status ?? "ACTIVE",
  );
  const [loginEmail, setLoginEmail] = useState(users[0]?.loginEmail ?? "");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selected = users.find((user) => user.id === selectedId) ?? users[0];
  const selectedPerson = people.find((person) => person.id === selected?.personId);
  const availableRoles = roles.filter((role) => hasPersonType(selectedPerson, role.code)
    || selected?.roles.some((assigned) => assigned === role.code));
  const loginEmailChanged = selected
    ? normalizeEmail(loginEmail) !== normalizeEmail(selected.loginEmail)
    : false;
  const activeStatusUnavailable = Boolean(
    selected && (!selected.emailVerifiedAt || loginEmailChanged),
  );
  const activationBlocked =
    previewStatus === "ACTIVE" && activeStatusUnavailable;
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return users.filter((user) =>
      [
        user.displayName,
        user.loginEmail,
        user.roles.join(" "),
        apiLabel(user.status),
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(normalized),
    );
  }, [query, users]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;

    const form = new FormData(event.currentTarget);
    const requestedEmail = String(form.get("loginEmail") ?? "").trim();
    const requestedStatus = String(form.get("status")) as UserAccountStatus;
    const requestedEmailChanged =
      normalizeEmail(requestedEmail) !== normalizeEmail(selected.loginEmail);
    if (
      requestedStatus === "ACTIVE" &&
      (!selected.emailVerifiedAt || requestedEmailChanged)
    ) {
      setError(
        "Uma conta sem e-mail confirmado deve permanecer como convidada até concluir a verificação.",
      );
      setMessage("");
      return;
    }
    const desiredRoleIds = new Set(form.getAll("roleId").map(Number));
    const assigned = roleAssignments[selected.id] ?? [];
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await putJson<UserResponse>(
        "/api/backend/users/" + encodeURIComponent(selected.id),
        {
          displayName: String(form.get("displayName") ?? "").trim(),
          loginEmail: requestedEmail,
          password: String(form.get("password") ?? "") || null,
          status: requestedStatus,
        },
      );

      const currentRoleIds = new Set(
        assigned.map((assignment) => assignment.roleId),
      );
      await Promise.all([
        ...[...desiredRoleIds]
          .filter((id) => !currentRoleIds.has(id))
          .map((roleId) =>
            apiRequest<UserRole>(
              "/api/backend/users/" +
                encodeURIComponent(selected.id) +
                "/roles",
              { method: "POST", body: { roleId } },
            ),
          ),
        ...assigned
          .filter((assignment) => !desiredRoleIds.has(assignment.roleId))
          .map((assignment) =>
            deleteResource(
              "/api/backend/users/" +
                encodeURIComponent(selected.id) +
                "/roles/" +
                assignment.roleId,
            ),
          ),
      ]);
      setMessage(
        requestedStatus === "ACTIVE"
          ? "Conta e papéis atualizados no backend."
          : "Conta atualizada. Os papéis permanecem registrados, mas não concedem acesso enquanto ela não estiver ativa.",
      );
      router.refresh();
    } catch (requestError) {
      setError(
        requestErrorMessage(
          requestError,
          "Não foi possível atualizar a conta.",
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (
      !selected ||
      !window.confirm("Excluir a conta de " + selected.displayName + "?")
    ) {
      return;
    }
    setError("");
    try {
      await deleteResource(
        "/api/backend/users/" + encodeURIComponent(selected.id),
      );
      router.refresh();
    } catch (requestError) {
      setError(
        requestErrorMessage(
          requestError,
          "Não foi possível excluir a conta.",
        ),
      );
    }
  }

  const preview: StatusPresentation = activationBlocked
    ? {
        label: "Ativação indisponível",
        tone: "warning",
        description:
          "A conta precisa confirmar o e-mail antes de ser ativada. Mantenha-a como convidada até a validação do código.",
      }
    : statusPresentation[previewStatus];

  return (
    <>
      <PageHeader
        eyebrow="Administração"
        title="Usuários"
        description="Contas existentes, vínculo imutável com pessoa, papéis e situação. Novas contas entram somente pelo cadastro público."
      />
      {error ? (
        <p
          role="alert"
          className="mb-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
        >
          {error}
        </p>
      ) : null}
      {message ? (
        <p
          role="status"
          className="mb-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900"
        >
          {message}
        </p>
      ) : null}

      {!users.length ? (
        <div className="border border-[var(--inat-line)] bg-white">
          <EmptyState
            title="Nenhuma conta"
            description="Nenhuma conta foi encontrada. O primeiro acesso deve começar no cadastro público."
            icon="people"
          />
        </div>
      ) : (
        <div className="border border-[var(--inat-line)] bg-white lg:grid lg:min-h-[36rem] lg:grid-cols-[minmax(17rem,0.75fr)_minmax(28rem,1.25fr)]">
          <aside className="border-b border-[var(--inat-line)] lg:border-b-0 lg:border-r">
            <div className="border-b border-[var(--inat-line)] p-3">
              <div className="relative">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]"
                />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  type="search"
                  placeholder="Buscar conta nesta página"
                  className="portal-field h-10 w-full pl-9 pr-3"
                />
              </div>
            </div>
            <div className="divide-y divide-[var(--inat-line)]">
              {visible.map((user) => {
                const presentation = statusPresentation[user.status];
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(user.id);
                      setPreviewStatus(user.status);
                      setLoginEmail(user.loginEmail);
                      setError("");
                      setMessage("");
                    }}
                    className={
                      "w-full border-l-[3px] p-4 text-left " +
                      (selected?.id === user.id
                        ? "border-[var(--inat-clay)] bg-[var(--inat-mist)]"
                        : "border-transparent")
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {user.displayName}
                        </p>
                        <p className="mt-1 truncate text-xs text-[var(--inat-muted)]">
                          {user.loginEmail}
                        </p>
                      </div>
                      <StatusMark tone={presentation.tone}>
                        {presentation.label}
                      </StatusMark>
                    </div>
                    <p className="mt-2 font-mono text-[0.625rem] text-[var(--inat-muted)]">
                      {user.roles.join(" · ") || "Sem papel"}
                    </p>
                  </button>
                );
              })}
            </div>
            {pagination ? <ListPagination shown={visible.length} {...pagination} /> : null}
          </aside>

          {selected ? (
            <form
              key={selected.id + "-" + selected.updatedAt}
              onSubmit={save}
            >
              <div className="border-b border-[var(--inat-line)] p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold">Editar conta</h2>
                    <p className="mt-1 text-xs text-[var(--inat-muted)]">
                      Último acesso: {formatDateTime(selected.lastLoginAt)}
                    </p>
                  </div>
                  <StatusMark tone={statusPresentation[selected.status].tone}>
                    {statusPresentation[selected.status].label}
                  </StatusMark>
                </div>
              </div>

              <div className="grid gap-5 p-5">
                <div
                  className={
                    "border p-4 text-sm leading-6 " +
                    (preview.tone === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                      : preview.tone === "warning"
                        ? "border-amber-200 bg-amber-50 text-amber-950"
                        : "border-rose-200 bg-rose-50 text-rose-950")
                  }
                  role="status"
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      name={preview.tone === "success" ? "check" : "alert"}
                      className="size-4 shrink-0"
                    />
                    <strong>{preview.label}</strong>
                  </div>
                  <p className="mt-1">
                    {activationBlocked
                      ? preview.description
                      : statusDescription(selected, previewStatus)}
                  </p>
                  <p className="mt-2 text-xs opacity-80">
                    E-mail confirmado:{" "}
                    {selected.emailVerifiedAt
                      ? formatDateTime(selected.emailVerifiedAt)
                      : "não"}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="portal-label">Nome de exibição</span>
                    <input
                      name="displayName"
                      defaultValue={selected.displayName}
                      maxLength={150}
                      className="portal-field mt-2 h-10 w-full px-3"
                      required
                    />
                  </label>
                  <label>
                    <span className="portal-label">E-mail de login</span>
                    <input
                      name="loginEmail"
                      type="email"
                      value={loginEmail}
                      onChange={(event) => {
                        const nextEmail = event.target.value;
                        setLoginEmail(nextEmail);
                        if (
                          previewStatus === "ACTIVE" &&
                          normalizeEmail(nextEmail) !==
                            normalizeEmail(selected.loginEmail)
                        ) {
                          setPreviewStatus("INVITED");
                        }
                      }}
                      maxLength={254}
                      className="portal-field mt-2 h-10 w-full px-3"
                      required
                    />
                  </label>
                  <label>
                    <span className="portal-label">Pessoa vinculada</span>
                    <input
                      value={
                        people.find((person) => person.id === selected.personId)
                          ?.fullName ?? selected.personId
                      }
                      className="portal-field mt-2 h-10 w-full cursor-not-allowed bg-[var(--inat-paper)] px-3 text-[var(--inat-muted)]"
                      aria-describedby="linked-person-help"
                      readOnly
                    />
                    <span
                      id="linked-person-help"
                      className="mt-2 block text-xs leading-5 text-[var(--inat-muted)]"
                    >
                      Este vínculo é definido na criação da conta e não pode ser alterado.
                    </span>
                  </label>
                  <label>
                    <span className="portal-label">Situação</span>
                    <select
                      name="status"
                      value={previewStatus}
                      onChange={(event) =>
                        setPreviewStatus(
                          event.target.value as UserAccountStatus,
                        )
                      }
                      className="portal-field mt-2 h-10 w-full px-3"
                    >
                      <option value="INVITED">Convidado</option>
                      <option
                        value="ACTIVE"
                        disabled={activeStatusUnavailable}
                      >
                        Ativo
                      </option>
                      <option value="LOCKED">Bloqueado</option>
                      <option value="DISABLED">Desativado</option>
                    </select>
                    {activeStatusUnavailable ? (
                      <span className="mt-2 block text-xs leading-5 text-amber-800">
                        {loginEmailChanged
                          ? "Alterar o e-mail remove a confirmação atual. Salve como convidado para validar o novo endereço."
                          : "A ativação será feita automaticamente após a confirmação do e-mail."}
                      </span>
                    ) : null}
                  </label>
                  <label className="sm:col-span-2">
                    <span className="portal-label">
                      Nova senha administrativa (opcional)
                    </span>
                    <input
                      name="password"
                      type="password"
                      minLength={8}
                      autoComplete="new-password"
                      className="portal-field mt-2 h-10 w-full px-3"
                    />
                    <span className="mt-2 block text-xs leading-5 text-[var(--inat-muted)]">
                      Alterar a senha encerra imediatamente todas as outras
                      sessões da conta.
                    </span>
                  </label>
                </div>

                <fieldset className="border border-[var(--inat-line)] p-4">
                  <legend className="px-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">
                    Papéis
                  </legend>
                  <p className="mb-4 text-xs leading-5 text-[var(--inat-muted)]">
                    Papéis podem ficar pré-atribuídos, mas só concedem acesso
                    enquanto a conta estiver ativa. Novos papéis exigem o tipo correspondente
                    no cadastro da pessoa.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {availableRoles.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-start gap-3 text-sm"
                      >
                        <input
                          type="checkbox"
                          name="roleId"
                          value={role.id}
                          defaultChecked={(roleAssignments[selected.id] ?? []).some(
                            (assignment) => assignment.roleId === role.id,
                          )}
                        />
                        <span>
                          <strong className="block">{role.name}</strong>
                          <span className="text-xs text-[var(--inat-muted)]">
                            {role.code}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="flex flex-wrap justify-between gap-3 border-t border-[var(--inat-line)] p-5">
                <button
                  type="button"
                  onClick={remove}
                  className="portal-button portal-button-quiet text-rose-700"
                >
                  <Icon name="trash" className="size-4" />
                  Excluir conta
                </button>
                <button
                  type="submit"
                  disabled={saving || activationBlocked}
                  title={
                    activationBlocked
                      ? "Confirme o e-mail antes de ativar esta conta."
                      : undefined
                  }
                  className="portal-button portal-button-primary"
                >
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          ) : null}
        </div>
      )}
    </>
  );
}

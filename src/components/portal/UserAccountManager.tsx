"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { EmptyState, PageHeader, StatusMark } from "@/components/design-system/PortalPrimitives";
import type { UserAccountStatus, UserResponse } from "@/lib/api/contracts";
import { apiRequest, deleteResource, putJson, requestErrorMessage } from "@/lib/api/client";
import type { Person, RoleRecord, UserRole } from "@/lib/api/domain-contracts";
import { apiLabel, formatDateTime } from "@/lib/api/format";

export function UserAccountManager({ users, people, roles, roleAssignments }: { users: UserResponse[]; people: Person[]; roles: RoleRecord[]; roleAssignments: Record<string, UserRole[]> }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(users[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const selected = users.find((user) => user.id === selectedId) ?? users[0];
  const visible = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return users.filter((user) => `${user.displayName} ${user.loginEmail} ${user.roles.join(" ")}`.toLocaleLowerCase("pt-BR").includes(normalized));
  }, [query, users]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const desiredRoleIds = new Set(form.getAll("roleId").map(Number));
    const assigned = roleAssignments[selected.id] ?? [];
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await putJson<UserResponse>(`/api/backend/users/${encodeURIComponent(selected.id)}`, {
        personId: String(form.get("personId")),
        displayName: String(form.get("displayName") ?? "").trim(),
        loginEmail: String(form.get("loginEmail") ?? "").trim(),
        password: String(form.get("password") ?? "") || null,
        status: String(form.get("status")) as UserAccountStatus,
      });
      const currentRoleIds = new Set(assigned.map((assignment) => assignment.roleId));
      await Promise.all([
        ...[...desiredRoleIds].filter((id) => !currentRoleIds.has(id)).map((roleId) => apiRequest<UserRole>(`/api/backend/users/${encodeURIComponent(selected.id)}/roles`, { method: "POST", body: { roleId } })),
        ...assigned.filter((assignment) => !desiredRoleIds.has(assignment.roleId)).map((assignment) => deleteResource(`/api/backend/users/${encodeURIComponent(selected.id)}/roles/${assignment.roleId}`)),
      ]);
      setMessage("Conta e papéis atualizados no backend.");
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível atualizar a conta."));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!selected || !window.confirm(`Excluir a conta de ${selected.displayName}?`)) return;
    setError("");
    try {
      await deleteResource(`/api/backend/users/${encodeURIComponent(selected.id)}`);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível excluir a conta."));
    }
  }

  return <>
    <PageHeader eyebrow="Administração" title="Usuários" description="Contas existentes, vínculo obrigatório com pessoa, papéis e situação. Novas contas entram somente pelo cadastro público." />
    {error ? <p role="alert" className="mb-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
    {message ? <p role="status" className="mb-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p> : null}
    {!users.length ? <div className="border border-[var(--inat-line)] bg-white"><EmptyState title="Nenhuma conta" description="Nenhuma conta foi encontrada. O primeiro acesso deve começar no cadastro público." icon="people" /></div> : <div className="border border-[var(--inat-line)] bg-white lg:grid lg:min-h-[36rem] lg:grid-cols-[minmax(17rem,0.75fr)_minmax(28rem,1.25fr)]">
      <aside className="border-b border-[var(--inat-line)] lg:border-b-0 lg:border-r"><div className="border-b border-[var(--inat-line)] p-3"><div className="relative"><Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Buscar conta" className="portal-field h-10 w-full pl-9 pr-3" /></div></div><div className="divide-y divide-[var(--inat-line)]">{visible.map((user) => <button key={user.id} type="button" onClick={() => { setSelectedId(user.id); setError(""); setMessage(""); }} className={`w-full border-l-[3px] p-4 text-left ${selected?.id === user.id ? "border-[var(--inat-clay)] bg-[var(--inat-mist)]" : "border-transparent"}`}><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold">{user.displayName}</p><p className="mt-1 truncate text-xs text-[var(--inat-muted)]">{user.loginEmail}</p></div><StatusMark>{apiLabel(user.status)}</StatusMark></div><p className="mt-2 font-mono text-[0.625rem] text-[var(--inat-muted)]">{user.roles.join(" · ") || "Sem papel"}</p></button>)}</div></aside>
      {selected ? <form key={`${selected.id}-${selected.updatedAt}`} onSubmit={save}><div className="border-b border-[var(--inat-line)] p-5"><h2 className="font-semibold">Editar conta</h2><p className="mt-1 text-xs text-[var(--inat-muted)]">Último acesso: {formatDateTime(selected.lastLoginAt)}</p></div><div className="grid gap-5 p-5"><div className="grid gap-4 sm:grid-cols-2"><label><span className="portal-label">Nome de exibição</span><input name="displayName" defaultValue={selected.displayName} maxLength={150} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">E-mail de login</span><input name="loginEmail" type="email" defaultValue={selected.loginEmail} maxLength={254} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Pessoa vinculada</span><select name="personId" defaultValue={selected.personId} className="portal-field mt-2 h-10 w-full px-3" required>{people.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}</select></label><label><span className="portal-label">Situação</span><select name="status" defaultValue={selected.status} className="portal-field mt-2 h-10 w-full px-3"><option value="INVITED">Convidado</option><option value="ACTIVE">Ativo</option><option value="LOCKED">Bloqueado</option><option value="DISABLED">Desativado</option></select></label><label className="sm:col-span-2"><span className="portal-label">Nova senha administrativa (opcional)</span><input name="password" type="password" minLength={8} autoComplete="new-password" className="portal-field mt-2 h-10 w-full px-3" /></label></div><fieldset className="border border-[var(--inat-line)] p-4"><legend className="px-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">Papéis</legend><div className="grid gap-3 sm:grid-cols-2">{roles.map((role) => <label key={role.id} className="flex items-start gap-3 text-sm"><input type="checkbox" name="roleId" value={role.id} defaultChecked={(roleAssignments[selected.id] ?? []).some((assignment) => assignment.roleId === role.id)} /><span><strong className="block">{role.name}</strong><span className="text-xs text-[var(--inat-muted)]">{role.code}</span></span></label>)}</div></fieldset></div><div className="flex flex-wrap justify-between gap-3 border-t border-[var(--inat-line)] p-5"><button type="button" onClick={remove} className="portal-button portal-button-quiet text-rose-700"><Icon name="trash" className="size-4" />Excluir conta</button><button type="submit" disabled={saving} className="portal-button portal-button-primary">{saving ? "Salvando..." : "Salvar alterações"}</button></div></form> : null}
    </div>}
  </>;
}

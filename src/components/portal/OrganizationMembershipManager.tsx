"use client";

import { PaginatedContent } from "@/components/design-system/ClientPagination";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { EmptyState, SectionHeading, Sheet, StatusMark } from "@/components/design-system/PortalPrimitives";
import { deleteResource, postJson, putJson, requestErrorMessage } from "@/lib/api/client";
import type { OrganizationMembership, Person, RecordStatus } from "@/lib/api/domain-contracts";
import { apiLabel, formatDate } from "@/lib/api/format";
import { hasPersonType, PERSON_TYPE_OPTIONS } from "@/lib/people/person-types";

export function OrganizationMembershipManager({ organizationId, memberships, people }: { organizationId: string; memberships: OrganizationMembership[]; people: Person[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [membershipRole, setMembershipRole] = useState("EMPLOYER_MANAGER");
  const requiredType = PERSON_TYPE_OPTIONS.find(({ code }) => code === membershipRole.trim().toUpperCase())?.code;
  const eligiblePeople = people.filter((person) => !requiredType || hasPersonType(person, requiredType));
  const personMap = new Map(people.map((person) => [person.id, person.fullName]));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaving(true);
    setError("");
    try {
      await postJson<OrganizationMembership>("/api/backend/organization-memberships", {
        personId: String(form.get("personId")),
        organizationId,
        membershipRole: String(form.get("membershipRole") ?? "").trim(),
        jobTitle: String(form.get("jobTitle") ?? "").trim() || null,
        startDate: String(form.get("startDate") ?? ""),
        endDate: String(form.get("endDate") ?? "") || null,
        status: String(form.get("status")) as RecordStatus,
      });
      setOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível criar o vínculo."));
    } finally {
      setSaving(false);
    }
  }

  async function toggle(membership: OrganizationMembership) {
    setError("");
    try {
      await putJson<OrganizationMembership>(`/api/backend/organization-memberships/${encodeURIComponent(membership.id)}`, {
        personId: membership.personId,
        organizationId: membership.organizationId,
        membershipRole: membership.membershipRole,
        jobTitle: membership.jobTitle,
        startDate: membership.startDate,
        endDate: membership.endDate,
        status: (membership.status === "ACTIVE" ? "INACTIVE" : "ACTIVE") as RecordStatus,
      });
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível atualizar o vínculo."));
    }
  }

  async function remove(membership: OrganizationMembership) {
    if (!window.confirm("Remover este vínculo organizacional?")) return;
    setError("");
    try {
      await deleteResource(`/api/backend/organization-memberships/${encodeURIComponent(membership.id)}`);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível remover o vínculo."));
    }
  }

  return <>
    <Sheet>
      <SectionHeading title="Membros da organização" description="Funções correspondentes a um tipo exigem esse tipo no cadastro da pessoa." icon="people" action={<button type="button" onClick={() => setOpen(true)} className="portal-button portal-button-secondary h-9"><Icon name="plus" className="size-4" />Vincular pessoa</button>} />
      {error ? <p role="alert" className="m-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {memberships.length ? <div className="divide-y divide-[var(--inat-line)]"><PaginatedContent>{memberships.map((membership) => <div key={membership.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"><div><p className="text-sm font-semibold">{personMap.get(membership.personId) ?? membership.personId}</p><p className="mt-1 text-xs text-[var(--inat-muted)]">{membership.jobTitle || membership.membershipRole} · {formatDate(membership.startDate)} — {formatDate(membership.endDate)}</p></div><div className="flex items-center gap-2"><StatusMark>{apiLabel(membership.status)}</StatusMark><button type="button" onClick={() => toggle(membership)} className="portal-button portal-button-quiet h-9">{membership.status === "ACTIVE" ? "Inativar" : "Ativar"}</button><button type="button" onClick={() => remove(membership)} className="portal-button portal-button-quiet h-9 text-rose-700" aria-label="Remover vínculo"><Icon name="trash" className="size-4" /></button></div></div>)}</PaginatedContent></div> : <EmptyState title="Nenhum membro vinculado" description="Não há vínculos organizacionais cadastrados." icon="people" />}
    </Sheet>
    {open ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true"><form onSubmit={submit} className="w-full max-w-lg border border-[var(--inat-line)] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Vincular pessoa</h2><button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="text-xl">×</button></div>{error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}<div className="mt-5 grid gap-4"><label><span className="portal-label">Pessoa</span><select key={requiredType ?? "all"} name="personId" defaultValue="" className="portal-field mt-2 h-10 w-full px-3" required><option value="" disabled>Selecione</option>{eligiblePeople.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}</select></label><label><span className="portal-label">Função na organização</span><input name="membershipRole" value={membershipRole} onChange={(event) => setMembershipRole(event.target.value)} list="membership-types" maxLength={40} className="portal-field mt-2 h-10 w-full px-3" required /><datalist id="membership-types">{PERSON_TYPE_OPTIONS.map(({ code, label }) => <option key={code} value={code}>{label}</option>)}</datalist></label><label><span className="portal-label">Cargo (opcional)</span><input name="jobTitle" maxLength={100} className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Início</span><input name="startDate" type="date" className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Término (opcional)</span><input name="endDate" type="date" className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Situação</span><select name="status" defaultValue="ACTIVE" className="portal-field mt-2 h-10 w-full px-3"><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option><option value="SUSPENDED">Suspenso</option></select></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving || !eligiblePeople.length} className="portal-button portal-button-primary">{saving ? "Vinculando..." : "Vincular"}</button></div></form></div> : null}
  </>;
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { SearchSelect } from "@/components/design-system/SearchSelect";
import { DetailList } from "@/components/design-system/DetailList";
import { SectionHeading, Sheet, StatusMark } from "@/components/design-system/PortalPrimitives";
import { deleteResource, postJson, putJson, requestErrorMessage } from "@/lib/api/client";
import type { Learner, LearnerGuardian, Person } from "@/lib/api/domain-contracts";

export function LearnerGuardianManager({ learner, guardians, people, canManage }: { learner: Learner; guardians: LearnerGuardian[]; people: Person[]; canManage: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<LearnerGuardian | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const personMap = new Map(people.map((person) => [person.id, person]));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    const guardianPersonId = editing?.guardianPersonId || String(form.get("guardianPersonId"));
    const body = { guardianPersonId, relationshipType: String(form.get("relationshipType") ?? "").trim().toUpperCase(), legalGuardian: form.get("legalGuardian") === "on", primaryContact: form.get("primaryContact") === "on" };
    try {
      const endpoint = `/api/backend/learners/${encodeURIComponent(learner.id)}/guardians${editing ? `/${encodeURIComponent(editing.guardianPersonId)}` : ""}`;
      if (editing) await putJson(endpoint, body); else await postJson(endpoint, body);
      setEditing(undefined); router.refresh();
    } catch (cause) { setError(requestErrorMessage(cause, "Não foi possível salvar o responsável.")); }
    finally { setSaving(false); }
  }

  async function remove(guardian: LearnerGuardian) {
    if (!window.confirm(`Remover ${guardian.guardianName} dos responsáveis deste aprendiz?`)) return;
    setError("");
    try { await deleteResource(`/api/backend/learners/${encodeURIComponent(learner.id)}/guardians/${encodeURIComponent(guardian.guardianPersonId)}`); router.refresh(); }
    catch (cause) { setError(requestErrorMessage(cause, "Não foi possível remover o responsável.")); }
  }

  return <Sheet>
    <SectionHeading title="Responsáveis vinculados" description="Contatos familiares e responsáveis legais do aprendiz." icon="people" action={canManage ? <button type="button" onClick={() => { setError(""); setEditing(null); }} className="portal-button portal-button-primary"><Icon name="plus" className="size-4" />Adicionar responsável</button> : undefined} />
    {error && editing === undefined ? <p role="alert" className="mx-5 mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
    <DetailList items={guardians} itemLabel="responsável" itemPlural="responsáveis" searchPlaceholder="Buscar nome, relação ou contato"
      searchText={(guardian) => { const person = personMap.get(guardian.guardianPersonId); return `${guardian.guardianName} ${guardian.relationshipType} ${person?.phoneNumber ?? ""} ${person?.contactEmail ?? ""}`; }}
      filterLabel="tipo de vínculo" filterOptions={[
        { value: "primary", label: "Contato principal", matches: (guardian) => guardian.primaryContact },
        { value: "legal", label: "Responsável legal", matches: (guardian) => guardian.legalGuardian },
        { value: "other", label: "Demais contatos", matches: (guardian) => !guardian.primaryContact && !guardian.legalGuardian },
      ]}
      emptyTitle="Nenhum responsável vinculado" emptyDescription="Adicione um contato. Aprendizes menores precisam manter ao menos um responsável legal." emptyIcon="people"
      renderItem={(guardian) => {
      const person = personMap.get(guardian.guardianPersonId);
      return <div key={guardian.guardianPersonId} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
        <div className="min-w-0"><h3 className="text-sm font-semibold">{guardian.guardianName}</h3><p className="mt-1 text-xs text-[var(--inat-muted)]">{guardian.relationshipType}{person?.phoneNumber ? ` · ${person.phoneNumber}` : ""}</p><p className="mt-1 truncate text-xs text-[var(--inat-muted)]">{person?.contactEmail || "E-mail não informado"}{person?.address?.city ? ` · ${person.address.city}/${person.address.stateCode}` : ""}</p><div className="mt-2 flex flex-wrap gap-2">{guardian.primaryContact ? <StatusMark tone="success">Contato principal</StatusMark> : null}{guardian.legalGuardian ? <StatusMark>Responsável legal</StatusMark> : null}</div></div>
        <div className="flex items-center justify-end gap-2">{canManage ? <><button type="button" onClick={() => { setError(""); setEditing(guardian); }} className="portal-button portal-button-quiet h-9">Editar</button><button type="button" onClick={() => void remove(guardian)} aria-label={`Remover ${guardian.guardianName}`} className="portal-button portal-button-quiet h-9 text-rose-700"><Icon name="trash" className="size-4" /></button></> : null}<Link href={`/sistema/pessoas/${guardian.guardianPersonId}`} aria-label={`Ver detalhes de ${guardian.guardianName}`} title="Ver detalhes da pessoa" className="grid size-9 place-items-center border border-[var(--inat-line)] hover:bg-[var(--inat-mist)]"><Icon name="arrow-right" className="size-4" /></Link></div>
      </div>;
    }} />
    {editing !== undefined ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true" aria-label={editing ? "Editar responsável" : "Adicionar responsável"}><form onSubmit={submit} className="w-full max-w-xl border border-[var(--inat-line)] bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-[var(--inat-line)] px-5 py-4"><h2 className="text-lg font-semibold">{editing ? "Editar responsável" : "Adicionar responsável"}</h2><button type="button" onClick={() => setEditing(undefined)} aria-label="Fechar" className="text-xl">×</button></div>{error ? <p role="alert" className="mx-5 mt-5 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}<div className="grid gap-4 p-5 sm:grid-cols-2">{editing ? <div className="sm:col-span-2"><span className="portal-label">Pessoa responsável</span><p className="mt-2 text-sm font-semibold">{editing.guardianName}</p></div> : <label className="sm:col-span-2"><span className="portal-label">Pessoa responsável</span><SearchSelect name="guardianPersonId" label="Pessoa responsável" endpoint="/api/backend/lookups/people?purpose=guardian" required /></label>}<label><span className="portal-label">Relação</span><input name="relationshipType" defaultValue={editing?.relationshipType ?? "Responsável"} maxLength={50} required className="portal-field mt-2 h-10 w-full px-3" /></label><div className="grid content-end gap-2 pb-1"><label className="flex items-center gap-2 text-sm"><input name="legalGuardian" type="checkbox" defaultChecked={editing?.legalGuardian ?? true} />Responsável legal</label><label className="flex items-center gap-2 text-sm"><input name="primaryContact" type="checkbox" defaultChecked={editing?.primaryContact ?? false} />Contato principal</label></div></div><div className="flex justify-end gap-2 border-t border-[var(--inat-line)] px-5 py-4"><button type="button" onClick={() => setEditing(undefined)} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving} className="portal-button portal-button-primary disabled:opacity-50">{saving ? "Salvando..." : "Salvar"}</button></div></form></div> : null}
  </Sheet>;
}

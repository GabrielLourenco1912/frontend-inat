"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { EmptyState, PageHeader } from "@/components/design-system/PortalPrimitives";
import { deleteResource, postJson, putJson, requestErrorMessage } from "@/lib/api/client";
import type { DocumentType } from "@/lib/api/domain-contracts";

export function DocumentTypeManager({ documentTypes }: { documentTypes: DocumentType[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<DocumentType | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      code: String(form.get("code") ?? "").trim().toUpperCase(),
      name: String(form.get("name") ?? "").trim(),
      description: String(form.get("description") ?? "").trim() || null,
    };
    setSaving(true);
    setError("");
    try {
      if (editing) await putJson<DocumentType>(`/api/backend/document-types/${editing.id}`, body);
      else await postJson<DocumentType>("/api/backend/document-types", body);
      setOpen(false);
      setEditing(null);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível salvar o tipo."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(type: DocumentType) {
    if (!window.confirm(`Excluir o tipo ${type.name}?`)) return;
    setError("");
    try {
      await deleteResource(`/api/backend/document-types/${type.id}`);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível excluir o tipo."));
    }
  }

  function create() { setEditing(null); setOpen(true); setError(""); }
  function edit(type: DocumentType) { setEditing(type); setOpen(true); setError(""); }

  return <>
    <PageHeader eyebrow="Administração" title="Tipos de documento" description="Catálogo usado em documentos pessoais e versões contratuais." action={<button type="button" onClick={create} className="portal-button portal-button-primary"><Icon name="plus" className="size-4" />Novo tipo</button>} />
    {error && !open ? <p role="alert" className="mb-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
    <div className="border border-[var(--inat-line)] bg-white">{documentTypes.length ? <div className="divide-y divide-[var(--inat-line)]">{documentTypes.map((type) => <div key={type.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:p-5"><div><p className="text-sm font-semibold">{type.name}</p><p className="mt-1 font-mono text-xs text-[var(--inat-muted)]">{type.code}</p><p className="mt-2 text-xs text-[var(--inat-muted)]">{type.description || "Sem descrição"}</p></div><div className="flex gap-2"><button type="button" onClick={() => edit(type)} className="portal-button portal-button-secondary h-9"><Icon name="edit" className="size-4" />Editar</button><button type="button" onClick={() => remove(type)} className="portal-button portal-button-quiet h-9 text-rose-700" aria-label={`Excluir ${type.name}`}><Icon name="trash" className="size-4" /></button></div></div>)}</div> : <EmptyState title="Nenhum tipo de documento" description="Cadastre o primeiro tipo antes de anexar documentos." icon="document" />}</div>
    {open ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true"><form key={editing?.id ?? "new"} onSubmit={submit} className="w-full max-w-lg border border-[var(--inat-line)] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{editing ? "Editar tipo" : "Novo tipo"}</h2><button type="button" onClick={() => setOpen(false)} className="text-xl" aria-label="Fechar">×</button></div>{error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}<div className="mt-5 grid gap-4"><label><span className="portal-label">Código técnico</span><input name="code" defaultValue={editing?.code ?? ""} pattern="[A-Za-z][A-Za-z0-9_]*" maxLength={50} placeholder="IDENTITY_DOCUMENT" className="portal-field mt-2 h-10 w-full px-3 uppercase" required /></label><label><span className="portal-label">Nome</span><input name="name" defaultValue={editing?.name ?? ""} maxLength={100} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Descrição</span><textarea name="description" defaultValue={editing?.description ?? ""} maxLength={255} rows={4} className="portal-field mt-2 w-full px-3 py-2" /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving} className="portal-button portal-button-primary">{saving ? "Salvando..." : "Salvar"}</button></div></form></div> : null}
  </>;
}

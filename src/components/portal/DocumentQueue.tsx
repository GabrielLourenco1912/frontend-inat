"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { EmptyState, PageHeader, StatusMark } from "@/components/design-system/PortalPrimitives";
import {
  apiRequest,
  deleteResource,
  downloadResource,
  putJson,
  requestErrorMessage,
} from "@/lib/api/client";
import type {
  DocumentType,
  DocumentVerificationStatus,
  Person,
  PersonDocument,
} from "@/lib/api/domain-contracts";
import { apiLabel, formatDate, formatDateTime, formatFileSize } from "@/lib/api/format";

type Filter = DocumentVerificationStatus | "ALL";

function downloadName(disposition: string | null, fallback: string) {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return disposition?.match(/filename="?([^";]+)"?/i)?.[1] ?? fallback;
}

export function DocumentQueue({ documents, documentTypes, people }: { documents: PersonDocument[]; documentTypes: DocumentType[]; people: Person[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(documents[0]?.id ?? "");
  const [filter, setFilter] = useState<Filter>("PENDING");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const personMap = new Map(people.map((person) => [person.id, person]));
  const typeMap = new Map(documentTypes.map((type) => [type.id, type]));
  const visible = useMemo(() => filter === "ALL" ? documents : documents.filter((document) => document.verificationStatus === filter), [documents, filter]);
  const selected = documents.find((document) => document.id === selectedId) ?? visible[0] ?? documents[0];

  async function review(document: PersonDocument, status: DocumentVerificationStatus) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await putJson<PersonDocument>(`/api/backend/person-documents/${encodeURIComponent(document.id)}`, {
        personId: document.personId,
        documentTypeId: document.documentTypeId,
        documentNumber: document.documentNumber,
        issuedOn: document.issuedOn,
        expiresOn: document.expiresOn,
        verificationStatus: status,
      });
      setMessage(`Documento marcado como ${apiLabel(status).toLowerCase()}.`);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível revisar o documento."));
    } finally {
      setSaving(false);
    }
  }

  async function download(document: PersonDocument) {
    setError("");
    try {
      const result = await downloadResource(`/api/backend/person-documents/${encodeURIComponent(document.id)}/content`);
      const url = URL.createObjectURL(result.blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = downloadName(result.contentDisposition, document.file.originalName);
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível baixar o arquivo."));
    }
  }

  async function remove(document: PersonDocument) {
    if (!window.confirm(`Remover ${document.file.originalName}?`)) return;
    setError("");
    try {
      await deleteResource(`/api/backend/person-documents/${encodeURIComponent(document.id)}`);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível remover o documento."));
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const fields = new FormData(formElement);
    const file = fields.get("file");
    if (!(file instanceof File) || !file.size) return;
    const metadata = {
      personId: String(fields.get("personId") ?? ""),
      documentTypeId: Number(fields.get("documentTypeId")),
      documentNumber: String(fields.get("documentNumber") ?? "").trim() || null,
      issuedOn: String(fields.get("issuedOn") ?? "") || null,
      expiresOn: String(fields.get("expiresOn") ?? "") || null,
      verificationStatus: "PENDING" as const,
    };
    const multipart = new FormData();
    multipart.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    multipart.append("file", file);
    setSaving(true);
    setError("");
    try {
      await apiRequest<PersonDocument>("/api/backend/person-documents", { method: "POST", body: multipart });
      formElement.reset();
      setUploadOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível anexar o documento."));
    } finally {
      setSaving(false);
    }
  }

  const filters: { value: Filter; label: string }[] = [
    { value: "PENDING", label: "Pendentes" },
    { value: "VERIFIED", label: "Verificados" },
    { value: "REJECTED", label: "Rejeitados" },
    { value: "EXPIRED", label: "Expirados" },
    { value: "ALL", label: "Todos" },
  ];

  return <>
    <PageHeader eyebrow="Operação documental" title="Documentos pessoais" description="Fila real de arquivos, metadados e verificação." action={<button type="button" onClick={() => setUploadOpen(true)} className="portal-button portal-button-primary"><Icon name="upload" className="size-4" />Anexar documento</button>} />
    {error ? <p role="alert" className="mb-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
    {message ? <p role="status" className="mb-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p> : null}
    <div className="border border-[var(--inat-line)] bg-white">
      <div className="overflow-x-auto border-b border-[var(--inat-line)]"><div className="flex min-w-max">{filters.map((item) => <button key={item.value} type="button" onClick={() => { setFilter(item.value); setSelectedId(""); }} className={`relative min-h-11 px-4 text-sm font-semibold ${filter === item.value ? "text-[var(--inat-teal-dark)]" : "text-[var(--inat-muted)]"}`}>{item.label}{filter === item.value ? <span className="absolute inset-x-3 bottom-0 h-0.5 bg-[var(--inat-clay)]" /> : null}</button>)}</div></div>
      {!documents.length ? <EmptyState title="Nenhum documento pessoal" description="O backend ainda não possui documentos. Use “Anexar documento” para enviar o primeiro arquivo." icon="document" /> : <div className="lg:grid lg:min-h-[36rem] lg:grid-cols-[minmax(18rem,0.85fr)_minmax(25rem,1.15fr)]">
        <div className="border-b border-[var(--inat-line)] lg:border-b-0 lg:border-r">{visible.length ? <div className="divide-y divide-[var(--inat-line)]">{visible.map((document) => { const person = personMap.get(document.personId); return <button key={document.id} type="button" onClick={() => { setSelectedId(document.id); setMessage(""); }} className={`w-full border-l-[3px] p-4 text-left sm:p-5 ${selected?.id === document.id ? "border-l-[var(--inat-clay)] bg-[var(--inat-mist)]" : "border-l-transparent hover:bg-[var(--inat-paper)]"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{person?.fullName ?? document.personId}</p><p className="mt-1 truncate text-xs text-[var(--inat-muted)]">{typeMap.get(document.documentTypeId)?.name ?? `Tipo ${document.documentTypeId}`}</p></div><StatusMark>{apiLabel(document.verificationStatus)}</StatusMark></div><p className="mt-3 font-mono text-[0.625rem] text-[var(--inat-muted)]">Recebido {formatDateTime(document.createdAt)} · validade {formatDate(document.expiresOn)}</p></button>; })}</div> : <EmptyState title="Fila sem documentos" description="Não há documentos neste filtro." icon="check" />}</div>
        {selected ? <section><div className="flex items-start justify-between gap-4 border-b border-[var(--inat-line)] p-4 sm:p-5"><div><p className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.1em] text-[var(--inat-muted)]">Documento em revisão</p><h2 className="mt-2 font-semibold">{typeMap.get(selected.documentTypeId)?.name ?? `Tipo ${selected.documentTypeId}`}</h2><p className="mt-1 text-sm text-[var(--inat-muted)]">{personMap.get(selected.personId)?.fullName ?? selected.personId}</p></div><StatusMark>{apiLabel(selected.verificationStatus)}</StatusMark></div><div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[1fr_15rem]"><div className="grid min-h-72 place-items-center border border-[var(--inat-line)] bg-[var(--inat-paper)] p-6 text-center"><div><span className="mx-auto grid size-14 place-items-center bg-white text-[var(--inat-teal-dark)] shadow-sm"><Icon name="document" className="size-7" /></span><p className="mt-4 text-sm font-semibold">{selected.file.originalName}</p><p className="mt-2 text-xs text-[var(--inat-muted)]">{selected.file.mimeType} · {formatFileSize(selected.file.sizeBytes)}</p><button type="button" onClick={() => download(selected)} className="portal-button portal-button-secondary mt-4 h-9"><Icon name="download" className="size-4" />Baixar arquivo</button></div></div><div><dl className="divide-y divide-[var(--inat-line)] border border-[var(--inat-line)]">{[["Número", selected.documentNumber || "Não informado"], ["Emissão", formatDate(selected.issuedOn)], ["Validade", formatDate(selected.expiresOn)], ["Verificado em", formatDateTime(selected.verifiedAt)]].map(([label, value]) => <div key={label} className="p-3"><dt className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">{label}</dt><dd className="mt-1.5 text-xs">{value}</dd></div>)}</dl><div className="mt-4 grid gap-2"><button type="button" disabled={saving} onClick={() => review(selected, "VERIFIED")} className="portal-button portal-button-primary"><Icon name="check" className="size-4" />Verificar</button><button type="button" disabled={saving} onClick={() => review(selected, "REJECTED")} className="portal-button portal-button-secondary text-rose-700"><Icon name="close" className="size-4" />Rejeitar</button><button type="button" disabled={saving} onClick={() => remove(selected)} className="portal-button portal-button-quiet text-rose-700"><Icon name="trash" className="size-4" />Remover</button></div></div></div></section> : null}
      </div>}
    </div>

    {uploadOpen ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true"><form onSubmit={upload} className="max-h-[90vh] w-full max-w-xl overflow-y-auto border border-[var(--inat-line)] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Anexar documento pessoal</h2><button type="button" onClick={() => setUploadOpen(false)} className="text-xl" aria-label="Fechar">×</button></div>{error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}<div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="portal-label">Pessoa</span><select name="personId" defaultValue="" className="portal-field mt-2 h-10 w-full px-3" required><option value="" disabled>Selecione</option>{people.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}</select></label><label className="sm:col-span-2"><span className="portal-label">Tipo</span><select name="documentTypeId" defaultValue="" className="portal-field mt-2 h-10 w-full px-3" required><option value="" disabled>Selecione</option>{documentTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label><label><span className="portal-label">Número (opcional)</span><input name="documentNumber" maxLength={80} className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Arquivo</span><input name="file" type="file" className="portal-field mt-2 w-full px-3 py-2" required /></label><label><span className="portal-label">Emissão</span><input name="issuedOn" type="date" className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Validade</span><input name="expiresOn" type="date" className="portal-field mt-2 h-10 w-full px-3" /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setUploadOpen(false)} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving || !people.length || !documentTypes.length} className="portal-button portal-button-primary">{saving ? "Enviando..." : "Enviar"}</button></div></form></div> : null}
  </>;
}

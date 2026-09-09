"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import {
  EmptyState,
  PageHeader,
  StatusMark,
} from "@/components/design-system/PortalPrimitives";
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
  PersonDocumentStatusChangeReason,
} from "@/lib/api/domain-contracts";
import { apiLabel, formatDate, formatDateTime, formatFileSize } from "@/lib/api/format";
import {
  DOCUMENT_EXTENSIONS,
  DOCUMENT_FILE_ACCEPT,
  uploadValidationError,
} from "@/lib/files/upload-policy";

type Filter = DocumentVerificationStatus | "ALL";

function downloadName(disposition: string | null, fallback: string) {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return disposition?.match(/filename="?([^";]+)"?/i)?.[1] ?? fallback;
}

function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

function validateDates(issuedOn: string | null, expiresOn: string | null) {
  const today = localToday();
  if (issuedOn && issuedOn > today) return "A emissão não pode estar no futuro.";
  if (expiresOn && expiresOn < today) return "A validade não pode estar vencida.";
  if (issuedOn && expiresOn && expiresOn < issuedOn) {
    return "A validade não pode ser anterior à emissão.";
  }
  return null;
}

function historyLabel(reason: PersonDocumentStatusChangeReason) {
  if (reason === "ADMIN_UPLOAD") return "Anexado e verificado";
  if (reason === "ADMIN_RENEWAL") return "Renovado e verificado";
  return "Expirado automaticamente";
}

export function DocumentQueue({
  documents,
  documentTypes,
  people,
}: {
  documents: PersonDocument[];
  documentTypes: DocumentType[];
  people: Person[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(documents[0]?.id ?? "");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadPersonId, setUploadPersonId] = useState("");
  const [editing, setEditing] = useState<PersonDocument | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const personMap = new Map(people.map((person) => [person.id, person]));
  const typeMap = new Map(documentTypes.map((type) => [type.id, type]));
  const activePeople = people.filter((person) => person.status === "ACTIVE");
  const personDocumentTypes = documentTypes.filter(
    (type) => type.scope === "PERSON" || type.scope === "BOTH",
  );
  const availableUploadTypes = personDocumentTypes.filter(
    (type) => !documents.some(
      (document) => document.personId === uploadPersonId
        && document.documentTypeId === type.id,
    ),
  );
  const visible = useMemo(
    () => filter === "ALL"
      ? documents
      : documents.filter((document) => document.verificationStatus === filter),
    [documents, filter],
  );
  const selected = visible.find((document) => document.id === selectedId) ?? visible[0];
  const selectedPersonIsActive = selected
    ? personMap.get(selected.personId)?.status === "ACTIVE"
    : false;

  async function download(document: PersonDocument) {
    setError("");
    try {
      const result = await downloadResource(
        `/api/backend/person-documents/${encodeURIComponent(document.id)}/content`,
      );
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
      setSelectedId("");
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
    if (!(file instanceof File)) return;
    const fileError = uploadValidationError(file, DOCUMENT_EXTENSIONS);
    if (fileError) {
      setError(fileError);
      return;
    }
    const issuedOn = String(fields.get("issuedOn") ?? "") || null;
    const expiresOn = String(fields.get("expiresOn") ?? "") || null;
    const dateError = validateDates(issuedOn, expiresOn);
    if (dateError) {
      setError(dateError);
      return;
    }
    const metadata = {
      personId: String(fields.get("personId") ?? ""),
      documentTypeId: Number(fields.get("documentTypeId")),
      documentNumber: String(fields.get("documentNumber") ?? "").trim() || null,
      issuedOn,
      expiresOn,
    };
    const multipart = new FormData();
    multipart.append(
      "metadata",
      new Blob([JSON.stringify(metadata)], { type: "application/json" }),
    );
    multipart.append("file", file);
    setSaving(true);
    setError("");
    try {
      await apiRequest<PersonDocument>("/api/backend/person-documents", {
        method: "POST",
        body: multipart,
      });
      formElement.reset();
      setUploadOpen(false);
      setMessage("Documento anexado e verificado automaticamente.");
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível anexar o documento."));
    } finally {
      setSaving(false);
    }
  }

  async function updateMetadata(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    const fields = new FormData(event.currentTarget);
    const issuedOn = String(fields.get("issuedOn") ?? "") || null;
    const expiresOn = String(fields.get("expiresOn") ?? "") || null;
    const dateError = validateDates(issuedOn, expiresOn);
    if (dateError) {
      setError(dateError);
      return;
    }
    setSaving(true);
    setError("");
    try {
      await putJson<PersonDocument>(
        `/api/backend/person-documents/${encodeURIComponent(editing.id)}`,
        {
          personId: editing.personId,
          documentTypeId: editing.documentTypeId,
          documentNumber: String(fields.get("documentNumber") ?? "").trim() || null,
          issuedOn,
          expiresOn,
        },
      );
      setEditing(null);
      setMessage(
        editing.verificationStatus === "EXPIRED"
          ? "Documento renovado e verificado novamente."
          : "Metadados do documento atualizados.",
      );
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível atualizar o documento."));
    } finally {
      setSaving(false);
    }
  }

  const filters: { value: Filter; label: string }[] = [
    { value: "ALL", label: "Todos" },
    { value: "VERIFIED", label: "Verificados" },
    { value: "EXPIRED", label: "Expirados" },
  ];
  const canUpload = activePeople.some((person) => personDocumentTypes.some(
    (type) => !documents.some(
      (document) => document.personId === person.id
        && document.documentTypeId === type.id,
    ),
  ));

  return <>
    <PageHeader
      eyebrow="Operação documental"
      title="Documentos pessoais"
      description="Uploads administrativos são verificados no envio e expiram automaticamente pela validade."
      action={<button type="button" onClick={() => { setUploadPersonId(""); setError(""); setUploadOpen(true); }} disabled={!canUpload} className="portal-button portal-button-primary disabled:cursor-not-allowed disabled:opacity-50"><Icon name="upload" className="size-4" />Anexar documento</button>}
    />
    {error ? <p role="alert" className="mb-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
    {message ? <p role="status" className="mb-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p> : null}
    {!canUpload ? <p className="mb-4 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Para anexar, é necessário ter uma pessoa ativa e um tipo aplicável a documentos pessoais.</p> : null}
    <div className="border border-[var(--inat-line)] bg-white">
      <div className="overflow-x-auto border-b border-[var(--inat-line)]"><div className="flex min-w-max">{filters.map((item) => <button key={item.value} type="button" onClick={() => { setFilter(item.value); setSelectedId(""); }} className={`relative min-h-11 px-4 text-sm font-semibold ${filter === item.value ? "text-[var(--inat-teal-dark)]" : "text-[var(--inat-muted)]"}`}>{item.label}{filter === item.value ? <span className="absolute inset-x-3 bottom-0 h-0.5 bg-[var(--inat-clay)]" /> : null}</button>)}</div></div>
      {!documents.length ? <EmptyState title="Nenhum documento pessoal" description="Use “Anexar documento” para enviar o primeiro arquivo." icon="document" /> : <div className="lg:grid lg:min-h-[36rem] lg:grid-cols-[minmax(18rem,0.85fr)_minmax(25rem,1.15fr)]">
        <div className="border-b border-[var(--inat-line)] lg:border-b-0 lg:border-r">{visible.length ? <div className="divide-y divide-[var(--inat-line)]">{visible.map((document) => { const person = personMap.get(document.personId); return <button key={document.id} type="button" onClick={() => { setSelectedId(document.id); setMessage(""); }} className={`w-full border-l-[3px] p-4 text-left sm:p-5 ${selected?.id === document.id ? "border-l-[var(--inat-clay)] bg-[var(--inat-mist)]" : "border-l-transparent hover:bg-[var(--inat-paper)]"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{person?.fullName ?? document.personId}</p><p className="mt-1 truncate text-xs text-[var(--inat-muted)]">{typeMap.get(document.documentTypeId)?.name ?? `Tipo ${document.documentTypeId}`}</p></div><StatusMark>{apiLabel(document.verificationStatus)}</StatusMark></div><p className="mt-3 font-mono text-[0.625rem] text-[var(--inat-muted)]">Enviado {formatDateTime(document.createdAt)} · validade {formatDate(document.expiresOn)}</p></button>; })}</div> : <EmptyState title="Nenhum documento" description="Não há documentos neste filtro." icon="check" />}</div>
        {selected ? <section><div className="flex items-start justify-between gap-4 border-b border-[var(--inat-line)] p-4 sm:p-5"><div><p className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.1em] text-[var(--inat-muted)]">Documento administrativo</p><h2 className="mt-2 font-semibold">{typeMap.get(selected.documentTypeId)?.name ?? `Tipo ${selected.documentTypeId}`}</h2><p className="mt-1 text-sm text-[var(--inat-muted)]">{personMap.get(selected.personId)?.fullName ?? selected.personId}</p></div><StatusMark>{apiLabel(selected.verificationStatus)}</StatusMark></div>{!selectedPersonIsActive ? <p className="mx-4 mt-4 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 sm:mx-5">A pessoa está inativa ou suspensa. O documento continua disponível para consulta, mas seus metadados não podem ser alterados.</p> : null}<div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[1fr_16rem]"><div><div className="grid min-h-64 place-items-center border border-[var(--inat-line)] bg-[var(--inat-paper)] p-6 text-center"><div><span className="mx-auto grid size-14 place-items-center bg-white text-[var(--inat-teal-dark)] shadow-sm"><Icon name="document" className="size-7" /></span><p className="mt-4 text-sm font-semibold">{selected.file.originalName}</p><p className="mt-2 text-xs text-[var(--inat-muted)]">{selected.file.mimeType} · {formatFileSize(selected.file.sizeBytes)}</p><button type="button" onClick={() => download(selected)} className="portal-button portal-button-secondary mt-4 h-9"><Icon name="download" className="size-4" />Baixar arquivo</button></div></div>{selected.statusHistory.length ? <div className="mt-4 border border-[var(--inat-line)]"><p className="border-b border-[var(--inat-line)] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">Histórico de status</p><div className="divide-y divide-[var(--inat-line)]">{selected.statusHistory.map((history) => <div key={history.id} className="px-3 py-2.5"><p className="text-xs font-semibold">{historyLabel(history.changeReason)}</p><p className="mt-1 text-[0.6875rem] text-[var(--inat-muted)]">{history.previousStatus ? apiLabel(history.previousStatus) : "Criação"} → {apiLabel(history.newStatus)} · {formatDateTime(history.changedAt)}</p></div>)}</div></div> : null}</div><div><dl className="divide-y divide-[var(--inat-line)] border border-[var(--inat-line)]">{[["Número", selected.documentNumber || "Não informado"], ["Emissão", formatDate(selected.issuedOn)], ["Validade", formatDate(selected.expiresOn)], ["Verificado em", formatDateTime(selected.verifiedAt)]].map(([label, value]) => <div key={label} className="p-3"><dt className="text-[0.625rem] font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">{label}</dt><dd className="mt-1.5 text-xs">{value}</dd></div>)}</dl><div className="mt-4 grid gap-2"><button type="button" disabled={saving || !selectedPersonIsActive} onClick={() => setEditing(selected)} className="portal-button portal-button-primary disabled:cursor-not-allowed disabled:opacity-50"><Icon name="edit" className="size-4" />{selected.verificationStatus === "EXPIRED" ? "Renovar dados" : "Editar dados"}</button><button type="button" disabled={saving} onClick={() => remove(selected)} className="portal-button portal-button-quiet text-rose-700"><Icon name="trash" className="size-4" />Remover</button></div></div></div></section> : null}
      </div>}
    </div>

    {uploadOpen ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true"><form onSubmit={upload} className="max-h-[90vh] w-full max-w-xl overflow-y-auto border border-[var(--inat-line)] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Anexar documento pessoal</h2><button type="button" onClick={() => setUploadOpen(false)} className="text-xl" aria-label="Fechar">×</button></div>{error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}<p className="mt-4 text-xs leading-5 text-[var(--inat-muted)]">Um arquivo por tipo para cada pessoa. Formatos: PDF, PNG, JPG ou WEBP, com até 25 MB. O conteúdo será inspecionado pelo backend.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="portal-label">Pessoa ativa</span><select name="personId" value={uploadPersonId} onChange={(event) => { setUploadPersonId(event.target.value); setError(""); }} className="portal-field mt-2 h-10 w-full px-3" required><option value="" disabled>Selecione</option>{activePeople.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}</select></label><label className="sm:col-span-2"><span className="portal-label">Tipo pessoal disponível</span><select key={uploadPersonId} name="documentTypeId" defaultValue="" disabled={!uploadPersonId || !availableUploadTypes.length} className="portal-field mt-2 h-10 w-full px-3 disabled:cursor-not-allowed disabled:bg-[var(--inat-paper)]" required><option value="" disabled>Selecione</option>{availableUploadTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select>{uploadPersonId && !availableUploadTypes.length ? <span className="mt-2 block text-xs text-amber-800">Essa pessoa já possui um arquivo para todos os tipos pessoais cadastrados.</span> : null}</label><label><span className="portal-label">Número (opcional e único no tipo)</span><input name="documentNumber" maxLength={80} className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Arquivo</span><input name="file" type="file" accept={DOCUMENT_FILE_ACCEPT} className="portal-field mt-2 w-full px-3 py-2" required /></label><label><span className="portal-label">Emissão</span><input name="issuedOn" type="date" className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Validade</span><input name="expiresOn" type="date" className="portal-field mt-2 h-10 w-full px-3" /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setUploadOpen(false)} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving || !uploadPersonId || !availableUploadTypes.length} className="portal-button portal-button-primary">{saving ? "Inspecionando..." : "Enviar e verificar"}</button></div></form></div> : null}

    {editing ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true"><form key={editing.id} onSubmit={updateMetadata} className="w-full max-w-lg border border-[var(--inat-line)] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{editing.verificationStatus === "EXPIRED" ? "Renovar documento" : "Editar metadados"}</h2><button type="button" onClick={() => setEditing(null)} className="text-xl" aria-label="Fechar">×</button></div>{error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}<p className="mt-4 text-xs text-[var(--inat-muted)]">O arquivo, a pessoa e o tipo permanecem os mesmos. Uma validade futura reativa automaticamente um documento expirado.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="portal-label">Número (opcional)</span><input name="documentNumber" defaultValue={editing.documentNumber ?? ""} maxLength={80} className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Emissão</span><input name="issuedOn" type="date" defaultValue={editing.issuedOn ?? ""} className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Nova validade</span><input name="expiresOn" type="date" defaultValue={editing.verificationStatus === "EXPIRED" ? "" : editing.expiresOn ?? ""} className="portal-field mt-2 h-10 w-full px-3" /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setEditing(null)} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving} className="portal-button portal-button-primary">{saving ? "Salvando..." : editing.verificationStatus === "EXPIRED" ? "Renovar" : "Salvar"}</button></div></form></div> : null}
  </>;
}

"use client";

import { apiCatalog } from "@/lib/api/catalog";
import type { Pagination } from "@/lib/pagination";
import { PaginatedContent } from "@/components/design-system/ClientPagination";
import { useRouter } from "next/navigation";
import { useId, useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { DefinitionList, SectionHeading, Sheet, StatusMark } from "@/components/design-system/PortalPrimitives";
import { DocumentFileCard, DocumentWorkspace } from "@/components/portal/DocumentWorkspace";
import { apiRequest, deleteResource, putJson, requestErrorMessage } from "@/lib/api/client";
import type { DocumentType, DocumentVerificationStatus, Person, PersonDocument, PersonDocumentStatusChangeReason } from "@/lib/api/domain-contracts";
import { apiLabel, formatDate, formatDateTime } from "@/lib/api/format";
import { downloadDocument } from "@/lib/files/download";
import { DOCUMENT_EXTENSIONS, DOCUMENT_FILE_ACCEPT, uploadValidationError } from "@/lib/files/upload-policy";

type Filter = DocumentVerificationStatus | "ALL";

function today() {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function validateDates(issuedOn: string | null, expiresOn: string | null) {
  const currentDate = today();
  if (issuedOn && issuedOn > currentDate) return "A emissão não pode estar no futuro.";
  if (expiresOn && expiresOn < currentDate) return "A validade não pode estar vencida.";
  if (issuedOn && expiresOn && expiresOn < issuedOn) return "A validade não pode ser anterior à emissão.";
  return null;
}

function historyLabel(reason: PersonDocumentStatusChangeReason) {
  if (reason === "ADMIN_UPLOAD") return "Anexado e verificado";
  if (reason === "ADMIN_RENEWAL") return "Renovado e verificado";
  return "Expirado automaticamente";
}

export function PersonDocumentManager({ person, documents: receivedDocuments, documentTypes, initialDocumentId, pagination, focusedDocument }: {
  person: Person;
  documents: PersonDocument[];
  documentTypes: DocumentType[];
  pagination?: Pagination;
  focusedDocument?: PersonDocument;
  initialDocumentId?: string;
}) {
  const router = useRouter();
  const [catalog, setCatalog] = useState<PersonDocument[] | null>(null);
  const dialogTitleId = useId();
  const [selectedId, setSelectedId] = useState(initialDocumentId ?? "");
  const [filter, setFilter] = useState<Filter>("ALL");
  const [editor, setEditor] = useState<"upload" | PersonDocument | null>(null);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const documents = receivedDocuments.filter((document) => document.personId === person.id);
  const allDocuments = catalog ?? documents;
  const focused = focusedDocument?.personId === person.id ? focusedDocument : undefined;
  const typeMap = new Map(documentTypes.map((type) => [type.id, type.name]));
  const availableTypes = documentTypes.filter((type) =>
    (type.scope === "PERSON" || type.scope === "BOTH")
    && !allDocuments.some((document) => document.documentTypeId === type.id),
  );
  const visible = documents.filter((document) => filter === "ALL" || document.verificationStatus === filter);
  const selected = visible.find((document) => document.id === selectedId) ?? (focused?.id === selectedId ? focused : undefined) ?? visible[0];
  const active = person.status === "ACTIVE";
  const canUpload = active && availableTypes.length > 0;
  const editing = editor && editor !== "upload" ? editor : null;
  const filters: { value: Filter; label: string }[] = [
    { value: "ALL", label: "Todos" },
    { value: "VERIFIED", label: "Verificados" },
    { value: "EXPIRED", label: "Expirados" },
  ];

  async function openEditor(value: "upload" | PersonDocument) {
    setError("");
    setMessage("");
    setSaving(true);
    try {
      if (value === "upload") await loadCatalog();
      setEditor(value);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível consultar os tipos já anexados."));
    } finally { setSaving(false); }
  }

  async function loadCatalog() {
    const items = pagination
      ? await apiCatalog<PersonDocument>(`/api/backend/person-documents?personId=${encodeURIComponent(person.id)}`)
      : documents;
    const scoped = items.filter((item) => item.personId === person.id);
    setCatalog(scoped);
    return scoped;
  }

  async function download(document: PersonDocument) {
    setError("");
    setDownloading(true);
    try {
      await downloadDocument(`/api/backend/person-documents/${encodeURIComponent(document.id)}/content`, document.file.originalName);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível baixar o arquivo."));
    } finally {
      setDownloading(false);
    }
  }

  async function remove(document: PersonDocument) {
    if (!window.confirm(`Remover ${document.file.originalName} de ${person.fullName}?`)) return;
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await deleteResource(`/api/backend/person-documents/${encodeURIComponent(document.id)}`);
      setSelectedId("");
      setMessage("Documento removido.");
      setCatalog(null);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível remover o documento."));
    } finally {
      setSaving(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editor || !active) return;
    const fields = new FormData(event.currentTarget);
    const issuedOn = String(fields.get("issuedOn") ?? "") || null;
    const expiresOn = String(fields.get("expiresOn") ?? "") || null;
    const dateError = validateDates(issuedOn, expiresOn);
    if (dateError) { setError(dateError); return; }
    const metadata = {
      personId: person.id,
      documentTypeId: editing?.documentTypeId ?? Number(fields.get("documentTypeId")),
      documentNumber: String(fields.get("documentNumber") ?? "").trim() || null,
      issuedOn,
      expiresOn,
    };
    let multipart: FormData | undefined;
    if (!editing) {
      const file = fields.get("file");
      if (!(file instanceof File)) return;
      const fileError = uploadValidationError(file, DOCUMENT_EXTENSIONS);
      if (fileError) { setError(fileError); return; }
      multipart = new FormData();
      multipart.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
      multipart.append("file", file);
    }
    setSaving(true);
    setError("");
    try {
      const saved = editing
        ? await putJson<PersonDocument>(`/api/backend/person-documents/${encodeURIComponent(editing.id)}`, metadata)
        : await apiRequest<PersonDocument>("/api/backend/person-documents", { method: "POST", body: multipart });
      setSelectedId(saved.id);
      setFilter("ALL");
      setEditor(null);
      setMessage(editing
        ? editing.verificationStatus === "EXPIRED" ? "Documento renovado e verificado novamente." : "Metadados do documento atualizados."
        : "Documento anexado e verificado automaticamente.");
      setCatalog(null);
      if (!editing && pagination) router.push(`?tab=documentos&page=1&document=${encodeURIComponent(saved.id)}`);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível salvar o documento."));
    } finally {
      setSaving(false);
    }
  }

  return <>
    <Sheet>
      <SectionHeading
        title="Documentos pessoais"
        description="Arquivos da pessoa, compartilhados com o dossiê do aprendiz quando houver."
        icon="document"
        stackOnMobile
        action={<button type="button" onClick={() => openEditor("upload")} disabled={!canUpload || saving} className="portal-button portal-button-primary h-9 disabled:cursor-not-allowed disabled:opacity-50"><Icon name="upload" className="size-4" />Anexar documento</button>}
      />
      {!active ? <p className="m-4 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">A pessoa está inativa ou suspensa. Os arquivos continuam disponíveis para consulta e remoção, mas não podem receber anexos nem alterações de dados.</p> : null}
      {active && !availableTypes.length ? <p className="m-4 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Não há tipos pessoais disponíveis para um novo anexo. Cada pessoa pode ter um documento por tipo; os documentos existentes podem ser editados ou renovados.</p> : null}
      {error && !editor ? <p role="alert" className="m-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {message ? <p role="status" className="m-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p> : null}
      <div aria-label="Filtrar documentos por situação" className="flex flex-wrap gap-2 border-b border-[var(--inat-line)] p-3">
        {filters.map((item) => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => { setFilter(item.value); setSelectedId(""); }} className={`portal-button h-9 ${filter === item.value ? "portal-button-primary" : "portal-button-quiet"}`}>{item.label} ({documents.filter((document) => item.value === "ALL" || document.verificationStatus === item.value).length})</button>)}
      </div>
      {pagination ? <p className="px-4 py-2 text-xs text-[var(--inat-muted)]">Os filtros se aplicam aos documentos desta página.</p> : null}
      <DocumentWorkspace
        pagination={pagination}
        items={visible.map((document) => ({
          id: document.id,
          title: typeMap.get(document.documentTypeId) ?? `Tipo ${document.documentTypeId}`,
          subtitle: document.file.originalName,
          detail: document.expiresOn ? `Validade: ${formatDate(document.expiresOn)}` : "Sem validade definida",
          status: <StatusMark>{apiLabel(document.verificationStatus)}</StatusMark>,
        }))}
        selectedId={selected?.id}
        onSelect={(id) => { setSelectedId(id); setMessage(""); }}
        emptyTitle={documents.length ? "Nenhum documento neste filtro" : "Nenhum documento pessoal"}
        emptyDescription={documents.length ? "Selecione outra situação para consultar os arquivos." : "Anexe o primeiro arquivo usando um tipo de documento pessoal."}
      >
        {selected ? <>
          <SectionHeading title={typeMap.get(selected.documentTypeId) ?? `Tipo ${selected.documentTypeId}`} description={person.fullName} action={<StatusMark>{apiLabel(selected.verificationStatus)}</StatusMark>} />
          <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="min-w-0">
              <DocumentFileCard file={selected.file} onDownload={() => download(selected)} downloading={downloading} />
              {selected.statusHistory.length ? <div className="mt-4 border border-[var(--inat-line)]">
                <h3 className="border-b border-[var(--inat-line)] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">Histórico de status</h3>
                <div className="divide-y divide-[var(--inat-line)]"><PaginatedContent>{selected.statusHistory.map((history) => <div key={history.id} className="px-3 py-3"><p className="text-xs font-semibold">{historyLabel(history.changeReason)}</p><p className="mt-1 text-xs text-[var(--inat-muted)]">{history.previousStatus ? apiLabel(history.previousStatus) : "Criação"} → {apiLabel(history.newStatus)} · {formatDateTime(history.changedAt)}</p></div>)}</PaginatedContent></div>
              </div> : null}
            </div>
            <div>
              <div className="border border-[var(--inat-line)]"><DefinitionList columns={1} items={[
                { label: "Número", value: selected.documentNumber || "Não informado" },
                { label: "Emissão", value: selected.issuedOn ? formatDate(selected.issuedOn) : "Não informada" },
                { label: "Validade", value: selected.expiresOn ? formatDate(selected.expiresOn) : "Sem validade definida" },
                { label: "Verificado em", value: formatDateTime(selected.verifiedAt) },
                { label: "Enviado em", value: formatDateTime(selected.createdAt) },
                { label: "Atualizado em", value: formatDateTime(selected.updatedAt) },
              ]} /></div>
              <div className="mt-4 grid gap-2">
                <button type="button" disabled={saving || !active} onClick={() => openEditor(selected)} className="portal-button portal-button-primary disabled:cursor-not-allowed disabled:opacity-50"><Icon name="edit" className="size-4" />{selected.verificationStatus === "EXPIRED" ? "Renovar dados" : "Editar dados"}</button>
                <button type="button" disabled={saving} onClick={() => remove(selected)} className="portal-button portal-button-quiet text-rose-700 disabled:opacity-50"><Icon name="trash" className="size-4" />Remover</button>
              </div>
            </div>
          </div>
        </> : null}
      </DocumentWorkspace>
    </Sheet>

    {editor ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true" aria-labelledby={dialogTitleId}>
      <form key={editing?.id ?? "upload"} onSubmit={save} className="max-h-[90vh] w-full max-w-xl overflow-y-auto border border-[var(--inat-line)] bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-4"><h2 id={dialogTitleId} className="text-lg font-semibold">{editing ? editing.verificationStatus === "EXPIRED" ? "Renovar documento" : "Editar metadados" : "Anexar documento pessoal"}</h2><button type="button" disabled={saving} onClick={() => setEditor(null)} className="text-xl" aria-label="Fechar">×</button></div>
        <p className="mt-3 text-sm font-semibold">{person.fullName}</p>
        <p className="mt-2 text-xs leading-5 text-[var(--inat-muted)]">{editing ? "O arquivo, a pessoa e o tipo permanecem os mesmos. Uma validade vigente verifica novamente um documento expirado." : "Um arquivo por tipo para esta pessoa. Formatos: PDF, PNG, JPG ou WEBP, com até 25 MB."}</p>
        {error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
        <fieldset disabled={saving} className="mt-5 grid gap-4 sm:grid-cols-2">
          {editing ? <p className="text-sm sm:col-span-2">Tipo: <strong>{typeMap.get(editing.documentTypeId) ?? `Tipo ${editing.documentTypeId}`}</strong></p> : <label className="sm:col-span-2"><span className="portal-label">Tipo pessoal disponível</span><select name="documentTypeId" defaultValue="" className="portal-field mt-2 h-10 w-full px-3" required><option value="" disabled>Selecione</option>{availableTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>}
          <label className="sm:col-span-2"><span className="portal-label">Número (opcional e único no tipo)</span><input name="documentNumber" maxLength={80} defaultValue={editing?.documentNumber ?? ""} className="portal-field mt-2 h-10 w-full px-3" /></label>
          {!editing ? <label className="sm:col-span-2"><span className="portal-label">Arquivo</span><input name="file" type="file" accept={DOCUMENT_FILE_ACCEPT} className="portal-field mt-2 w-full px-3 py-2" required /></label> : null}
          <label><span className="portal-label">Emissão</span><input name="issuedOn" type="date" defaultValue={editing?.issuedOn ?? ""} max={today()} className="portal-field mt-2 h-10 w-full px-3" /></label>
          <label><span className="portal-label">Validade</span><input name="expiresOn" type="date" defaultValue={editing?.expiresOn ?? ""} min={today()} className="portal-field mt-2 h-10 w-full px-3" /></label>
        </fieldset>
        <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setEditor(null)} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving || !active || (!editing && !canUpload)} className="portal-button portal-button-primary">{saving ? "Salvando..." : editing ? "Salvar dados" : "Enviar e verificar"}</button></div>
      </form>
    </div> : null}
  </>;
}

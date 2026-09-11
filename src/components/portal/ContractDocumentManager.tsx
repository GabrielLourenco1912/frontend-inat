"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { DefinitionList, SectionHeading, Sheet, StatusMark } from "@/components/design-system/PortalPrimitives";
import { DocumentFileCard, DocumentWorkspace } from "@/components/portal/DocumentWorkspace";
import { apiRequest, deleteResource, putJson, requestErrorMessage } from "@/lib/api/client";
import type { ContractDocument, ContractStatus, DocumentType } from "@/lib/api/domain-contracts";
import { formatDateTime } from "@/lib/api/format";
import { downloadDocument } from "@/lib/files/download";
import {
  DOCUMENT_EXTENSIONS,
  DOCUMENT_FILE_ACCEPT,
  uploadValidationError,
} from "@/lib/files/upload-policy";

export function ContractDocumentManager({ contractId, contractStatus, documents: receivedDocuments, documentTypes, initialDocumentId }: { contractId: string; contractStatus: ContractStatus; documents: ContractDocument[]; documentTypes: DocumentType[]; initialDocumentId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState(initialDocumentId ?? "");
  const [filter, setFilter] = useState<"ALL" | "CURRENT" | "PREVIOUS">("ALL");
  const [uploadTypeId, setUploadTypeId] = useState("");
  const documents = receivedDocuments.filter((document) => document.contractId === contractId);
  const typeMap = new Map(documentTypes.map((type) => [type.id, type.name]));
  const compatibleTypes = documentTypes.filter(
    (type) => type.scope === "CONTRACT" || type.scope === "BOTH",
  );
  const editable = contractStatus === "DRAFT"
    || contractStatus === "ACTIVE"
    || contractStatus === "SUSPENDED";
  const hasCurrent = documents.some((document) => document.documentTypeId === Number(uploadTypeId) && document.current);
  const nextVersion = Math.max(0, ...documents.filter((document) => document.documentTypeId === Number(uploadTypeId)).map((document) => document.versionNumber)) + 1;
  const visible = documents.filter((document) => filter === "ALL" || (filter === "CURRENT" ? document.current : !document.current));
  const selected = visible.find((document) => document.id === selectedId) ?? visible[0];
  const anotherCurrent = selected && documents.some((document) => document.documentTypeId === selected.documentTypeId && document.current && document.id !== selected.id);

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editable || !uploadTypeId) return;
    const formElement = event.currentTarget;
    const fields = new FormData(formElement);
    const file = fields.get("file");
    if (!(file instanceof File)) return;
    const fileError = uploadValidationError(file, DOCUMENT_EXTENSIONS);
    if (fileError) {
      setError(fileError);
      return;
    }
    const metadata = {
      contractId,
      documentTypeId: Number(fields.get("documentTypeId")),
      versionNumber: Number(fields.get("versionNumber")),
      current: fields.get("current") === "on",
    };
    const multipart = new FormData();
    multipart.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    multipart.append("file", file);
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const saved = await apiRequest<ContractDocument>("/api/backend/contract-documents", { method: "POST", body: multipart });
      formElement.reset();
      setOpen(false);
      setSelectedId(saved.id);
      setFilter("ALL");
      setMessage("Versão anexada ao contrato.");
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível anexar o documento."));
    } finally {
      setSaving(false);
    }
  }

  async function toggleCurrent(document: ContractDocument) {
    if (!editable) return;
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await putJson<ContractDocument>(`/api/backend/contract-documents/${encodeURIComponent(document.id)}`, {
        contractId: document.contractId,
        documentTypeId: document.documentTypeId,
        versionNumber: document.versionNumber,
        current: !document.current,
      });
      setMessage("Versão atualizada.");
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível atualizar a versão."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(document: ContractDocument) {
    if (!editable) return;
    if (!window.confirm(`Remover o arquivo ${document.file.originalName}?`)) return;
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await deleteResource(`/api/backend/contract-documents/${encodeURIComponent(document.id)}`);
      setSelectedId("");
      setMessage("Documento removido do contrato.");
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível remover o documento."));
    } finally {
      setSaving(false);
    }
  }

  async function download(document: ContractDocument) {
    setError("");
    setDownloading(true);
    try {
      await downloadDocument(`/api/backend/contract-documents/${encodeURIComponent(document.id)}/content`, document.file.originalName);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível baixar o documento."));
    } finally {
      setDownloading(false);
    }
  }

  return <>
    <Sheet>
      <SectionHeading stackOnMobile title="Documentos do contrato" description="Somente arquivos vinculados a este contrato. Documentos pessoais ficam no cadastro da pessoa ou do aprendiz." icon="document" action={<button type="button" onClick={() => { setUploadTypeId(""); setError(""); setOpen(true); }} disabled={!editable || !compatibleTypes.length || saving} className="portal-button portal-button-primary h-9 disabled:cursor-not-allowed disabled:opacity-50"><Icon name="upload" className="size-4" />Anexar versão</button>} />
      {!editable ? <p className="m-4 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Contratos encerrados ou cancelados preservam os documentos existentes, mas não aceitam novas versões nem mudanças de versão atual.</p> : null}
      {editable && !compatibleTypes.length ? <p className="m-4 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Cadastre um tipo aplicável a contratos antes de anexar uma versão.</p> : null}
      {error && !open ? <p role="alert" className="m-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {message ? <p role="status" className="m-4 border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{message}</p> : null}
      <div aria-label="Filtrar versões" className="flex flex-wrap gap-2 border-b border-[var(--inat-line)] p-3">
        {([{ value: "ALL", label: "Todas" }, { value: "CURRENT", label: "Atuais" }, { value: "PREVIOUS", label: "Anteriores" }] as const).map((item) => <button key={item.value} type="button" aria-pressed={filter === item.value} onClick={() => { setFilter(item.value); setSelectedId(""); }} className={`portal-button h-9 ${filter === item.value ? "portal-button-primary" : "portal-button-quiet"}`}>{item.label}</button>)}
      </div>
      <DocumentWorkspace
        items={visible.map((document) => ({ id: document.id, title: typeMap.get(document.documentTypeId) ?? `Tipo ${document.documentTypeId}`, subtitle: document.file.originalName, detail: `Versão ${document.versionNumber} · ${formatDateTime(document.createdAt)}`, status: <StatusMark tone={document.current ? "success" : "neutral"}>{document.current ? "Atual" : "Anterior"}</StatusMark> }))}
        selectedId={selected?.id}
        onSelect={(id) => { setSelectedId(id); setMessage(""); }}
        emptyTitle={documents.length ? "Nenhuma versão neste filtro" : "Nenhum documento contratual"}
        emptyDescription={documents.length ? "Selecione outro filtro para consultar as versões." : editable ? "Anexe a primeira versão para este contrato." : "Este contrato não possui versões anexadas."}
      >
        {selected ? <>
          <SectionHeading title={typeMap.get(selected.documentTypeId) ?? `Tipo ${selected.documentTypeId}`} description={`Versão ${selected.versionNumber}`} action={<StatusMark tone={selected.current ? "success" : "neutral"}>{selected.current ? "Atual" : "Anterior"}</StatusMark>} />
          <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_15rem]">
            <div className="min-w-0">
              <DocumentFileCard file={selected.file} onDownload={() => download(selected)} downloading={downloading} />
              <div className="mt-4 border border-[var(--inat-line)]">
                <h3 className="border-b border-[var(--inat-line)] px-3 py-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">Versões deste tipo</h3>
                <ol className="divide-y divide-[var(--inat-line)]">{documents.filter((document) => document.documentTypeId === selected.documentTypeId).sort((a, b) => b.versionNumber - a.versionNumber).map((document) => <li key={document.id}><button type="button" onClick={() => { setFilter("ALL"); setSelectedId(document.id); }} className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-[var(--inat-paper)]"><span className="text-xs">Versão {document.versionNumber}<span className="mt-1 block text-[var(--inat-muted)]">{formatDateTime(document.createdAt)}</span></span><StatusMark tone={document.current ? "success" : "neutral"}>{document.current ? "Atual" : "Anterior"}</StatusMark></button></li>)}</ol>
              </div>
            </div>
            <div>
              <div className="border border-[var(--inat-line)]"><DefinitionList columns={1} items={[
                { label: "Tipo", value: typeMap.get(selected.documentTypeId) ?? `Tipo ${selected.documentTypeId}` },
                { label: "Versão", value: String(selected.versionNumber) },
                { label: "Situação", value: selected.current ? "Atual" : "Anterior" },
                { label: "Enviado em", value: formatDateTime(selected.createdAt) },
              ]} /></div>
              <div className="mt-4 grid gap-2">
                <button type="button" onClick={() => toggleCurrent(selected)} disabled={!editable || saving || Boolean(anotherCurrent && !selected.current)} className="portal-button portal-button-primary disabled:cursor-not-allowed disabled:opacity-50">{selected.current ? "Marcar anterior" : "Marcar atual"}</button>
                <button type="button" onClick={() => remove(selected)} disabled={!editable || saving} className="portal-button portal-button-quiet text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"><Icon name="trash" className="size-4" />Remover</button>
              </div>
              {editable && anotherCurrent && !selected.current ? <p className="mt-3 text-xs leading-5 text-[var(--inat-muted)]">Marque a versão atual deste mesmo tipo como anterior antes de ativar esta versão.</p> : null}
            </div>
          </div>
        </> : null}
      </DocumentWorkspace>
    </Sheet>

    {open ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="contract-upload-title">
      <form onSubmit={upload} className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[var(--inat-line)] bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between"><h2 id="contract-upload-title" className="text-lg font-semibold">Anexar documento contratual</h2><button type="button" disabled={saving} onClick={() => setOpen(false)} aria-label="Fechar" className="text-xl">×</button></div>
        {error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
        <p className="mt-4 text-xs leading-5 text-[var(--inat-muted)]">Arquivo vinculado exclusivamente a este contrato. Formatos: PDF, PNG, JPG ou WEBP, com até 25 MB.</p>
        <fieldset disabled={saving} className="mt-5 grid gap-4">
          <label><span className="portal-label">Tipo de documento contratual</span><select name="documentTypeId" value={uploadTypeId} onChange={(event) => setUploadTypeId(event.target.value)} className="portal-field mt-2 h-10 w-full px-3" required><option value="" disabled>Selecione</option>{compatibleTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
          <label><span className="portal-label">Número da versão</span><input key={uploadTypeId} name="versionNumber" type="number" min="1" defaultValue={nextVersion} className="portal-field mt-2 h-10 w-full px-3" required /></label>
          <label><span className="portal-label">Arquivo</span><input name="file" type="file" accept={DOCUMENT_FILE_ACCEPT} className="portal-field mt-2 w-full px-3 py-2" required /></label>
          <label key={uploadTypeId + "-current"} className="flex items-center gap-2 text-sm"><input name="current" type="checkbox" defaultChecked={!hasCurrent} disabled={hasCurrent || !uploadTypeId} />Definir como versão atual</label>
          {hasCurrent ? <p className="text-xs text-[var(--inat-muted)]">Já existe uma versão atual deste tipo. Marque-a como anterior antes de tornar outra versão atual.</p> : null}
        </fieldset>
        <div className="mt-5 flex justify-end gap-2"><button type="button" disabled={saving} onClick={() => setOpen(false)} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving || !editable || !uploadTypeId} className="portal-button portal-button-primary">{saving ? "Inspecionando..." : "Anexar"}</button></div>
      </form>
    </div> : null}
  </>;
}

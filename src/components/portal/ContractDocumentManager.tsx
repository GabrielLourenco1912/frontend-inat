"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { EmptyState, SectionHeading, Sheet, StatusMark } from "@/components/design-system/PortalPrimitives";
import { apiRequest, deleteResource, downloadResource, putJson, requestErrorMessage } from "@/lib/api/client";
import type { ContractDocument, ContractStatus, DocumentType } from "@/lib/api/domain-contracts";
import { formatDateTime, formatFileSize } from "@/lib/api/format";
import {
  DOCUMENT_EXTENSIONS,
  DOCUMENT_FILE_ACCEPT,
  uploadValidationError,
} from "@/lib/files/upload-policy";

function downloadName(disposition: string | null, fallback: string) {
  const encoded = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return disposition?.match(/filename="?([^";]+)"?/i)?.[1] ?? fallback;
}

export function ContractDocumentManager({ contractId, contractStatus, documents, documentTypes }: { contractId: string; contractStatus: ContractStatus; documents: ContractDocument[]; documentTypes: DocumentType[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const typeMap = new Map(documentTypes.map((type) => [type.id, type.name]));
  const compatibleTypes = documentTypes.filter(
    (type) => type.scope === "CONTRACT" || type.scope === "BOTH",
  );
  const editable = contractStatus === "DRAFT"
    || contractStatus === "ACTIVE"
    || contractStatus === "SUSPENDED";
  const hasCurrent = documents.some((document) => document.current);

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
    try {
      await apiRequest<ContractDocument>("/api/backend/contract-documents", { method: "POST", body: multipart });
      formElement.reset();
      setOpen(false);
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
    try {
      await putJson<ContractDocument>(`/api/backend/contract-documents/${encodeURIComponent(document.id)}`, {
        contractId: document.contractId,
        documentTypeId: document.documentTypeId,
        versionNumber: document.versionNumber,
        current: !document.current,
      });
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível atualizar a versão."));
    }
  }

  async function remove(document: ContractDocument) {
    if (!window.confirm(`Remover o arquivo ${document.file.originalName}?`)) return;
    setError("");
    try {
      await deleteResource(`/api/backend/contract-documents/${encodeURIComponent(document.id)}`);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível remover o documento."));
    }
  }

  async function download(document: ContractDocument) {
    setError("");
    try {
      const result = await downloadResource(`/api/backend/contract-documents/${encodeURIComponent(document.id)}/content`);
      const url = URL.createObjectURL(result.blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = downloadName(result.contentDisposition, document.file.originalName);
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível baixar o documento."));
    }
  }

  return <>
    <Sheet>
      <SectionHeading title="Documentos e versões" description="Tipos compatíveis, versões e binários validados pelo backend." icon="document" action={<button type="button" onClick={() => setOpen(true)} disabled={!editable || !compatibleTypes.length} className="portal-button portal-button-primary h-9 disabled:cursor-not-allowed disabled:opacity-50"><Icon name="upload" className="size-4" />Anexar versão</button>} />
      {!editable ? <p className="m-4 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Contratos encerrados ou cancelados preservam os documentos existentes, mas não aceitam novas versões nem mudanças de versão atual.</p> : null}
      {editable && !compatibleTypes.length ? <p className="m-4 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Cadastre um tipo aplicável a contratos antes de anexar uma versão.</p> : null}
      {error ? <p role="alert" className="m-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {documents.length ? <div className="divide-y divide-[var(--inat-line)]">{documents.map((document) => <div key={document.id} className="grid gap-3 p-4 sm:grid-cols-[1fr_auto] sm:items-center sm:px-5"><div><p className="text-sm font-semibold">{typeMap.get(document.documentTypeId) ?? `Tipo ${document.documentTypeId}`}</p><p className="mt-1 text-xs text-[var(--inat-muted)]">{document.file.originalName} · versão {document.versionNumber} · {formatFileSize(document.file.sizeBytes)} · {formatDateTime(document.createdAt)}</p></div><div className="flex flex-wrap items-center gap-2">{document.current ? <StatusMark tone="success">Atual</StatusMark> : <StatusMark>Anterior</StatusMark>}<button type="button" onClick={() => download(document)} className="portal-button portal-button-quiet h-9"><Icon name="download" className="size-4" />Baixar</button><button type="button" onClick={() => toggleCurrent(document)} disabled={!editable} className="portal-button portal-button-secondary h-9 disabled:cursor-not-allowed disabled:opacity-50">{document.current ? "Marcar anterior" : "Marcar atual"}</button><button type="button" onClick={() => remove(document)} className="portal-button portal-button-quiet h-9 text-rose-700" aria-label={`Remover ${document.file.originalName}`}><Icon name="trash" className="size-4" /></button></div></div>)}</div> : <EmptyState title="Nenhum documento contratual" description={editable ? "Anexe a primeira versão para este contrato." : "Este contrato não possui versões anexadas."} icon="document" />}
    </Sheet>

    {open ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true"><form onSubmit={upload} className="w-full max-w-lg border border-[var(--inat-line)] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Anexar documento contratual</h2><button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="text-xl">×</button></div>{error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}<p className="mt-4 text-xs leading-5 text-[var(--inat-muted)]">Formatos permitidos: PDF, PNG, JPG ou WEBP, com até 25 MB. O backend confere o conteúdo real e o antivírus quando habilitado.</p><div className="mt-5 grid gap-4"><label><span className="portal-label">Tipo de documento contratual</span><select name="documentTypeId" defaultValue="" className="portal-field mt-2 h-10 w-full px-3" required><option value="" disabled>Selecione</option>{compatibleTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label><label><span className="portal-label">Número da versão</span><input name="versionNumber" type="number" min="1" defaultValue="1" className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Arquivo</span><input name="file" type="file" accept={DOCUMENT_FILE_ACCEPT} className="portal-field mt-2 w-full px-3 py-2" required /></label><label className="flex items-center gap-2 text-sm"><input name="current" type="checkbox" defaultChecked={!hasCurrent} />Definir como versão atual</label>{hasCurrent ? <p className="text-xs text-[var(--inat-muted)]">Já existe uma versão atual. Marque-a como anterior antes de tornar outra versão atual.</p> : null}</div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving || !editable || !compatibleTypes.length} className="portal-button portal-button-primary">{saving ? "Inspecionando..." : "Anexar"}</button></div></form></div> : null}
  </>;
}

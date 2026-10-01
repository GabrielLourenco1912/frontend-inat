"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import { EmptyState, SectionHeading, Sheet } from "@/components/design-system/PortalPrimitives";
import { AttachmentFileList } from "@/components/portal/AttachmentFileList";
import { apiRequest, deleteResource, requestErrorMessage } from "@/lib/api/client";
import type { Lesson, LessonFile } from "@/lib/api/domain-contracts";
import { GENERAL_ATTACHMENT_ACCEPT, GENERAL_ATTACHMENT_EXTENSIONS, uploadValidationError } from "@/lib/files/upload-policy";

export function LessonMaterials({ lesson, files, canManage }: { lesson: Lesson; files: LessonFile[]; canManage: boolean }) {
  const router = useRouter();
  const submitting = useRef(false);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const baseUrl = `/api/backend/lessons/${encodeURIComponent(lesson.id)}/files`;

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    const fields = new FormData(event.currentTarget);
    const file = fields.get("file");
    if (!(file instanceof File)) return;
    const validationError = uploadValidationError(file, GENERAL_ATTACHMENT_EXTENSIONS);
    if (validationError) { setError(validationError); return; }

    const multipart = new FormData();
    multipart.append("metadata", new Blob([JSON.stringify({ sortOrder: Number(fields.get("sortOrder")) })], { type: "application/json" }));
    multipart.append("file", file);
    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      await apiRequest<LessonFile>(baseUrl, { method: "POST", body: multipart });
      setOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível anexar o material da aula."));
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  async function remove(fileId: string) {
    if (submitting.current || !window.confirm("Remover este material da aula?")) return;
    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      await deleteResource(`${baseUrl}/${encodeURIComponent(fileId)}`);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível remover o material da aula."));
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }

  return <>
    <Sheet>
      <SectionHeading title="Materiais da aula" description="Arquivos de apoio para acompanhar o conteúdo da aula." icon="paperclip" action={canManage ? <button type="button" onClick={() => { setError(""); setOpen(true); }} disabled={saving || lesson.status === "CANCELLED"} className="portal-button portal-button-secondary disabled:cursor-not-allowed disabled:opacity-50"><Icon name="upload" className="size-4" />Anexar material</button> : undefined} />
      {error && !open ? <p role="alert" className="m-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {files.length ? <AttachmentFileList files={files} url={(fileId) => `${baseUrl}/${encodeURIComponent(fileId)}/content`} onRemove={canManage ? remove : undefined} /> : <EmptyState title="Nenhum material anexado" description="Os arquivos de apoio da aula aparecerão aqui." icon="paperclip" />}
    </Sheet>
    {open ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="lesson-material-title">
      <form onSubmit={upload} className="max-h-[90vh] w-full max-w-lg overflow-y-auto border border-[var(--inat-line)] bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between"><h2 id="lesson-material-title" className="text-lg font-semibold">Anexar material da aula</h2><button type="button" onClick={() => setOpen(false)} disabled={saving} className="text-xl" aria-label="Fechar">×</button></div>
        {error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
        <p className="mt-4 text-xs leading-5 text-[var(--inat-muted)]">PDF, imagens, documentos Office/OpenDocument, texto, áudio ou vídeo, com até 25 MB.</p>
        <div className="mt-5 grid gap-4">
          <label><span className="portal-label">Ordem de exibição</span><input name="sortOrder" type="number" min="0" step="1" defaultValue={files.length ? Math.max(...files.map((link) => link.sortOrder)) + 1 : 0} required className="portal-field mt-2 h-10 w-full px-3" /></label>
          <label><span className="portal-label">Arquivo</span><input name="file" type="file" accept={GENERAL_ATTACHMENT_ACCEPT} required className="portal-field mt-2 w-full px-3 py-2" /></label>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} disabled={saving} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving} className="portal-button portal-button-primary">{saving ? "Anexando..." : "Anexar material"}</button></div>
      </form>
    </div> : null}
  </>;
}

"use client";

import { PaginatedContent } from "@/components/design-system/ClientPagination";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/design-system/Icon";
import {
  DefinitionList,
  EmptyState,
  PageHeader,
  SectionHeading,
  Sheet,
  StatusMark,
} from "@/components/design-system/PortalPrimitives";
import {
  apiRequest,
  deleteResource,
  downloadResource,
  patchJson,
  postJson,
  putJson,
  requestErrorMessage,
} from "@/lib/api/client";
import type {
  Activity,
  ActivityFile,
  ActivitySubmission,
  Lesson,
  SubmissionFile,
  SubmissionStatus,
} from "@/lib/api/domain-contracts";
import { apiLabel, formatDateTime, formatFileSize } from "@/lib/api/format";
import {
  GENERAL_ATTACHMENT_ACCEPT,
  GENERAL_ATTACHMENT_EXTENSIONS,
  uploadValidationError,
} from "@/lib/files/upload-policy";

function fileNameFromDisposition(value: string | null, fallback: string) {
  if (!value) return fallback;
  const encoded = value.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) return decodeURIComponent(encoded);
  return value.match(/filename="?([^";]+)"?/i)?.[1] ?? fallback;
}

async function saveDownload(url: string, fallbackName: string) {
  const { blob, contentDisposition } = await downloadResource(url);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileNameFromDisposition(contentDisposition, fallbackName);
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

function FileList({
  files,
  url,
  onRemove,
}: {
  files: { file: ActivityFile["file"] }[];
  url: (fileId: string) => string;
  onRemove?: (fileId: string) => void;
}) {
  const [error, setError] = useState("");
  if (!files.length) return <p className="p-4 text-sm text-[var(--inat-muted)]">Nenhum arquivo anexado.</p>;
  return (
    <div className="divide-y divide-[var(--inat-line)]">
      {error ? <p role="alert" className="m-4 border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p> : null}
      {files.map(({ file }) => (
        <div key={file.id} className="flex items-center gap-3 p-4">
          <Icon name="paperclip" className="size-4 text-[var(--inat-teal-dark)]" />
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{file.originalName}</p><p className="mt-1 font-mono text-[0.625rem] text-[var(--inat-muted)]">{file.mimeType} · {formatFileSize(file.sizeBytes)}</p></div>
          <button type="button" onClick={() => saveDownload(url(file.id), file.originalName).catch(() => setError("Não foi possível baixar o arquivo."))} className="portal-button portal-button-quiet h-9"><Icon name="download" className="size-4" />Baixar</button>
          {onRemove ? <button type="button" onClick={() => onRemove(file.id)} className="portal-button portal-button-quiet h-9 text-rose-700" aria-label={`Remover ${file.originalName}`}><Icon name="trash" className="size-4" /></button> : null}
        </div>
      ))}
    </div>
  );
}

function LearnerSubmission({
  activity,
  lesson,
  learnerId,
  submission,
  files,
}: {
  activity: Activity;
  lesson: Lesson;
  learnerId: string;
  submission?: ActivitySubmission;
  files: SubmissionFile[];
}) {
  const router = useRouter();
  const [textAnswer, setTextAnswer] = useState(submission?.textAnswer ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const lessonCancelled = lesson.status === "CANCELLED";
  const activityAcceptsSubmissions = ["PUBLISHED", "CLOSED"].includes(activity.status);
  const submissionBlocked = lessonCancelled || !activityAcceptsSubmissions;
  const editable =
    !submissionBlocked &&
    (!submission || ["DRAFT", "RETURNED"].includes(submission.status));
  const draftAllowed = activity.status === "PUBLISHED";
  const blockedMessage = lessonCancelled || activity.status === "CANCELLED"
    ? "Esta aula foi cancelada. A atividade foi cancelada e novas entregas, alterações e anexos estão bloqueados."
    : activity.status === "DRAFT"
      ? "Esta atividade ainda é um rascunho e não aceita entregas."
      : null;

  async function persist(status: "DRAFT" | "SUBMITTED") {
    if (file) {
      const fileError = uploadValidationError(file, GENERAL_ATTACHMENT_EXTENSIONS);
      if (fileError) {
        setError(fileError);
        return;
      }
    }
    setSubmitting(true);
    setError("");
    try {
      let current = submission;
      if (!current) {
        current = await postJson<ActivitySubmission>("/api/backend/activity-submissions", {
          activityId: activity.id,
          learnerId,
          textAnswer,
          status: file && status === "SUBMITTED" ? "DRAFT" : status,
        });
      } else {
        current = await putJson<ActivitySubmission>(
          `/api/backend/activity-submissions/${encodeURIComponent(current.id)}`,
          {
            activityId: activity.id,
            learnerId,
            textAnswer,
            status: file ? "DRAFT" : status,
          },
        );
      }

      if (file) {
        const form = new FormData();
        form.append("file", file);
        await apiRequest<SubmissionFile>(
          `/api/backend/activity-submissions/${encodeURIComponent(current.id)}/files`,
          { method: "POST", body: form },
        );
      }

      if (status === "SUBMITTED" && current.status === "DRAFT") {
        await putJson<ActivitySubmission>(
          `/api/backend/activity-submissions/${encodeURIComponent(current.id)}`,
          { activityId: activity.id, learnerId, textAnswer, status: "SUBMITTED" },
        );
      }
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível salvar a entrega."));
    } finally {
      setSubmitting(false);
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    void persist("SUBMITTED");
  }

  async function removeSubmission() {
    if (!submission || !window.confirm("Excluir este rascunho ou entrega devolvida?")) return;
    setSubmitting(true);
    setError("");
    try {
      await deleteResource(`/api/backend/activity-submissions/${encodeURIComponent(submission.id)}`);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível excluir a entrega."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_21rem]">
      <Sheet>
        <SectionHeading title="Minha entrega" description="Rascunhos e envios são persistidos imediatamente no backend." icon="edit" action={<StatusMark>{apiLabel(submission?.status ?? "DRAFT")}</StatusMark>} />
        <form onSubmit={submit} className="grid gap-5 p-4 sm:p-5">
          {blockedMessage ? <p role="status" className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"><strong className="block">Entrega indisponível</strong>{blockedMessage}</p> : null}
          {submission?.feedback ? <div className="border-l-[3px] border-[var(--inat-clay)] bg-[#fff7f1] p-4 text-sm leading-6 text-[#743715]"><strong className="block">Feedback do instrutor</strong>{submission.feedback}</div> : null}
          {error ? <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
          <label><span className="portal-label">Resposta textual</span><textarea rows={10} value={textAnswer} onChange={(event) => setTextAnswer(event.target.value)} disabled={!editable} className="portal-field mt-2 w-full resize-y px-4 py-3 text-sm leading-6 disabled:bg-[var(--inat-paper)]" placeholder="Escreva sua resposta..." /></label>
          {editable && draftAllowed ? <label><span className="portal-label">Novo anexo (opcional)</span><input type="file" accept={GENERAL_ATTACHMENT_ACCEPT} onChange={(event) => { const selectedFile = event.target.files?.[0] ?? null; const fileError = selectedFile ? uploadValidationError(selectedFile, GENERAL_ATTACHMENT_EXTENSIONS) : null; if (fileError) { setFile(null); setError(fileError); event.target.value = ""; return; } setFile(selectedFile); setError(""); }} className="portal-field mt-2 w-full px-3 py-2 text-sm" /><span className="mt-2 block text-xs leading-5 text-[var(--inat-muted)]">PDF, imagens, documentos Office/OpenDocument, texto, áudio ou vídeo, com até 25 MB. O conteúdo real é conferido no envio.</span></label> : editable ? <p className="text-xs text-[var(--inat-muted)]">Após o encerramento, o backend aceita o envio textual tardio, mas não permite abrir um rascunho novo para anexar arquivos.</p> : null}
          {files.length ? <div className="border border-[var(--inat-line)]"><FileList files={files} url={(fileId) => `/api/backend/activity-submissions/${encodeURIComponent(submission!.id)}/files/${encodeURIComponent(fileId)}/content`} /></div> : null}
          {editable ? <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{submission ? <button type="button" onClick={removeSubmission} disabled={submitting} className="portal-button portal-button-quiet text-rose-700"><Icon name="trash" className="size-4" />Excluir</button> : null}{draftAllowed ? <button type="button" onClick={() => persist("DRAFT")} disabled={submitting} className="portal-button portal-button-secondary">Salvar rascunho</button> : null}<button type="submit" disabled={submitting} className="portal-button portal-button-clay"><Icon name="send" className="size-4" />{submitting ? "Salvando..." : submission?.status === "RETURNED" ? "Reenviar" : "Enviar atividade"}</button></div> : null}
          {submission?.status === "GRADED" ? <p className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">Nota: <strong>{submission.score ?? "—"}</strong>{activity.maxScore !== null ? ` de ${activity.maxScore}` : ""}</p> : null}
        </form>
      </Sheet>
      <Sheet className="self-start"><SectionHeading title="Atividade" icon="clipboard" /><DefinitionList columns={1} items={[{ label: "Disponível", value: formatDateTime(activity.availableAt) }, { label: "Prazo", value: formatDateTime(activity.dueAt) }, { label: "Nota máxima", value: activity.maxScore ?? "Sem nota" }]} /></Sheet>
    </div>
  );
}

function CorrectionDesk({ activity, submissions, files }: { activity: Activity; submissions: ActivitySubmission[]; files: Record<string, SubmissionFile[]> }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(submissions[0]?.id ?? "");
  const selected = submissions.find((submission) => submission.id === selectedId) ?? submissions[0];
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  if (!selected) return <Sheet><EmptyState title="Nenhuma entrega recebida" description="As entregas dos aprendizes aparecerão aqui quando forem enviadas." icon="clipboard" /></Sheet>;

  async function finish(status: Extract<SubmissionStatus, "GRADED" | "RETURNED">) {
    setSaving(true);
    setError("");
    try {
      await patchJson<ActivitySubmission>(
        `/api/backend/activity-submissions/${encodeURIComponent(selected.id)}/grade`,
        {
          score: status === "GRADED" && score ? Number(score.replace(",", ".")) : null,
          feedback: feedback.trim() || null,
          status,
        },
      );
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível registrar a avaliação."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border border-[var(--inat-line)] bg-white lg:grid lg:min-h-[34rem] lg:grid-cols-[15rem_minmax(20rem,1fr)_20rem]">
      <aside className="border-b border-[var(--inat-line)] lg:border-b-0 lg:border-r"><div className="border-b border-[var(--inat-line)] p-4 text-xs font-bold uppercase text-[var(--inat-muted)]">Entregas</div><div className="divide-y divide-[var(--inat-line)]"><PaginatedContent>{submissions.map((submission) => <button key={submission.id} type="button" onClick={() => { setSelectedId(submission.id); setScore(submission.score?.toString() ?? ""); setFeedback(submission.feedback ?? ""); setError(""); }} className={`w-full p-4 text-left ${submission.id === selected.id ? "bg-[var(--inat-mist)]" : "hover:bg-[var(--inat-paper)]"}`}><p className="truncate font-mono text-xs">{submission.learnerId}</p><StatusMark className="mt-2">{apiLabel(submission.status)}</StatusMark></button>)}</PaginatedContent></div></aside>
      <section className="min-w-0 border-b border-[var(--inat-line)] lg:border-b-0 lg:border-r"><div className="border-b border-[var(--inat-line)] p-4 sm:p-5"><p className="font-mono text-xs font-semibold">Aprendiz {selected.learnerId}</p><p className="mt-1 text-xs text-[var(--inat-muted)]">Enviada {formatDateTime(selected.submittedAt)}</p></div><div className="p-4 sm:p-5"><p className="text-[0.6875rem] font-bold uppercase tracking-[.1em] text-[var(--inat-muted)]">Resposta</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{selected.textAnswer || "Sem resposta textual."}</p>{files[selected.id]?.length ? <div className="mt-5 border border-[var(--inat-line)]"><FileList files={files[selected.id]} url={(fileId) => `/api/backend/activity-submissions/${encodeURIComponent(selected.id)}/files/${encodeURIComponent(fileId)}/content`} /></div> : null}</div></section>
      <aside className="p-4 sm:p-5"><h2 className="font-semibold">Avaliação</h2>{error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">{error}</p> : null}{activity.maxScore !== null ? <label className="mt-5 block"><span className="portal-label">Nota (máximo {activity.maxScore})</span><input value={score} onChange={(event) => setScore(event.target.value)} inputMode="decimal" className="portal-field mt-2 h-10 w-full px-3" /></label> : null}<label className="mt-5 block"><span className="portal-label">Feedback</span><textarea rows={7} value={feedback} onChange={(event) => setFeedback(event.target.value)} className="portal-field mt-2 w-full px-3 py-2" /></label>{["SUBMITTED", "LATE"].includes(selected.status) ? <div className="mt-5 grid gap-2"><button type="button" onClick={() => finish("GRADED")} disabled={saving} className="portal-button portal-button-primary"><Icon name="check" className="size-4" />Avaliar entrega</button><button type="button" onClick={() => finish("RETURNED")} disabled={saving} className="portal-button portal-button-secondary"><Icon name="arrow-left" className="size-4" />Devolver para ajuste</button></div> : <p className="mt-5 text-xs text-[var(--inat-muted)]">Esta entrega não está disponível para avaliação no estado atual.</p>}</aside>
    </div>
  );
}

function localDateTime(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function ActivityManager({ activity, lesson, files }: { activity: Activity; lesson: Lesson; files: ActivityFile[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function update(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const availableAt = new Date(String(form.get("availableAt")));
    const dueAt = new Date(String(form.get("dueAt")));
    if (
      Number.isNaN(availableAt.getTime()) ||
      Number.isNaN(dueAt.getTime()) ||
      dueAt.getTime() <= availableAt.getTime()
    ) {
      setError("O prazo deve ser posterior à data de disponibilidade.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await putJson<Activity>(`/api/backend/activities/${encodeURIComponent(activity.id)}`, {
        lessonId: activity.lessonId,
        title: String(form.get("title") ?? "").trim(),
        description: String(form.get("description") ?? "").trim(),
        availableAt: availableAt.toISOString(),
        dueAt: dueAt.toISOString(),
        maxScore: String(form.get("maxScore") ?? "") ? Number(String(form.get("maxScore")).replace(",", ".")) : null,
        status: String(form.get("status")),
      });
      setEditing(false);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível atualizar a atividade."));
    } finally {
      setSaving(false);
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const fields = new FormData(formElement);
    const file = fields.get("file");
    if (!(file instanceof File) || !file.size) return;
    const fileError = uploadValidationError(file, GENERAL_ATTACHMENT_EXTENSIONS);
    if (fileError) {
      setError(fileError);
      return;
    }
    const multipart = new FormData();
    multipart.append("metadata", new Blob([JSON.stringify({ sortOrder: Number(fields.get("sortOrder") ?? 0) })], { type: "application/json" }));
    multipart.append("file", file);
    setSaving(true);
    setError("");
    try {
      await apiRequest<ActivityFile>(`/api/backend/activities/${encodeURIComponent(activity.id)}/files`, { method: "POST", body: multipart });
      setUploading(false);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível anexar o material."));
    } finally {
      setSaving(false);
    }
  }

  async function removeFile(fileId: string) {
    if (!window.confirm("Remover este material da atividade?")) return;
    setError("");
    try {
      await deleteResource(`/api/backend/activities/${encodeURIComponent(activity.id)}/files/${encodeURIComponent(fileId)}`);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível remover o material."));
    }
  }

  async function removeActivity() {
    if (!window.confirm(`Excluir a atividade “${activity.title}”?`)) return;
    setError("");
    try {
      await deleteResource(`/api/backend/activities/${encodeURIComponent(activity.id)}`);
      router.push("/sistema/atividades");
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível excluir a atividade."));
    }
  }

  return <>
    <Sheet className="mb-5">
      <SectionHeading title="Gestão da atividade" description="Metadados, estado e materiais persistidos no backend." icon="settings" action={<div className="flex flex-wrap gap-2"><button type="button" onClick={() => setUploading(true)} disabled={lesson.status === "CANCELLED" || activity.status === "CANCELLED"} className="portal-button portal-button-secondary h-9 disabled:cursor-not-allowed disabled:opacity-50"><Icon name="upload" className="size-4" />Anexar material</button><button type="button" onClick={() => setEditing(true)} className="portal-button portal-button-primary h-9"><Icon name="edit" className="size-4" />Editar</button><button type="button" onClick={removeActivity} className="portal-button portal-button-quiet h-9 text-rose-700"><Icon name="trash" className="size-4" />Excluir</button></div>} />
      {lesson.status === "CANCELLED" ? <p className="mx-4 mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">Como a aula está cancelada, a atividade deve permanecer cancelada. Seus metadados e materiais continuam disponíveis para consulta.</p> : null}
      {error ? <p role="alert" className="m-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
      {files.length ? <FileList files={files} url={(fileId) => `/api/backend/activities/${encodeURIComponent(activity.id)}/files/${encodeURIComponent(fileId)}/content`} onRemove={removeFile} /> : <EmptyState title="Nenhum material" description="A atividade não possui arquivos anexados." icon="paperclip" />}
    </Sheet>

    {editing ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true"><form onSubmit={update} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-[var(--inat-line)] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Editar atividade</h2><button type="button" onClick={() => setEditing(false)} className="text-xl" aria-label="Fechar">×</button></div>{error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}{lesson.status === "CANCELLED" ? <p className="mt-4 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">O estado permanece cancelado enquanto a aula estiver cancelada.</p> : null}<div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="portal-label">Título</span><input name="title" defaultValue={activity.title} maxLength={160} className="portal-field mt-2 h-10 w-full px-3" required /></label><label className="sm:col-span-2"><span className="portal-label">Enunciado</span><textarea name="description" defaultValue={activity.description} maxLength={5000} rows={7} className="portal-field mt-2 w-full px-3 py-2" required /></label><label><span className="portal-label">Disponível em</span><input name="availableAt" type="datetime-local" defaultValue={localDateTime(activity.availableAt)} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Prazo</span><input name="dueAt" type="datetime-local" defaultValue={localDateTime(activity.dueAt)} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Nota máxima</span><input name="maxScore" type="number" min="0" step="0.01" defaultValue={activity.maxScore ?? ""} className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Estado</span><select name="status" defaultValue={activity.status} disabled={lesson.status === "CANCELLED"} className="portal-field mt-2 h-10 w-full px-3 disabled:cursor-not-allowed disabled:bg-[var(--inat-paper)]">{lesson.status === "CANCELLED" ? <option value="CANCELLED">Cancelada</option> : <><option value="DRAFT">Rascunho</option><option value="PUBLISHED">Publicada</option><option value="CLOSED">Encerrada</option><option value="CANCELLED">Cancelada</option></>}</select>{lesson.status === "CANCELLED" ? <input type="hidden" name="status" value="CANCELLED" /> : null}</label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setEditing(false)} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving} className="portal-button portal-button-primary">{saving ? "Salvando..." : "Salvar alterações"}</button></div></form></div> : null}
    {uploading ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true"><form onSubmit={upload} className="w-full max-w-lg border border-[var(--inat-line)] bg-white p-5 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Anexar material</h2><button type="button" onClick={() => setUploading(false)} className="text-xl" aria-label="Fechar">×</button></div>{error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}<p className="mt-4 text-xs leading-5 text-[var(--inat-muted)]">PDF, imagens, documentos Office/OpenDocument, texto, áudio ou vídeo, com até 25 MB. O backend valida o conteúdo real e consulta o antivírus quando habilitado.</p><div className="mt-5 grid gap-4"><label><span className="portal-label">Ordem</span><input name="sortOrder" type="number" min="0" defaultValue={files.length} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Arquivo</span><input name="file" type="file" accept={GENERAL_ATTACHMENT_ACCEPT} className="portal-field mt-2 w-full px-3 py-2" required /></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setUploading(false)} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving} className="portal-button portal-button-primary">{saving ? "Inspecionando..." : "Anexar"}</button></div></form></div> : null}
  </>;
}

export function ActivityWorkspace({ activity, lesson, activityFiles, submissions, submissionFiles, learnerId, learner, canManage }: { activity: Activity; lesson: Lesson; activityFiles: ActivityFile[]; submissions: ActivitySubmission[]; submissionFiles: Record<string, SubmissionFile[]>; learnerId?: string; learner: boolean; canManage: boolean }) {
  return (
    <>
      <PageHeader eyebrow={`Prazo ${formatDateTime(activity.dueAt)}`} title={activity.title} description={lesson.title} backHref="/sistema/atividades" backLabel="Voltar para atividades" action={<StatusMark>{apiLabel(activity.status)}</StatusMark>} />
      {lesson.status === "CANCELLED" ? <div className="mb-5 border-l-[3px] border-amber-500 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"><strong className="block">Aula cancelada</strong>As atividades abertas foram canceladas. Lembretes e novas entregas estão bloqueados.</div> : null}
      <div className="mb-5 border-l-[3px] border-[var(--inat-teal)] bg-[var(--inat-mist)] px-4 py-3 text-sm leading-6"><strong className="mr-2">Enunciado:</strong>{activity.description}</div>
      {canManage ? <ActivityManager activity={activity} lesson={lesson} files={activityFiles} /> : activityFiles.length ? <Sheet className="mb-5"><SectionHeading title="Materiais da atividade" icon="paperclip" /><FileList files={activityFiles} url={(fileId) => `/api/backend/activities/${encodeURIComponent(activity.id)}/files/${encodeURIComponent(fileId)}/content`} /></Sheet> : null}
      {learner ? learnerId ? <LearnerSubmission activity={activity} lesson={lesson} learnerId={learnerId} submission={submissions[0]} files={submissions[0] ? submissionFiles[submissions[0].id] ?? [] : []} /> : <Sheet><EmptyState title="Perfil de aprendiz incompleto" description="O backend não encontrou um learner vinculado à pessoa desta conta." icon="alert" /></Sheet> : canManage ? <CorrectionDesk activity={activity} submissions={submissions} files={submissionFiles} /> : <Sheet><EmptyState title="Conteúdo disponível somente para leitura" description="Seu perfil não gerencia entregas desta atividade." icon="shield" /></Sheet>}
    </>
  );
}

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeZone: "America/Sao_Paulo",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

const timeFormatter = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Sao_Paulo",
});

export function formatDate(value?: string | null) {
  if (!value) return "Sem término";
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
}

export function formatTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : timeFormatter.format(date);
}

export function formatPeriod(start: string, end?: string | null) {
  return `${formatDate(start)} — ${formatDate(end)}`;
}

export function formatDateTimePeriod(start: string, end: string) {
  return `${formatDateTime(start)} — ${formatTime(end)}`;
}

export function formatCurrency(value: number | null) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatMinutes(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return minutes ? `${hours}h ${minutes}min` : `${hours}h`;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

const labels: Record<string, string> = {
  ACTIVE: "Ativo",
  INACTIVE: "Inativo",
  SUSPENDED: "Suspenso",
  PLANNED: "Planejada",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
  PENDING: "Pendente",
  DRAFT: "Rascunho",
  ENDED: "Encerrado",
  SCHEDULED: "Agendada",
  IN_PROGRESS: "Em andamento",
  PUBLISHED: "Publicada",
  CLOSED: "Encerrada",
  EXPECTED: "Esperado",
  PRESENT: "Presente",
  ABSENT: "Ausente",
  EXCUSED: "Justificada",
  LATE: "Atraso",
  PARTIAL: "Parcial",
  SUBMITTED: "Enviada",
  GRADED: "Avaliada",
  RETURNED: "Devolvida",
  VERIFIED: "Verificado",
  REJECTED: "Rejeitado",
  EXPIRED: "Expirado",
  ONSITE: "Presencial",
  ONLINE: "Online",
  EMPLOYER: "Empresa",
  SCHOOL: "Escola",
  REGULAR: "Regular",
  TRANSFERRED: "Remanejado",
  MAKEUP: "Reposição",
  EXTRA: "Extra",
  LOW: "Baixa",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
  IN_APP: "No portal",
  EMAIL: "E-mail",
  PUSH: "Push",
  SENT: "Enviado",
  DELIVERED: "Entregue",
  FAILED: "Falha",
  USER: "Usuário",
  COHORT: "Turma",
  ALL: "Todos",
  INVITED: "Convidado",
  LOCKED: "Bloqueado",
  DISABLED: "Desativado",
};

export function apiLabel(value?: string | null) {
  if (!value) return "—";
  return labels[value] ?? value;
}

export function maskTaxId(value?: string | null) {
  if (!value) return "—";
  if (value.length === 11) return `***.${value.slice(3, 6)}.${value.slice(6, 9)}-**`;
  if (value.length === 14) return `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}/${value.slice(8, 12)}-${value.slice(12)}`;
  return value;
}

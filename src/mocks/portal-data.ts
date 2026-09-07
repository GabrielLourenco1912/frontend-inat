export const MOCK_TODAY = "2026-08-21";

export type StatusTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type Lesson = {
  id: string;
  title: string;
  date: string;
  weekday: string;
  start: string;
  end: string;
  cohort: string;
  cohortCode: string;
  instructor: string;
  modality: "Presencial" | "Online";
  place: string;
  state: "Agendada" | "Em andamento" | "Concluída" | "Cancelada";
  attendance: "Pendente" | "Em preenchimento" | "Concluída";
};

export const lessons: Lesson[] = [
  {
    id: "aula-comunicacao",
    title: "Comunicação no ambiente de trabalho",
    date: MOCK_TODAY,
    weekday: "Sex, 21 ago",
    start: "08:00",
    end: "10:00",
    cohort: "Aprendizagem Administrativa 2026 A",
    cohortCode: "ADM-26A",
    instructor: "Eduardo Nascimento",
    modality: "Presencial",
    place: "Sala 02",
    state: "Concluída",
    attendance: "Concluída",
  },
  {
    id: "aula-gestao-tempo",
    title: "Organização e gestão do tempo",
    date: MOCK_TODAY,
    weekday: "Sex, 21 ago",
    start: "10:20",
    end: "12:20",
    cohort: "Aprendizagem Administrativa 2026 A",
    cohortCode: "ADM-26A",
    instructor: "Eduardo Nascimento",
    modality: "Presencial",
    place: "Sala 02",
    state: "Em andamento",
    attendance: "Em preenchimento",
  },
  {
    id: "aula-cidadania-digital",
    title: "Cidadania e segurança digital",
    date: MOCK_TODAY,
    weekday: "Sex, 21 ago",
    start: "13:30",
    end: "15:30",
    cohort: "Serviços e Comércio 2026 B",
    cohortCode: "SER-26B",
    instructor: "Carolina Mendes",
    modality: "Online",
    place: "Google Meet",
    state: "Agendada",
    attendance: "Pendente",
  },
  {
    id: "aula-projeto-profissional",
    title: "Projeto profissional: próximos passos",
    date: MOCK_TODAY,
    weekday: "Sex, 21 ago",
    start: "15:50",
    end: "17:30",
    cohort: "Serviços e Comércio 2026 B",
    cohortCode: "SER-26B",
    instructor: "Carolina Mendes",
    modality: "Online",
    place: "Google Meet",
    state: "Agendada",
    attendance: "Pendente",
  },
  {
    id: "aula-etica",
    title: "Ética, convivência e responsabilidade",
    date: "2026-08-24",
    weekday: "Seg, 24 ago",
    start: "08:00",
    end: "10:00",
    cohort: "Aprendizagem Administrativa 2026 A",
    cohortCode: "ADM-26A",
    instructor: "Eduardo Nascimento",
    modality: "Presencial",
    place: "Sala 02",
    state: "Agendada",
    attendance: "Pendente",
  },
  {
    id: "aula-excel",
    title: "Planilhas para rotinas administrativas",
    date: "2026-08-25",
    weekday: "Ter, 25 ago",
    start: "13:30",
    end: "16:30",
    cohort: "Serviços e Comércio 2026 B",
    cohortCode: "SER-26B",
    instructor: "Carolina Mendes",
    modality: "Presencial",
    place: "Laboratório 01",
    state: "Agendada",
    attendance: "Pendente",
  },
];

export type AttendanceStatus =
  | "Presente"
  | "Ausente"
  | "Justificada"
  | "Atraso"
  | "Parcial"
  | "Sem registro";

export type Participant = {
  id: string;
  learnerId: string;
  name: string;
  registration: string;
  participation: "Regular" | "Remanejado" | "Reposição" | "Extra";
  origin?: string;
  status: AttendanceStatus;
  entry?: string;
  exit?: string;
  note?: string;
};

export const participants: Participant[] = [
  {
    id: "part-ana",
    learnerId: "apr-ana-souza",
    name: "Ana Souza",
    registration: "2026.0142",
    participation: "Regular",
    status: "Presente",
    entry: "10:18",
    exit: "12:20",
  },
  {
    id: "part-bruno",
    learnerId: "apr-bruno-lima",
    name: "Bruno Lima",
    registration: "2026.0148",
    participation: "Regular",
    status: "Presente",
    entry: "10:20",
    exit: "12:20",
  },
  {
    id: "part-gabriela",
    learnerId: "apr-gabriela-rocha",
    name: "Gabriela Rocha",
    registration: "2026.0151",
    participation: "Remanejado",
    origin: "SER-26B",
    status: "Atraso",
    entry: "10:36",
    exit: "12:20",
    note: "Transporte coletivo atrasou.",
  },
  {
    id: "part-joao",
    learnerId: "apr-joao-vitor",
    name: "João Vitor Martins",
    registration: "2026.0157",
    participation: "Regular",
    status: "Sem registro",
  },
  {
    id: "part-larissa",
    learnerId: "apr-larissa-gomes",
    name: "Larissa Gomes",
    registration: "2026.0162",
    participation: "Reposição",
    origin: "ADM-26C",
    status: "Justificada",
    note: "Atestado entregue à secretaria.",
  },
  {
    id: "part-matheus",
    learnerId: "apr-matheus-santos",
    name: "Matheus Santos",
    registration: "2026.0168",
    participation: "Regular",
    status: "Sem registro",
  },
  {
    id: "part-raissa",
    learnerId: "apr-raissa-oliveira",
    name: "Raíssa Oliveira",
    registration: "2026.0174",
    participation: "Extra",
    status: "Parcial",
    entry: "10:20",
    exit: "11:42",
    note: "Saída autorizada para consulta.",
  },
];

export type Activity = {
  id: string;
  title: string;
  lesson: string;
  cohort: string;
  availableAt: string;
  dueAt: string;
  state: "Rascunho" | "Publicada" | "Encerrada";
  pendingReviews: number;
  submissions: string;
  maxScore?: number;
};

export const activities: Activity[] = [
  {
    id: "atividade-prioridades",
    title: "Minha matriz de prioridades",
    lesson: "Organização e gestão do tempo",
    cohort: "ADM-26A",
    availableAt: "21 ago, 10:20",
    dueAt: "24 ago, 18:00",
    state: "Publicada",
    pendingReviews: 4,
    submissions: "12 de 18",
    maxScore: 10,
  },
  {
    id: "atividade-email-profissional",
    title: "Reescrita de e-mail profissional",
    lesson: "Comunicação no ambiente de trabalho",
    cohort: "ADM-26A",
    availableAt: "19 ago, 10:00",
    dueAt: "Hoje, 18:00",
    state: "Publicada",
    pendingReviews: 7,
    submissions: "15 de 18",
    maxScore: 10,
  },
  {
    id: "atividade-seguranca",
    title: "Checklist de segurança digital",
    lesson: "Cidadania e segurança digital",
    cohort: "SER-26B",
    availableAt: "Hoje, 13:30",
    dueAt: "28 ago, 18:00",
    state: "Rascunho",
    pendingReviews: 0,
    submissions: "Ainda não publicada",
  },
  {
    id: "atividade-curriculo",
    title: "Revisão do currículo profissional",
    lesson: "Projeto profissional: próximos passos",
    cohort: "SER-26B",
    availableAt: "14 ago, 15:50",
    dueAt: "20 ago, 18:00",
    state: "Encerrada",
    pendingReviews: 2,
    submissions: "16 de 17",
    maxScore: 10,
  },
];

export const submissions = [
  {
    id: "sub-ana",
    learner: "Ana Souza",
    registration: "2026.0142",
    state: "Enviada",
    sentAt: "Hoje, 11:47",
    response:
      "Organizei minhas tarefas em quatro grupos. Percebi que preciso reservar o início do dia para as atividades importantes e evitar responder mensagens a todo momento.",
    attachment: "matriz-prioridades-ana.pdf",
    score: "",
  },
  {
    id: "sub-bruno",
    learner: "Bruno Lima",
    registration: "2026.0148",
    state: "Avaliada",
    sentAt: "Hoje, 11:32",
    response:
      "Separei as tarefas urgentes das que podem ser planejadas. Vou revisar a matriz toda sexta-feira.",
    attachment: "matriz-bruno.pdf",
    score: "8,5",
  },
  {
    id: "sub-gabriela",
    learner: "Gabriela Rocha",
    registration: "2026.0151",
    state: "Devolvida",
    sentAt: "Hoje, 11:18",
    response:
      "Listei as atividades da semana e escolhi as mais importantes.",
    attachment: "prioridades-gabriela.jpg",
    score: "",
  },
  {
    id: "sub-larissa",
    learner: "Larissa Gomes",
    registration: "2026.0162",
    state: "Enviada com atraso",
    sentAt: "Hoje, 10:56",
    response:
      "Usei a matriz para organizar as tarefas da empresa e do curso em um único lugar.",
    attachment: "atividade-larissa.pdf",
    score: "",
  },
];

export type Learner = {
  id: string;
  name: string;
  registration: string;
  education: string;
  cohort: string;
  company: string;
  state: "Ativo" | "Pendente" | "Suspenso" | "Encerrado";
  attendance: string;
  birthDate: string;
  email: string;
  phone: string;
};

export const learners: Learner[] = [
  {
    id: "apr-ana-souza",
    name: "Ana Souza",
    registration: "2026.0142",
    education: "2º ano · Ensino médio",
    cohort: "ADM-26A",
    company: "Porto Sul Logística",
    state: "Ativo",
    attendance: "94%",
    birthDate: "14 de março de 2009",
    email: "ana.souza@aluno.inat.org.br",
    phone: "(41) 99912-3040",
  },
  {
    id: "apr-bruno-lima",
    name: "Bruno Lima",
    registration: "2026.0148",
    education: "3º ano · Ensino médio",
    cohort: "ADM-26A",
    company: "Mercado do Litoral",
    state: "Ativo",
    attendance: "91%",
    birthDate: "22 de novembro de 2008",
    email: "bruno.lima@aluno.inat.org.br",
    phone: "(41) 99820-1157",
  },
  {
    id: "apr-gabriela-rocha",
    name: "Gabriela Rocha",
    registration: "2026.0151",
    education: "Ensino médio completo",
    cohort: "SER-26B",
    company: "Porto Sul Logística",
    state: "Ativo",
    attendance: "88%",
    birthDate: "9 de junho de 2007",
    email: "gabriela.rocha@aluno.inat.org.br",
    phone: "(41) 99704-9821",
  },
  {
    id: "apr-joao-vitor",
    name: "João Vitor Martins",
    registration: "2026.0157",
    education: "2º ano · Ensino médio",
    cohort: "ADM-26A",
    company: "Comercial Atlântico",
    state: "Pendente",
    attendance: "—",
    birthDate: "30 de janeiro de 2009",
    email: "joao.martins@aluno.inat.org.br",
    phone: "(41) 99641-2880",
  },
  {
    id: "apr-larissa-gomes",
    name: "Larissa Gomes",
    registration: "2026.0162",
    education: "Ensino médio completo",
    cohort: "ADM-26C",
    company: "Porto Sul Logística",
    state: "Suspenso",
    attendance: "82%",
    birthDate: "18 de setembro de 2007",
    email: "larissa.gomes@aluno.inat.org.br",
    phone: "(41) 99552-7904",
  },
];

export const organizations = [
  {
    id: "org-porto-sul",
    name: "Porto Sul Logística",
    legalName: "Porto Sul Operações Logísticas Ltda.",
    type: "Empresa",
    document: "12.482.390/0001-66",
    city: "Paranaguá · PR",
    contact: "Renata Alves",
    learners: "8 aprendizes",
    state: "Ativa",
  },
  {
    id: "org-colegio-faro",
    name: "Colégio Estadual do Farol",
    legalName: "Colégio Estadual do Farol",
    type: "Escola",
    document: "76.410.218/0001-90",
    city: "Paranaguá · PR",
    contact: "Simone Prado",
    learners: "12 estudantes",
    state: "Ativa",
  },
  {
    id: "org-mercado-litoral",
    name: "Mercado do Litoral",
    legalName: "Mercado do Litoral Comércio de Alimentos S.A.",
    type: "Empresa",
    document: "04.917.300/0001-12",
    city: "Paranaguá · PR",
    contact: "Marcos Leal",
    learners: "5 aprendizes",
    state: "Ativa",
  },
  {
    id: "org-comercial-atlantico",
    name: "Comercial Atlântico",
    legalName: "Comercial Atlântico Importação Ltda.",
    type: "Empresa",
    document: "38.902.104/0001-72",
    city: "Paranaguá · PR",
    contact: "Célia Moura",
    learners: "3 aprendizes",
    state: "Em análise",
  },
];

export const contracts = [
  {
    id: "ctr-ana-2026",
    learner: "Ana Souza",
    company: "Porto Sul Logística",
    school: "Colégio Estadual do Farol",
    period: "02 fev 2026 — 31 jan 2027",
    workload: "20h semanais",
    salary: "R$ 1.069,48",
    documents: "5 de 6",
    state: "Ativo",
  },
  {
    id: "ctr-bruno-2026",
    learner: "Bruno Lima",
    company: "Mercado do Litoral",
    school: "Colégio Estadual do Farol",
    period: "02 fev 2026 — 31 jan 2027",
    workload: "20h semanais",
    salary: "R$ 1.069,48",
    documents: "6 de 6",
    state: "Ativo",
  },
  {
    id: "ctr-gabriela-2026",
    learner: "Gabriela Rocha",
    company: "Porto Sul Logística",
    school: "—",
    period: "09 mar 2026 — 08 mar 2027",
    workload: "24h semanais",
    salary: "R$ 1.283,38",
    documents: "5 de 6",
    state: "Ativo",
  },
  {
    id: "ctr-larissa-2026",
    learner: "Larissa Gomes",
    company: "Porto Sul Logística",
    school: "—",
    period: "12 jan 2026 — 11 jan 2027",
    workload: "20h semanais",
    salary: "R$ 1.069,48",
    documents: "4 de 6",
    state: "Suspenso",
  },
];

export const cohorts = [
  {
    id: "turma-adm-26a",
    code: "ADM-26A",
    name: "Aprendizagem Administrativa 2026 A",
    schedule: "Seg, qua e sex · Manhã",
    period: "02 fev — 18 dez 2026",
    enrollments: "18 matrículas",
    nextLesson: "Hoje, 10:20",
    state: "Ativa",
  },
  {
    id: "turma-ser-26b",
    code: "SER-26B",
    name: "Serviços e Comércio 2026 B",
    schedule: "Ter e sex · Tarde",
    period: "09 mar — 18 dez 2026",
    enrollments: "17 matrículas",
    nextLesson: "Hoje, 13:30",
    state: "Ativa",
  },
  {
    id: "turma-adm-26c",
    code: "ADM-26C",
    name: "Aprendizagem Administrativa 2026 C",
    schedule: "Ter e qui · Manhã",
    period: "06 abr 2026 — 19 fev 2027",
    enrollments: "16 matrículas",
    nextLesson: "25 ago, 08:00",
    state: "Ativa",
  },
  {
    id: "turma-ser-25a",
    code: "SER-25A",
    name: "Serviços e Comércio 2025 A",
    schedule: "Seg e qua · Tarde",
    period: "03 fev — 19 dez 2025",
    enrollments: "19 matrículas",
    nextLesson: "—",
    state: "Encerrada",
  },
];

export const people = [
  {
    id: "pes-ana",
    name: "Ana Souza",
    document: "***.482.***-09",
    contact: "ana.souza@aluno.inat.org.br",
    relationship: "Aprendiz",
    city: "Paranaguá · PR",
    state: "Ativa",
  },
  {
    id: "pes-eduardo",
    name: "Eduardo Nascimento",
    document: "***.207.***-40",
    contact: "eduardo.nascimento@inat.org.br",
    relationship: "Instrutor",
    city: "Paranaguá · PR",
    state: "Ativa",
  },
  {
    id: "pes-sandra",
    name: "Sandra Souza",
    document: "***.914.***-31",
    contact: "(41) 99871-2014",
    relationship: "Responsável",
    city: "Paranaguá · PR",
    state: "Ativa",
  },
  {
    id: "pes-renata",
    name: "Renata Alves",
    document: "***.611.***-72",
    contact: "renata.alves@portosul.com.br",
    relationship: "Membro de organização",
    city: "Paranaguá · PR",
    state: "Ativa",
  },
];

export const documents = [
  {
    id: "doc-01",
    person: "Ana Souza",
    type: "Declaração escolar",
    number: "DECL-2026-184",
    validity: "31 dez 2026",
    submittedAt: "Hoje, 08:12",
    state: "Pendente",
  },
  {
    id: "doc-02",
    person: "João Vitor Martins",
    type: "Comprovante de residência",
    number: "—",
    validity: "Sem validade",
    submittedAt: "20 ago, 16:44",
    state: "Pendente",
  },
  {
    id: "doc-03",
    person: "Larissa Gomes",
    type: "Atestado de saúde ocupacional",
    number: "ASO-44182",
    validity: "12 ago 2026",
    submittedAt: "19 ago, 10:20",
    state: "Expirado",
  },
  {
    id: "doc-04",
    person: "Gabriela Rocha",
    type: "Documento de identificação",
    number: "***.482.***-1",
    validity: "Sem validade",
    submittedAt: "18 ago, 15:10",
    state: "Rejeitado",
  },
  {
    id: "doc-05",
    person: "Bruno Lima",
    type: "Declaração escolar",
    number: "DECL-2026-151",
    validity: "31 dez 2026",
    submittedAt: "18 ago, 09:03",
    state: "Verificado",
  },
];

export const notices = [
  {
    id: "aviso-01",
    title: "Documentação da turma ADM-26A",
    message:
      "Três declarações escolares vencem neste mês. Revise a fila antes do fechamento.",
    context: "Documentos",
    time: "Hoje, 07:30",
    priority: "Alta",
    read: false,
    href: "/sistema/documentos",
  },
  {
    id: "aviso-02",
    title: "Mudança de sala na próxima segunda",
    message:
      "A turma ADM-26A terá aula no Laboratório 01 em 24 de agosto.",
    context: "Turma ADM-26A",
    time: "Ontem, 16:20",
    priority: "Normal",
    read: false,
    href: "/sistema/aulas/aula-etica",
  },
  {
    id: "aviso-03",
    title: "Atividade devolvida para ajuste",
    message:
      "Seu instrutor deixou uma orientação na atividade Reescrita de e-mail profissional.",
    context: "Atividades",
    time: "Ontem, 14:05",
    priority: "Normal",
    read: false,
    href: "/sistema/atividades/atividade-email-profissional",
  },
  {
    id: "aviso-04",
    title: "Calendário de setembro disponível",
    message: "As datas de encontros e formações de setembro já podem ser consultadas.",
    context: "Agenda",
    time: "18 ago, 09:00",
    priority: "Baixa",
    read: true,
    href: "/sistema/agenda",
  },
];

export const workQueue = [
  {
    id: "work-01",
    title: "Finalizar chamada da aula das 10:20",
    context: "ADM-26A · 2 registros sem situação",
    owner: "Eduardo Nascimento",
    due: "Agora",
    kind: "Chamada",
    href: "/sistema/aulas/aula-gestao-tempo",
    tone: "warning" as StatusTone,
  },
  {
    id: "work-02",
    title: "Corrigir entregas de e-mail profissional",
    context: "7 entregas aguardando avaliação",
    owner: "Equipe pedagógica",
    due: "Hoje, 17:00",
    kind: "Correção",
    href: "/sistema/atividades/atividade-email-profissional",
    tone: "info" as StatusTone,
  },
  {
    id: "work-03",
    title: "Revisar documentos recebidos",
    context: "2 pendentes e 1 rejeitado",
    owner: "Camila Ribeiro",
    due: "Hoje",
    kind: "Documento",
    href: "/sistema/documentos",
    tone: "danger" as StatusTone,
  },
  {
    id: "work-04",
    title: "Concluir matrícula de João Vitor",
    context: "Contrato criado · matrícula pendente",
    owner: "Secretaria",
    due: "24 ago",
    kind: "Matrícula",
    href: "/sistema/aprendizes/apr-joao-vitor",
    tone: "neutral" as StatusTone,
  },
];

export const communications = [
  {
    id: "msg-01",
    title: "Lembrete de documentos — ADM-26A",
    audience: "8 destinatários",
    channels: "Interno + e-mail",
    scheduled: "Hoje, 08:00",
    delivery: "7 entregues · 1 falha",
    state: "Processada",
  },
  {
    id: "msg-02",
    title: "Alteração de sala — 24/08",
    audience: "Turma ADM-26A",
    channels: "Interno",
    scheduled: "Envio imediato",
    delivery: "18 pendentes",
    state: "Rascunho",
  },
  {
    id: "msg-03",
    title: "Prazo da atividade de comunicação",
    audience: "3 destinatários",
    channels: "Interno + push simulado",
    scheduled: "Hoje, 14:00",
    delivery: "Agendada",
    state: "Agendada",
  },
];

export const users = [
  {
    id: "usr-admin-01",
    name: "Marina Costa",
    email: "marina.costa@inat.org.br",
    roles: "ADMIN · STAFF",
    person: "Marina Costa",
    lastAccess: "Hoje, 07:42",
    state: "Ativo",
  },
  {
    id: "usr-staff-01",
    name: "Camila Ribeiro",
    email: "camila.ribeiro@inat.org.br",
    roles: "STAFF",
    person: "Camila Ribeiro",
    lastAccess: "Hoje, 07:36",
    state: "Ativo",
  },
  {
    id: "usr-inst-01",
    name: "Eduardo Nascimento",
    email: "eduardo.nascimento@inat.org.br",
    roles: "INSTRUCTOR",
    person: "Eduardo Nascimento",
    lastAccess: "Ontem, 18:15",
    state: "Ativo",
  },
  {
    id: "usr-learner-01",
    name: "Ana Souza",
    email: "ana.souza@aluno.inat.org.br",
    roles: "LEARNER",
    person: "Ana Souza",
    lastAccess: "Ontem, 20:08",
    state: "Ativo",
  },
  {
    id: "usr-user-01",
    name: "Lucas Almeida",
    email: "lucas.almeida@email.com",
    roles: "USER",
    person: "Não vinculada",
    lastAccess: "Primeiro acesso",
    state: "Em análise",
  },
];

export const roleCatalog = [
  {
    id: "role-admin",
    code: "ADMIN",
    name: "Administrador",
    description: "Operação completa, usuários, papéis e permissões.",
    users: "2 usuários",
    state: "Padrão",
  },
  {
    id: "role-staff",
    code: "STAFF",
    name: "Equipe INAT",
    description: "Operação acadêmica, cadastral, documental e comunicação.",
    users: "6 usuários",
    state: "Padrão",
  },
  {
    id: "role-instructor",
    code: "INSTRUCTOR",
    name: "Instrutor",
    description: "Aulas atribuídas, chamada, atividades e correções.",
    users: "9 usuários",
    state: "Padrão",
  },
  {
    id: "role-learner",
    code: "LEARNER",
    name: "Aprendiz",
    description: "Percurso, aulas, atividades, entregas e avisos próprios.",
    users: "48 usuários",
    state: "Padrão",
  },
];

export const documentTypes = [
  {
    id: "type-declaracao",
    code: "DECLARACAO_ESCOLAR",
    name: "Declaração escolar",
    description: "Comprova matrícula e frequência na instituição de ensino.",
    usage: "31 documentos",
    state: "Ativo",
  },
  {
    id: "type-identidade",
    code: "DOCUMENTO_IDENTIDADE",
    name: "Documento de identificação",
    description: "RG ou documento oficial equivalente.",
    usage: "52 documentos",
    state: "Ativo",
  },
  {
    id: "type-aso",
    code: "ASO",
    name: "Atestado de saúde ocupacional",
    description: "Documento médico ocupacional com controle de validade.",
    usage: "27 documentos",
    state: "Ativo",
  },
];

export const files = [
  {
    id: "file-01",
    name: "declaracao-escolar-ana.pdf",
    type: "application/pdf",
    size: "482 KB",
    owner: "Ana Souza",
    linkedTo: "Documento pessoal",
    createdAt: "Hoje, 08:12",
    state: "Vinculado",
  },
  {
    id: "file-02",
    name: "matriz-prioridades-ana.pdf",
    type: "application/pdf",
    size: "1,2 MB",
    owner: "Ana Souza",
    linkedTo: "Entrega de atividade",
    createdAt: "Hoje, 11:47",
    state: "Vinculado",
  },
  {
    id: "file-03",
    name: "modelo-termo-aprendizagem.docx",
    type: "application/vnd.openxmlformats",
    size: "96 KB",
    owner: "Camila Ribeiro",
    linkedTo: "Sem vínculo",
    createdAt: "20 ago, 15:22",
    state: "Disponível",
  },
];

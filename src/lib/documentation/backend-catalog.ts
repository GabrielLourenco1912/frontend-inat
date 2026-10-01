export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type AccessLevel = "public" | "authenticated" | "admin" | "contextual";

export type ApiEndpoint = {
  method: HttpMethod;
  path: string;
  summary: string;
  access: AccessLevel;
  request?: string;
  response: string;
  parameters?: string[];
  note?: string;
  contentType?: "application/json" | "multipart/form-data";
};

export type ApiGroup = {
  id: string;
  name: string;
  description: string;
  endpoints: ApiEndpoint[];
};

export type BackendModule = {
  packageName: string;
  name: string;
  kind: "Domínio" | "Infraestrutura" | "Transversal";
  description: string;
  models: string[];
  rules: string[];
};

const pagination = [
  "page — índice baseado em zero (padrão: 0)",
  "size — entre 1 e 100 (padrão: 20)",
];

const endpoint = (
  method: HttpMethod,
  path: string,
  summary: string,
  access: AccessLevel,
  response: string,
  options: Omit<ApiEndpoint, "method" | "path" | "summary" | "access" | "response"> = {},
): ApiEndpoint => ({ method, path, summary, access, response, ...options });

type CrudOptions = {
  base: string;
  singular: string;
  plural: string;
  dto: string;
  request?: string;
  id?: string;
  access?: AccessLevel;
  createAccess?: AccessLevel;
  readAccess?: AccessLevel;
  listAccess?: AccessLevel;
  updateAccess?: AccessLevel;
  deleteAccess?: AccessLevel;
  listParameters?: string[];
};

function crud({
  base,
  singular,
  plural,
  dto,
  request = `${dto}.Request`,
  id = "{id}",
  access = "admin",
  createAccess = access,
  readAccess = access,
  listAccess = access,
  updateAccess = access,
  deleteAccess = access,
  listParameters = pagination,
}: CrudOptions): ApiEndpoint[] {
  return [
    endpoint("POST", base, `Criar ${singular}`, createAccess, `${dto}.Response`, {
      request,
      contentType: "application/json",
    }),
    endpoint("GET", `${base}/${id}`, `Consultar ${singular}`, readAccess, `${dto}.Response`),
    endpoint("GET", base, `Listar ${plural}`, listAccess, `PageResponse<${dto}.Response>`, {
      parameters: listParameters,
    }),
    endpoint("PUT", `${base}/${id}`, `Atualizar ${singular}`, updateAccess, `${dto}.Response`, {
      request,
      contentType: "application/json",
    }),
    endpoint("DELETE", `${base}/${id}`, `Excluir ${singular}`, deleteAccess, "Void"),
  ];
}

export const accessLabels: Record<AccessLevel, string> = {
  public: "Público",
  authenticated: "Autenticado",
  admin: "ADMIN",
  contextual: "Contextual",
};

export const accessDescriptions: Record<AccessLevel, string> = {
  public: "Não exige access token.",
  authenticated: "Exige JWT válido, sem papel específico nesta rota.",
  admin: "Exige o papel ADMIN.",
  contextual: "Acesso decidido pelo objeto e pelo vínculo do usuário autenticado.",
};

export const apiGroups: ApiGroup[] = [
  {
    id: "auth",
    name: "Autenticação",
    description: "Conta, MFA por código, recuperação de senha, renovação e encerramento de sessão.",
    endpoints: [
      endpoint("POST", "/api/auth/login", "Validar credenciais e iniciar MFA", "public", "AuthChallengeResponse", {
        request: "LoginRequest",
        contentType: "application/json",
        note: "Retorna 202 e envia um código. Tokens só são emitidos após a verificação do desafio.",
      }),
      endpoint("POST", "/api/auth/register", "Criar conta vinculada a uma pessoa", "public", "AuthChallengeResponse", {
        request: "RegisterRequest",
        contentType: "application/json",
        note: "Cria a conta como INVITED e retorna um desafio de verificação de e-mail.",
      }),
      endpoint("POST", "/api/auth/forgot-password", "Solicitar recuperação de senha", "public", "AuthChallengeResponse", {
        request: "ForgotPasswordRequest",
        contentType: "application/json",
      }),
      endpoint("POST", "/api/auth/reset-password", "Redefinir a senha com código válido", "public", "Void", {
        request: "ResetPasswordRequest",
        contentType: "application/json",
        note: "Invalida as sessões existentes e não autentica automaticamente.",
      }),
      endpoint("POST", "/api/auth/challenge/verify", "Confirmar código de autenticação", "public", "AccessTokenResponse (web) | AuthResponse (mobile)", {
        request: "VerifyAuthChallengeRequest",
        contentType: "application/json",
      }),
      endpoint("POST", "/api/auth/refresh", "Renovar o par de tokens", "public", "AccessTokenResponse (web) | AuthResponse (mobile)", {
        request: "RefreshRequest (opcional no cliente web)",
        contentType: "application/json",
        note: "No navegador, o refresh token pode vir do cookie HttpOnly; em cliente mobile, vem no corpo.",
      }),
      endpoint("POST", "/api/auth/logout", "Revogar o refresh token", "public", "Void", {
        request: "RefreshRequest (opcional no cliente web)",
        contentType: "application/json",
      }),
    ],
  },
  {
    id: "context-search",
    name: "Contexto e busca",
    description: "Contexto do ator atual e consultas enxutas usadas por listas e seletores do portal.",
    endpoints: [
      endpoint("GET", "/api/me", "Obter o contexto do usuário atual", "authenticated", "CurrentUserContextResponse"),
      endpoint("GET", "/api/search/{resource}", "Pesquisar recursos do portal", "authenticated", "PageResponse<Object>", {
        parameters: ["q — texto, até 160 caracteres", ...pagination, "personType — filtro opcional para pessoas", "status — filtro opcional por código de situação, até 32 caracteres"],
        note: "O serviço aplica o escopo permitido ao ator para cada resource. O filtro status aceita os valores do enum do recurso em people, learners, organizations, contracts, cohorts, lessons, activities e users.",
      }),
      endpoint("GET", "/api/lookups/{resource}", "Buscar opções para campos de seleção", "authenticated", "PageResponse<Object>", {
        parameters: [
          "q — texto, até 160 caracteres",
          "page — índice baseado em zero",
          "size — entre 1 e 5 (padrão: 5)",
          "personType, purpose e contextId — filtros opcionais",
        ],
      }),
    ],
  },
  {
    id: "users-roles",
    name: "Usuários e papéis",
    description: "Contas de acesso, catálogo fechado de papéis e concessões explícitas.",
    endpoints: [
      ...crud({
        base: "/api/users",
        singular: "usuário",
        plural: "usuários",
        dto: "UserDtos",
        request: "UserDtos.CreateRequest",
        readAccess: "contextual",
      }).map((item) =>
        ({
          ...item,
          request: item.method === "PUT" ? "UserDtos.UpdateRequest" : item.request,
          response: item.response.replace("UserDtos.Response", "UserResponse"),
        }),
      ),
      ...crud({
        base: "/api/roles",
        singular: "papel",
        plural: "papéis",
        dto: "RoleDtos",
        id: "{id: short}",
      }),
      endpoint("GET", "/api/users/{userId}/roles", "Listar papéis do usuário", "contextual", "List<UserRoleDtos.Response>"),
      endpoint("POST", "/api/users/{userId}/roles", "Conceder papel ao usuário", "admin", "UserRoleDtos.Response", {
        request: "UserRoleDtos.GrantRequest",
        contentType: "application/json",
        note: "A pessoa vinculada deve possuir o personType compatível; LEARNER também exige perfil ativo.",
      }),
      endpoint("DELETE", "/api/users/{userId}/roles/{roleId}", "Revogar papel do usuário", "admin", "Void"),
    ],
  },
  {
    id: "people",
    name: "Pessoas",
    description: "Cadastro civil central, tipos de pessoa e endereço associado.",
    endpoints: crud({
      base: "/api/people",
      singular: "pessoa",
      plural: "pessoas",
      dto: "PersonDtos",
      listParameters: [...pagination, "personType — ADMIN, INSTRUCTOR, LEARNER, EMPLOYER_MANAGER ou GUARDIAN"],
    }),
  },
  {
    id: "organizations",
    name: "Organizações e vínculos",
    description: "Organizações podem atuar como empresas, escolas ou ambos; vínculos ligam pessoas a cada organização.",
    endpoints: [
      ...crud({
        base: "/api/organizations",
        singular: "organização",
        plural: "organizações",
        dto: "OrganizationDtos",
        readAccess: "contextual",
      }),
      ...crud({
        base: "/api/organization-memberships",
        singular: "vínculo organizacional",
        plural: "vínculos organizacionais",
        dto: "OrganizationMembershipDtos",
      }),
    ],
  },
  {
    id: "learners",
    name: "Aprendizes e responsáveis",
    description: "Perfil pedagógico do aprendiz, onboarding atômico e responsáveis legais.",
    endpoints: [
      endpoint("GET", "/api/learners/{id}", "Consultar aprendiz", "contextual", "LearnerDtos.Response"),
      endpoint("GET", "/api/learners", "Listar aprendizes", "admin", "PageResponse<LearnerDtos.Response>", {
        parameters: [...pagination, "personId — filtro opcional"],
      }),
      endpoint("PUT", "/api/learners/{id}", "Atualizar aprendiz", "admin", "LearnerDtos.Response", {
        request: "LearnerDtos.Request",
        contentType: "application/json",
      }),
      endpoint("DELETE", "/api/learners/{id}", "Excluir aprendiz", "admin", "Void"),
      endpoint("POST", "/api/learner-onboardings", "Cadastrar pessoa e perfil de aprendiz", "admin", "LearnerOnboardingDtos.Response", {
        request: "LearnerOnboardingDtos.Request",
        contentType: "application/json",
        note: "Executa o onboarding completo em uma única transação.",
      }),
      endpoint("POST", "/api/learners/{learnerId}/guardians", "Vincular responsável", "admin", "LearnerGuardianDtos.Response", {
        request: "LearnerGuardianDtos.Request",
        contentType: "application/json",
      }),
      endpoint("GET", "/api/learners/{learnerId}/guardians", "Listar responsáveis", "admin", "List<LearnerGuardianDtos.Response>"),
      endpoint("PUT", "/api/learners/{learnerId}/guardians/{guardianPersonId}", "Atualizar vínculo do responsável", "admin", "LearnerGuardianDtos.Response", {
        request: "LearnerGuardianDtos.Request",
        contentType: "application/json",
      }),
      endpoint("DELETE", "/api/learners/{learnerId}/guardians/{guardianPersonId}", "Desvincular responsável", "admin", "Void"),
    ],
  },
  {
    id: "contracts",
    name: "Contratos",
    description: "Contrato de aprendizagem, empresa empregadora, escola, carga horária e documentos versionados.",
    endpoints: [
      ...crud({
        base: "/api/contracts",
        singular: "contrato",
        plural: "contratos",
        dto: "ContractDtos",
        readAccess: "contextual",
      }),
      endpoint("GET", "/api/contracts/learner/{learnerId}", "Listar contratos do aprendiz", "contextual", "List<ContractDtos.Response>"),
      endpoint("GET", "/api/contracts/organization/{organizationId}", "Listar contratos da organização", "contextual", "List<ContractDtos.Response>"),
      endpoint("POST", "/api/contract-documents", "Enviar documento contratual", "admin", "ContractDocumentDtos.Response", {
        request: "metadata: ContractDocumentDtos.Request + file: binário",
        contentType: "multipart/form-data",
      }),
      endpoint("GET", "/api/contract-documents/{id}", "Consultar metadados do documento", "admin", "ContractDocumentDtos.Response"),
      endpoint("GET", "/api/contract-documents/{id}/content", "Baixar documento contratual", "admin", "Resource (binário)"),
      endpoint("GET", "/api/contract-documents", "Listar documentos contratuais", "admin", "PageResponse<ContractDocumentDtos.Response>", {
        parameters: [...pagination, "contractId — filtro opcional"],
      }),
      endpoint("PUT", "/api/contract-documents/{id}", "Atualizar metadados do documento", "admin", "ContractDocumentDtos.Response", {
        request: "ContractDocumentDtos.Request",
        contentType: "application/json",
      }),
      endpoint("DELETE", "/api/contract-documents/{id}", "Excluir documento contratual", "admin", "Void"),
    ],
  },
  {
    id: "documents",
    name: "Documentos de pessoa",
    description: "Catálogo de tipos, uploads, verificação, validade e histórico de status documental.",
    endpoints: [
      ...crud({
        base: "/api/document-types",
        singular: "tipo de documento",
        plural: "tipos de documento",
        dto: "DocumentTypeDtos",
        id: "{id: short}",
      }),
      endpoint("POST", "/api/person-documents", "Enviar documento de pessoa", "admin", "PersonDocumentDtos.Response", {
        request: "metadata: PersonDocumentDtos.Request + file: binário",
        contentType: "multipart/form-data",
      }),
      endpoint("GET", "/api/person-documents/{id}", "Consultar metadados do documento", "admin", "PersonDocumentDtos.Response"),
      endpoint("GET", "/api/person-documents/{id}/content", "Baixar documento de pessoa", "admin", "Resource (binário)"),
      endpoint("GET", "/api/person-documents", "Listar documentos de pessoa", "admin", "PageResponse<PersonDocumentDtos.Response>", {
        parameters: [...pagination, "personId — filtro opcional", "verificationStatus — filtro opcional"],
      }),
      endpoint("PUT", "/api/person-documents/{id}", "Atualizar e verificar documento", "admin", "PersonDocumentDtos.Response", {
        request: "PersonDocumentDtos.Request",
        contentType: "application/json",
      }),
      endpoint("DELETE", "/api/person-documents/{id}", "Excluir documento de pessoa", "admin", "Void"),
    ],
  },
  {
    id: "cohorts",
    name: "Turmas e matrículas",
    description: "Planejamento das turmas e vínculo temporal entre contrato e turma.",
    endpoints: [
      ...crud({ base: "/api/cohorts", singular: "turma", plural: "turmas", dto: "CohortDtos" }),
      ...crud({
        base: "/api/cohort-enrollments",
        singular: "matrícula",
        plural: "matrículas",
        dto: "CohortEnrollmentDtos",
      }),
    ],
  },
  {
    id: "lessons",
    name: "Aulas e participantes",
    description: "Agenda presencial/online, descrição, materiais, chamada esperada, conflitos de horário e remanejamento.",
    endpoints: [
      endpoint("POST", "/api/lessons", "Criar aula", "admin", "LessonDtos.Response", {
        request: "LessonDtos.Request",
        contentType: "application/json",
      }),
      endpoint("GET", "/api/lessons/{id}", "Consultar aula", "contextual", "LessonDtos.Response"),
      endpoint("GET", "/api/lessons", "Listar aulas", "admin", "PageResponse<LessonDtos.Response>", { parameters: pagination }),
      endpoint("GET", "/api/lessons/me", "Listar aulas acessíveis ao ator", "authenticated", "List<LessonDtos.Response>"),
      endpoint("PUT", "/api/lessons/{id}", "Atualizar aula", "contextual", "LessonDtos.Response", {
        request: "LessonDtos.Request",
        contentType: "application/json",
      }),
      endpoint("DELETE", "/api/lessons/{id}", "Excluir aula", "contextual", "Void", {
        note: "Somente aulas SCHEDULED sem participantes, atividades ou materiais podem ser removidas fisicamente.",
      }),
      endpoint("POST", "/api/lessons/{lessonId}/files", "Anexar material à aula", "contextual", "LessonFileDtos.Response", {
        request: "metadata: LessonFileDtos.Request + file: binário",
        contentType: "multipart/form-data",
        note: "ADMIN ou instrutor da aula. Mesma política de tamanho, formatos e inspeção dos materiais de atividades.",
      }),
      endpoint("GET", "/api/lessons/{lessonId}/files/{fileId}/content", "Baixar material da aula", "contextual", "Resource (binário)"),
      endpoint("GET", "/api/lessons/{lessonId}/files", "Listar materiais da aula", "contextual", "List<LessonFileDtos.Response>"),
      endpoint("DELETE", "/api/lessons/{lessonId}/files/{fileId}", "Remover material da aula", "contextual", "Void"),
      endpoint("POST", "/api/lesson-participants", "Adicionar participante", "contextual", "LessonParticipantDtos.Response", {
        request: "LessonParticipantDtos.Request",
        contentType: "application/json",
      }),
      endpoint("GET", "/api/lesson-participants/{id}", "Consultar participante", "contextual", "LessonParticipantDtos.Response"),
      endpoint("GET", "/api/lesson-participants", "Listar todos os participantes", "admin", "PageResponse<LessonParticipantDtos.Response>", { parameters: pagination }),
      endpoint("GET", "/api/lesson-participants/lesson/{lessonId}", "Obter chamada da aula", "contextual", "List<LessonParticipantDtos.Response>"),
      endpoint("PUT", "/api/lesson-participants/{id}", "Atualizar participante", "contextual", "LessonParticipantDtos.Response", {
        request: "LessonParticipantDtos.Request",
        contentType: "application/json",
      }),
      endpoint("DELETE", "/api/lesson-participants/{id}", "Excluir participante", "contextual", "Void"),
      endpoint("POST", "/api/lesson-participants/lesson/{lessonId}/generate-roster", "Gerar chamada regular", "contextual", "LessonParticipantDtos.RosterGenerationResponse"),
      endpoint("POST", "/api/lesson-participants/reassign", "Remanejar aprendiz entre aulas", "admin", "LessonParticipantDtos.ReassignmentResponse", {
        request: "LessonParticipantDtos.ReassignRequest",
        contentType: "application/json",
      }),
    ],
  },
  {
    id: "attendance",
    name: "Frequência",
    description: "Presença, ausência, atraso e frequência automática das aulas online.",
    endpoints: [
      endpoint("POST", "/api/attendance-records", "Registrar frequência", "contextual", "AttendanceRecordDtos.Response", {
        request: "AttendanceRecordDtos.Request",
        contentType: "application/json",
      }),
      endpoint("GET", "/api/attendance-records/{id}", "Consultar frequência", "contextual", "AttendanceRecordDtos.Response"),
      endpoint("GET", "/api/attendance-records", "Pesquisar frequências", "contextual", "PageResponse<AttendanceRecordDtos.Response>", {
        parameters: [
          "startDate e endDate — datas ISO opcionais",
          "learnerId e organizationId — filtros opcionais",
          "activeContractsOnly — booleano (padrão: false)",
          ...pagination,
        ],
        note: "ADMIN consulta qualquer combinação; INSTRUCTOR deve informar learnerId e recebe apenas registros de suas aulas.",
      }),
      endpoint("GET", "/api/attendance-records/lesson/{lessonId}", "Listar frequências da aula", "contextual", "List<AttendanceRecordDtos.Response>"),
      endpoint("PUT", "/api/attendance-records/{id}", "Corrigir frequência", "contextual", "AttendanceRecordDtos.Response", {
        request: "AttendanceRecordDtos.Request",
        contentType: "application/json",
      }),
      endpoint("DELETE", "/api/attendance-records/{id}", "Excluir frequência", "contextual", "Void"),
    ],
  },
  {
    id: "activities",
    name: "Atividades e materiais",
    description: "Atividades da aula, publicação, prazos, notas máximas e materiais anexos.",
    endpoints: [
      endpoint("POST", "/api/activities", "Criar atividade", "contextual", "ActivityDtos.Response", {
        request: "ActivityDtos.Request",
        contentType: "application/json",
      }),
      endpoint("GET", "/api/activities/{id}", "Consultar atividade", "contextual", "ActivityDtos.Response"),
      endpoint("GET", "/api/activities", "Listar todas as atividades", "admin", "PageResponse<ActivityDtos.Response>", { parameters: pagination }),
      endpoint("GET", "/api/activities/lesson/{lessonId}", "Listar atividades da aula", "contextual", "List<ActivityDtos.Response>", {
        note: "Rascunhos só são incluídos para quem pode gerenciar a aula.",
      }),
      endpoint("PUT", "/api/activities/{id}", "Atualizar atividade", "contextual", "ActivityDtos.Response", {
        request: "ActivityDtos.Request",
        contentType: "application/json",
      }),
      endpoint("DELETE", "/api/activities/{id}", "Excluir atividade", "contextual", "Void"),
      endpoint("POST", "/api/activities/{activityId}/files", "Anexar material à atividade", "contextual", "AttachmentDtos.ActivityFileResponse", {
        request: "metadata: ActivityFileRequest + file: binário",
        contentType: "multipart/form-data",
      }),
      endpoint("GET", "/api/activities/{activityId}/files/{fileId}/content", "Baixar material da atividade", "contextual", "Resource (binário)"),
      endpoint("GET", "/api/activities/{activityId}/files", "Listar materiais da atividade", "contextual", "List<AttachmentDtos.ActivityFileResponse>"),
      endpoint("DELETE", "/api/activities/{activityId}/files/{fileId}", "Remover material da atividade", "contextual", "Void"),
    ],
  },
  {
    id: "submissions",
    name: "Entregas e anexos",
    description: "Resposta do aprendiz, atraso, devolução, correção, nota e arquivos da entrega.",
    endpoints: [
      endpoint("POST", "/api/activity-submissions", "Criar entrega", "contextual", "ActivitySubmissionDtos.Response", {
        request: "ActivitySubmissionDtos.SaveRequest",
        contentType: "application/json",
      }),
      endpoint("GET", "/api/activity-submissions/{id}", "Consultar entrega", "contextual", "ActivitySubmissionDtos.Response"),
      endpoint("GET", "/api/activity-submissions", "Listar todas as entregas", "admin", "PageResponse<ActivitySubmissionDtos.Response>", { parameters: pagination }),
      endpoint("GET", "/api/activity-submissions/activity/{activityId}", "Listar entregas da atividade", "contextual", "List<ActivitySubmissionDtos.Response>"),
      endpoint("GET", "/api/activity-submissions/learner/{learnerId}", "Listar entregas do aprendiz", "contextual", "List<ActivitySubmissionDtos.Response>"),
      endpoint("PUT", "/api/activity-submissions/{id}", "Editar entrega", "contextual", "ActivitySubmissionDtos.Response", {
        request: "ActivitySubmissionDtos.SaveRequest",
        contentType: "application/json",
      }),
      endpoint("PATCH", "/api/activity-submissions/{id}/grade", "Avaliar ou devolver entrega", "contextual", "ActivitySubmissionDtos.Response", {
        request: "ActivitySubmissionDtos.GradeRequest",
        contentType: "application/json",
      }),
      endpoint("DELETE", "/api/activity-submissions/{id}", "Excluir entrega editável", "contextual", "Void"),
      endpoint("POST", "/api/activity-submissions/{submissionId}/files", "Anexar arquivo à entrega", "contextual", "AttachmentDtos.SubmissionFileResponse", {
        request: "file: binário",
        contentType: "multipart/form-data",
      }),
      endpoint("GET", "/api/activity-submissions/{submissionId}/files/{fileId}/content", "Baixar anexo da entrega", "contextual", "Resource (binário)"),
      endpoint("GET", "/api/activity-submissions/{submissionId}/files", "Listar anexos da entrega", "contextual", "List<AttachmentDtos.SubmissionFileResponse>"),
      endpoint("DELETE", "/api/activity-submissions/{submissionId}/files/{fileId}", "Remover anexo da entrega", "contextual", "Void"),
    ],
  },
  {
    id: "notifications",
    name: "Notificações",
    description: "Composição, audiência materializada, caixa pessoal e entrega por canal.",
    endpoints: [
      endpoint("POST", "/api/notifications", "Criar e materializar notificação", "admin", "NotificationDtos.Response", {
        request: "NotificationDtos.CreateRequest",
        contentType: "application/json",
      }),
      endpoint("GET", "/api/notifications/{id}", "Consultar notificação", "admin", "NotificationDtos.Response"),
      endpoint("GET", "/api/notifications", "Listar notificações", "admin", "PageResponse<NotificationDtos.Response>", { parameters: pagination }),
      endpoint("GET", "/api/notifications/context/{contextType}/{contextId}", "Listar notificações por contexto", "admin", "List<NotificationDtos.Response>"),
      endpoint("PUT", "/api/notifications/{id}", "Atualizar conteúdo e agendamento", "admin", "NotificationDtos.Response", {
        request: "NotificationDtos.UpdateRequest",
        contentType: "application/json",
        note: "Só é permitido antes de qualquer destinatário ter sido processado; audiência e canais são imutáveis.",
      }),
      endpoint("DELETE", "/api/notifications/{id}", "Excluir notificação", "admin", "Void"),
      endpoint("GET", "/api/notification-recipients/{id}", "Consultar item da caixa", "contextual", "NotificationRecipientDtos.Response"),
      endpoint("GET", "/api/notification-recipients", "Listar todos os destinatários", "admin", "PageResponse<NotificationRecipientDtos.Response>", { parameters: pagination }),
      endpoint("GET", "/api/notification-recipients/me", "Abrir a própria caixa", "authenticated", "PageResponse<NotificationRecipientDtos.Response>", {
        parameters: ["channel — filtro opcional", ...pagination],
      }),
      endpoint("GET", "/api/notification-recipients/me/unread-count", "Contar notificações não lidas", "authenticated", "NotificationRecipientDtos.UnreadCount"),
      endpoint("PATCH", "/api/notification-recipients/{id}/delivery", "Alterar estado da entrega", "admin", "NotificationRecipientDtos.Response", {
        request: "NotificationRecipientDtos.DeliveryRequest",
        contentType: "application/json",
      }),
      endpoint("PATCH", "/api/notification-recipients/{id}/read", "Marcar notificação como lida", "contextual", "NotificationRecipientDtos.Response"),
    ],
  },
  {
    id: "contact",
    name: "Mensagens de contato",
    description: "Entrada pública da landing page e triagem administrativa das mensagens recebidas.",
    endpoints: [
      endpoint("POST", "/api/contact-messages", "Enviar mensagem de contato", "public", "ContactMessageDtos.Response", {
        request: "ContactMessageDtos.CreateRequest",
        contentType: "application/json",
        note: "Único endpoint de domínio público fora do conjunto /api/auth.",
      }),
      endpoint("GET", "/api/contact-messages", "Pesquisar mensagens", "admin", "PageResponse<ContactMessageDtos.Response>", {
        parameters: ["search, status e contactType — filtros opcionais", ...pagination],
      }),
      endpoint("GET", "/api/contact-messages/{id}", "Consultar mensagem", "admin", "ContactMessageDtos.Response"),
      endpoint("PATCH", "/api/contact-messages/{id}/status", "Atualizar status da mensagem", "admin", "ContactMessageDtos.Response", {
        request: "ContactMessageDtos.StatusRequest",
        contentType: "application/json",
      }),
      endpoint("DELETE", "/api/contact-messages/{id}", "Excluir mensagem", "admin", "Void"),
    ],
  },
];

export const backendModules: BackendModule[] = [
  {
    packageName: "activity",
    name: "Atividades",
    kind: "Domínio",
    description: "Atividades pedagógicas, materiais, entregas, anexos e avaliação.",
    models: ["Activity", "ActivityFile", "ActivitySubmission", "SubmissionFile"],
    rules: ["Uma entrega por atividade/aprendiz", "Atraso calculado pelo prazo", "Nota limitada ao maxScore"],
  },
  {
    packageName: "address",
    name: "Endereços",
    kind: "Domínio",
    description: "Endereço postal reutilizado nos cadastros de pessoas e organizações.",
    models: ["Address"],
    rules: ["CEP e UF normalizados", "Persistência com identidade ULID"],
  },
  {
    packageName: "auth",
    name: "Autenticação",
    kind: "Transversal",
    description: "JWT, refresh token, cookies, desafios por código, bloqueio de conta e autorização por objeto.",
    models: ["AuthChallenge", "RefreshToken"],
    rules: ["MFA após senha válida", "Sessão versionada", "Bloqueio após falhas consecutivas"],
  },
  {
    packageName: "cohort",
    name: "Turmas",
    kind: "Domínio",
    description: "Turmas, calendário-base, matrículas e ciclo do treinamento.",
    models: ["Cohort", "CohortEnrollment"],
    rules: ["Matrícula vinculada a contrato", "Conclusão automática pela data final"],
  },
  {
    packageName: "contact",
    name: "Contato",
    kind: "Domínio",
    description: "Mensagens públicas da landing page e fluxo administrativo de leitura e arquivamento.",
    models: ["ContactMessage"],
    rules: ["Criação pública", "Consulta e triagem exclusivas de ADMIN"],
  },
  {
    packageName: "contract",
    name: "Contratos",
    kind: "Domínio",
    description: "Relação de aprendizagem entre jovem, empregador e escola, incluindo documentos e histórico escolar.",
    models: ["Contract", "ContractDocument", "ContractSchoolChange"],
    rules: ["Carga semanal em minutos", "Vigência coerente", "Histórico de troca de escola"],
  },
  {
    packageName: "document",
    name: "Documentos",
    kind: "Domínio",
    description: "Catálogo documental, arquivos, verificação, validade e histórico de mudanças.",
    models: ["DocumentType", "PersonDocument", "PersonDocumentStatusHistory", "StoredFile"],
    rules: ["Expiração automática", "Hash SHA-256", "Arquivo físico fora do banco"],
  },
  {
    packageName: "learner",
    name: "Aprendizes",
    kind: "Domínio",
    description: "Perfil do aprendiz, onboarding e relações com responsáveis.",
    models: ["Learner", "LearnerGuardian"],
    rules: ["Pessoa e perfil separados", "Responsável primário consistente", "Elegibilidade por status"],
  },
  {
    packageName: "lesson",
    name: "Aulas e frequência",
    kind: "Domínio",
    description: "Aulas, participantes esperados, remanejamento, frequência e reconciliação temporal.",
    models: ["Lesson", "LessonParticipant", "AttendanceRecord"],
    rules: ["Sem sobreposição", "Estados guiados pelo relógio", "Presença online por conclusão"],
  },
  {
    packageName: "mail",
    name: "E-mail",
    kind: "Infraestrutura",
    description: "Contrato de envio e adaptação SMTP usados por códigos de autenticação e notificações.",
    models: ["EmailSender", "SmtpEmailSender", "EmailDeliveryException"],
    rules: ["SMTP configurável", "Conteúdo seguro", "Falhas sem exposição de credenciais"],
  },
  {
    packageName: "notification",
    name: "Notificações",
    kind: "Domínio",
    description: "Composição, audiência, destinatários, leitura e entrega multicanal.",
    models: ["Notification", "NotificationRecipient"],
    rules: ["Audiência materializada", "Retentativa de e-mail", "Estado individual por canal"],
  },
  {
    packageName: "organization",
    name: "Organizações",
    kind: "Domínio",
    description: "Empresas, escolas e vínculos funcionais das pessoas.",
    models: ["Organization", "OrganizationTypeEntry", "OrganizationMembership"],
    rules: ["Um ou mais tipos: EMPLOYER e/ou SCHOOL", "Tipos exigidos por contratos não podem ser removidos", "Gestor limitado à empresa vinculada"],
  },
  {
    packageName: "person",
    name: "Pessoas",
    kind: "Domínio",
    description: "Identidade civil compartilhada por usuários, aprendizes, instrutores, gestores e responsáveis.",
    models: ["Person", "PersonType"],
    rules: ["E-mail de contato único", "Classificações explícitas", "Cadastro independente da conta"],
  },
  {
    packageName: "project",
    name: "Políticas do projeto",
    kind: "Transversal",
    description: "Regras INAT que atravessam contratos, aulas, atividades e frequência.",
    models: ["ApprenticeshipPolicy", "OnlineAttendanceClosingPolicy"],
    rules: ["Aula online exige contrato ativo de 30 h", "Carga de 30 h protegida em aulas abertas", "Fechamento mensal usa America/Sao_Paulo"],
  },
  {
    packageName: "search",
    name: "Busca do portal",
    kind: "Transversal",
    description: "Pesquisa paginada e lookups pequenos, sempre filtrados pelo contexto do ator.",
    models: ["PortalSearchController", "PortalSearchService", "PageResponse<Object>"],
    rules: ["Recursos permitidos em catálogo", "Lookups limitados a cinco itens"],
  },
  {
    packageName: "shared",
    name: "Núcleo compartilhado",
    kind: "Transversal",
    description: "Contratos de paginação, enums, histórico de ciclo de vida, ULIDs e abstrações CRUD.",
    models: ["PageResponse", "LifecycleStatusHistory", "UlidGenerator"],
    rules: ["Instantes em UTC", "IDs ULID", "Estados tipados"],
  },
  {
    packageName: "user",
    name: "Usuários e papéis",
    kind: "Domínio",
    description: "Conta de acesso, papéis do sistema e contexto atual do portal.",
    models: ["User", "Role", "UserRole"],
    rules: ["Quatro papéis fechados", "Um usuário por pessoa", "Concessão explícita"],
  },
  {
    packageName: "web",
    name: "Camada HTTP",
    kind: "Infraestrutura",
    description: "Envelope de respostas e tradução centralizada de exceções para a API.",
    models: ["ApiResponse", "GlobalExceptionHandler", "BusinessRuleException"],
    rules: ["Envelope uniforme", "Erros de validação estruturados", "Exceções mapeadas para status HTTP"],
  },
];

export const endpointCount = apiGroups.reduce(
  (total, group) => total + group.endpoints.length,
  0,
);

export const publicEndpointCount = apiGroups.reduce(
  (total, group) =>
    total + group.endpoints.filter((item) => item.access === "public").length,
  0,
);

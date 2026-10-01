export type ApiMultipartPart = {
  name: string;
  contentType: string;
  required: boolean;
  description: string;
  fileExample?: string;
};

export type ApiRequestContract = {
  example?: Record<string, unknown>;
  rules: string[];
  parts?: ApiMultipartPart[];
};

const personId = "01K5X3M8Y7ABCD1234EFGH5678";
const learnerId = "01K5X3M8Y7ABCD1234EFGH5680";
const organizationId = "01K5X3M8Y7ABCD1234EFGH5681";
const cohortId = "01K5X3M8Y7ABCD1234EFGH5682";
const contractId = "01K5X3M8Y7ABCD1234EFGH5683";
const lessonId = "01K5X3M8Y7ABCD1234EFGH5684";
const participantId = "01K5X3M8Y7ABCD1234EFGH5685";
const activityId = "01K5X3M8Y7ABCD1234EFGH5686";

const addressExample = {
  postalCode: "83252000",
  street: "Rua João Teixeira",
  streetNumber: "1257",
  addressLine2: "Casa 2",
  district: "Vila Bela",
  city: "Paranaguá",
  stateCode: "PR",
  countryCode: "BR",
};

const personExample = {
  address: addressExample,
  fullName: "Maria da Silva",
  taxId: "12345678901",
  contactEmail: "maria@example.com",
  phoneNumber: "41987654321",
  birthDate: "2005-01-25",
  gender: "F",
  status: "ACTIVE",
  personTypes: ["LEARNER"],
};

const jsonPart = (description: string): ApiMultipartPart => ({
  name: "metadata",
  contentType: "application/json",
  required: true,
  description,
});

const filePart = (description: string): ApiMultipartPart => ({
  name: "file",
  contentType: "tipo MIME do arquivo",
  required: true,
  description,
  fileExample: "/caminho/arquivo.pdf",
});

export const requestContracts: Record<string, ApiRequestContract> = {
  LoginRequest: {
    example: {
      email: "usuario@example.com",
      password: "SenhaSegura123!",
    },
    rules: [
      "email — obrigatório, formato de e-mail, máximo de 254 caracteres",
      "password — obrigatório, máximo de 72 bytes em UTF-8",
    ],
  },
  RegisterRequest: {
    example: {
      name: "Maria da Silva",
      email: "maria@example.com",
      regulationAccepted: true,
      regulationAcceptedAt: "2026-09-22T12:00:00Z",
      password: "SenhaSegura123!",
    },
    rules: [
      "name — obrigatório, máximo de 100 caracteres",
      "regulationAccepted — deve ser true",
      "regulationAcceptedAt — obrigatório, instante ISO 8601",
      "password — de 8 caracteres até 72 bytes em UTF-8",
    ],
  },
  ForgotPasswordRequest: {
    example: { email: "usuario@example.com" },
    rules: ["email — obrigatório, formato de e-mail, máximo de 254 caracteres"],
  },
  ResetPasswordRequest: {
    example: {
      challengeId: "01K5X3M8Y7ABCD1234EFGH5687",
      code: "123456",
      newPassword: "NovaSenha123!",
    },
    rules: [
      "challengeId — obrigatório, máximo de 26 caracteres",
      "code — exatamente 6 dígitos",
      "newPassword — de 8 caracteres até 72 bytes em UTF-8",
    ],
  },
  VerifyAuthChallengeRequest: {
    example: {
      challengeId: "01K5X3M8Y7ABCD1234EFGH5687",
      code: "123456",
    },
    rules: [
      "challengeId — obrigatório, máximo de 26 caracteres",
      "code — exatamente 6 dígitos",
    ],
  },
  "RefreshRequest (opcional no cliente web)": {
    example: { refreshToken: "<refresh_token_de_43_caracteres>" },
    rules: [
      "refreshToken — 43 caracteres URL-safe; opcional quando o cliente web envia o cookie HttpOnly",
    ],
  },
  "UserDtos.CreateRequest": {
    example: {
      personId,
      displayName: "Maria da Silva",
      loginEmail: "maria@example.com",
      password: "SenhaSegura123!",
      status: "ACTIVE",
    },
    rules: [
      "personId — obrigatório; a pessoa ainda não pode estar vinculada a outro usuário",
      "displayName — obrigatório, máximo de 150 caracteres",
      "password — de 8 caracteres até 72 bytes em UTF-8",
      "status — INVITED, ACTIVE, LOCKED ou DISABLED",
    ],
  },
  "UserDtos.UpdateRequest": {
    example: {
      displayName: "Maria da Silva",
      loginEmail: "maria@example.com",
      password: null,
      status: "ACTIVE",
    },
    rules: [
      "displayName — obrigatório, máximo de 150 caracteres",
      "password — opcional; quando informado, mínimo de 8 caracteres e máximo de 72 bytes",
      "status — INVITED, ACTIVE, LOCKED ou DISABLED",
    ],
  },
  "RoleDtos.Request": {
    example: {
      code: "INSTRUCTOR",
      name: "Instructor",
      description: "Assigned lesson management",
    },
    rules: [
      "code — ADMIN, INSTRUCTOR, LEARNER ou EMPLOYER_MANAGER",
      "name — obrigatório, máximo de 100 caracteres",
      "description — opcional, máximo de 255 caracteres",
    ],
  },
  "UserRoleDtos.GrantRequest": {
    example: { roleId: 2 },
    rules: [
      "roleId — short obrigatório; a pessoa do usuário deve possuir o personType correspondente",
    ],
  },
  "PersonDtos.Request": {
    example: personExample,
    rules: [
      "address — obrigatório; postalCode possui 8 dígitos e UF/país possuem 2 letras",
      "taxId — exatamente 11 dígitos",
      "phoneNumber — DDD + telefone sem formatação, com 10 ou 11 dígitos",
      "birthDate — data ISO anterior à data atual",
      "status — ACTIVE, INACTIVE ou SUSPENDED",
      "personTypes — ADMIN, INSTRUCTOR, LEARNER, EMPLOYER_MANAGER e/ou GUARDIAN; pode ser omitido",
    ],
  },
  "OrganizationDtos.Request": {
    example: {
      parentOrganizationId: null,
      address: addressExample,
      organizationTypes: ["EMPLOYER", "SCHOOL"],
      legalName: "Empresa Exemplo Ltda.",
      tradeName: "Empresa Exemplo",
      taxId: "12345678000195",
      contactEmail: "contato@empresa.example",
      phoneNumber: "4134567890",
      attendanceClosingDay: 25,
      status: "ACTIVE",
    },
    rules: [
      "organizationTypes — obrigatório, ao menos um de EMPLOYER e/ou SCHOOL; envie como array no POST e no PUT",
      "Ao editar, tipos já usados por contratos não podem ser removidos; outros podem ser adicionados",
      "taxId — exatamente 14 dígitos",
      "attendanceClosingDay — opcional, entre 1 e 31",
      "status — ACTIVE, INACTIVE ou SUSPENDED",
    ],
  },
  "OrganizationMembershipDtos.Request": {
    example: {
      personId,
      organizationId,
      membershipRole: "EMPLOYER_MANAGER",
      jobTitle: "Gestora de pessoas",
      startDate: "2026-01-15",
      endDate: null,
      status: "ACTIVE",
    },
    rules: [
      "membershipRole — obrigatório, máximo de 40 caracteres",
      "startDate/endDate — datas ISO; endDate é opcional",
      "status — ACTIVE, INACTIVE ou SUSPENDED",
    ],
  },
  "LearnerDtos.Request": {
    example: {
      personId,
      hasCompletedHighSchool: false,
      status: "ACTIVE",
    },
    rules: [
      "personId — deve apontar para pessoa com personType LEARNER",
      "registrationNumber — gerado pelo banco na criação; não é enviado nem alterado nas requisições",
      "status — ACTIVE, INACTIVE ou SUSPENDED",
    ],
  },
  "LearnerOnboardingDtos.Request": {
    example: {
      person: personExample,
      learner: {
        hasCompletedHighSchool: false,
        status: "ACTIVE",
      },
      guardians: [
        {
          guardianPersonId: "01K5X3M8Y7ABCD1234EFGH5688",
          relationshipType: "MOTHER",
          legalGuardian: true,
          primaryContact: true,
        },
      ],
    },
    rules: [
      "person.personTypes — deve incluir LEARNER",
      "learner.registrationNumber — gerado pelo banco e retornado na resposta",
      "guardians — obrigatório, aceita até 10 itens e pode ser [] quando as regras de idade permitirem",
      "menor de 18 anos — exige ao menos um responsável legal adulto com personType GUARDIAN",
    ],
  },
  "LearnerGuardianDtos.Request": {
    example: {
      guardianPersonId: "01K5X3M8Y7ABCD1234EFGH5688",
      relationshipType: "MOTHER",
      legalGuardian: true,
      primaryContact: true,
    },
    rules: [
      "guardianPersonId — pessoa adulta com personType GUARDIAN",
      "relationshipType — obrigatório, máximo de 30 caracteres",
    ],
  },
  "ContractDtos.Request": {
    example: {
      learnerId,
      employerId: organizationId,
      schoolId: null,
      startDate: "2026-02-02",
      endDate: "2027-01-31",
      monthlySalary: 1518.0,
      weeklyWorkloadMinutes: 1800,
      status: "DRAFT",
      statusReason: null,
    },
    rules: [
      "monthlySalary — maior que zero",
      "weeklyWorkloadMinutes — entre 1 e 10080; aulas online exigem 1800",
      "status — DRAFT, ACTIVE, SUSPENDED, ENDED ou CANCELLED; novos contratos nascem DRAFT",
      "statusReason — até 500 caracteres, exigido em determinadas transições",
    ],
  },
  "metadata: ContractDocumentDtos.Request + file: binário": {
    example: {
      contractId,
      documentTypeId: 1,
      versionNumber: 1,
      current: true,
    },
    rules: [
      "versionNumber — inteiro igual ou maior que 1",
      "metadata deve ser enviado como uma parte application/json, não como texto comum",
    ],
    parts: [
      jsonPart("ContractDocumentDtos.Request serializado em JSON"),
      filePart("Documento contratual; tamanho e extensões seguem a política de upload"),
    ],
  },
  "ContractDocumentDtos.Request": {
    example: {
      contractId,
      documentTypeId: 1,
      versionNumber: 2,
      current: true,
    },
    rules: ["versionNumber — inteiro igual ou maior que 1"],
  },
  "DocumentTypeDtos.Request": {
    example: {
      code: "IDENTITY_DOCUMENT",
      name: "Documento de identidade",
      description: "Documento oficial com foto",
      scope: "PERSON",
    },
    rules: [
      "code — começa com letra e contém apenas letras, números e underscore; máximo de 50 caracteres",
      "scope — PERSON, CONTRACT ou BOTH",
    ],
  },
  "metadata: PersonDocumentDtos.Request + file: binário": {
    example: {
      personId,
      documentTypeId: 1,
      documentNumber: "123456789",
      issuedOn: "2024-01-10",
      expiresOn: "2034-01-10",
    },
    rules: [
      "documentNumber — opcional, máximo de 80 caracteres",
      "issuedOn/expiresOn — datas ISO opcionais",
      "metadata deve ser enviado como uma parte application/json",
    ],
    parts: [
      jsonPart("PersonDocumentDtos.Request serializado em JSON"),
      filePart("Documento da pessoa; tamanho e extensões seguem a política de upload"),
    ],
  },
  "PersonDocumentDtos.Request": {
    example: {
      personId,
      documentTypeId: 1,
      documentNumber: "123456789",
      issuedOn: "2024-01-10",
      expiresOn: "2034-01-10",
    },
    rules: [
      "documentNumber — opcional, máximo de 80 caracteres",
      "issuedOn/expiresOn — datas ISO opcionais",
    ],
  },
  "CohortDtos.Request": {
    example: {
      code: "TURMA-2026-A",
      name: "Aprendizagem 2026 — Turma A",
      defaultWeekday: 2,
      shiftCode: "AFTERNOON",
      startDate: "2026-02-02",
      endDate: "2026-12-18",
      maxLearners: 30,
      status: "PLANNED",
      statusReason: null,
    },
    rules: [
      "defaultWeekday — entre 1 e 7",
      "maxLearners — opcional e maior ou igual a 1",
      "status — PLANNED, ACTIVE, COMPLETED ou CANCELLED",
    ],
  },
  "CohortEnrollmentDtos.Request": {
    example: {
      contractId,
      cohortId,
      startDate: "2026-02-02",
      endDate: "2026-12-18",
      status: "PENDING",
      statusReason: null,
    },
    rules: [
      "startDate/endDate — datas ISO dentro das vigências compatíveis",
      "status — PENDING, ACTIVE, COMPLETED ou CANCELLED",
    ],
  },
  "LessonDtos.Request": {
    example: {
      cohortId,
      instructorPersonId: personId,
      title: "Fundamentos de cidadania",
      description: "Direitos, deveres e participação cidadã: objetivos e orientações da aula.",
      startsAt: "2026-10-05T16:00:00Z",
      endsAt: "2026-10-05T18:00:00Z",
      deliveryMode: "ONLINE",
      room: null,
      meetingUrl: "https://meet.example.com/aula-01",
      externalLessonUrl: null,
      status: "SCHEDULED",
    },
    rules: [
      "description — obrigatória, até 5.000 caracteres",
      "startsAt/endsAt — instantes ISO 8601; término posterior ao início",
      "deliveryMode — ONSITE ou ONLINE",
      "meetingUrl/externalLessonUrl — URL HTTP(S) opcional",
      "status — SCHEDULED, IN_PROGRESS, COMPLETED ou CANCELLED",
    ],
  },
  "LessonParticipantDtos.Request": {
    example: {
      lessonId,
      learnerId,
      sourceEnrollmentId: null,
      participationType: "REGULAR",
      status: "EXPECTED",
      assignmentReason: null,
    },
    rules: [
      "participationType — REGULAR, TRANSFERRED, MAKEUP ou EXTRA",
      "status — EXPECTED ou CANCELLED",
      "assignmentReason — opcional, máximo de 500 caracteres",
    ],
  },
  "LessonParticipantDtos.ReassignRequest": {
    example: {
      sourceParticipantId: participantId,
      targetLessonId: "01K5X3M8Y7ABCD1234EFGH5689",
      reason: "Reposição em outra data",
    },
    rules: ["reason — obrigatório, máximo de 500 caracteres"],
  },
  "AttendanceRecordDtos.Request": {
    example: {
      lessonParticipantId: participantId,
      status: "PRESENT",
      checkInAt: "2026-10-05T16:00:00Z",
      checkOutAt: "2026-10-05T18:00:00Z",
      notes: null,
    },
    rules: [
      "status — PRESENT, ABSENT, EXCUSED, LATE ou PARTIAL",
      "checkInAt/checkOutAt — instantes ISO 8601 opcionais e coerentes com a aula",
      "notes — opcional, máximo de 500 caracteres",
    ],
  },
  "ActivityDtos.Request": {
    example: {
      lessonId,
      title: "Atividade de fixação",
      description: "Responda às questões propostas.",
      availableAt: "2026-10-05T18:00:00Z",
      dueAt: "2026-10-12T23:59:59Z",
      maxScore: 10.0,
      status: "DRAFT",
    },
    rules: [
      "availableAt/dueAt — instantes ISO 8601; prazo posterior à disponibilidade",
      "maxScore — opcional e maior ou igual a zero",
      "status — DRAFT, PUBLISHED, CLOSED ou CANCELLED",
    ],
  },
  "metadata: LessonFileDtos.Request + file: binário": {
    example: { sortOrder: 0 },
    rules: [
      "sortOrder — inteiro maior ou igual a zero",
      "metadata deve ser enviado como uma parte application/json",
    ],
    parts: [
      jsonPart("LessonFileDtos.Request serializado em JSON"),
      filePart("Material da aula; tamanho e extensões seguem a política de materiais de atividades"),
    ],
  },
  "metadata: ActivityFileRequest + file: binário": {
    example: { sortOrder: 0 },
    rules: [
      "sortOrder — inteiro maior ou igual a zero",
      "metadata deve ser enviado como uma parte application/json",
    ],
    parts: [
      jsonPart("ActivityFileRequest serializado em JSON"),
      filePart("Material da atividade; tamanho e extensões seguem a política de upload"),
    ],
  },
  "ActivitySubmissionDtos.SaveRequest": {
    example: {
      activityId,
      learnerId,
      textAnswer: "Minha resposta para a atividade.",
      status: "SUBMITTED",
    },
    rules: [
      "status — DRAFT ou SUBMITTED nas operações do aprendiz; demais estados são controlados pelo fluxo",
      "textAnswer — opcional; anexos são enviados pela rota de arquivos da entrega",
    ],
  },
  "ActivitySubmissionDtos.GradeRequest": {
    example: {
      score: 8.5,
      feedback: "Boa resposta; revise o segundo tópico.",
      status: "GRADED",
    },
    rules: [
      "score — opcional, maior ou igual a zero e não pode superar maxScore",
      "status — GRADED ou RETURNED na avaliação",
    ],
  },
  "file: binário": {
    rules: ["Envie o arquivo na parte file; tamanho e extensões seguem a política de upload"],
    parts: [filePart("Arquivo anexado à entrega")],
  },
  "NotificationDtos.CreateRequest": {
    example: {
      notificationType: "LESSON_REMINDER",
      title: "Aula amanhã",
      message: "Sua próxima aula começa amanhã às 13h.",
      actionUrl: "/sistema/aulas/01K5X3M8Y7ABCD1234EFGH5684",
      contextType: "LESSON",
      contextId: lessonId,
      payload: "{\"lessonId\":\"01K5X3M8Y7ABCD1234EFGH5684\"}",
      priority: "NORMAL",
      scheduledAt: null,
      expiresAt: "2026-10-06T18:00:00Z",
      audience: { type: "COHORT", targetId: cohortId },
      channels: ["IN_APP", "EMAIL"],
    },
    rules: [
      "notificationType — maiúsculas, números e underscore; máximo de 50 caracteres",
      "priority — LOW, NORMAL, HIGH ou URGENT",
      "audience.type — USER, COHORT ou ALL; targetId depende do tipo",
      "channels — conjunto não vazio com IN_APP, EMAIL e/ou PUSH",
      "payload — string opcional, inclusive quando seu conteúdo representa JSON",
    ],
  },
  "NotificationDtos.UpdateRequest": {
    example: {
      notificationType: "LESSON_REMINDER",
      title: "Aula amanhã — horário atualizado",
      message: "Sua próxima aula começa amanhã às 14h.",
      actionUrl: "/sistema/aulas/01K5X3M8Y7ABCD1234EFGH5684",
      contextType: "LESSON",
      contextId: lessonId,
      payload: null,
      priority: "HIGH",
      scheduledAt: null,
      expiresAt: "2026-10-06T19:00:00Z",
    },
    rules: [
      "Audiência e canais não fazem parte da atualização e permanecem imutáveis",
      "priority — LOW, NORMAL, HIGH ou URGENT",
    ],
  },
  "NotificationRecipientDtos.DeliveryRequest": {
    example: {
      deliveryStatus: "FAILED",
      failureReason: "Caixa postal indisponível",
    },
    rules: [
      "deliveryStatus — PENDING, SENT, DELIVERED, FAILED ou CANCELLED",
      "failureReason — opcional, máximo de 500 caracteres",
    ],
  },
  "ContactMessageDtos.CreateRequest": {
    example: {
      name: "Maria da Silva",
      email: "maria@example.com",
      phone: "41987654321",
      contactType: "YOUTH_INTERESTED",
      message: "Gostaria de saber mais sobre o programa de aprendizagem.",
    },
    rules: [
      "phone — DDD + telefone sem formatação, com 10 ou 11 dígitos",
      "contactType — YOUTH_INTERESTED, COMPANY, FAMILY_OR_GUARDIAN ou OTHER",
      "message — obrigatório, máximo de 5000 caracteres",
    ],
  },
  "ContactMessageDtos.StatusRequest": {
    example: { status: "READ" },
    rules: ["status — NEW, READ ou ARCHIVED"],
  },
};

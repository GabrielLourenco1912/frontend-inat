import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { EndpointExplorer } from "@/components/documentation/EndpointExplorer";
import { Icon, type IconName } from "@/components/design-system/Icon";
import {
  backendModules,
  endpointCount,
  publicEndpointCount,
} from "@/lib/documentation/backend-catalog";
import {
  INSTITUTION_NAME,
  INTERNAL_SYSTEM_NAV_URL,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Documentação técnica | INAT Paranaguá",
  description:
    "Arquitetura, segurança, domínios, regras e referência completa da API da plataforma INAT EAD.",
};

const sectionNavigation = [
  { label: "Visão geral", href: "#visao-geral" },
  { label: "Arquitetura", href: "#arquitetura" },
  { label: "Contratos HTTP", href: "#contratos-http" },
  { label: "Segurança", href: "#seguranca" },
  { label: "Módulos", href: "#modulos" },
  { label: "Regras de negócio", href: "#regras" },
  { label: "Automações", href: "#automacoes" },
  { label: "Referência da API", href: "#referencia-api" },
  { label: "Persistência e operação", href: "#operacao" },
];

const stack = [
  "Java 21",
  "Spring Boot 4.0.6",
  "Spring MVC",
  "Spring Security",
  "Spring Data JPA",
  "Hibernate validate",
  "Flyway",
  "MySQL",
  "JWT",
  "SMTP",
  "Filesystem",
  "Virtual Threads",
];

const roleMatrix = [
  {
    area: "Pessoas e documentos",
    ADMIN: "Gerencia",
    INSTRUCTOR: "Participantes",
    LEARNER: "Próprio contexto",
    EMPLOYER_MANAGER: "Contratados",
  },
  {
    area: "Organizações e vínculos",
    ADMIN: "Gerencia",
    INSTRUCTOR: "—",
    LEARNER: "—",
    EMPLOYER_MANAGER: "Própria empresa",
  },
  {
    area: "Contratos",
    ADMIN: "Gerencia",
    INSTRUCTOR: "—",
    LEARNER: "Próprios",
    EMPLOYER_MANAGER: "Da empresa",
  },
  {
    area: "Aulas e frequência",
    ADMIN: "Gerencia",
    INSTRUCTOR: "Aulas atribuídas",
    LEARNER: "Próprias",
    EMPLOYER_MANAGER: "—",
  },
  {
    area: "Atividades e entregas",
    ADMIN: "Gerencia",
    INSTRUCTOR: "Cria e corrige",
    LEARNER: "Entrega",
    EMPLOYER_MANAGER: "—",
  },
  {
    area: "Comunicações",
    ADMIN: "Compõe e acompanha",
    INSTRUCTOR: "Caixa própria",
    LEARNER: "Caixa própria",
    EMPLOYER_MANAGER: "Caixa própria",
  },
  {
    area: "Usuários e papéis",
    ADMIN: "Gerencia",
    INSTRUCTOR: "Própria conta",
    LEARNER: "Própria conta",
    EMPLOYER_MANAGER: "Própria conta",
  },
];

const businessRules: Array<{
  icon: IconName;
  title: string;
  description: string;
  items: string[];
}> = [
  {
    icon: "calendar",
    title: "Agenda e ciclo acadêmico",
    description: "Horários são parte do domínio, não apenas informação visual.",
    items: [
      "Instrutor, turma e aprendiz não podem ter aulas ativas sobrepostas; aulas adjacentes são permitidas.",
      "Aulas evoluem de SCHEDULED para IN_PROGRESS e COMPLETED pelo relógio; CANCELLED e COMPLETED são terminais.",
      "Atividades PUBLISHED fecham após dueAt; DRAFT nunca é publicado automaticamente.",
    ],
  },
  {
    icon: "briefcase",
    title: "Aprendizagem profissional",
    description: "As políticas em project conectam diferentes agregados.",
    items: [
      "Uma aula ONLINE exige contrato ativo na data e carga semanal de 1.800 minutos (30 h).",
      "A carga de 30 h do contrato não pode ser alterada enquanto houver participação online aberta dependente dela.",
      "Vigências de contrato, turma e matrícula são reconciliadas sem apagar o histórico.",
    ],
  },
  {
    icon: "check",
    title: "Frequência online",
    description: "A presença pode nascer da conclusão efetiva das atividades.",
    items: [
      "Todas as atividades PUBLISHED ou CLOSED da aula devem ter entrega SUBMITTED, LATE ou GRADED.",
      "O fechamento mensal respeita attendanceClosingDay da empresa e o fuso America/Sao_Paulo.",
      "A verificação bloqueia o participante para impedir registros duplicados em concorrência.",
    ],
  },
  {
    icon: "clipboard",
    title: "Entregas e avaliação",
    description: "O estado da aula, da atividade e da entrega trabalha em conjunto.",
    items: [
      "Só existe uma entrega por atividade e aprendiz; envios após o prazo tornam-se LATE.",
      "O aprendiz edita apenas DRAFT ou RETURNED; o instrutor avalia SUBMITTED ou LATE.",
      "A nota não pode superar maxScore e anexos seguem política de tipo, tamanho e conteúdo.",
    ],
  },
  {
    icon: "document",
    title: "Documentos e arquivos",
    description: "Metadados transacionais no banco, binários protegidos no filesystem.",
    items: [
      "Uploads estruturados usam multipart com as partes metadata e file.",
      "O cliente nunca define storageKey, checksum ou tamanho; o backend calcula e protege esses dados.",
      "Documentos verificados vencidos mudam para EXPIRED com histórico da transição.",
    ],
  },
  {
    icon: "bell",
    title: "Notificações",
    description: "A audiência é resolvida no momento da criação.",
    items: [
      "USER, COHORT e ALL geram um retrato de destinatários; mudanças futuras não alteram o envio criado.",
      "Publicação, prazo próximo e entrega de atividade podem gerar notificações automáticas.",
      "E-mail aceito pelo SMTP torna-se SENT; FAILED pode voltar a PENDING por ação administrativa.",
    ],
  },
];

const schedulers = [
  {
    name: "AccountLockScheduler",
    interval: "60 s",
    action: "Desbloqueia contas cujo bloqueio automático expirou.",
  },
  {
    name: "TrainingLifecycleScheduler",
    interval: "60 s",
    action: "Encerra contratos e conclui turmas e matrículas vencidas.",
  },
  {
    name: "AcademicLifecycleScheduler",
    interval: "60 s",
    action: "Move aulas/atividades, cria lembretes e registra ausências online pendentes.",
  },
  {
    name: "PersonDocumentLifecycleScheduler",
    interval: "60 s",
    action: "Expira, em lote, documentos verificados cuja validade terminou.",
  },
  {
    name: "NotificationEmailScheduler",
    interval: "5 s",
    action: "Busca destinatários de e-mail pendentes e tenta a entrega via SMTP.",
  },
];

const responseExample = `{
  "timestamp": "2026-09-20T14:30:00",
  "status": "OK",
  "message": "Resource found",
  "data": { ... }
}`;

const pageExample = `{
  "content": [ ... ],
  "page": 0,
  "size": 20,
  "totalElements": 48,
  "totalPages": 3,
  "first": true,
  "last": false
}`;

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="section-eyebrow">{eyebrow}</p>
      <h2 className="section-title mt-3 text-3xl font-bold sm:text-4xl">{title}</h2>
      <p className="section-copy mt-4 text-base leading-8">{description}</p>
    </div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#16282a] shadow-[0_24px_65px_-45px_rgba(12,32,34,.85)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-white/48">
          {label}
        </span>
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2 rounded-full bg-[#d16b36]" />
          <span className="size-2 rounded-full bg-[#d9b65b]" />
          <span className="size-2 rounded-full bg-[#69a99d]" />
        </span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-[#dceae7]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function DocumentationHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--inat-line)] bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-[4.75rem] w-full max-w-[96rem] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="Voltar para a página inicial" className="shrink-0">
          <Image
            src="/brand/inat-logo-header.png"
            alt={INSTITUTION_NAME}
            width={1000}
            height={250}
            priority
            className="h-auto w-[10.5rem] sm:w-[12rem]"
          />
        </Link>
        <span className="hidden h-7 w-px bg-[var(--inat-line-strong)] sm:block" />
        <span className="hidden font-mono text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-muted)] sm:block">
          Docs do backend
        </span>

        <nav className="ml-auto hidden items-center gap-1 xl:flex" aria-label="Seções da documentação">
          {sectionNavigation.slice(0, 5).map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="px-2.5 py-2 text-xs font-semibold text-[var(--inat-muted)] transition hover:bg-[var(--inat-mist)] hover:text-[var(--inat-ink)]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          href="/"
          className="portal-button portal-button-secondary ml-auto hidden sm:inline-flex xl:ml-3"
        >
          <Icon name="arrow-left" className="size-4" />
          Site institucional
        </Link>
        <a
          href={INTERNAL_SYSTEM_NAV_URL}
          className="portal-button portal-button-clay shrink-0"
        >
          <span className="hidden sm:inline">Acessar portal</span>
          <span className="sm:hidden">Portal</span>
          <Icon name="arrow-right" className="size-4" />
        </a>
      </div>
    </header>
  );
}

export default function DocumentationPage() {
  return (
    <>
      <DocumentationHeader />

      <main className="flex-1 bg-[var(--inat-paper)]">
        <section className="landing-grid relative overflow-hidden bg-[var(--inat-ink)] text-white">
          <div className="pointer-events-none absolute -right-28 -top-32 size-[30rem] rounded-full border border-white/5" />
          <div className="pointer-events-none absolute -right-10 -top-14 size-[19rem] rounded-full border border-[#e3824f]/18" />
          <div className="pointer-events-none absolute bottom-0 left-[8%] h-px w-[44%] bg-gradient-to-r from-transparent via-[#70b5a9]/40 to-transparent" />

          <div className="relative mx-auto grid w-full max-w-[96rem] gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,.8fr)] lg:items-end lg:px-8 lg:py-24">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[#6fb3a8]/35 bg-[#6fb3a8]/10 px-3 py-1.5 font-mono text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[#a9d8d0]">
                  Referência técnica
                </span>
                <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 font-mono text-[0.6875rem] font-semibold text-white/62">
                  API v1 · setembro/2026
                </span>
                <span className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 font-mono text-[0.6875rem] font-semibold text-white/62">
                  Página estática
                </span>
              </div>

              <h1 className="mt-7 max-w-4xl text-4xl font-bold leading-[1.02] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                O backend INAT,
                <span className="block text-[#ef9b6d]">do contexto à API.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/66 sm:text-lg">
                Um mapa do sistema Spring: arquitetura, autenticação, autorização,
                domínios, políticas, automações, persistência e cada operação HTTP
                disponível hoje.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#referencia-api" className="btn-base btn-cta gap-2">
                  Explorar endpoints
                  <Icon name="arrow-right" className="size-4" />
                </a>
                <a
                  href="#arquitetura"
                  className="btn-base gap-2 border border-white/18 bg-white/7 text-white hover:bg-white/12"
                >
                  Entender a arquitetura
                  <Icon name="layers" className="size-4" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] backdrop-blur-sm">
              {[
                { value: endpointCount, label: "operações HTTP" },
                { value: backendModules.length, label: "módulos de código" },
                { value: 4, label: "papéis de sistema" },
                { value: publicEndpointCount, label: "rotas públicas" },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className={`p-5 sm:p-6 ${index % 2 === 0 ? "border-r border-white/10" : ""} ${index < 2 ? "border-b border-white/10" : ""}`}
                >
                  <strong className="block font-mono text-3xl font-bold text-white sm:text-4xl">
                    {stat.value}
                  </strong>
                  <span className="mt-2 block text-xs leading-5 text-white/48">
                    {stat.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto grid w-full max-w-[96rem] gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-8 lg:py-20 xl:gap-16">
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <p className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.14em] text-[var(--inat-muted)]">
                Nesta página
              </p>
              <nav className="mt-4 border-l border-[var(--inat-line-strong)]" aria-label="Índice da documentação">
                {sectionNavigation.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block border-l-2 border-transparent px-4 py-2 text-xs font-semibold text-[var(--inat-muted)] transition hover:border-[var(--inat-teal)] hover:bg-white hover:text-[var(--inat-ink)]"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-8 rounded-lg border border-[var(--inat-line)] bg-white p-4">
                <div className="flex items-center gap-2 text-[var(--inat-teal-dark)]">
                  <Icon name="shield" className="size-4" />
                  <span className="text-xs font-bold">Acesso público</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-[var(--inat-muted)]">
                  Esta rota vive apenas no Next.js, não consulta a API e não passa pelo Spring Security.
                </p>
              </div>
            </div>
          </aside>

          <div className="min-w-0">
            <section id="visao-geral" className="scroll-mt-28">
              <SectionHeading
                eyebrow="01 · Visão geral"
                title="Uma API modular para a jornada de aprendizagem"
                description="O backend é um monólito modular orientado aos fluxos do INAT. Cada pacote concentra controller, DTOs, serviços, repositórios e modelos do seu assunto; as regras que cruzam assuntos ficam explícitas em políticas transversais."
              />

              <div className="mt-8 flex flex-wrap gap-2">
                {stack.map((item) => (
                  <span
                    key={item}
                    className="rounded border border-[var(--inat-line)] bg-white px-3 py-2 font-mono text-[0.6875rem] font-semibold text-[var(--inat-muted)] shadow-[0_10px_30px_-28px_rgba(32,52,54,.7)]"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  {
                    icon: "layers" as IconName,
                    title: "Monólito modular",
                    text: "Uma aplicação implantável, com fronteiras organizadas por domínio em vez de camadas globais.",
                  },
                  {
                    icon: "shield" as IconName,
                    title: "Autorização em duas etapas",
                    text: "O filtro exige autenticação e o Method Security decide papel, identidade e vínculo com o objeto.",
                  },
                  {
                    icon: "clock" as IconName,
                    title: "Domínio temporal",
                    text: "Agendadores reconciliam contratos, aulas, atividades, documentos, contas e entregas de e-mail.",
                  },
                ].map((card) => (
                  <article key={card.title} className="card-simple p-5 sm:p-6">
                    <span className="grid size-10 place-items-center rounded bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]">
                      <Icon name={card.icon} className="size-5" />
                    </span>
                    <h3 className="mt-5 font-bold text-[var(--inat-ink)]">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[var(--inat-muted)]">{card.text}</p>
                  </article>
                ))}
              </div>
            </section>

            <section id="arquitetura" className="scroll-mt-28 border-t border-[var(--inat-line)] pt-16 mt-16 sm:pt-20 sm:mt-20">
              <SectionHeading
                eyebrow="02 · Arquitetura"
                title="O caminho de uma requisição"
                description="Os controllers cuidam do contrato HTTP. Serviços coordenam casos de uso e transações; políticas concentram invariantes que atravessam agregados; repositórios isolam a persistência. Integrações externas permanecem nas bordas."
              />

              <div className="mt-10 overflow-hidden rounded-xl border border-[var(--inat-line)] bg-white p-4 shadow-[0_30px_80px_-62px_rgba(32,52,54,.7)] sm:p-6">
                <div className="grid gap-3 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] xl:items-stretch">
                  {[
                    { label: "Clientes", detail: "Next.js · mobile", icon: "grid" as IconName },
                    { label: "Controllers", detail: "HTTP · validação · DTO", icon: "external" as IconName },
                    { label: "Serviços e políticas", detail: "casos de uso · transações", icon: "settings" as IconName },
                    { label: "Repositórios", detail: "Spring Data JPA", icon: "layers" as IconName },
                  ].map((node, index) => (
                    <div key={node.label} className="contents">
                      <div className="rounded-lg border border-[var(--inat-line)] bg-[var(--inat-paper)] p-4">
                        <span className="grid size-9 place-items-center rounded bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]">
                          <Icon name={node.icon} className="size-4" />
                        </span>
                        <strong className="mt-4 block text-sm text-[var(--inat-ink)]">{node.label}</strong>
                        <span className="mt-1 block text-xs leading-5 text-[var(--inat-muted)]">{node.detail}</span>
                      </div>
                      {index < 3 ? (
                        <span className="grid place-items-center text-[var(--inat-line-strong)] max-xl:rotate-90">
                          <Icon name="arrow-right" className="size-5" />
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-[var(--inat-ink)] p-4 text-white">
                    <div className="flex items-center gap-2">
                      <Icon name="layers" className="size-4 text-[#8bc9be]" />
                      <strong className="text-sm">MySQL + Flyway</strong>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/58">Dados relacionais, schema versionado e Hibernate apenas validando o mapeamento.</p>
                  </div>
                  <div className="rounded-lg bg-[var(--inat-ink)] p-4 text-white">
                    <div className="flex items-center gap-2">
                      <Icon name="folder" className="size-4 text-[#8bc9be]" />
                      <strong className="text-sm">Filesystem</strong>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/58">Binários fora do banco; metadados, checksum e relacionamentos dentro da transação.</p>
                  </div>
                  <div className="rounded-lg bg-[var(--inat-ink)] p-4 text-white">
                    <div className="flex items-center gap-2">
                      <Icon name="mail" className="size-4 text-[#8bc9be]" />
                      <strong className="text-sm">SMTP + schedulers</strong>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-white/58">Códigos e notificações por e-mail, processados de forma desacoplada dos fluxos principais.</p>
                  </div>
                </div>
              </div>
            </section>

            <section id="contratos-http" className="scroll-mt-28 border-t border-[var(--inat-line)] pt-16 mt-16 sm:pt-20 sm:mt-20">
              <SectionHeading
                eyebrow="03 · Contratos HTTP"
                title="Uma forma previsível de conversar com a API"
                description="A API usa /api como prefixo, JSON para operações comuns e multipart apenas nos uploads. Em desenvolvimento, o backend escuta a porta 8080; o frontend real acessa-o pelo BFF do Next.js."
              />

              <div className="mt-8 grid gap-5 xl:grid-cols-2">
                <CodeBlock label="ApiResponse<T>" code={responseExample} />
                <CodeBlock label="PageResponse<T> dentro de data" code={pageExample} />
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { title: "Identificadores", text: "ULID de 26 caracteres nos agregados; catálogos pequenos usam short." },
                  { title: "Tempo", text: "Instantes persistidos em UTC; datas civis críticas usam America/Sao_Paulo." },
                  { title: "Paginação", text: "page começa em 0; size usa 20 por padrão e aceita no máximo 100." },
                  { title: "Erros", text: "400 validação, 401 autenticação, 403 acesso, 404 ausência, 409 conflito e 422 regra." },
                ].map((item) => (
                  <div key={item.title} className="rounded-lg border border-[var(--inat-line)] bg-white p-4">
                    <h3 className="text-sm font-bold text-[var(--inat-ink)]">{item.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-[var(--inat-muted)]">{item.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg border border-[#d4e6e2] bg-[var(--inat-mist)] p-5">
                <div className="flex gap-3">
                  <Icon name="paperclip" className="mt-0.5 size-5 shrink-0 text-[var(--inat-teal-dark)]" />
                  <div>
                    <h3 className="text-sm font-bold text-[var(--inat-ink)]">Contrato de upload</h3>
                    <p className="mt-1 text-sm leading-6 text-[var(--inat-muted)]">
                      Documentos de pessoa, documentos contratuais e materiais de atividade recebem
                      <code className="mx-1 rounded bg-white/75 px-1.5 py-0.5 font-mono text-xs text-[var(--inat-ink)]">metadata</code>
                      em JSON e
                      <code className="mx-1 rounded bg-white/75 px-1.5 py-0.5 font-mono text-xs text-[var(--inat-ink)]">file</code>
                      como binário. Anexos de entrega precisam apenas de file. O limite padrão é 25 MB.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section id="seguranca" className="scroll-mt-28 border-t border-[var(--inat-line)] pt-16 mt-16 sm:pt-20 sm:mt-20">
              <SectionHeading
                eyebrow="04 · Segurança"
                title="JWT na borda, contexto no domínio"
                description="Spring Security opera sem sessão de servidor. Um JWT válido identifica o ator; a autorização por método avalia papel, identidade, organização, aula, aprendiz ou outro objeto antes de executar o caso de uso."
              />

              <div className="mt-9 grid gap-3 md:grid-cols-4">
                {[
                  { number: "01", title: "Senha", text: "Login valida a credencial e cria o desafio." },
                  { number: "02", title: "Código", text: "Seis dígitos, validade de 10 min e até 5 tentativas." },
                  { number: "03", title: "Tokens", text: "A confirmação emite access e refresh token." },
                  { number: "04", title: "Validação ativa", text: "Estado e versão de sessão são conferidos no banco." },
                ].map((step, index) => (
                  <div key={step.number} className="relative rounded-lg border border-[var(--inat-line)] bg-white p-5">
                    {index < 3 ? <span className="absolute -right-2.5 top-8 z-10 hidden size-5 place-items-center rounded-full border border-[var(--inat-line)] bg-[var(--inat-paper)] text-[var(--inat-muted)] md:grid">→</span> : null}
                    <span className="font-mono text-xs font-bold text-[var(--inat-clay)]">{step.number}</span>
                    <h3 className="mt-4 text-sm font-bold text-[var(--inat-ink)]">{step.title}</h3>
                    <p className="mt-2 text-xs leading-5 text-[var(--inat-muted)]">{step.text}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_.8fr]">
                <div className="rounded-lg border border-[var(--inat-line)] bg-white p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]">
                      <Icon name="lock" className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-[var(--inat-ink)]">Sessão web e mobile</h3>
                      <p className="text-xs text-[var(--inat-muted)]">Mesmo domínio, transporte adequado a cada cliente.</p>
                    </div>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md bg-[var(--inat-paper)] p-4">
                      <strong className="font-mono text-xs text-[var(--inat-ink)]">X-Client-Type: web</strong>
                      <p className="mt-2 text-xs leading-5 text-[var(--inat-muted)]">Refresh token em cookie HttpOnly, SameSite=Lax e Secure por padrão.</p>
                    </div>
                    <div className="rounded-md bg-[var(--inat-paper)] p-4">
                      <strong className="font-mono text-xs text-[var(--inat-ink)]">X-Client-Type: mobile</strong>
                      <p className="mt-2 text-xs leading-5 text-[var(--inat-muted)]">Refresh token devolvido e recebido no corpo da requisição.</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-[#ead2c5] bg-[#fff8f4] p-5 sm:p-6">
                  <div className="flex items-center gap-3 text-[#8f4926]">
                    <Icon name="shield" className="size-5" />
                    <h3 className="font-bold">Superfície pública</h3>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#765444]">
                    São públicos os sete POSTs de autenticação e o POST de contato. Todo o restante exige JWT; regras mais restritas são aplicadas nos controllers.
                  </p>
                  <p className="mt-3 font-mono text-[0.6875rem] font-semibold text-[#8f4926]">
                    {publicEndpointCount} de {endpointCount} operações
                  </p>
                </div>
              </div>

              <div className="mt-8 overflow-x-auto rounded-lg border border-[var(--inat-line)] bg-white">
                <table className="w-full min-w-[52rem] border-collapse text-left text-xs">
                  <caption className="sr-only">Matriz resumida de acesso por papel</caption>
                  <thead className="bg-[var(--inat-ink)] text-white">
                    <tr>
                      <th className="px-4 py-3.5 font-semibold">Área</th>
                      <th className="px-4 py-3.5 font-mono text-[0.6875rem]">ADMIN</th>
                      <th className="px-4 py-3.5 font-mono text-[0.6875rem]">INSTRUCTOR</th>
                      <th className="px-4 py-3.5 font-mono text-[0.6875rem]">LEARNER</th>
                      <th className="px-4 py-3.5 font-mono text-[0.6875rem]">EMPLOYER_MANAGER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roleMatrix.map((row) => (
                      <tr key={row.area} className="border-b border-[var(--inat-line)] last:border-b-0">
                        <th className="px-4 py-3.5 font-semibold text-[var(--inat-ink)]">{row.area}</th>
                        <td className="px-4 py-3.5 text-[var(--inat-muted)]">{row.ADMIN}</td>
                        <td className="px-4 py-3.5 text-[var(--inat-muted)]">{row.INSTRUCTOR}</td>
                        <td className="px-4 py-3.5 text-[var(--inat-muted)]">{row.LEARNER}</td>
                        <td className="px-4 py-3.5 text-[var(--inat-muted)]">{row.EMPLOYER_MANAGER}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="modulos" className="scroll-mt-28 border-t border-[var(--inat-line)] pt-16 mt-16 sm:pt-20 sm:mt-20">
              <SectionHeading
                eyebrow="05 · Módulos"
                title="O mapa completo dos pacotes"
                description="Os 18 pacotes de primeiro nível incluem domínios de negócio, capacidades transversais e integrações de infraestrutura. Abra um módulo para ver modelos e responsabilidades centrais."
              />

              <div className="mt-9 grid gap-3 md:grid-cols-2">
                {backendModules.map((module) => (
                  <details key={module.packageName} className="group rounded-lg border border-[var(--inat-line)] bg-white open:border-[var(--inat-line-strong)]">
                    <summary className="flex cursor-pointer list-none items-start gap-4 p-5 [&::-webkit-details-marker]:hidden">
                      <span className="grid size-10 shrink-0 place-items-center rounded bg-[var(--inat-mist)] font-mono text-xs font-black uppercase text-[var(--inat-teal-dark)]">
                        {module.packageName.slice(0, 2)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <strong className="text-sm text-[var(--inat-ink)]">{module.name}</strong>
                          <span className="rounded-full bg-[var(--inat-paper)] px-2 py-1 font-mono text-[0.5625rem] font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">
                            {module.kind}
                          </span>
                        </span>
                        <code className="mt-1 block font-mono text-[0.6875rem] text-[var(--inat-clay-dark)]">{module.packageName}</code>
                        <span className="mt-2 block text-xs leading-5 text-[var(--inat-muted)]">{module.description}</span>
                      </span>
                      <Icon name="chevron-down" className="mt-1 size-4 shrink-0 text-[var(--inat-muted)] transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="border-t border-[var(--inat-line)] px-5 py-4">
                      <div>
                        <span className="font-mono text-[0.625rem] font-bold uppercase tracking-[0.1em] text-[var(--inat-muted)]">Peças centrais</span>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {module.models.map((model) => (
                            <code key={model} className="rounded bg-[var(--inat-paper)] px-2 py-1 font-mono text-[0.6875rem] text-[var(--inat-ink)]">{model}</code>
                          ))}
                        </div>
                      </div>
                      <ul className="mt-4 grid gap-2">
                        {module.rules.map((rule) => (
                          <li key={rule} className="flex gap-2 text-xs leading-5 text-[var(--inat-muted)]">
                            <Icon name="check" className="mt-0.5 size-3.5 shrink-0 text-[var(--inat-teal)]" />
                            {rule}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </details>
                ))}
              </div>
            </section>

            <section id="regras" className="scroll-mt-28 border-t border-[var(--inat-line)] pt-16 mt-16 sm:pt-20 sm:mt-20">
              <SectionHeading
                eyebrow="06 · Regras de negócio"
                title="Onde o sistema protege o processo"
                description="As invariantes abaixo são os pontos em que o backend faz mais do que persistir formulários. Elas coordenam estados, prazos, vínculos e efeitos automáticos."
              />

              <div className="mt-9 grid gap-4 lg:grid-cols-2">
                {businessRules.map((rule) => (
                  <article key={rule.title} className="rounded-lg border border-[var(--inat-line)] bg-white p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <span className="grid size-10 shrink-0 place-items-center rounded bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]">
                        <Icon name={rule.icon} className="size-5" />
                      </span>
                      <div>
                        <h3 className="font-bold text-[var(--inat-ink)]">{rule.title}</h3>
                        <p className="mt-1 text-xs leading-5 text-[var(--inat-muted)]">{rule.description}</p>
                      </div>
                    </div>
                    <ul className="mt-5 grid gap-3 border-t border-[var(--inat-line)] pt-4">
                      {rule.items.map((item) => (
                        <li key={item} className="flex gap-2.5 text-xs leading-5 text-[var(--inat-muted)]">
                          <span className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-[var(--inat-clay)]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section id="automacoes" className="scroll-mt-28 border-t border-[var(--inat-line)] pt-16 mt-16 sm:pt-20 sm:mt-20">
              <SectionHeading
                eyebrow="07 · Automações"
                title="Cinco ciclos mantêm o estado coerente"
                description="Os agendadores usam fixed delay configurável. Cada serviço revalida o estado dentro da transação, trabalha em lotes quando necessário e registra apenas mudanças efetivas."
              />

              <div className="mt-9 overflow-hidden rounded-lg border border-[var(--inat-line)] bg-white">
                {schedulers.map((job, index) => (
                  <div key={job.name} className="grid gap-3 border-b border-[var(--inat-line)] p-5 last:border-b-0 md:grid-cols-[2fr_.6fr_3fr] md:items-center">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]">
                        <Icon name={index === 4 ? "mail" : "clock"} className="size-4" />
                      </span>
                      <code className="font-mono text-xs font-semibold text-[var(--inat-ink)]">{job.name}</code>
                    </div>
                    <span className="w-fit rounded-full border border-[var(--inat-line)] px-2.5 py-1 font-mono text-[0.625rem] font-semibold text-[var(--inat-muted)]">{job.interval}</span>
                    <p className="text-xs leading-5 text-[var(--inat-muted)]">{job.action}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="referencia-api" className="scroll-mt-28 border-t border-[var(--inat-line)] pt-16 mt-16 sm:pt-20 sm:mt-20">
              <SectionHeading
                eyebrow="08 · Referência da API"
                title={`${endpointCount} operações, pesquisáveis por contexto`}
                description="Pesquise por rota, ação, DTO ou regra; filtre por domínio e nível de acesso. Cada item mostra o contrato principal de entrada, saída, parâmetros e observações relevantes."
              />
              <EndpointExplorer />
            </section>

            <section id="operacao" className="scroll-mt-28 border-t border-[var(--inat-line)] pt-16 mt-16 sm:pt-20 sm:mt-20">
              <SectionHeading
                eyebrow="09 · Persistência e operação"
                title="Flyway é a origem do schema"
                description="O banco nasce pelas migrations e o Hibernate apenas confere se as entidades correspondem ao schema. Isso torna estrutura e catálogos reproduzíveis, revisáveis e independentes do ambiente."
              />

              <div className="mt-9 grid gap-5 lg:grid-cols-2">
                <div className="rounded-lg border border-[var(--inat-line)] bg-white p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]">
                      <Icon name="layers" className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-[var(--inat-ink)]">Banco e migrations</h3>
                      <p className="text-xs text-[var(--inat-muted)]">MySQL em produção, H2/Testcontainers nos testes.</p>
                    </div>
                  </div>
                  <ol className="mt-5 grid gap-3">
                    <li className="flex gap-3 text-sm leading-6 text-[var(--inat-muted)]"><span className="font-mono text-xs font-bold text-[var(--inat-clay)]">V1</span><span>Cria tabelas, índices, constraints e relacionamentos do modelo completo.</span></li>
                    <li className="flex gap-3 text-sm leading-6 text-[var(--inat-muted)]"><span className="font-mono text-xs font-bold text-[var(--inat-clay)]">V2</span><span>Insere papéis de sistema e tipos de pessoa, sem depender do contexto Spring.</span></li>
                    <li className="flex gap-3 text-sm leading-6 text-[var(--inat-muted)]"><span className="font-mono text-xs font-bold text-[var(--inat-clay)]">JPA</span><span><code className="font-mono text-xs text-[var(--inat-ink)]">ddl-auto: validate</code> em todos os ambientes.</span></li>
                  </ol>
                  <p className="mt-5 rounded-md bg-[var(--inat-paper)] p-3 text-xs leading-5 text-[var(--inat-muted)]">
                    O próprio banco guarda <code className="font-mono text-[var(--inat-ink)]">flyway_schema_history</code>, com versão, checksum, data e resultado de cada migration.
                  </p>
                </div>

                <div className="rounded-lg border border-[var(--inat-line)] bg-white p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]">
                      <Icon name="settings" className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-[var(--inat-ink)]">Configuração externa</h3>
                      <p className="text-xs text-[var(--inat-muted)]">Segredos e infraestrutura chegam por variáveis de ambiente.</p>
                    </div>
                  </div>
                  <dl className="mt-5 grid gap-3 text-xs">
                    {[
                      ["Banco", "SPRING_DATASOURCE_URL / USERNAME / PASSWORD"],
                      ["JWT", "API_SECURITY_JWT_SECRET / ISSUER"],
                      ["E-mail", "EMAIL / EMAIL_PASS / SMTP_*"],
                      ["Arquivos", "FILE_STORAGE_ROOT / MAX_SIZE / ALLOWED_*"],
                      ["Ciclos", "ACADEMIC_* / DOCUMENT_* / NOTIFICATION_*"],
                    ].map(([term, value]) => (
                      <div key={term} className="grid gap-1 border-b border-[var(--inat-line)] pb-3 last:border-b-0 sm:grid-cols-[5rem_1fr]">
                        <dt className="font-semibold text-[var(--inat-ink)]">{term}</dt>
                        <dd className="break-words font-mono text-[0.6875rem] leading-5 text-[var(--inat-muted)]">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-[#d5e7e3] bg-[var(--inat-mist)] p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded bg-white text-[var(--inat-teal-dark)] shadow-sm">
                      <Icon name="document" className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-bold text-[var(--inat-ink)]">Esta documentação pertence ao frontend</h3>
                      <p className="mt-1 max-w-2xl text-sm leading-6 text-[var(--inat-muted)]">
                        A rota <code className="font-mono text-xs text-[var(--inat-ink)]">/documentacao</code> é renderizada pelo Next.js com um catálogo versionado no código. Ela não cria endpoint no Spring, não chama o backend e continua disponível mesmo com a API desligada.
                      </p>
                    </div>
                  </div>
                  <a href="#visao-geral" className="portal-button portal-button-secondary shrink-0">
                    Voltar ao topo
                    <Icon name="arrow-right" className="size-4 -rotate-90" />
                  </a>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-[var(--inat-ink)] text-white">
        <div className="mx-auto flex w-full max-w-[96rem] flex-col gap-5 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Image src="/brand/inat-logo-footer.png" alt={INSTITUTION_NAME} width={800} height={200} className="h-auto w-44" />
            <span className="hidden h-8 w-px bg-white/12 sm:block" />
            <p className="hidden text-xs text-white/42 sm:block">Referência técnica da plataforma EAD</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/52">
            <Link href="/" className="transition hover:text-white">Site institucional</Link>
            <a href={INTERNAL_SYSTEM_NAV_URL} className="transition hover:text-white">Portal</a>
            <a href="#referencia-api" className="transition hover:text-white">API</a>
          </div>
        </div>
      </footer>
    </>
  );
}

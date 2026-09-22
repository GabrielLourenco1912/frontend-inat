"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/design-system/Icon";
import {
  accessDescriptions,
  accessLabels,
  apiGroups,
  type AccessLevel,
  type ApiEndpoint,
  type HttpMethod,
} from "@/lib/documentation/backend-catalog";
import {
  requestContracts,
  type ApiRequestContract,
} from "@/lib/documentation/request-contracts";

type AccessFilter = "all" | AccessLevel;

type RequestHeader = {
  name: string;
  value: string;
  required: boolean;
  description: string;
  curlValue?: string;
};

type PathParameter = {
  name: string;
  type: string;
  description: string;
};

const accessFilters: Array<{ value: AccessFilter; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "public", label: "Públicos" },
  { value: "authenticated", label: "Autenticados" },
  { value: "admin", label: "ADMIN" },
  { value: "contextual", label: "Contextuais" },
];

const methodStyles: Record<HttpMethod, string> = {
  GET: "border-sky-200 bg-sky-50 text-sky-700",
  POST: "border-emerald-200 bg-emerald-50 text-emerald-700",
  PUT: "border-amber-200 bg-amber-50 text-amber-700",
  PATCH: "border-violet-200 bg-violet-50 text-violet-700",
  DELETE: "border-rose-200 bg-rose-50 text-rose-700",
};

const accessStyles: Record<AccessLevel, string> = {
  public: "border-emerald-200 bg-emerald-50 text-emerald-700",
  authenticated: "border-slate-200 bg-slate-50 text-slate-600",
  admin: "border-orange-200 bg-orange-50 text-orange-700",
  contextual: "border-teal-200 bg-teal-50 text-teal-700",
};

const clientAwareAuthPaths = new Set([
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/challenge/verify",
  "/api/auth/refresh",
  "/api/auth/logout",
]);

const pathParameterDescriptions: Record<string, string> = {
  activityId: "ULID da atividade",
  contextId: "ULID do recurso usado como contexto",
  contextType: "Tipo do contexto, por exemplo LESSON",
  contractId: "ULID do contrato",
  fileId: "ULID do arquivo",
  guardianPersonId: "ULID da pessoa responsável",
  learnerId: "ULID do aprendiz",
  lessonId: "ULID da aula",
  organizationId: "ULID da organização",
  resource: "Recurso de busca aceito pelo catálogo do backend",
  roleId: "Identificador short do papel",
  submissionId: "ULID da entrega",
  userId: "ULID do usuário",
};

function requestContract(endpoint: ApiEndpoint): ApiRequestContract | undefined {
  return endpoint.request ? requestContracts[endpoint.request] : undefined;
}

function requestHeaders(endpoint: ApiEndpoint): RequestHeader[] {
  const binaryResponse = endpoint.response.startsWith("Resource");
  const headers: RequestHeader[] = [
    {
      name: "Accept",
      value: binaryResponse ? "application/octet-stream" : "application/json",
      required: false,
      description: binaryResponse
        ? "O tipo real do arquivo também pode ser negociado."
        : "Formato padrão das respostas da API.",
    },
  ];

  if (endpoint.access !== "public") {
    headers.push({
      name: "Authorization",
      value: "Bearer <access_token>",
      required: true,
      description: "JWT de acesso emitido após a verificação do desafio.",
    });
  }

  if (endpoint.contentType === "application/json") {
    headers.push({
      name: "Content-Type",
      value: "application/json",
      required: true,
      description: "O corpo deve ser enviado como JSON UTF-8.",
    });
  }

  if (endpoint.contentType === "multipart/form-data") {
    headers.push({
      name: "Content-Type",
      value: "multipart/form-data; boundary=<automático>",
      required: true,
      description: "Deixe o cliente HTTP gerar o boundary; no curl, use --form.",
    });
  }

  if (clientAwareAuthPaths.has(endpoint.path)) {
    headers.push({
      name: "X-Client-Type",
      value: "web | mobile",
      curlValue: "web",
      required: false,
      description: "Padrão: web. Define se o refresh token usa cookie ou corpo.",
    });
  }

  if (endpoint.path === "/api/auth/refresh" || endpoint.path === "/api/auth/logout") {
    headers.push({
      name: "Cookie",
      value: "refresh_token=<refresh_token>",
      required: false,
      description: "Alternativa usada pelo cliente web ao refreshToken no corpo.",
    });
  }

  return headers;
}

function pathParameters(path: string): PathParameter[] {
  return [...path.matchAll(/\{([^}]+)\}/g)].map((match) => {
    const [rawName, rawType] = match[1].split(":").map((part) => part.trim());
    const isShort = rawType === "short" || rawName === "roleId";

    return {
      name: rawName,
      type: isShort ? "short" : rawName === "resource" || rawName === "contextType" ? "string" : "ULID",
      description:
        pathParameterDescriptions[rawName] ??
        (isShort ? "Identificador numérico do catálogo" : "ULID do recurso"),
    };
  });
}

function examplePath(path: string) {
  return path.replace(/\{([^}]+)\}/g, (_, token: string) => {
    const [name, rawType] = token.split(":").map((part) => part.trim());
    if (rawType === "short" || name === "roleId") return "1";
    if (name === "resource") return "people";
    if (name === "contextType") return "LESSON";
    return "01K5X3M8Y7ABCD1234EFGH5678";
  });
}

function exampleQuery(endpoint: ApiEndpoint) {
  const parameters = endpoint.parameters?.join(" ").toLowerCase() ?? "";
  if (!parameters) return "";

  const query: string[] = [];
  if (parameters.includes("q —")) query.push("q=maria");
  if (parameters.includes("startdate")) query.push("startDate=2026-09-01", "endDate=2026-09-30");
  if (parameters.includes("learnerid")) query.push("learnerId=01K5X3M8Y7ABCD1234EFGH5680");
  if (parameters.includes("organizationid")) query.push("organizationId=01K5X3M8Y7ABCD1234EFGH5681");
  if (parameters.includes("activecontractsonly")) query.push("activeContractsOnly=true");
  if (parameters.includes("personid")) query.push("personId=01K5X3M8Y7ABCD1234EFGH5678");
  if (parameters.includes("persontype")) query.push("personType=LEARNER");
  if (parameters.includes("verificationstatus")) query.push("verificationStatus=VERIFIED");
  if (parameters.includes("channel")) query.push("channel=IN_APP");
  if (parameters.includes("search,")) query.push("search=maria", "status=NEW", "contactType=YOUTH_INTERESTED");
  if (parameters.includes("purpose")) query.push("purpose=selector");
  if (parameters.includes("contextid")) query.push("contextId=01K5X3M8Y7ABCD1234EFGH5678");
  if (parameters.includes("page")) query.push("page=0");
  if (parameters.includes("size")) query.push(`size=${endpoint.path.startsWith("/api/lookups/") ? 5 : 20}`);

  return query.length ? `?${query.join("&")}` : "";
}

function shellSingleQuoted(value: string) {
  return value.replaceAll("'", "'\\''");
}

function curlExample(endpoint: ApiEndpoint, contract: ApiRequestContract | undefined) {
  const lines = [
    `curl --request ${endpoint.method}`,
    `  --url 'http://localhost:8080${examplePath(endpoint.path)}${exampleQuery(endpoint)}'`,
  ];

  requestHeaders(endpoint)
    .filter((header) => header.name !== "Cookie")
    .filter(
      (header) =>
        !(endpoint.contentType === "multipart/form-data" && header.name === "Content-Type"),
    )
    .forEach((header) => {
      lines.push(`  --header '${header.name}: ${header.curlValue ?? header.value}'`);
    });

  if (contract?.parts?.length) {
    for (const part of contract.parts) {
      if (part.name === "metadata" && contract.example) {
        const metadata = shellSingleQuoted(JSON.stringify(contract.example));
        lines.push(`  --form 'metadata=${metadata};type=application/json'`);
      } else if (part.fileExample) {
        lines.push(`  --form '${part.name}=@${part.fileExample}'`);
      }
    }
  } else if (contract?.example) {
    lines.push(`  --data '${shellSingleQuoted(JSON.stringify(contract.example, null, 2))}'`);
  }

  return lines.map((line, index) => (index < lines.length - 1 ? `${line} \\` : line)).join("\n");
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function matchesSearch(endpoint: ApiEndpoint, groupName: string, query: string) {
  if (!query) return true;
  const contract = requestContract(endpoint);
  const searchable = [
    endpoint.method,
    endpoint.path,
    endpoint.summary,
    endpoint.request,
    endpoint.response,
    endpoint.note,
    groupName,
    accessLabels[endpoint.access],
    ...(endpoint.parameters ?? []),
    ...(contract?.rules ?? []),
    contract?.example ? JSON.stringify(contract.example) : undefined,
    ...(contract?.parts?.map((part) => `${part.name} ${part.contentType} ${part.description}`) ?? []),
  ]
    .filter(Boolean)
    .join(" ");

  return normalize(searchable).includes(normalize(query));
}

function EndpointRow({ endpoint }: { endpoint: ApiEndpoint }) {
  const contract = requestContract(endpoint);
  const headers = requestHeaders(endpoint);
  const routeParameters = pathParameters(endpoint.path);

  return (
    <details className="group border-b border-[var(--inat-line)] bg-white last:border-b-0 open:bg-[#fbfdfc]">
      <summary className="grid cursor-pointer list-none gap-3 px-4 py-4 transition hover:bg-[var(--inat-mist)]/55 sm:grid-cols-[5rem_minmax(0,1fr)_auto_auto] sm:items-center sm:px-5 [&::-webkit-details-marker]:hidden">
        <span
          className={`inline-flex w-fit min-w-[4.25rem] justify-center rounded border px-2 py-1 font-mono text-[0.6875rem] font-black tracking-[0.08em] ${methodStyles[endpoint.method]}`}
        >
          {endpoint.method}
        </span>

        <span className="min-w-0">
          <code className="block overflow-hidden text-ellipsis whitespace-nowrap font-mono text-xs font-semibold text-[var(--inat-ink)] sm:text-[0.8125rem]">
            {endpoint.path}
          </code>
          <span className="mt-1 block text-xs text-[var(--inat-muted)] sm:hidden">
            {endpoint.summary}
          </span>
        </span>

        <span className="hidden max-w-64 text-right text-xs text-[var(--inat-muted)] lg:block">
          {endpoint.summary}
        </span>

        <span className="flex items-center justify-between gap-2 sm:justify-end">
          <span
            className={`rounded-full border px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-[0.08em] ${accessStyles[endpoint.access]}`}
          >
            {accessLabels[endpoint.access]}
          </span>
          <Icon
            name="chevron-down"
            className="size-4 shrink-0 text-[var(--inat-muted)] transition-transform group-open:rotate-180"
          />
        </span>
      </summary>

      <div className="border-t border-[var(--inat-line)] px-4 py-5 sm:px-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,.72fr)]">
          <div>
            <p className="text-sm font-semibold text-[var(--inat-ink)]">
              {endpoint.summary}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--inat-muted)]">
              {accessDescriptions[endpoint.access]}
            </p>

            {endpoint.note ? (
              <div className="mt-4 flex gap-3 rounded-md border border-[#efd5c7] bg-[#fff7f2] p-3 text-sm leading-6 text-[#744127]">
                <Icon name="spark" className="mt-0.5 size-4 shrink-0" />
                <p>{endpoint.note}</p>
              </div>
            ) : null}

            {routeParameters.length ? (
              <div className="mt-5">
                <h4 className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-muted)]">
                  Parâmetros de rota
                </h4>
                <ul className="mt-2 grid gap-2">
                  {routeParameters.map((parameter) => (
                    <li
                      key={parameter.name}
                      className="flex gap-2 text-xs leading-5 text-[var(--inat-muted)]"
                    >
                      <span className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-[var(--inat-teal)]" />
                      <span>
                        <code className="font-mono font-semibold text-[var(--inat-ink)]">
                          {parameter.name}
                        </code>{" "}
                        <span className="text-[var(--inat-muted)]">
                          ({parameter.type}) — {parameter.description}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {endpoint.parameters?.length ? (
              <div className="mt-5">
                <h4 className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-muted)]">
                  Query parameters
                </h4>
                <ul className="mt-2 grid gap-2">
                  {endpoint.parameters.map((parameter) => (
                    <li
                      key={parameter}
                      className="flex gap-2 text-xs leading-5 text-[var(--inat-muted)]"
                    >
                      <span className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-[var(--inat-teal)]" />
                      {parameter}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <dl className="grid content-start gap-px overflow-hidden rounded-md border border-[var(--inat-line)] bg-[var(--inat-line)] text-xs">
            <div className="grid grid-cols-[6.75rem_1fr] bg-white">
              <dt className="px-3 py-2.5 font-semibold text-[var(--inat-muted)]">Autorização</dt>
              <dd className="px-3 py-2.5 font-mono font-semibold text-[var(--inat-ink)]">
                {accessLabels[endpoint.access]}
              </dd>
            </div>
            <div className="grid grid-cols-[6.75rem_1fr] bg-white">
              <dt className="px-3 py-2.5 font-semibold text-[var(--inat-muted)]">Requisição</dt>
              <dd className="break-words px-3 py-2.5 font-mono text-[var(--inat-ink)]">
                {endpoint.request ?? "Sem corpo"}
              </dd>
            </div>
            <div className="grid grid-cols-[6.75rem_1fr] bg-white">
              <dt className="px-3 py-2.5 font-semibold text-[var(--inat-muted)]">Content-Type</dt>
              <dd className="break-words px-3 py-2.5 font-mono text-[var(--inat-ink)]">
                {endpoint.contentType ?? "—"}
              </dd>
            </div>
            <div className="grid grid-cols-[6.75rem_1fr] bg-white">
              <dt className="px-3 py-2.5 font-semibold text-[var(--inat-muted)]">Resposta</dt>
              <dd className="break-words px-3 py-2.5 font-mono text-[var(--inat-ink)]">
                {endpoint.response}
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-6 border-t border-[var(--inat-line)] pt-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h4 className="text-sm font-bold text-[var(--inat-ink)]">Como consumir</h4>
              <p className="mt-1 text-xs leading-5 text-[var(--inat-muted)]">
                Cabeçalhos, corpo e exemplo executável para o ambiente local.
              </p>
            </div>
            <code className="rounded bg-[var(--inat-paper)] px-2 py-1 font-mono text-[0.6875rem] text-[var(--inat-muted)]">
              http://localhost:8080
            </code>
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <section className="min-w-0 overflow-hidden rounded-md border border-[var(--inat-line)] bg-white">
              <div className="border-b border-[var(--inat-line)] bg-[var(--inat-paper)] px-4 py-3">
                <h5 className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-muted)]">
                  Cabeçalhos da requisição
                </h5>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] border-collapse text-left text-xs">
                  <thead className="text-[var(--inat-muted)]">
                    <tr className="border-b border-[var(--inat-line)]">
                      <th className="px-4 py-2.5 font-semibold">Nome</th>
                      <th className="px-4 py-2.5 font-semibold">Valor</th>
                      <th className="px-4 py-2.5 font-semibold">Uso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {headers.map((header) => (
                      <tr
                        key={header.name}
                        className="border-b border-[var(--inat-line)] last:border-b-0"
                      >
                        <td className="px-4 py-3 align-top">
                          <code className="font-mono font-semibold text-[var(--inat-ink)]">
                            {header.name}
                          </code>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <code className="break-all font-mono text-[var(--inat-ink)]">
                            {header.value}
                          </code>
                        </td>
                        <td className="px-4 py-3 align-top leading-5 text-[var(--inat-muted)]">
                          <span
                            className={`mr-1.5 inline-flex rounded-full px-1.5 py-0.5 font-mono text-[0.5625rem] font-bold uppercase tracking-[0.06em] ${
                              header.required
                                ? "bg-[#fff0e8] text-[#9a4b25]"
                                : "bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]"
                            }`}
                          >
                            {header.required ? "obrigatório" : "opcional"}
                          </span>
                          {header.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="min-w-0 overflow-hidden rounded-md border border-[var(--inat-line)] bg-white">
              <div className="border-b border-[var(--inat-line)] bg-[var(--inat-paper)] px-4 py-3">
                <h5 className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-[var(--inat-muted)]">
                  Payload esperado
                </h5>
              </div>

              {contract?.example ? (
                <pre className="max-h-96 overflow-auto bg-[#16282a] p-4 font-mono text-xs leading-6 text-[#dceae7]">
                  <code>{JSON.stringify(contract.example, null, 2)}</code>
                </pre>
              ) : (
                <div className="px-4 py-5 text-sm leading-6 text-[var(--inat-muted)]">
                  {contract?.parts?.length
                    ? "Esta operação recebe apenas partes de arquivo no formulário multipart."
                    : "Esta operação não recebe corpo de requisição."}
                </div>
              )}

              {contract?.parts?.length ? (
                <div className="border-t border-[var(--inat-line)] px-4 py-4">
                  <h6 className="text-xs font-bold text-[var(--inat-ink)]">Partes multipart</h6>
                  <ul className="mt-2 grid gap-2">
                    {contract.parts.map((part) => (
                      <li key={part.name} className="text-xs leading-5 text-[var(--inat-muted)]">
                        <code className="font-mono font-semibold text-[var(--inat-ink)]">
                          {part.name}
                        </code>{" "}
                        <span className="font-mono text-[0.625rem]">({part.contentType})</span>
                        {part.required ? " — obrigatório. " : " — opcional. "}
                        {part.description}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {contract?.rules.length ? (
                <div className="border-t border-[var(--inat-line)] px-4 py-4">
                  <h6 className="text-xs font-bold text-[var(--inat-ink)]">Campos e validações</h6>
                  <ul className="mt-2 grid gap-2">
                    {contract.rules.map((rule) => (
                      <li
                        key={rule}
                        className="flex gap-2 text-xs leading-5 text-[var(--inat-muted)]"
                      >
                        <span className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-[var(--inat-clay)]" />
                        {rule}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className="min-w-0 overflow-hidden rounded-md border border-white/10 bg-[#16282a] xl:col-span-2">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <h5 className="font-mono text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-white/48">
                  Exemplo com curl
                </h5>
                <span className="font-mono text-[0.625rem] text-white/38">bash</span>
              </div>
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-6 text-[#dceae7]">
                <code>{curlExample(endpoint, contract)}</code>
              </pre>
            </section>
          </div>
        </div>
      </div>
    </details>
  );
}

export function EndpointExplorer() {
  const [query, setQuery] = useState("");
  const [access, setAccess] = useState<AccessFilter>("all");
  const [activeGroup, setActiveGroup] = useState("all");

  const filteredGroups = useMemo(
    () =>
      apiGroups
        .filter((group) => activeGroup === "all" || group.id === activeGroup)
        .map((group) => ({
          ...group,
          endpoints: group.endpoints.filter(
            (item) =>
              (access === "all" || item.access === access) &&
              matchesSearch(item, group.name, query.trim()),
          ),
        }))
        .filter((group) => group.endpoints.length > 0),
    [access, activeGroup, query],
  );

  const visibleCount = filteredGroups.reduce(
    (total, group) => total + group.endpoints.length,
    0,
  );
  const hasFilters = query || access !== "all" || activeGroup !== "all";

  const clearFilters = () => {
    setQuery("");
    setAccess("all");
    setActiveGroup("all");
  };

  return (
    <div className="mt-10">
      <div className="rounded-lg border border-[var(--inat-line)] bg-white p-4 shadow-[0_24px_70px_-55px_rgba(32,52,54,.65)] sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <label className="block">
            <span className="mb-2 block text-xs font-bold text-[var(--inat-ink)]">
              Pesquisar na API
            </span>
            <span className="relative block">
              <Icon
                name="search"
                className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[var(--inat-muted)]"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ex.: frequência, /api/lessons, multipart..."
                className="portal-field min-h-12 w-full bg-white pl-10 pr-4 text-sm"
              />
            </span>
          </label>

          <div>
            <span className="mb-2 block text-xs font-bold text-[var(--inat-ink)]">
              Nível de acesso
            </span>
            <div className="flex flex-wrap gap-2" aria-label="Filtrar pelo nível de acesso">
              {accessFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setAccess(filter.value)}
                  aria-pressed={access === filter.value}
                  className={`min-h-10 rounded border px-3 text-xs font-bold transition ${
                    access === filter.value
                      ? "border-[var(--inat-ink)] bg-[var(--inat-ink)] text-white"
                      : "border-[var(--inat-line-strong)] bg-white text-[var(--inat-muted)] hover:border-[var(--inat-teal)] hover:text-[var(--inat-ink)]"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-[var(--inat-line)] pt-4">
          <div className="flex gap-2 overflow-x-auto pb-2" aria-label="Filtrar por domínio">
            <button
              type="button"
              onClick={() => setActiveGroup("all")}
              aria-pressed={activeGroup === "all"}
              className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                activeGroup === "all"
                  ? "border-[var(--inat-teal)] bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]"
                  : "border-[var(--inat-line)] text-[var(--inat-muted)] hover:border-[var(--inat-line-strong)]"
              }`}
            >
              Todos os domínios
            </button>
            {apiGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setActiveGroup(group.id)}
                aria-pressed={activeGroup === group.id}
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                  activeGroup === group.id
                    ? "border-[var(--inat-teal)] bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]"
                    : "border-[var(--inat-line)] text-[var(--inat-muted)] hover:border-[var(--inat-line-strong)]"
                }`}
              >
                {group.name}
                <span className="ml-1.5 opacity-60">{group.endpoints.length}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--inat-muted)]">
        <p aria-live="polite">
          <strong className="font-semibold text-[var(--inat-ink)]">{visibleCount}</strong>{" "}
          {visibleCount === 1 ? "operação encontrada" : "operações encontradas"}
        </p>
        {hasFilters ? (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 font-semibold text-[var(--inat-teal-dark)] hover:underline"
          >
            <Icon name="close" className="size-3.5" />
            Limpar filtros
          </button>
        ) : null}
      </div>

      {filteredGroups.length ? (
        <div className="mt-5 grid gap-7">
          {filteredGroups.map((group) => (
            <section key={group.id} aria-labelledby={`api-group-${group.id}`}>
              <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3
                    id={`api-group-${group.id}`}
                    className="text-lg font-bold tracking-[-0.02em] text-[var(--inat-ink)]"
                  >
                    {group.name}
                  </h3>
                  <p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--inat-muted)]">
                    {group.description}
                  </p>
                </div>
                <span className="font-mono text-[0.6875rem] font-semibold text-[var(--inat-muted)]">
                  {group.endpoints.length} {group.endpoints.length === 1 ? "operação" : "operações"}
                </span>
              </div>

              <div className="overflow-hidden rounded-lg border border-[var(--inat-line)] shadow-[0_18px_50px_-45px_rgba(32,52,54,.6)]">
                {group.endpoints.map((item) => (
                  <EndpointRow key={`${item.method}-${item.path}`} endpoint={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-5 rounded-lg border border-dashed border-[var(--inat-line-strong)] bg-white px-6 py-14 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-[var(--inat-mist)] text-[var(--inat-teal-dark)]">
            <Icon name="search" className="size-5" />
          </span>
          <h3 className="mt-4 font-semibold text-[var(--inat-ink)]">Nenhuma operação encontrada</h3>
          <p className="mt-1 text-sm text-[var(--inat-muted)]">
            Ajuste o termo, o domínio ou o nível de acesso.
          </p>
          <button
            type="button"
            onClick={clearFilters}
            className="portal-button portal-button-secondary mt-5"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  );
}

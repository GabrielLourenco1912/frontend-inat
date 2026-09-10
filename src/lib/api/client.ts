import type { ApiFieldError, ApiResponse } from "@/lib/api/contracts";

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: unknown = null,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown | FormData;
};

function requestInit(options: ApiRequestOptions): RequestInit {
  const body = options.body;
  const formData = body instanceof FormData;
  return {
    method: options.method ?? "GET",
    headers:
      body === undefined || formData
        ? undefined
        : { "Content-Type": "application/json" },
    body:
      body === undefined
        ? undefined
        : formData
          ? body
          : JSON.stringify(body),
  };
}

async function fetchWithSession(url: string, options: ApiRequestOptions) {
  let response = await fetch(url, requestInit(options));

  if (response.status === 401 && url.startsWith("/api/backend/")) {
    const refreshed = await fetch("/api/auth/refresh", { method: "POST" }).catch(
      () => null,
    );
    if (refreshed?.ok) response = await fetch(url, requestInit(options));
  }

  return response;
}

export async function apiRequest<T>(
  url: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  let response: Response;

  try {
    response = await fetchWithSession(url, options);
  } catch {
    throw new ApiRequestError(0, "Serviço indisponível");
  }

  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok) {
    throw new ApiRequestError(
      response.status,
      payload?.message ?? "Não foi possível concluir a solicitação.",
      payload?.data,
    );
  }

  if (!payload || !("data" in payload)) {
    throw new ApiRequestError(
      502,
      "O serviço respondeu em um formato inesperado.",
    );
  }

  return payload.data;
}

export function postJson<T>(url: string, body?: unknown) {
  return apiRequest<T>(url, { method: "POST", body });
}

export function putJson<T>(url: string, body: unknown) {
  return apiRequest<T>(url, { method: "PUT", body });
}

export function patchJson<T>(url: string, body?: unknown) {
  return apiRequest<T>(url, { method: "PATCH", body });
}

export function deleteResource(url: string) {
  return apiRequest<null>(url, { method: "DELETE" });
}

export async function downloadResource(url: string) {
  const response = await fetchWithSession(url, { method: "GET" });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;
    throw new ApiRequestError(
      response.status,
      payload?.message ?? "Não foi possível baixar o arquivo.",
      payload?.data,
    );
  }
  return {
    blob: await response.blob(),
    contentDisposition: response.headers.get("content-disposition"),
  };
}

function isFieldErrorList(value: unknown): value is ApiFieldError[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as ApiFieldError).field === "string" &&
        typeof (item as ApiFieldError).message === "string",
    )
  );
}

export function authErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiRequestError)) {
    return fallback;
  }

  if (error.status === 0 || error.status >= 500) {
    return error.status === 503
      ? "Não foi possível enviar o e-mail agora. Tente novamente em instantes."
      : "O serviço de autenticação está indisponível. Tente novamente em instantes.";
  }

  const normalizedMessage = error.message.toLowerCase();

  if (normalizedMessage.includes("invalid credentials")) {
    return "E-mail ou senha inválidos.";
  }
  if (normalizedMessage.includes("invalid or expired authentication code")) {
    return "O código é inválido ou expirou. Solicite um novo código para continuar.";
  }
  if (normalizedMessage.includes("person record")) {
    return "Não encontramos uma pessoa cadastrada com esse e-mail. Confirme o endereço com a equipe do INAT.";
  }
  if (normalizedMessage.includes("already linked to a user")) {
    return "Essa pessoa já possui uma conta de acesso.";
  }
  if (normalizedMessage.includes("email already in use")) {
    return "Esse e-mail já está sendo utilizado por outra conta.";
  }
  if (normalizedMessage.includes("active person")) {
    return "A pessoa vinculada a esse e-mail não está ativa. Procure a equipe do INAT.";
  }
  if (normalizedMessage.includes("password reset is unavailable")) {
    return "Não foi possível recuperar a senha dessa conta. Confirme o e-mail ou procure a equipe do INAT.";
  }

  if (isFieldErrorList(error.details)) {
    const field = error.details[0]?.field;
    const fieldMessages: Record<string, string> = {
      name: "Revise o nome informado.",
      email: "Informe um e-mail válido.",
      password: "A senha deve ter ao menos 8 caracteres e no máximo 72 bytes.",
      newPassword: "A nova senha deve ter ao menos 8 caracteres e no máximo 72 bytes.",
      regulationAccepted: "É necessário aceitar o regulamento para criar a conta.",
      regulationAcceptedAt: "Marque novamente o aceite do regulamento.",
      code: "Informe o código de seis dígitos enviado por e-mail.",
    };

    return (field && fieldMessages[field]) || "Revise os dados informados.";
  }

  if (error.status === 401) {
    return "Não foi possível validar suas credenciais.";
  }

  return fallback;
}

export function requestErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiRequestError)) return fallback;
  if (error.status === 0 || error.status === 503) {
    return "O backend está indisponível. Tente novamente em instantes.";
  }
  if (error.status === 400) return "Revise os campos informados.";
  if (error.status === 403) return "Seu perfil não permite concluir esta ação.";
  if (error.status === 404) return "O registro relacionado não foi encontrado.";
  if (error.status === 409) return "A operação conflita com um registro já existente.";
  if (error.status === 422) return error.message || "A regra de negócio não permite esta operação.";
  return fallback;
}

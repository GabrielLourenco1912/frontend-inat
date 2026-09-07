import { NextResponse, type NextRequest } from "next/server";
import { mockApiGet, mockMutationData } from "@/mocks/backend-adapter";

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

function envelope(data: unknown, message = "Operação mock concluída") {
  return {
    timestamp: new Date().toISOString(),
    status: "OK",
    message,
    data,
  };
}

async function mockBody(request: NextRequest) {
  if (!request.headers.get("content-type")?.includes("application/json")) return null;
  const value = await request.json().catch(() => null);
  return typeof value === "object" && value !== null
    ? value as Record<string, unknown>
    : null;
}

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  if (!path.length || path[0] === "auth") {
    return NextResponse.json(envelope(null, "Recurso mock não encontrado"), { status: 404 });
  }

  const method = request.method.toUpperCase();
  if (method === "POST" && path.length === 1 && path[0] === "users") {
    return NextResponse.json(
      envelope(null, "A criação direta de usuário não é exposta pelo frontend"),
      { status: 405, headers: { Allow: "GET" } },
    );
  }

  const apiPath = `/api/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`;
  if (method === "GET") {
    if (path.at(-1) === "content") {
      return new NextResponse("Arquivo de demonstração da branch develop-mock.\n", {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": 'attachment; filename="arquivo-mock.txt"',
        },
      });
    }

    const result = mockApiGet(apiPath);
    return NextResponse.json(
      envelope(result.data, result.message ?? "Dados mock carregados"),
      { status: result.status },
    );
  }

  const data = mockMutationData(apiPath, method, await mockBody(request));
  return NextResponse.json(envelope(data));
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

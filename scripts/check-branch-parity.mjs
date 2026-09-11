import { execFileSync } from "node:child_process";

// Deliberately narrow: UI, policies, fixtures, tests and docs must all be identical.
const runtimeFiles = new Set([
  "src/app/api/backend/[...path]/route.ts",
  "src/lib/api/server.ts",
  "src/lib/auth/session.ts",
  "src/proxy.ts",
]);
const [realRef = "develop", mockRef = "develop-mock"] = process.argv.slice(2);
const git = (...args) => execFileSync("git", args, { encoding: "utf8" });

try {
  for (const ref of [realRef, mockRef]) git("rev-parse", "--verify", `${ref}^{commit}`);
  const changed = git("diff", "--name-only", realRef, mockRef, "--").trim().split("\n").filter(Boolean);
  const unexpected = changed.filter((file) => !runtimeFiles.has(file));
  if (unexpected.length) throw new Error(`Arquivos compartilhados divergentes:\n${unexpected.join("\n")}`);

  const realFiles = git("ls-tree", "-r", "--name-only", realRef, "--", "src").trim().split("\n");
  for (const file of realFiles.filter((file) => /\.[cm]?[jt]sx?$/.test(file) && !file.startsWith("src/mocks/"))) {
    const source = git("show", `${realRef}:${file}`);
    if (/["'][^"'\n]*\bmocks\//.test(source)) throw new Error(`Integração real importa mocks: ${file}`);
  }
  const realServer = git("show", `${realRef}:src/lib/api/server.ts`);
  const realSession = git("show", `${realRef}:src/lib/auth/session.ts`);
  const realRoute = git("show", `${realRef}:src/app/api/backend/[...path]/route.ts`);
  const realProxy = git("show", `${realRef}:src/proxy.ts`);
  if (![realServer, realSession, realRoute].every((source) => source.includes("backendFetch") && source.includes("ACCESS_TOKEN_COOKIE")) || !realProxy.includes("isAccessTokenUsable")) {
    throw new Error("As fronteiras de autenticação e backend da branch real precisam ser revisadas.");
  }
  console.log(`Paridade confirmada: ${realRef} e ${mockRef} compartilham todos os arquivos, exceto ${changed.length} adaptadores de execução permitidos.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

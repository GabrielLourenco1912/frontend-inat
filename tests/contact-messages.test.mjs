import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("landing contact form posts through the public BFF route", () => {
  const form = source("src/components/landing/Contact.tsx");
  const route = source("src/app/api/contact-messages/route.ts");

  assert.match(form, /postJson<ContactMessage>\("\/api\/contact-messages", body\)/);
  assert.match(form, /contactType: String\(fields\.get\("contactType"\)\)/);
  assert.match(route, /backendFetch\("\/api\/contact-messages"/);
  assert.match(route, /export async function POST/);
  assert.doesNotMatch(route, /export async function GET/);
});

test("contact type selector submits backend enum values", () => {
  const selector = source("src/components/landing/ContactTypeSelect.tsx");

  for (const value of [
    "YOUTH_INTERESTED",
    "COMPANY",
    "FAMILY_OR_GUARDIAN",
    "OTHER",
  ]) {
    assert.match(selector, new RegExp(`value: "${value}"`));
  }
});

test("contact inbox is restricted in navigation and at page entry", () => {
  const navigation = source("src/components/shell/PortalShell.tsx");
  const listPage = source("src/app/sistema/administracao/mensagens/page.tsx");
  const detailPage = source(
    "src/app/sistema/administracao/mensagens/[messageId]/page.tsx",
  );

  assert.match(navigation, /Mensagens de contato[^\n]+adminOnly: true/);
  assert.match(navigation, /!item\.adminOnly \|\| hasRole\(actor, "ADMIN"\)/);
  assert.match(listPage, /requireCapability\("administration:read"\)/);
  assert.match(detailPage, /requireCapability\("administration:read"\)/);
});

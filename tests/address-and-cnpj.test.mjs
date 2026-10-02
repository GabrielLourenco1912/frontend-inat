import assert from "node:assert/strict";
import { test } from "node:test";
import { loader, elements } from "./support/source-loader.mjs";

const load = loader({});
const { addressFrom, paranaCityOption, paranaCityOptions } = load("@/lib/inputs/address");
const { cnpjCharacters, formatMaskedInput } = load("@/lib/inputs/masks");

function addressForm() {
  const form = new FormData();
  for (const [name, value] of Object.entries({
    postalCode: "83252-000", street: " Rua João Teixeira ", streetNumber: " 1257 a ",
    addressLine2: " Casa 2 ", district: " Vila Bela ", city: "paranagua", stateCode: "SC", countryCode: "US",
  })) form.set(name, value);
  return form;
}

test("a lista local contém os 399 municípios e resolve o nome oficial sem exigir acentos", () => {
  assert.equal(paranaCityOptions.length, 399);
  assert.equal(new Set(paranaCityOptions.map((option) => option.id)).size, 399);
  assert.deepEqual(paranaCityOption(" paranagua "), { id: "PARANAGUÁ", label: "Paranaguá" });
  assert.equal(paranaCityOption("sao jose dos pinhais").id, "SÃO JOSÉ DOS PINHAIS");
  assert.equal(paranaCityOption("Florianópolis"), undefined);
});

test("o endereço enviado usa o padrão do seed e fixa PR/BR mesmo com outros valores no formulário", () => {
  const form = addressForm();
  assert.deepEqual(addressFrom(form), {
    postalCode: "83252000", street: "RUA JOÃO TEIXEIRA", streetNumber: "1257 A",
    addressLine2: "CASA 2", district: "VILA BELA", city: "PARANAGUÁ", stateCode: "PR", countryCode: "BR",
  });
  form.set("addressLine2", " ");
  assert.equal(addressFrom(form).addressLine2, null);
  for (const city of ["", "Cidade inexistente", "Florianópolis"]) {
    form.set("city", city);
    assert.throws(() => addressFrom(form), /Selecione uma cidade do Paraná/);
  }
});

test("o formulário compartilhado preserva a cidade na edição e apresenta UF e país fixos", () => {
  const { AddressFields } = load("@/components/portal/AddressFields");
  const { SearchSelect } = load("@/components/design-system/SearchSelect");
  const view = elements(AddressFields({ address: { city: "Paranagua", stateCode: "SC", countryCode: "US" } }));
  const city = view.find((element) => element.type === SearchSelect);
  assert.equal(city.props.initialOption.id, "PARANAGUÁ");
  assert.equal(city.props.options.length, 399);
  assert.equal(city.props.required, true);
  for (const [name, value] of [["stateCode", "PR"], ["countryCode", "BR"]]) {
    const input = view.find((element) => element.props.name === name);
    assert.equal(input.props.value, value);
    assert.equal(input.props.readOnly, true);
    assert.equal(input.props.disabled, undefined);
  }
});

test("o seletor local pesquisa, pagina e exige uma opção selecionada sem consultar a API", () => {
  const states = [];
  let cursor = 0;
  let validity = "";
  const requests = [];
  const selectLoad = loader({
    react: {
      useId: () => "city-list",
      useRef: () => ({ current: { setCustomValidity: (value) => { validity = value; }, focus() {} } }),
      useEffect: (effect) => effect(),
      useState: (initial) => {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (next) => { states[index] = typeof next === "function" ? next(states[index]) : next; }];
      },
    },
    "@/lib/api/client": { apiRequest: async (url) => { requests.push(url); }, requestErrorMessage: (error) => error.message },
  });
  const { SearchSelect } = selectLoad("@/components/design-system/SearchSelect");
  const render = () => { cursor = 0; return elements(SearchSelect({ name: "city", label: "Cidade", required: true, options: paranaCityOptions })); };
  const input = (view) => view.find((element) => element.props.role === "combobox");
  input(render()).props.onFocus();
  const firstPage = render().filter((element) => element.props.role === "option");
  assert.equal(firstPage.length, 5);
  render().find((element) => element.props["aria-label"] === "Próximos resultados").props.onClick();
  assert.equal(render().filter((element) => element.props.role === "option").length, 5);
  assert.notEqual(render().find((element) => element.props.role === "option").props.children, firstPage[0].props.children);
  input(render()).props.onChange({ target: { value: "paranagua" } });
  const results = render().filter((element) => element.props.role === "option");
  assert.equal(results.length, 1);
  assert.equal(results[0].props.children, "Paranaguá");
  assert.ok(validity);
  input(render()).props.onKeyDown({ key: "Enter", preventDefault() {} });
  assert.equal(render().find((element) => element.props.name === "city").props.value, "PARANAGUÁ");
  assert.equal(validity, "");
  render().find((element) => element.props["aria-label"] === "Limpar Cidade").props.onClick();
  input(render()).props.onChange({ target: { value: "Cidade inexistente" } });
  assert.equal(render().find((element) => element.props.name === "city").props.value, "");
  assert.equal(render().filter((element) => element.props.role === "option").length, 0);
  assert.ok(validity);
  assert.deepEqual(requests, []);
});

function formLoader() {
  return loader({
    "next/navigation": { useRouter: () => ({ refresh() {} }) },
    react: { useState: (initial) => [initial, () => {}] },
  });
}

test("criação e edição de organizações enviam CNPJ alfanumérico e nomes padronizados", () => {
  const formLoad = formLoader();
  const { OrganizationCreator } = formLoad("@/components/portal/ResourceCreators");
  const { OrganizationEditor } = formLoad("@/components/portal/EntityEditors");
  const form = addressForm();
  for (const [name, value] of Object.entries({
    legalName: " Empresa Árvore Ltda ", tradeName: " Escola Árvore ", taxId: "12.abc.345/01de-35",
    contactEmail: "Contato@Exemplo.test", phoneNumber: "(41) 99999-9999", status: "ACTIVE",
  })) form.set(name, value);
  form.append("organizationTypes", "EMPLOYER");
  form.append("organizationTypes", "SCHOOL");
  for (const modal of [OrganizationCreator(), OrganizationEditor({ organization: { id: "org", address: {} }, hasContracts: false, requiredTypes: [] })]) {
    const body = modal.props.children(() => {}).props.build(form);
    assert.equal(body.legalName, "EMPRESA ÁRVORE LTDA");
    assert.equal(body.tradeName, "ESCOLA ÁRVORE");
    assert.equal(body.taxId, "12ABC34501DE35");
    assert.equal(body.contactEmail, "Contato@Exemplo.test");
    assert.deepEqual(body.organizationTypes, ["EMPLOYER", "SCHOOL"]);
    assert.deepEqual(body.address, addressFrom(form));
  }
});

test("pessoas, edição e onboarding usam o mesmo endereço e mantêm o padrão dos nomes pessoais", () => {
  const formLoad = formLoader();
  const { PersonCreator, PersonActions, LearnerOnboardingCreator, CohortCreator } = formLoad("@/components/portal/ResourceCreators");
  const form = addressForm();
  for (const [name, value] of Object.entries({ fullName: " João Aprendiz ", contactEmail: "Joao@Exemplo.test", relationshipType: " mãe ", guardianPersonId: "guardian-id" })) form.set(name, value);
  const person = { id: "person-id", fullName: "João Aprendiz", personTypes: ["LEARNER"], address: {} };
  const editing = elements(PersonActions({ person, learner: null })).find((element) => element.props.title === "Editar pessoa");
  for (const modal of [PersonCreator(), editing, LearnerOnboardingCreator()]) {
    const body = modal.props.children(() => {}).props.build(form);
    const submittedPerson = body.person ?? body;
    assert.deepEqual(submittedPerson.address, addressFrom(form));
    assert.equal(submittedPerson.fullName, "João Aprendiz");
    assert.equal(submittedPerson.contactEmail, "Joao@Exemplo.test");
    if (body.guardians) assert.equal(body.guardians[0].relationshipType, "MÃE");
  }
  form.set("code", " turma_segunda ");
  form.set("name", " Turma de segunda ");
  form.set("shiftCode", " manha ");
  const cohort = CohortCreator().props.children(() => {}).props.build(form);
  assert.equal(cohort.code, "TURMA_SEGUNDA");
  assert.equal(cohort.name, "Turma de segunda");
  assert.equal(cohort.shiftCode, "MANHA");
});

test("a máscara de CNPJ mantém letras, normaliza maiúsculas e exige os dois dígitos finais", () => {
  assert.equal(formatMaskedInput("cnpj", "12abc34501de35"), "12.ABC.345/01DE-35");
  assert.equal(cnpjCharacters("12.abc.345/01de-35"), "12ABC34501DE35");
  let value;
  const inputLoad = loader({ react: { useState: (initial) => [value ??= initial(), (next) => { value = next; }] } });
  const { MaskedInput } = inputLoad("@/components/design-system/MaskedInput");
  const input = () => MaskedInput({ name: "taxId", mask: "cnpj" });
  input().props.onChange({ target: { value: "12abc34501de35" } });
  assert.equal(value, "12.ABC.345/01DE-35");
  assert.equal(input().props.inputMode, "text");
  const pattern = new RegExp(`^(?:${input().props.pattern})$`, "v");
  assert.ok(pattern.test(value));
  assert.ok(pattern.test("12.345.678/0001-95"));
  assert.ok(!pattern.test("12.ABC.345/01DE-AB"));
  const { maskTaxId } = load("@/lib/api/format");
  assert.equal(maskTaxId("12abc34501de35"), "12.ABC.345/01DE-35");
});

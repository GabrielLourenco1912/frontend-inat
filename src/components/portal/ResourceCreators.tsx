"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Icon } from "@/components/design-system/Icon";
import { deleteResource, postJson, putJson, requestErrorMessage } from "@/lib/api/client";
import type {
  Cohort,
  CohortStatus,
  ContractStatus,
  Learner,
  LessonStatus,
  Organization,
  OrganizationType,
  Person,
  RecordStatus,
} from "@/lib/api/domain-contracts";

type ModalProps = {
  title: string;
  trigger: string;
  children: (close: () => void) => ReactNode;
  disabled?: boolean;
  icon?: "plus" | "edit";
};

function CreatorModal({ title, trigger, children, disabled, icon = "plus" }: ModalProps) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} disabled={disabled} className="portal-button portal-button-primary disabled:cursor-not-allowed disabled:opacity-50"><Icon name={icon} className="size-4" />{trigger}</button>
    {open ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true"><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-[var(--inat-line)] bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--inat-line)] bg-white px-5 py-4"><h2 className="text-lg font-semibold">{title}</h2><button type="button" onClick={() => setOpen(false)} className="text-xl" aria-label="Fechar">×</button></div>{children(() => setOpen(false))}</div></div> : null}
  </>;
}

function AddressFields({ address }: { address?: Person["address"] }) {
  return <fieldset className="grid gap-4 border border-[var(--inat-line)] p-4 sm:grid-cols-2"><legend className="px-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">Endereço obrigatório</legend><label><span className="portal-label">CEP</span><input name="postalCode" defaultValue={address?.postalCode ?? ""} inputMode="numeric" pattern="[0-9]{8}" maxLength={8} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Logradouro</span><input name="street" defaultValue={address?.street ?? ""} maxLength={150} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Número</span><input name="streetNumber" defaultValue={address?.streetNumber ?? ""} maxLength={20} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Complemento</span><input name="addressLine2" defaultValue={address?.addressLine2 ?? ""} maxLength={100} className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Bairro</span><input name="district" defaultValue={address?.district ?? ""} maxLength={100} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Cidade</span><input name="city" defaultValue={address?.city ?? ""} maxLength={100} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">UF</span><input name="stateCode" defaultValue={address?.stateCode ?? ""} pattern="[A-Za-z]{2}" maxLength={2} className="portal-field mt-2 h-10 w-full px-3 uppercase" required /></label><label><span className="portal-label">País</span><input name="countryCode" defaultValue={address?.countryCode ?? "BR"} pattern="[A-Za-z]{2}" maxLength={2} className="portal-field mt-2 h-10 w-full px-3 uppercase" required /></label></fieldset>;
}

function addressFrom(form: FormData) {
  return {
    postalCode: String(form.get("postalCode") ?? "").replace(/\D/g, ""),
    street: String(form.get("street") ?? "").trim(),
    streetNumber: String(form.get("streetNumber") ?? "").trim(),
    addressLine2: String(form.get("addressLine2") ?? "").trim() || null,
    district: String(form.get("district") ?? "").trim(),
    city: String(form.get("city") ?? "").trim(),
    stateCode: String(form.get("stateCode") ?? "").toUpperCase(),
    countryCode: String(form.get("countryCode") ?? "BR").toUpperCase(),
  };
}

function PersonFields({ person }: { person?: Person }) {
  return <div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="portal-label">Nome completo</span><input name="fullName" defaultValue={person?.fullName ?? ""} maxLength={150} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">CPF</span><input name="taxId" defaultValue={person?.taxId ?? ""} inputMode="numeric" pattern="[0-9]{11}" maxLength={11} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Nascimento</span><input name="birthDate" defaultValue={person?.birthDate ?? ""} type="date" className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Situação da pessoa</span><select name="personStatus" defaultValue={person?.status ?? "ACTIVE"} className="portal-field mt-2 h-10 w-full px-3"><option value="ACTIVE">Ativa</option><option value="INACTIVE">Inativa</option><option value="SUSPENDED">Suspensa</option></select></label><label><span className="portal-label">E-mail de contato</span><input name="contactEmail" defaultValue={person?.contactEmail ?? ""} type="email" maxLength={254} className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Telefone</span><input name="phoneNumber" defaultValue={person?.phoneNumber ?? ""} maxLength={20} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Gênero (opcional)</span><input name="gender" defaultValue={person?.gender ?? ""} maxLength={30} className="portal-field mt-2 h-10 w-full px-3" /></label></div>;
}

function personFrom(form: FormData) {
  return {
    address: addressFrom(form),
    fullName: String(form.get("fullName") ?? "").trim(),
    taxId: String(form.get("taxId") ?? "").replace(/\D/g, ""),
    contactEmail: String(form.get("contactEmail") ?? "").trim() || null,
    phoneNumber: String(form.get("phoneNumber") ?? "").trim(),
    birthDate: String(form.get("birthDate") ?? ""),
    gender: String(form.get("gender") ?? "").trim() || null,
    status: String(form.get("personStatus") ?? "ACTIVE") as RecordStatus,
  };
}

function FormFooter({ close, saving, label }: { close: () => void; saving: boolean; label: string }) {
  return <div className="flex justify-end gap-2 border-t border-[var(--inat-line)] px-5 py-4"><button type="button" onClick={close} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving} className="portal-button portal-button-clay disabled:opacity-50">{saving ? "Salvando..." : label}</button></div>;
}

export function PersonCreator() {
  const router = useRouter();
  return <CreatorModal title="Cadastrar pessoa" trigger="Nova pessoa">{(close) => <RequestForm close={close} success={() => router.refresh()} endpoint="/api/backend/people" successLabel="Cadastrar pessoa" build={(form) => personFrom(form)}><PersonFields /><AddressFields /></RequestForm>}</CreatorModal>;
}

export function PersonActions({ person }: { person: Person }) {
  const router = useRouter();
  async function remove() {
    if (!window.confirm(`Excluir o cadastro de ${person.fullName}?`)) return;
    try {
      await deleteResource(`/api/backend/people/${encodeURIComponent(person.id)}`);
      router.push("/sistema/pessoas");
      router.refresh();
    } catch (error) {
      window.alert(requestErrorMessage(error, "Não foi possível excluir a pessoa."));
    }
  }
  return <div className="flex flex-wrap gap-2"><CreatorModal title="Editar pessoa" trigger="Editar" icon="edit">{(close) => <RequestForm close={close} success={() => router.refresh()} endpoint={`/api/backend/people/${encodeURIComponent(person.id)}`} method="PUT" successLabel="Salvar alterações" build={(form) => personFrom(form)}><PersonFields person={person} /><AddressFields address={person.address} /></RequestForm>}</CreatorModal><button type="button" onClick={remove} className="portal-button portal-button-quiet text-rose-700"><Icon name="trash" className="size-4" />Excluir</button></div>;
}

function RequestForm({ close, success, endpoint, successLabel, build, children, method = "POST" }: { close: () => void; success: () => void; endpoint: string; successLabel: string; build: (form: FormData) => unknown; children: ReactNode; method?: "POST" | "PUT" }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    setError("");
    try {
      const body = build(new FormData(formElement));
      if (method === "PUT") await putJson<unknown>(endpoint, body);
      else await postJson<unknown>(endpoint, body);
      close();
      success();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível salvar o cadastro."));
    } finally {
      setSaving(false);
    }
  }
  return <form onSubmit={submit}>{error ? <p role="alert" className="mx-5 mt-5 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}<div className="grid gap-5 p-5">{children}</div><FormFooter close={close} saving={saving} label={successLabel} /></form>;
}

export function OrganizationCreator({ organizations }: { organizations: Organization[] }) {
  const router = useRouter();
  return <CreatorModal title="Cadastrar organização" trigger="Nova organização">{(close) => <RequestForm close={close} success={() => router.refresh()} endpoint="/api/backend/organizations" successLabel="Cadastrar organização" build={(form) => ({
    parentOrganizationId: String(form.get("parentOrganizationId") ?? "") || null,
    address: addressFrom(form),
    organizationType: String(form.get("organizationType")) as OrganizationType,
    legalName: String(form.get("legalName") ?? "").trim(),
    tradeName: String(form.get("tradeName") ?? "").trim() || null,
    taxId: String(form.get("taxId") ?? "").replace(/\D/g, ""),
    contactEmail: String(form.get("contactEmail") ?? "").trim(),
    phoneNumber: String(form.get("phoneNumber") ?? "").trim(),
    status: String(form.get("status")) as RecordStatus,
  })}><div className="grid gap-4 sm:grid-cols-2"><label><span className="portal-label">Tipo</span><select name="organizationType" defaultValue="EMPLOYER" className="portal-field mt-2 h-10 w-full px-3"><option value="EMPLOYER">Empresa</option><option value="SCHOOL">Escola</option></select></label><label><span className="portal-label">Situação</span><select name="status" defaultValue="ACTIVE" className="portal-field mt-2 h-10 w-full px-3"><option value="ACTIVE">Ativa</option><option value="INACTIVE">Inativa</option><option value="SUSPENDED">Suspensa</option></select></label><label className="sm:col-span-2"><span className="portal-label">Razão social</span><input name="legalName" maxLength={180} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Nome fantasia</span><input name="tradeName" maxLength={180} className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">CNPJ</span><input name="taxId" inputMode="numeric" pattern="[0-9]{14}" maxLength={14} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">E-mail</span><input name="contactEmail" type="email" maxLength={254} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Telefone</span><input name="phoneNumber" maxLength={20} className="portal-field mt-2 h-10 w-full px-3" required /></label><label className="sm:col-span-2"><span className="portal-label">Organização superior (opcional)</span><select name="parentOrganizationId" defaultValue="" className="portal-field mt-2 h-10 w-full px-3"><option value="">Nenhuma</option>{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.tradeName || organization.legalName}</option>)}</select></label></div><AddressFields /></RequestForm>}</CreatorModal>;
}

export function LearnerOnboardingCreator({ guardianPeople }: { guardianPeople: Person[] }) {
  const router = useRouter();
  return <CreatorModal title="Cadastrar aprendiz" trigger="Novo aprendiz">{(close) => <RequestForm close={close} success={() => router.refresh()} endpoint="/api/backend/learner-onboardings" successLabel="Cadastrar aprendiz" build={(form) => {
    const guardianPersonId = String(form.get("guardianPersonId") ?? "");
    return {
      person: personFrom(form),
      learner: {
        registrationNumber: String(form.get("registrationNumber") ?? "").trim(),
        hasCompletedHighSchool: form.get("hasCompletedHighSchool") === "on",
        status: String(form.get("status")) as RecordStatus,
      },
      guardians: guardianPersonId ? [{ guardianPersonId, relationshipType: String(form.get("relationshipType") ?? "").trim(), legalGuardian: form.get("legalGuardian") === "on", primaryContact: form.get("primaryContact") === "on" }] : [],
    };
  }}><div className="border-l-[3px] border-[var(--inat-teal)] bg-[var(--inat-mist)] p-4 text-sm leading-6">Pessoa, endereço e perfil de aprendiz são enviados em uma única operação. A conta de acesso continua sendo criada apenas pelo cadastro público.</div><PersonFields /><AddressFields /><fieldset className="grid gap-4 border border-[var(--inat-line)] p-4 sm:grid-cols-2"><legend className="px-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">Perfil de aprendiz</legend><label><span className="portal-label">Matrícula</span><input name="registrationNumber" maxLength={30} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Situação</span><select name="status" defaultValue="ACTIVE" className="portal-field mt-2 h-10 w-full px-3"><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option><option value="SUSPENDED">Suspenso</option></select></label><label className="flex items-center gap-2 text-sm sm:col-span-2"><input name="hasCompletedHighSchool" type="checkbox" />Ensino médio concluído</label></fieldset><fieldset className="grid gap-4 border border-[var(--inat-line)] p-4 sm:grid-cols-2"><legend className="px-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">Responsável já cadastrado (opcional)</legend><label className="sm:col-span-2"><span className="portal-label">Pessoa responsável</span><select name="guardianPersonId" defaultValue="" className="portal-field mt-2 h-10 w-full px-3"><option value="">Nenhum nesta etapa</option>{guardianPeople.map((person) => <option key={person.id} value={person.id}>{person.fullName} · {person.taxId}</option>)}</select></label><label><span className="portal-label">Relação</span><input name="relationshipType" maxLength={30} defaultValue="Responsável" className="portal-field mt-2 h-10 w-full px-3" /></label><div className="grid content-end gap-2 pb-1"><label className="flex items-center gap-2 text-sm"><input name="legalGuardian" type="checkbox" defaultChecked />Responsável legal</label><label className="flex items-center gap-2 text-sm"><input name="primaryContact" type="checkbox" defaultChecked />Contato principal</label></div></fieldset></RequestForm>}</CreatorModal>;
}

export function CohortCreator() {
  const router = useRouter();
  return <CreatorModal title="Criar turma" trigger="Nova turma">{(close) => <RequestForm close={close} success={() => router.refresh()} endpoint="/api/backend/cohorts" successLabel="Criar turma" build={(form) => ({ code: String(form.get("code") ?? "").trim(), name: String(form.get("name") ?? "").trim(), defaultWeekday: Number(form.get("defaultWeekday")), shiftCode: String(form.get("shiftCode") ?? "").trim(), startDate: String(form.get("startDate") ?? ""), endDate: String(form.get("endDate") ?? "") || null, status: String(form.get("status")) as CohortStatus })}><div className="grid gap-4 sm:grid-cols-2"><label><span className="portal-label">Código</span><input name="code" maxLength={40} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Nome</span><input name="name" maxLength={120} className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Dia padrão</span><select name="defaultWeekday" defaultValue="1" className="portal-field mt-2 h-10 w-full px-3"><option value="1">Segunda</option><option value="2">Terça</option><option value="3">Quarta</option><option value="4">Quinta</option><option value="5">Sexta</option><option value="6">Sábado</option><option value="7">Domingo</option></select></label><label><span className="portal-label">Turno</span><input name="shiftCode" maxLength={20} placeholder="MANHA" className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Início</span><input name="startDate" type="date" className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Término (opcional)</span><input name="endDate" type="date" className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Situação</span><select name="status" defaultValue="PLANNED" className="portal-field mt-2 h-10 w-full px-3"><option value="PLANNED">Planejada</option><option value="ACTIVE">Ativa</option><option value="COMPLETED">Concluída</option><option value="CANCELLED">Cancelada</option></select></label></div></RequestForm>}</CreatorModal>;
}

export function ContractCreator({ learners, people, organizations }: { learners: Learner[]; people: Person[]; organizations: Organization[] }) {
  const router = useRouter();
  const peopleMap = new Map(people.map((person) => [person.id, person.fullName]));
  const employers = organizations.filter((item) => item.organizationType === "EMPLOYER");
  const schools = organizations.filter((item) => item.organizationType === "SCHOOL");
  return <CreatorModal title="Criar contrato" trigger="Novo contrato" disabled={!learners.length || !employers.length}>{(close) => <RequestForm close={close} success={() => router.refresh()} endpoint="/api/backend/contracts" successLabel="Criar contrato" build={(form) => ({ learnerId: String(form.get("learnerId")), employerId: String(form.get("employerId")), schoolId: String(form.get("schoolId") ?? "") || null, startDate: String(form.get("startDate") ?? ""), endDate: String(form.get("endDate") ?? "") || null, monthlySalary: Number(String(form.get("monthlySalary") ?? "").replace(",", ".")), weeklyWorkloadMinutes: Number(form.get("weeklyWorkloadMinutes")), status: String(form.get("status")) as ContractStatus })}><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="portal-label">Aprendiz</span><select name="learnerId" defaultValue="" className="portal-field mt-2 h-10 w-full px-3" required><option value="" disabled>Selecione</option>{learners.map((learner) => <option key={learner.id} value={learner.id}>{peopleMap.get(learner.personId) || learner.registrationNumber}</option>)}</select></label><label><span className="portal-label">Empresa</span><select name="employerId" defaultValue="" className="portal-field mt-2 h-10 w-full px-3" required><option value="" disabled>Selecione</option>{employers.map((item) => <option key={item.id} value={item.id}>{item.tradeName || item.legalName}</option>)}</select></label><label><span className="portal-label">Escola (quando aplicável)</span><select name="schoolId" defaultValue="" className="portal-field mt-2 h-10 w-full px-3"><option value="">Sem escola</option>{schools.map((item) => <option key={item.id} value={item.id}>{item.tradeName || item.legalName}</option>)}</select></label><label><span className="portal-label">Início</span><input name="startDate" type="date" className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Término (opcional)</span><input name="endDate" type="date" className="portal-field mt-2 h-10 w-full px-3" /></label><label><span className="portal-label">Salário mensal</span><input name="monthlySalary" inputMode="decimal" placeholder="1069,48" className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Carga semanal (minutos)</span><input name="weeklyWorkloadMinutes" type="number" min="1" max="10080" defaultValue="1200" className="portal-field mt-2 h-10 w-full px-3" required /></label><label><span className="portal-label">Situação</span><select name="status" defaultValue="DRAFT" className="portal-field mt-2 h-10 w-full px-3"><option value="DRAFT">Rascunho</option><option value="ACTIVE">Ativo</option><option value="SUSPENDED">Suspenso</option><option value="ENDED">Encerrado</option><option value="CANCELLED">Cancelado</option></select></label></div></RequestForm>}</CreatorModal>;
}

export function LessonCreator({ cohorts, people }: { cohorts: Cohort[]; people: Person[] }) {
  const router = useRouter();
  return (
    <CreatorModal
      title="Planejar aula"
      trigger="Nova aula"
      disabled={!cohorts.length || !people.length}
    >
      {(close) => (
        <RequestForm
          close={close}
          success={() => router.refresh()}
          endpoint="/api/backend/lessons"
          successLabel="Criar aula"
          build={(form) => ({
            cohortId: String(form.get("cohortId")),
            instructorPersonId: String(form.get("instructorPersonId")),
            title: String(form.get("title") ?? "").trim(),
            startsAt: new Date(String(form.get("startsAt"))).toISOString(),
            endsAt: new Date(String(form.get("endsAt"))).toISOString(),
            deliveryMode: String(form.get("deliveryMode")),
            room: String(form.get("room") ?? "").trim() || null,
            meetingUrl: String(form.get("meetingUrl") ?? "").trim() || null,
            externalLessonUrl:
              String(form.get("externalLessonUrl") ?? "").trim() || null,
            status: String(form.get("status")) as LessonStatus,
          })}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2">
              <span className="portal-label">Título</span>
              <input
                name="title"
                maxLength={160}
                className="portal-field mt-2 h-10 w-full px-3"
                required
              />
            </label>
            <label>
              <span className="portal-label">Turma</span>
              <select
                name="cohortId"
                defaultValue=""
                className="portal-field mt-2 h-10 w-full px-3"
                required
              >
                <option value="" disabled>Selecione</option>
                {cohorts.map((cohort) => (
                  <option key={cohort.id} value={cohort.id}>
                    {cohort.code} · {cohort.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="portal-label">Instrutor (pessoa)</span>
              <select
                name="instructorPersonId"
                defaultValue=""
                className="portal-field mt-2 h-10 w-full px-3"
                required
              >
                <option value="" disabled>Selecione</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.fullName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="portal-label">Início</span>
              <input
                name="startsAt"
                type="datetime-local"
                className="portal-field mt-2 h-10 w-full px-3"
                required
              />
            </label>
            <label>
              <span className="portal-label">Término</span>
              <input
                name="endsAt"
                type="datetime-local"
                className="portal-field mt-2 h-10 w-full px-3"
                required
              />
            </label>
            <label>
              <span className="portal-label">Modalidade</span>
              <select
                name="deliveryMode"
                defaultValue="ONSITE"
                className="portal-field mt-2 h-10 w-full px-3"
              >
                <option value="ONSITE">Presencial</option>
                <option value="ONLINE">Online</option>
              </select>
            </label>
            <label>
              <span className="portal-label">Situação</span>
              <select
                name="status"
                defaultValue="SCHEDULED"
                className="portal-field mt-2 h-10 w-full px-3"
              >
                <option value="SCHEDULED">Agendada</option>
                <option value="IN_PROGRESS">Em andamento</option>
                <option value="COMPLETED">Concluída</option>
                <option value="CANCELLED">Cancelada</option>
              </select>
            </label>
            <label>
              <span className="portal-label">Sala (presencial)</span>
              <input
                name="room"
                maxLength={80}
                className="portal-field mt-2 h-10 w-full px-3"
              />
            </label>
            <label>
              <span className="portal-label">Link (online)</span>
              <input
                name="meetingUrl"
                type="url"
                maxLength={512}
                className="portal-field mt-2 h-10 w-full px-3"
              />
            </label>
            <label className="sm:col-span-2">
              <span className="portal-label">
                URL da aula externa (opcional)
              </span>
              <input
                name="externalLessonUrl"
                type="url"
                pattern="https?://.+"
                title="Use uma URL iniciada por http:// ou https://"
                maxLength={2048}
                placeholder="https://www.youtube.com/watch?v=..."
                className="portal-field mt-2 h-10 w-full px-3"
              />
              <span className="mt-1.5 block text-xs text-[var(--inat-muted)]">
                YouTube, Vimeo, Dailymotion, arquivo de vídeo ou outro player público.
              </span>
            </label>
          </div>
        </RequestForm>
      )}
    </CreatorModal>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { SearchSelect } from "@/components/design-system/SearchSelect";
import { Icon } from "@/components/design-system/Icon";
import { putJson, requestErrorMessage } from "@/lib/api/client";
import type { Contract, Learner, Organization, RecordStatus } from "@/lib/api/domain-contracts";

function EditorModal({ title, children }: { title: string; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" onClick={() => setOpen(true)} className="portal-button portal-button-secondary h-9"><Icon name="edit" className="size-4" />Editar</button>
    {open ? <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto border border-[var(--inat-line)] bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--inat-line)] bg-white px-5 py-4"><h2 className="text-lg font-semibold">{title}</h2><button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="text-xl">×</button></div>
        {children(() => setOpen(false))}
      </div>
    </div> : null}
  </>;
}

function EditForm({ endpoint, build, close, children }: { endpoint: string; build: (form: FormData) => unknown; close: () => void; children: ReactNode }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    try { await putJson(endpoint, build(new FormData(event.currentTarget))); close(); router.refresh(); }
    catch (cause) { setError(requestErrorMessage(cause, "Não foi possível salvar as alterações.")); }
    finally { setSaving(false); }
  }
  return <form onSubmit={submit}>{error ? <p role="alert" className="mx-5 mt-5 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}<div className="grid gap-5 p-5">{children}</div><div className="flex justify-end gap-2 border-t border-[var(--inat-line)] px-5 py-4"><button type="button" onClick={close} className="portal-button portal-button-secondary">Cancelar</button><button type="submit" disabled={saving} className="portal-button portal-button-primary disabled:opacity-50">{saving ? "Salvando..." : "Salvar alterações"}</button></div></form>;
}

export function LearnerEditor({ learner }: { learner: Learner }) {
  return <EditorModal title="Editar aprendiz">{(close) => <EditForm close={close} endpoint={`/api/backend/learners/${encodeURIComponent(learner.id)}`} build={(form) => ({
    personId: learner.personId,
    registrationNumber: String(form.get("registrationNumber") ?? "").trim(),
    hasCompletedHighSchool: form.get("hasCompletedHighSchool") === "on",
    status: String(form.get("status")) as RecordStatus,
  })}>
    <div className="grid gap-4 sm:grid-cols-2">
      <label><span className="portal-label">Matrícula</span><input name="registrationNumber" defaultValue={learner.registrationNumber} maxLength={30} required className="portal-field mt-2 h-10 w-full px-3" /></label>
      <label><span className="portal-label">Situação</span><select name="status" defaultValue={learner.status} className="portal-field mt-2 h-10 w-full px-3"><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option><option value="SUSPENDED">Suspenso</option></select></label>
      <label className="flex items-center gap-2 text-sm sm:col-span-2"><input name="hasCompletedHighSchool" type="checkbox" defaultChecked={learner.hasCompletedHighSchool} />Ensino médio concluído</label>
      <p className="text-xs leading-5 text-[var(--inat-muted)] sm:col-span-2">A pessoa vinculada é preservada. A inativação continua sujeita aos contratos vigentes.</p>
    </div>
  </EditForm>}</EditorModal>;
}

function AddressInputs({ organization }: { organization: Organization }) {
  const address = organization.address;
  return <fieldset className="grid gap-4 border border-[var(--inat-line)] p-4 sm:grid-cols-2"><legend className="px-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--inat-muted)]">Endereço</legend>
    <label><span className="portal-label">CEP</span><input name="postalCode" defaultValue={address.postalCode} inputMode="numeric" pattern="[0-9]{8}" required className="portal-field mt-2 h-10 w-full px-3" /></label>
    <label><span className="portal-label">Logradouro</span><input name="street" defaultValue={address.street} required className="portal-field mt-2 h-10 w-full px-3" /></label>
    <label><span className="portal-label">Número</span><input name="streetNumber" defaultValue={address.streetNumber} required className="portal-field mt-2 h-10 w-full px-3" /></label>
    <label><span className="portal-label">Complemento</span><input name="addressLine2" defaultValue={address.addressLine2 ?? ""} className="portal-field mt-2 h-10 w-full px-3" /></label>
    <label><span className="portal-label">Bairro</span><input name="district" defaultValue={address.district} required className="portal-field mt-2 h-10 w-full px-3" /></label>
    <label><span className="portal-label">Cidade</span><input name="city" defaultValue={address.city} required className="portal-field mt-2 h-10 w-full px-3" /></label>
    <label><span className="portal-label">UF</span><input name="stateCode" defaultValue={address.stateCode} pattern="[A-Za-z]{2}" maxLength={2} required className="portal-field mt-2 h-10 w-full px-3 uppercase" /></label>
    <label><span className="portal-label">País</span><input name="countryCode" defaultValue={address.countryCode} pattern="[A-Za-z]{2}" maxLength={2} required className="portal-field mt-2 h-10 w-full px-3 uppercase" /></label>
  </fieldset>;
}

export function OrganizationEditor({ organization, hasContracts }: { organization: Organization; hasContracts: boolean }) {
  return <EditorModal title="Editar organização">{(close) => <EditForm close={close} endpoint={`/api/backend/organizations/${encodeURIComponent(organization.id)}`} build={(form) => ({
    parentOrganizationId: String(form.get("parentOrganizationId") ?? "") || null,
    address: { postalCode: String(form.get("postalCode") ?? "").replace(/\D/g, ""), street: String(form.get("street") ?? "").trim(), streetNumber: String(form.get("streetNumber") ?? "").trim(), addressLine2: String(form.get("addressLine2") ?? "").trim() || null, district: String(form.get("district") ?? "").trim(), city: String(form.get("city") ?? "").trim(), stateCode: String(form.get("stateCode") ?? "").toUpperCase(), countryCode: String(form.get("countryCode") ?? "BR").toUpperCase() },
    organizationType: String(form.get("organizationType")), legalName: String(form.get("legalName") ?? "").trim(), tradeName: String(form.get("tradeName") ?? "").trim() || null, taxId: String(form.get("taxId") ?? "").replace(/\D/g, ""), contactEmail: String(form.get("contactEmail") ?? "").trim(), phoneNumber: String(form.get("phoneNumber") ?? "").trim(), attendanceClosingDay: form.get("attendanceClosingDay") ? Number(form.get("attendanceClosingDay")) : null, status: String(form.get("status")),
  })}>
    <div className="grid gap-4 sm:grid-cols-2">
      <label><span className="portal-label">Tipo</span><select name="organizationType" defaultValue={organization.organizationType} disabled={hasContracts} className="portal-field mt-2 h-10 w-full px-3 disabled:bg-[var(--inat-paper)]"><option value="EMPLOYER">Empresa</option><option value="SCHOOL">Escola</option></select>{hasContracts ? <input type="hidden" name="organizationType" value={organization.organizationType} /> : null}</label>
      <label><span className="portal-label">Situação</span><select name="status" defaultValue={organization.status} className="portal-field mt-2 h-10 w-full px-3"><option value="ACTIVE">Ativa</option><option value="INACTIVE">Inativa</option><option value="SUSPENDED">Suspensa</option></select></label>
      <label className="sm:col-span-2"><span className="portal-label">Razão social</span><input name="legalName" defaultValue={organization.legalName} required className="portal-field mt-2 h-10 w-full px-3" /></label>
      <label><span className="portal-label">Nome fantasia</span><input name="tradeName" defaultValue={organization.tradeName ?? ""} className="portal-field mt-2 h-10 w-full px-3" /></label>
      <label><span className="portal-label">CNPJ</span><input name="taxId" defaultValue={organization.taxId} disabled={hasContracts} pattern="[0-9]{14}" required className="portal-field mt-2 h-10 w-full px-3 disabled:bg-[var(--inat-paper)]" />{hasContracts ? <input type="hidden" name="taxId" value={organization.taxId} /> : null}</label>
      <label><span className="portal-label">E-mail</span><input name="contactEmail" defaultValue={organization.contactEmail} type="email" required className="portal-field mt-2 h-10 w-full px-3" /></label>
      <label><span className="portal-label">Telefone</span><input name="phoneNumber" defaultValue={organization.phoneNumber} required className="portal-field mt-2 h-10 w-full px-3" /></label>
      <label><span className="portal-label">Fechamento de ponto</span><input name="attendanceClosingDay" defaultValue={organization.attendanceClosingDay ?? ""} type="number" min="1" max="31" className="portal-field mt-2 h-10 w-full px-3" /></label>
      <label className="sm:col-span-2"><span className="portal-label">Organização superior</span><SearchSelect name="parentOrganizationId" label="Organização superior" endpoint={`/api/backend/lookups/organizations?purpose=parent&excludeId=${encodeURIComponent(organization.id)}`} initialOption={organization.parentOrganizationId ? { id: organization.parentOrganizationId, label: organization.parentOrganizationId } : undefined} /></label>
      {hasContracts ? <p className="text-xs text-[var(--inat-muted)] sm:col-span-2">Tipo e CNPJ ficam preservados porque a organização já participa de contratos.</p> : null}
    </div>
    <AddressInputs organization={organization} />
  </EditForm>}</EditorModal>;
}

export function ContractEditor({ contract, learnerName, organizationNames }: { contract: Contract; learnerName: string; organizationNames: Record<string, string> }) {
  if (contract.status === "ENDED" || contract.status === "CANCELLED") return null;
  const draft = contract.status === "DRAFT";
  return <EditorModal title="Editar contrato">{(close) => <EditForm close={close} endpoint={`/api/backend/contracts/${encodeURIComponent(contract.id)}`} build={(form) => ({
    learnerId: String(form.get("learnerId")), employerId: String(form.get("employerId")), schoolId: String(form.get("schoolId") ?? "") || null, startDate: String(form.get("startDate")), endDate: String(form.get("endDate") ?? "") || null, monthlySalary: Number(String(form.get("monthlySalary") ?? "").replace(",", ".")), weeklyWorkloadMinutes: Math.round(Number(form.get("weeklyWorkloadHours")) * 60), status: contract.status, statusReason: null,
  })}>
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="sm:col-span-2"><span className="portal-label">Aprendiz</span><SearchSelect name="learnerId" label="Aprendiz" endpoint="/api/backend/lookups/learners?purpose=contract-learner" required disabled={!draft} initialOption={{ id: contract.learnerId, label: learnerName }} />{!draft ? <input type="hidden" name="learnerId" value={contract.learnerId} /> : null}</label>
      <label><span className="portal-label">Empresa</span><SearchSelect name="employerId" label="Empresa" endpoint="/api/backend/lookups/organizations?purpose=employer" required disabled={!draft} initialOption={{ id: contract.employerId, label: organizationNames[contract.employerId] ?? contract.employerId }} />{!draft ? <input type="hidden" name="employerId" value={contract.employerId} /> : null}</label>
      <label><span className="portal-label">Escola</span><SearchSelect name="schoolId" label="Escola" endpoint="/api/backend/lookups/organizations?purpose=school" initialOption={contract.schoolId ? { id: contract.schoolId, label: organizationNames[contract.schoolId] ?? contract.schoolId } : undefined} /></label>
      <label><span className="portal-label">Início</span><input name="startDate" type="date" defaultValue={contract.startDate} disabled={!draft} required className="portal-field mt-2 h-10 w-full px-3 disabled:bg-[var(--inat-paper)]" />{!draft ? <input type="hidden" name="startDate" value={contract.startDate} /> : null}</label>
      <label><span className="portal-label">Término</span><input name="endDate" type="date" defaultValue={contract.endDate ?? ""} className="portal-field mt-2 h-10 w-full px-3" /></label>
      <label><span className="portal-label">Salário mensal</span><input name="monthlySalary" inputMode="decimal" defaultValue={contract.monthlySalary} required className="portal-field mt-2 h-10 w-full px-3" /></label>
      <label><span className="portal-label">Carga semanal (horas)</span><input name="weeklyWorkloadHours" type="number" min="1" max="168" step="0.5" defaultValue={contract.weeklyWorkloadMinutes / 60} required className="portal-field mt-2 h-10 w-full px-3" /></label>
      <p className="text-xs leading-5 text-[var(--inat-muted)] sm:col-span-2">A escola pode ser alterada durante a vigência e cada troca é registrada. Para aprendizes menores sem ensino médio concluído, ela continua obrigatória.</p>
    </div>
  </EditForm>}</EditorModal>;
}

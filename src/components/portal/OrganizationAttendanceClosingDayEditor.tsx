"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Organization } from "@/lib/api/domain-contracts";
import { putJson, requestErrorMessage } from "@/lib/api/client";

export function OrganizationAttendanceClosingDayEditor({
  organization,
}: {
  organization: Organization;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = String(form.get("attendanceClosingDay") ?? "");
    setSaving(true);
    setError("");
    try {
      await putJson<Organization>(
        `/api/backend/organizations/${encodeURIComponent(organization.id)}`,
        {
          parentOrganizationId: organization.parentOrganizationId,
          address: {
            postalCode: organization.address.postalCode,
            street: organization.address.street,
            streetNumber: organization.address.streetNumber,
            addressLine2: organization.address.addressLine2,
            district: organization.address.district,
            city: organization.address.city,
            stateCode: organization.address.stateCode,
            countryCode: organization.address.countryCode,
          },
          organizationType: organization.organizationType,
          legalName: organization.legalName,
          tradeName: organization.tradeName,
          taxId: organization.taxId,
          contactEmail: organization.contactEmail,
          phoneNumber: organization.phoneNumber,
          attendanceClosingDay: value ? Number(value) : null,
          status: organization.status,
        },
      );
      setOpen(false);
      router.refresh();
    } catch (requestError) {
      setError(requestErrorMessage(requestError, "Não foi possível salvar o fechamento de ponto."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="portal-button portal-button-secondary h-9">
        Editar fechamento
      </button>
      {open ? (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-[var(--inat-ink)]/70 p-4" role="dialog" aria-modal="true" aria-labelledby="attendance-closing-title">
          <form onSubmit={submit} className="w-full max-w-md border border-[var(--inat-line)] bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h2 id="attendance-closing-title" className="text-lg font-semibold">Fechamento de ponto</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="text-xl">×</button>
            </div>
            {error ? <p role="alert" className="mt-4 border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
            <label className="mt-5 block">
              <span className="portal-label">Dia do mês (opcional)</span>
              <input name="attendanceClosingDay" type="number" inputMode="numeric" min="1" max="31" defaultValue={organization.attendanceClosingDay ?? ""} placeholder="Sem fechamento configurado" className="portal-field mt-2 h-10 w-full px-3" />
            </label>
            <p className="mt-2 text-xs leading-5 text-[var(--inat-muted)]">
              O dia limita a geração automática de presença por entregas de atividades online. Deixe vazio para manter o comportamento sem corte.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="portal-button portal-button-secondary">Cancelar</button>
              <button type="submit" disabled={saving} className="portal-button portal-button-primary disabled:opacity-45">{saving ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}

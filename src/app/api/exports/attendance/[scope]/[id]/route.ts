import { getCurrentActor } from "@/lib/auth/session";
import { ServerApiError } from "@/lib/api/server";
import { canExportAttendance } from "@/lib/attendance/export-permissions";
import { attendanceExportData } from "@/lib/attendance/export-data";
import { attendanceWorkbook, XLSX_CONTENT_TYPE } from "@/lib/attendance/export-workbook";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ scope: string; id: string }> }) {
  const actor = await getCurrentActor();
  if (!actor) return Response.json({ message: "Entre novamente para exportar as presenças." }, { status: 401 });
  const { scope, id } = await params;
  if ((scope !== "organizations" && scope !== "learners") || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    return Response.json({ message: "Exportação não encontrada." }, { status: 404 });
  }
  if (!canExportAttendance(actor, scope)) return Response.json({ message: "Seu perfil não permite exportar estas presenças." }, { status: 403 });
  try {
    const report = await attendanceExportData(actor, scope, id);
    const buffer = await attendanceWorkbook(report);
    return new Response(new Uint8Array(buffer), { headers: {
      "Content-Type": XLSX_CONTENT_TYPE,
      "Content-Disposition": `attachment; filename="presencas-${scope === "organizations" ? "organizacao" : "aprendiz"}-${id}.xlsx"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    if (error instanceof ServerApiError) return Response.json({ message: "Não foi possível consultar os dados da exportação. Tente novamente." }, { status: error.status });
    throw error;
  }
}

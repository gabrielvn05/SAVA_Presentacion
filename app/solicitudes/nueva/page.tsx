import { requireAuth } from "@/lib/auth";
import { JustificacionWizard } from "@/components/solicitudes/JustificacionWizard";

export default async function NuevaSolicitudPage() {
  await requireAuth();
  return <JustificacionWizard />;
}

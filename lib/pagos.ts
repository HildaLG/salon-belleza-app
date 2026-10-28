import { MercadoPagoConfig, Payment } from "mercadopago";
import { supabaseServer } from "./supabase";

export async function sincronizarPago(paymentId: string) {
  const mp = new MercadoPagoConfig({
    accessToken: process.env.MP_ACCESS_TOKEN!,
  });
  const pago = await new Payment(mp).get({ id: paymentId });

  const citaId = pago.external_reference;
  if (!citaId) return { estado: "desconocido" };

  const estado = pago.status ?? "pending";
  const supabase = supabaseServer();

  await supabase
    .from("pagos")
    .update({ id_transaccion: String(pago.id), estado })
    .eq("cita_id", citaId);

  if (estado === "approved") {
    await supabase
      .from("citas")
      .update({ estado: "confirmada" })
      .eq("id", citaId)
      .eq("estado", "pendiente");
  }

  return { estado, cita_id: citaId };
}
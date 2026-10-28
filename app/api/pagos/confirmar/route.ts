import { sincronizarPago } from "../../../../lib/pagos";

export async function GET(request: Request) {
  const paymentId = new URL(request.url).searchParams.get("payment_id");
  if (!paymentId || !/^\d+$/.test(paymentId)) {
    return Response.json({ error: "Pago inválido." }, { status: 400 });
  }

  try {
    const resultado = await sincronizarPago(paymentId);
    return Response.json(resultado);
  } catch (e) {
    console.error("Error al confirmar:", e);
    return Response.json({ error: "No se pudo confirmar." }, { status: 500 });
  }
}
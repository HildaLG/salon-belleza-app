import { sincronizarPago } from "../../../../lib/pagos";

export async function POST(request: Request) {
  const url = new URL(request.url);
  let tipo = url.searchParams.get("type") ?? url.searchParams.get("topic");
  let id = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  try {
    const body = await request.json();
    tipo = body.type ?? tipo;
    id = body.data?.id ?? id;
  } catch {
    // Algunas notificaciones llegan sin cuerpo JSON
  }

  if (tipo === "payment" && id && /^\d+$/.test(String(id))) {
    try {
      await sincronizarPago(String(id));
    } catch (e) {
      console.error("Error en webhook:", e);
      return new Response("error", { status: 500 });
    }
  }

  return new Response("ok", { status: 200 });
}
import { MercadoPagoConfig, Preference } from "mercadopago";
import { supabaseServer } from "../../../../lib/supabase";

export async function POST(request: Request) {
  const { cita_id } = await request.json();
  if (!cita_id) {
    return Response.json({ error: "Falta la cita." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: cita } = await supabase
    .from("citas")
    .select("id, estado, servicio_id")
    .eq("id", cita_id)
    .single();

  if (!cita || cita.estado !== "pendiente") {
    return Response.json(
      { error: "La cita no existe o ya no está pendiente." },
      { status: 400 }
    );
  }

  const { data: servicio } = await supabase
    .from("servicios")
    .select("nombre, precio")
    .eq("id", cita.servicio_id)
    .single();

  if (!servicio) {
    return Response.json({ error: "Servicio no encontrado." }, { status: 400 });
  }

  const anticipo = Math.round(servicio.precio * 0.3 * 100) / 100;

  // Un solo registro de pago por cita
  const { data: existente } = await supabase
    .from("pagos")
    .select("id")
    .eq("cita_id", cita.id)
    .maybeSingle();

  if (existente) {
    await supabase
      .from("pagos")
      .update({ monto: anticipo, estado: "pendiente" })
      .eq("id", existente.id);
  } else {
    await supabase
      .from("pagos")
      .insert({ cita_id: cita.id, monto: anticipo });
  }

  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  const esPublica = base.startsWith("https://");

  try {
    const mp = new MercadoPagoConfig({
      accessToken: process.env.MP_ACCESS_TOKEN!,
    });
    const preferencia = await new Preference(mp).create({
      body: {
        items: [
          {
            id: String(cita.servicio_id),
            title: `Anticipo 30% - ${servicio.nombre}`,
            quantity: 1,
            unit_price: anticipo,
            currency_id: "MXN",
          },
        ],
        external_reference: cita.id,
        back_urls: {
          success: `${base}/pago/resultado`,
          failure: `${base}/pago/resultado`,
          pending: `${base}/pago/resultado`,
        },
        // Solo funcionan con una URL pública (cuando estemos en Vercel)
        ...(esPublica && {
          auto_return: "approved",
          notification_url: `${base}/api/webhook/mercadopago`,
        }),
      },
    });

    return Response.json({ init_point: preferencia.init_point });
  } catch (e) {
    console.error("Error Mercado Pago:", e);
    return Response.json(
      { error: "No se pudo iniciar el pago." },
      { status: 500 }
    );
  }
}
import { supabaseServer } from "../../../lib/supabase";
import { HORAS, ZONA, esDomingo } from "../../../lib/horarios";

export async function POST(request: Request) {
  const { servicio_id, fecha, hora, nombre, telefono, correo } =
    await request.json();

  if (!servicio_id || !fecha || !hora || !nombre?.trim() ||
      !telefono?.trim() || !correo?.trim()) {
    return Response.json({ error: "Faltan datos." }, { status: 400 });
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || !HORAS.includes(hora)) {
    return Response.json({ error: "Fecha u hora inválida." }, { status: 400 });
  }

  if (esDomingo(fecha)) {
    return Response.json({ error: "Cerramos los domingos." }, { status: 400 });
  }

  const fechaHora = new Date(`${fecha}T${hora}:00${ZONA}`);
  if (fechaHora <= new Date()) {
    return Response.json({ error: "Esa hora ya pasó." }, { status: 400 });
  }

  const supabase = supabaseServer();

  const { data: servicio } = await supabase
    .from("servicios")
    .select("id, nombre, precio")
    .eq("id", servicio_id)
    .eq("activo", true)
    .single();

  if (!servicio) {
    return Response.json({ error: "Servicio no encontrado." }, { status: 400 });
  }

  const { data: cliente, error: errCliente } = await supabase
    .from("clientes")
    .insert({
      nombre: nombre.trim(),
      telefono: telefono.trim(),
      correo: correo.trim(),
    })
    .select("id")
    .single();

  if (errCliente || !cliente) {
    return Response.json({ error: "No se pudo guardar el cliente." }, { status: 500 });
  }

  const { data: cita, error: errCita } = await supabase
    .from("citas")
    .insert({
      cliente_id: cliente.id,
      servicio_id: servicio.id,
      fecha_hora: fechaHora.toISOString(),
    })
    .select("id")
    .single();

  if (errCita || !cita) {
    if (errCita?.code === "23505") {
      return Response.json(
        { error: "Ese horario ya fue reservado. Elige otro." },
        { status: 409 }
      );
    }
    return Response.json({ error: "No se pudo crear la cita." }, { status: 500 });
  }

  return Response.json({
    cita_id: cita.id,
    servicio: servicio.nombre,
    precio: servicio.precio,
    anticipo: Math.round(servicio.precio * 0.3 * 100) / 100,
  });
}
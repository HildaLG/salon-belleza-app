import { supabaseServer } from "../../../lib/supabase";
import { esDomingo, horaMexico, ZONA } from "../../../lib/horarios";

export async function GET(request: Request) {
  const fecha = new URL(request.url).searchParams.get("fecha");

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return Response.json({ error: "Fecha inválida" }, { status: 400 });
  }

  if (esDomingo(fecha)) {
    return Response.json({ ocupadas: [], cerrado: true });
  }

  const supabase = supabaseServer();
  const { data, error } = await supabase
    .from("citas")
    .select("fecha_hora")
    .gte("fecha_hora", `${fecha}T00:00:00${ZONA}`)
    .lte("fecha_hora", `${fecha}T23:59:59${ZONA}`)
    .in("estado", ["pendiente", "confirmada"]);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const ocupadas = data.map((c) => horaMexico(c.fecha_hora));
  return Response.json({ ocupadas, cerrado: false });
}
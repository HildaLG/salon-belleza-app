"use client";

import { useEffect, useState } from "react";
import { HORAS } from "../lib/horarios";

type Servicio = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_min: number;
};

type CitaCreada = {
  cita_id: string;
  servicio: string;
  precio: number;
  anticipo: number;
};

export default function Home() {
  const [servicios, setServicios] = useState<Servicio[]>([]);
  const [servicioId, setServicioId] = useState<number | null>(null);
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [ocupadas, setOcupadas] = useState<string[]>([]);
  const [cerrado, setCerrado] = useState(false);
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [correo, setCorreo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [pagando, setPagando] = useState(false);
  const [error, setError] = useState("");
  const [citaCreada, setCitaCreada] = useState<CitaCreada | null>(null);
  const [hoy, setHoy] = useState("");

  useEffect(() => {
    // Fecha local (YYYY-MM-DD), calculada en el navegador
    setHoy(new Date().toLocaleDateString("en-CA"));
    fetch("/api/servicios")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setServicios(d));
  }, []);

  async function cambiarFecha(nuevaFecha: string) {
    setFecha(nuevaFecha);
    setHora("");
    setOcupadas([]);
    setCerrado(false);
    if (!nuevaFecha) return;
    const res = await fetch(`/api/horarios?fecha=${nuevaFecha}`);
    const data = await res.json();
    setOcupadas(data.ocupadas ?? []);
    setCerrado(Boolean(data.cerrado));
  }

  async function reservar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!servicioId || !fecha || !hora) {
      setError("Elige un servicio, una fecha y una hora.");
      return;
    }
    setEnviando(true);
    const res = await fetch("/api/citas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        servicio_id: servicioId,
        fecha,
        hora,
        nombre,
        telefono,
        correo,
      }),
    });
    const data = await res.json();
    setEnviando(false);
    if (!res.ok) {
      setError(data.error ?? "Ocurrió un error.");
      if (res.status === 409) await cambiarFecha(fecha);
      return;
    }
    setCitaCreada(data);
  }

  async function pagar() {
    if (!citaCreada) return;
    setError("");
    setPagando(true);
    const res = await fetch("/api/pagos/crear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cita_id: citaCreada.cita_id }),
    });
    const data = await res.json();
    if (!res.ok || !data.init_point) {
      setPagando(false);
      setError(data.error ?? "No se pudo iniciar el pago.");
      return;
    }
    window.location.href = data.init_point;
  }

  const inputClase =
    "w-full rounded-lg border border-rose-200 bg-white px-3 py-2 text-gray-900";

  if (citaCreada) {
    return (
      <main className="min-h-screen bg-rose-50 p-6 text-gray-900">
        <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow">
          <h1 className="text-2xl font-bold text-rose-700">
            ¡Cita registrada!
          </h1>
          <p className="mt-3">
            Servicio: <strong>{citaCreada.servicio}</strong>
          </p>
          <p>
            Fecha: {fecha} a las {hora}
          </p>
          <p>Precio: ${citaCreada.precio} MXN</p>
          <p>Anticipo (30%): ${citaCreada.anticipo} MXN</p>
          <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Tu cita está <strong>pendiente de pago</strong>. Paga el anticipo
            para confirmarla.
          </p>
          {error && <p className="mt-4 text-rose-700">{error}</p>}
          <button
            type="button"
            onClick={pagar}
            disabled={pagando}
            className="mt-6 w-full rounded-lg bg-rose-600 py-3 font-semibold text-white disabled:opacity-50"
          >
            {pagando
              ? "Abriendo Mercado Pago..."
              : `Pagar anticipo $${citaCreada.anticipo} MXN`}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-rose-50 p-6 text-gray-900">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-center text-4xl font-bold text-rose-700">
          Salón de Belleza
        </h1>
        <p className="mt-2 text-center text-gray-600">
          Reserva tu cita en línea
        </p>

        <h2 className="mt-8 text-xl font-semibold">1. Elige tu servicio</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {servicios.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServicioId(s.id)}
              className={`rounded-xl border-2 bg-white p-4 text-left ${
                servicioId === s.id ? "border-rose-600" : "border-transparent"
              }`}
            >
              <div className="font-semibold">{s.nombre}</div>
              <div className="text-sm text-gray-600">{s.descripcion}</div>
              <div className="mt-2 text-sm">
                <span className="font-bold text-rose-700">${s.precio} MXN</span>
                {" · "}
                {s.duracion_min} min
              </div>
            </button>
          ))}
        </div>

        <form onSubmit={reservar}>
          <h2 className="mt-8 text-xl font-semibold">2. Elige fecha y hora</h2>
          <input
            type="date"
            min={hoy}
            value={fecha}
            onChange={(e) => cambiarFecha(e.target.value)}
            className={`${inputClase} mt-3 max-w-xs`}
          />

          {cerrado && (
            <p className="mt-3 text-rose-700">Cerramos los domingos.</p>
          )}

          {fecha && !cerrado && (
            <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
              {HORAS.map((h) => {
                const ocupada = ocupadas.includes(h);
                return (
                  <button
                    key={h}
                    type="button"
                    disabled={ocupada}
                    onClick={() => setHora(h)}
                    className={`rounded-lg border px-2 py-2 text-sm ${
                      hora === h
                        ? "border-rose-600 bg-rose-600 text-white"
                        : "border-rose-200 bg-white"
                    } ${ocupada ? "cursor-not-allowed opacity-40 line-through" : ""}`}
                  >
                    {h}
                  </button>
                );
              })}
            </div>
          )}

          <h2 className="mt-8 text-xl font-semibold">3. Tus datos</h2>
          <div className="mt-3 grid gap-3">
            <input
              required
              placeholder="Nombre completo"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className={inputClase}
            />
            <input
              required
              type="tel"
              placeholder="Teléfono"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              className={inputClase}
            />
            <input
              required
              type="email"
              placeholder="Correo electrónico"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className={inputClase}
            />
          </div>

          {error && <p className="mt-4 text-rose-700">{error}</p>}

          <button
            type="submit"
            disabled={enviando}
            className="mt-6 w-full rounded-lg bg-rose-600 py-3 font-semibold text-white disabled:opacity-50"
          >
            {enviando ? "Reservando..." : "Reservar cita"}
          </button>
        </form>
      </div>
    </main>
  );
}
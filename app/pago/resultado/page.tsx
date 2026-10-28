"use client";

import { useEffect, useState } from "react";

export default function Resultado() {
  const [estado, setEstado] = useState("cargando");

  useEffect(() => {
    async function confirmar() {
      const p = new URLSearchParams(window.location.search);
      const paymentId = p.get("payment_id") ?? p.get("collection_id");
      if (!paymentId || paymentId === "null") {
        setEstado("sin_pago");
        return;
      }
      try {
        const res = await fetch(`/api/pagos/confirmar?payment_id=${paymentId}`);
        const data = await res.json();
        setEstado(data.estado ?? "error");
      } catch {
        setEstado("error");
      }
    }
    confirmar();
  }, []);

  const mensajes: Record<string, { titulo: string; texto: string }> = {
    cargando: { titulo: "Confirmando tu pago...", texto: "Un momento por favor." },
    approved: {
      titulo: "¡Pago aprobado!",
      texto: "Tu cita quedó confirmada. Te esperamos.",
    },
    pending: {
      titulo: "Pago pendiente",
      texto: "Estamos esperando la confirmación de tu pago.",
    },
    in_process: {
      titulo: "Pago en revisión",
      texto: "Estamos revisando tu pago. Te avisaremos pronto.",
    },
    rejected: {
      titulo: "Pago rechazado",
      texto: "No se pudo procesar el pago. Tu cita sigue pendiente.",
    },
    sin_pago: {
      titulo: "No se realizó el pago",
      texto: "Tu cita sigue pendiente de pago.",
    },
    error: {
      titulo: "No pudimos confirmar el pago",
      texto: "Intenta recargar esta página en unos segundos.",
    },
  };

  const m = mensajes[estado] ?? mensajes.error;

  return (
    <main className="min-h-screen bg-rose-50 p-6 text-gray-900">
      <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold text-rose-700">{m.titulo}</h1>
        <p className="mt-3">{m.texto}</p>
        <a
          href="/"
          className="mt-6 inline-block rounded-lg bg-rose-600 px-5 py-2 font-semibold text-white"
        >
          Volver al inicio
        </a>
      </div>
    </main>
  );
}
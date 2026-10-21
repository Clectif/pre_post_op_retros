import type { NextRequest } from "next/server";

/**
 * Pasarela hacia ahv_api.py. La tablet llama a /backend/api/... en este mismo dominio y aquí se
 * agrega el HTTP Basic, así el usuario y la contraseña de la API nunca llegan al navegador.
 * La firma de Telegram (X-Telegram-Init-Data) pasa tal cual: la sigue verificando el backend.
 */

const API_URL = (process.env.API_URL ?? "").replace(/\/+$/, "");
const API_USER = process.env.API_USER ?? "";
const API_PASSWORD = process.env.API_PASSWORD ?? "";

/** Lo único que la app de campo necesita que viaje al backend. */
const FORWARDED_HEADERS = ["content-type", "x-telegram-init-data"];

const fail = (status: number, detail: string) => Response.json({ detail }, { status });

async function forward(request: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  if (!API_URL || !API_USER) return fail(503, "Pasarela sin configurar: faltan API_URL, API_USER o API_PASSWORD.");

  const { path } = await ctx.params;
  const headers = new Headers({
    Authorization: "Basic " + Buffer.from(`${API_USER}:${API_PASSWORD}`).toString("base64"),
  });
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  try {
    const r = await fetch(`${API_URL}/${path.map(encodeURIComponent).join("/")}${request.nextUrl.search}`, {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : await request.arrayBuffer(),
      // si la tablet corta por timeout, se corta también la llamada al backend
      signal: request.signal,
      cache: "no-store",
    });
    return new Response(r.body, {
      status: r.status,
      headers: { "Content-Type": r.headers.get("content-type") ?? "application/json" },
    });
  } catch {
    // 502 es reintentable para la cola offline, igual que una caída de red
    return fail(502, "No se pudo contactar el backend.");
  }
}

export { forward as GET, forward as POST, forward as PUT };

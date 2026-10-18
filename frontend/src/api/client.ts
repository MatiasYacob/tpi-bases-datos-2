const baseUrl = (
  import.meta.env.VITE_API_URL || "http://localhost:3000/api"
).replace(/\/$/, "");
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public codigo: string,
    public campo?: string,
  ) {
    super(message);
  }
}
export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado.";
}
export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(baseUrl + path, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    throw new ApiError(
      "No se pudo conectar con la API. Comprobá que el backend esté iniciado y reintentá.",
      0,
      "RED",
    );
  }
  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      "La API devolvió una respuesta no válida.",
      response.status,
      "RESPUESTA_INVALIDA",
    );
  }
  if (!response.ok)
    throw new ApiError(
      payload.error?.mensaje || "No se pudo completar la operación.",
      response.status,
      payload.error?.codigo || "ERROR_INTERNO",
      payload.error?.campo,
    );
  return payload as T;
}
export type ListResponse<T> = {
  data: T[];
  paginacion: { pagina: number; limite: number; total: number };
};
// La UI mantiene búsqueda/paginación local; se recorren todas las páginas del servidor.
export async function readAll<T>(
  resource: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const result: T[] = [];
  for (let pagina = 1; ; pagina++) {
    const response = await apiRequest<ListResponse<T>>(
      "/" + resource + "?limite=100&pagina=" + pagina,
      { signal },
    );
    result.push(...response.data);
    if (
      result.length >= response.paginacion.total ||
      response.data.length === 0
    )
      return result;
  }
}

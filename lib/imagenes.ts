/**
 * Parsea el campo `imagenes` de Supabase (varias URLs en un solo texto).
 *
 * Formato en Supabase:
 * - Tipo: TEXT
 * - Contenido: URLs separadas por comas, sin espacios extra (o con espacios, se hace trim).
 * - Ejemplo: "https://ejemplo.com/a.jpg,https://ejemplo.com/b.jpg"
 *
 * En el dashboard de Supabase puedes editar el campo como texto;
 * para múltiples imágenes escribe las URLs separadas por coma.
 */
export function parseImagenesUrls(imagenes: string | null): string[] {
  if (!imagenes || !imagenes.trim()) return [];
  return imagenes
    .split(",")
    .map((s) => s.trim())
    .filter(
      (url) =>
        url.length > 0 &&
        (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("//"))
    );
}

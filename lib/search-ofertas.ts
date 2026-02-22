/**
 * Búsqueda en el campo ofertas: normalización de consulta y filtrado de stop words.
 */

/** Palabras vacías en español (artículos, conjunciones, preposiciones, etc.) */
const STOP_WORDS = new Set([
  "el", "la", "los", "las", "un", "una", "unos", "unas",
  "y", "e", "o", "u", "de", "del", "al", "a", "en", "con", "por", "para",
  "que", "es", "son", "está", "están", "lo", "le", "se", "te", "me", "nos", "les",
  "su", "sus", "mi", "mis", "tu", "tus", "este", "esta", "estos", "estas",
  "ese", "esa", "esos", "esas", "qué", "cómo", "cuál", "cuáles", "dónde",
  "cuando", "si", "no", "pero", "sino", "aunque", "porque", "sin", "sobre",
  "entre", "hasta", "desde", "durante", "mediante", "según", "contra",
  "hacia", "tras", "ante", "bajo", "cabe", "con", "desde", "durante",
  "excepto", "salvo", "menos", "más", "muy", "tan", "tanto", "todo", "toda",
  "todos", "todas", "algo", "alguien", "algún", "alguna", "algunos", "algunas",
  "ningún", "ninguna", "ningunos", "ningunas", "cada", "otro", "otra",
  "otros", "otras", "mismo", "misma", "mismos", "mismas", "sí", "también",
  "así", "aquí", "ahí", "allí", "entonces", "luego", "después", "ahora",
  "hoy", "ayer", "mañana", "siempre", "nunca", "jamás", "casi", "solo",
  "sola", "sólo", "sola", "además", "incluso", "inclusive", "excepto",
  "salvo", "menos", "versus", "vs", "etc", "ej", "p", "ejemplo",
]);

/** Longitud mínima de una palabra para considerarla (evitar una sola letra) */
const MIN_WORD_LEN = 2;

/**
 * Extrae términos de búsqueda desde el texto: normaliza, quita stop words y duplicados.
 */
export function queryToSearchTerms(query: string): string[] {
  const normalized = query
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "") // quitar tildes para búsqueda más flexible
    .replace(/[^\p{L}\p{N}\s]/gu, " ") // solo letras, números y espacios
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= MIN_WORD_LEN && !STOP_WORDS.has(w));
  return [...new Set(normalized)];
}

/**
 * Comprueba si el texto (p. ej. ofertas) contiene todas las palabras de terms (sin tildes, case insensitive).
 * Devuelve las palabras de terms que aparecen en el texto (para mostrar "palabras halladas").
 */
export function matchTermsInText(
  text: string | null,
  terms: string[],
): { matches: boolean; matchedWords: string[] } {
  if (!text || terms.length === 0) {
    return { matches: terms.length === 0, matchedWords: [] };
  }
  const normalizedText = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
  const matchedWords: string[] = [];
  for (const term of terms) {
    const normalizedTerm = term
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
    // Buscar como palabra completa (evitar "pan" dentro de "empanada" si se desea; aquí permitimos substring)
    if (normalizedText.includes(normalizedTerm)) {
      matchedWords.push(term);
    }
  }
  const matches = matchedWords.length === terms.length;
  return { matches, matchedWords };
}

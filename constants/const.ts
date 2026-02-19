export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = "Please login (10001)";
export const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

/** URL del documento de Términos y Condiciones para registrar sitios. Configurable con EXPO_PUBLIC_TERMINOS_URL. */
export const URL_TERMINOS_CONDICIONES =
  process.env.EXPO_PUBLIC_TERMINOS_URL ??
  "https://djxvosobflwtryenqoou.supabase.co/storage/v1/object/public/descargas/TerminosCondiciones.pdf";

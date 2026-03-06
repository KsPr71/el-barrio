import * as SQLite from "expo-sqlite";

import type { SitioRelevante } from "@/hooks/use-sitios-relevantes";
import type { TipoSitio } from "@/hooks/use-tipos-sitio";
import type { Opinion } from "@/hooks/use-opiniones";
import type { Municipio, Provincia } from "@/hooks/use-locations";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// SQLite no permite transacciones anidadas. Serializamos TODAS las escrituras.
let writeQueue: Promise<void> = Promise.resolve();
function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function isLockedError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const msg = String((e as { message?: unknown }).message ?? e);
  return msg.includes("database is locked");
}

/** Error conocido: NativeDatabase/SharedObject corrupto o liberado prematuramente */
function isSharedObjectError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const msg = String((e as { message?: unknown }).message ?? e);
  return (
    msg.includes("prepareAsync") ||
    msg.includes("SharedObject") ||
    msg.includes("java.lang.Integer")
  );
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync("por-el-barrio-cache.db");
  }
  return dbPromise;
}

function resetDb(): void {
  dbPromise = null;
}

async function ensureTables() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS sitios_relevantes_cache (
      id INTEGER PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL,
      localizacion TEXT,
      descripcion TEXT,
      imagenes TEXT,
      ofertas TEXT,
      menus TEXT,
      tipo_sitio_id INTEGER,
      direccion TEXT,
      telefono INTEGER,
      contador_opiniones INTEGER NOT NULL DEFAULT 0,
      provincia_id TEXT,
      provincia_short_name TEXT,
      municipio_id TEXT,
      promedio_puntuacion REAL NOT NULL DEFAULT 0,
      horario TEXT,
      facebook_link TEXT,
      instagram_link TEXT,
      sitio_web TEXT
    );

    CREATE TABLE IF NOT EXISTS tipos_sitio_cache (
      id INTEGER PRIMARY KEY NOT NULL,
      tipo TEXT NOT NULL,
      descripcion TEXT
    );

    CREATE TABLE IF NOT EXISTS opiniones_cache (
      id TEXT PRIMARY KEY NOT NULL,
      sitio_id INTEGER NOT NULL,
      calificacion INTEGER NOT NULL,
      comentario TEXT,
      autor_texto TEXT,
      creado_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_opiniones_cache_sitio_id
      ON opiniones_cache (sitio_id);

    CREATE TABLE IF NOT EXISTS provincia_cache (
      id TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS municipio_cache (
      id TEXT PRIMARY KEY NOT NULL,
      nombre TEXT NOT NULL,
      provincia_id TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_municipio_cache_provincia_id
      ON municipio_cache (provincia_id);
  `);

  // Migración simple: añadir columna provincia_short_name si no existe aún.
  try {
    await db.execAsync(`
      ALTER TABLE sitios_relevantes_cache
      ADD COLUMN provincia_short_name TEXT;
    `);
  } catch {
    // Ignorar error si la columna ya existe.
  }
}

export async function getCachedSitiosRelevantes(): Promise<SitioRelevante[]> {
  await ensureTables();
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: number;
    nombre: string;
    localizacion: string | null;
    descripcion: string | null;
    imagenes: string | null;
    ofertas: string | null;
    menus: string | null;
    tipo_sitio_id: number | null;
    direccion: string | null;
    telefono: number | null;
    contador_opiniones: number;
    provincia_id: string | null;
    provincia_short_name: string | null;
    municipio_id: string | null;
    promedio_puntuacion: number;
    horario: string | null;
    facebook_link: string | null;
    instagram_link: string | null;
    sitio_web: string | null;
  }>(
    `
      SELECT
        id,
        nombre,
        localizacion,
        descripcion,
        imagenes,
        ofertas,
        menus,
        tipo_sitio_id,
        direccion,
        telefono,
        contador_opiniones,
        provincia_id,
        provincia_short_name,
        municipio_id,
        promedio_puntuacion,
        horario,
        facebook_link,
        instagram_link,
        sitio_web
      FROM sitios_relevantes_cache
      ORDER BY
        tipo_sitio_id IS NULL,
        tipo_sitio_id ASC,
        promedio_puntuacion DESC,
        id ASC
    `,
  );

  return rows.map((row) => ({
    id: row.id,
    nombre: row.nombre,
    localizacion: row.localizacion,
    descripcion: row.descripcion,
    imagenes: row.imagenes,
    ofertas: row.ofertas,
    menus: row.menus ? JSON.parse(row.menus) : null,
    tipo_sitio_id: row.tipo_sitio_id,
    direccion: row.direccion,
    telefono: row.telefono,
    contador_opiniones: row.contador_opiniones,
    provincia_id: row.provincia_id,
    provincia_short_name: row.provincia_short_name,
    municipio_id: row.municipio_id,
    promedio_puntuacion: row.promedio_puntuacion,
    horario: row.horario,
    facebook_link: row.facebook_link,
    instagram_link: row.instagram_link,
    sitio_web: row.sitio_web,
  }));
}

export async function replaceCachedSitiosRelevantes(
  sitios: SitioRelevante[],
): Promise<void> {
  if (!sitios || sitios.length === 0) return;
  await enqueueWrite(async () => {
    await ensureTables();
    const db = await getDb();
    try {
      await db.execAsync("DELETE FROM sitios_relevantes_cache;");
      for (const sitio of sitios) {
        await db.runAsync(
          `
            INSERT OR REPLACE INTO sitios_relevantes_cache (
              id,
              nombre,
              localizacion,
              descripcion,
              imagenes,
              ofertas,
              menus,
              tipo_sitio_id,
              direccion,
              telefono,
              contador_opiniones,
              provincia_id,
              provincia_short_name,
              municipio_id,
              promedio_puntuacion,
              horario,
              facebook_link,
              instagram_link,
              sitio_web
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            sitio.id,
            sitio.nombre,
            sitio.localizacion,
            sitio.descripcion,
            sitio.imagenes,
            sitio.ofertas,
            sitio.menus ? JSON.stringify(sitio.menus) : null,
            sitio.tipo_sitio_id,
            sitio.direccion,
            sitio.telefono,
            sitio.contador_opiniones,
            sitio.provincia_id,
            sitio.provincia_short_name,
            sitio.municipio_id,
            sitio.promedio_puntuacion,
            sitio.horario,
            sitio.facebook_link,
            sitio.instagram_link,
            sitio.sitio_web,
          ],
        );
      }
    } catch (e) {
      if (!isLockedError(e)) {
        console.warn("[offline-sitios-db] error al guardar cache:", e);
      }
    }
  });
}

export async function getCachedSitioRelevanteById(
  id: number,
): Promise<SitioRelevante | null> {
  await ensureTables();
  const db = await getDb();
  const row = await db.getFirstAsync<{
    id: number;
    nombre: string;
    localizacion: string | null;
    descripcion: string | null;
    imagenes: string | null;
    ofertas: string | null;
    menus: string | null;
    tipo_sitio_id: number | null;
    direccion: string | null;
    telefono: number | null;
    contador_opiniones: number;
    provincia_id: string | null;
    provincia_short_name: string | null;
    municipio_id: string | null;
    promedio_puntuacion: number;
    horario: string | null;
    facebook_link: string | null;
    instagram_link: string | null;
    sitio_web: string | null;
  }>(
    `
      SELECT
        id,
        nombre,
        localizacion,
        descripcion,
        imagenes,
        ofertas,
        menus,
        tipo_sitio_id,
        direccion,
        telefono,
        contador_opiniones,
        provincia_id,
        provincia_short_name,
        municipio_id,
        promedio_puntuacion,
        horario,
        facebook_link,
        instagram_link,
        sitio_web
      FROM sitios_relevantes_cache
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );
  if (!row) return null;
  return {
    id: row.id,
    nombre: row.nombre,
    localizacion: row.localizacion,
    descripcion: row.descripcion,
    imagenes: row.imagenes,
    ofertas: row.ofertas,
    menus: row.menus ? JSON.parse(row.menus) : null,
    tipo_sitio_id: row.tipo_sitio_id,
    direccion: row.direccion,
    telefono: row.telefono,
    contador_opiniones: row.contador_opiniones,
    provincia_id: row.provincia_id,
    provincia_short_name: row.provincia_short_name,
    municipio_id: row.municipio_id,
    promedio_puntuacion: row.promedio_puntuacion,
    horario: row.horario,
    facebook_link: row.facebook_link,
    instagram_link: row.instagram_link,
    sitio_web: row.sitio_web,
  };
}

export async function getCachedTiposSitio(): Promise<TipoSitio[]> {
  await ensureTables();
  const db = await getDb();
  const rows = await db.getAllAsync<TipoSitio>(
    `SELECT id, tipo, descripcion FROM tipos_sitio_cache ORDER BY tipo ASC`,
  );
  return rows ?? [];
}

export async function replaceCachedTiposSitio(tipos: TipoSitio[]): Promise<void> {
  if (!tipos) return;
  await enqueueWrite(async () => {
    await ensureTables();
    const db = await getDb();
    try {
      await db.execAsync("DELETE FROM tipos_sitio_cache;");
      for (const t of tipos) {
        await db.runAsync(
          `INSERT OR REPLACE INTO tipos_sitio_cache (id, tipo, descripcion) VALUES (?, ?, ?)`,
          [t.id, t.tipo, t.descripcion],
        );
      }
    } catch (e) {
      if (!isLockedError(e)) {
        console.warn("[offline-sitios-db] error al guardar tipos_sitio_cache:", e);
      }
    }
  });
}

export async function getCachedOpinionesBySitioId(
  sitioId: number,
  isRetry = false,
): Promise<Opinion[]> {
  try {
    await ensureTables();
    const db = await getDb();
    const rows = await db.getAllAsync<Opinion>(
      `
      SELECT id, sitio_id, calificacion, comentario, autor_texto, creado_at
      FROM opiniones_cache
      WHERE sitio_id = ?
      ORDER BY creado_at DESC
    `,
      [sitioId],
    );
    return rows ?? [];
  } catch (e) {
    if (isSharedObjectError(e) && !isRetry) {
      resetDb();
      return getCachedOpinionesBySitioId(sitioId, true);
    }
    throw e;
  }
}

export async function replaceCachedOpinionesForSitio(
  sitioId: number,
  opiniones: Opinion[],
): Promise<void> {
  if (!opiniones) return;
  await enqueueWrite(async () => {
    await ensureTables();
    const db = await getDb();
    try {
      await db.runAsync(`DELETE FROM opiniones_cache WHERE sitio_id = ?`, [sitioId]);
      for (const o of opiniones) {
        await db.runAsync(
          `
            INSERT OR REPLACE INTO opiniones_cache (
              id, sitio_id, calificacion, comentario, autor_texto, creado_at
            ) VALUES (?, ?, ?, ?, ?, ?)
          `,
          [o.id, o.sitio_id, o.calificacion, o.comentario, o.autor_texto, o.creado_at],
        );
      }
    } catch (e) {
      if (!isLockedError(e)) {
        console.warn("[offline-sitios-db] error al guardar opiniones_cache:", e);
      }
    }
  });
}

export async function getCachedProvincias(): Promise<Provincia[]> {
  await ensureTables();
  const db = await getDb();
  const rows = await db.getAllAsync<Provincia>(
    `SELECT id, nombre FROM provincia_cache ORDER BY nombre ASC`,
  );
  return rows ?? [];
}

export async function replaceCachedProvincias(provincias: Provincia[]): Promise<void> {
  if (!provincias) return;
  await enqueueWrite(async () => {
    await ensureTables();
    const db = await getDb();
    try {
      await db.execAsync("DELETE FROM provincia_cache;");
      for (const p of provincias) {
        await db.runAsync(
          `INSERT OR REPLACE INTO provincia_cache (id, nombre) VALUES (?, ?)`,
          [p.id, p.nombre],
        );
      }
    } catch (e) {
      if (!isLockedError(e)) {
        console.warn("[offline-sitios-db] error al guardar provincia_cache:", e);
      }
    }
  });
}

export async function getCachedMunicipiosByProvinciaId(
  provinciaId: string,
): Promise<Municipio[]> {
  await ensureTables();
  const db = await getDb();
  const rows = await db.getAllAsync<Municipio>(
    `SELECT id, nombre, provincia_id FROM municipio_cache WHERE provincia_id = ? ORDER BY nombre ASC`,
    [provinciaId],
  );
  return rows ?? [];
}

export async function replaceCachedMunicipiosForProvincia(
  provinciaId: string,
  municipios: Municipio[],
): Promise<void> {
  if (!municipios) return;
  await enqueueWrite(async () => {
    await ensureTables();
    const db = await getDb();
    try {
      await db.runAsync(`DELETE FROM municipio_cache WHERE provincia_id = ?`, [provinciaId]);
      for (const m of municipios) {
        await db.runAsync(
          `INSERT OR REPLACE INTO municipio_cache (id, nombre, provincia_id) VALUES (?, ?, ?)`,
          [m.id, m.nombre, m.provincia_id],
        );
      }
    } catch (e) {
      if (!isLockedError(e)) {
        console.warn("[offline-sitios-db] error al guardar municipio_cache:", e);
      }
    }
  });
}


/**
 * ARCA operational feed: normalizes public, read-only hazard data. It does not
 * infer evacuations, dispatch rescue resources, collect user locations or call
 * authorities. Source provenance remains visible in every normalized event.
 */
import * as db from "./db";

type UnknownRecord = Record<string, unknown>;

type FeedStatus = {
  source: "gdacs" | "usgs";
  status: "fresh" | "cached" | "unavailable";
  message: string;
};

const GDACS_LATEST_URL = "https://www.gdacs.org/gdacsapi/api/Events/geteventlist/latest?eventlist=EQ%3BTC%3BFL%3BWF%3BVO%3BDR&pageSize=80&pageNumber=1";
const USGS_LATEST_URL = "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&orderby=time&limit=80&minmagnitude=4.5";

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as UnknownRecord : null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asFiniteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asDate(value: unknown, fallback = new Date()): Date {
  const parsed = typeof value === "string" || typeof value === "number" ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : fallback;
}

function normalizeAlertLevel(value: unknown): db.PublicHazardInput["alertLevel"] {
  const level = asString(value).toLowerCase();
  if (level === "green" || level === "yellow" || level === "orange" || level === "red") return level;
  return "unknown";
}

function toCoordinates(geometry: UnknownRecord | null) {
  const coordinates = geometry?.coordinates;
  if (!Array.isArray(coordinates)) return null;
  const longitude = asFiniteNumber(coordinates[0]);
  const latitude = asFiniteNumber(coordinates[1]);
  const depthKm = asFiniteNumber(coordinates[2]);
  if (longitude === null || latitude === null) return null;
  return { longitude, latitude, depthKm };
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "ARCA-Resilience-Operational-Panel/1.0" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`Fonte respondeu HTTP ${response.status}`);
  return response.json() as Promise<unknown>;
}

export async function fetchGdacsHazards(): Promise<db.PublicHazardInput[]> {
  const payload = asRecord(await fetchJson(GDACS_LATEST_URL));
  const features = Array.isArray(payload?.features) ? payload.features : [];
  const events: db.PublicHazardInput[] = [];

  for (const feature of features) {
    const record = asRecord(feature);
    const properties = asRecord(record?.properties);
    const geometry = asRecord(record?.geometry);
    const coordinates = toCoordinates(geometry);
    const eventId = asFiniteNumber(properties?.eventid);
    if (!properties || !coordinates || eventId === null) continue;
    const urls = asRecord(properties.url);
    const severity = asRecord(properties.severitydata);
    events.push({
      source: "gdacs",
      sourceEventId: `${asString(properties.eventtype, "event")}-${eventId}`,
      title: asString(properties.name, asString(properties.description, "Evento GDACS")),
      hazardType: asString(properties.eventtype, "unknown"),
      alertLevel: normalizeAlertLevel(properties.episodealertlevel ?? properties.alertlevel),
      magnitude: asFiniteNumber(severity?.severity),
      depthKm: coordinates.depthKm,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      geometry: geometry ?? null,
      countryOrPlace: asString(properties.country) || null,
      observedAt: asDate(properties.fromdate ?? properties.todate),
      sourceUpdatedAt: asDate(properties.datemodified),
      sourceUrl: asString(urls?.report, "https://gdacs.org/"),
      isCurrent: asString(properties.iscurrent, "true") === "true" ? 1 : 0,
    });
  }
  return events;
}

export async function fetchUsgsHazards(): Promise<db.PublicHazardInput[]> {
  const payload = asRecord(await fetchJson(USGS_LATEST_URL));
  const features = Array.isArray(payload?.features) ? payload.features : [];
  const events: db.PublicHazardInput[] = [];

  for (const feature of features) {
    const record = asRecord(feature);
    const properties = asRecord(record?.properties);
    const geometry = asRecord(record?.geometry);
    const coordinates = toCoordinates(geometry);
    const sourceEventId = asString(record?.id);
    if (!properties || !coordinates || !sourceEventId) continue;
    events.push({
      source: "usgs",
      sourceEventId,
      title: asString(properties.title, "Earthquake — USGS"),
      hazardType: "EQ",
      alertLevel: normalizeAlertLevel(properties.alert),
      magnitude: asFiniteNumber(properties.mag),
      depthKm: coordinates.depthKm,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      geometry: geometry ?? null,
      countryOrPlace: asString(properties.place) || null,
      observedAt: asDate(properties.time),
      sourceUpdatedAt: asDate(properties.updated ?? properties.time),
      sourceUrl: asString(properties.url, "https://earthquake.usgs.gov/"),
      isCurrent: 1,
    });
  }
  return events;
}

async function refreshPublicHazards() {
  const outcomes = await Promise.allSettled([fetchGdacsHazards(), fetchUsgsHazards()]);
  const statuses: FeedStatus[] = [];
  const normalized: db.PublicHazardInput[] = [];
  const sources: Array<FeedStatus["source"]> = ["gdacs", "usgs"];

  outcomes.forEach((outcome, index) => {
    const source = sources[index];
    if (outcome.status === "fulfilled") {
      normalized.push(...outcome.value);
      statuses.push({ source, status: "fresh", message: `${outcome.value.length} eventos normalizados` });
      return;
    }
    statuses.push({ source, status: "unavailable", message: "Fonte indisponível nesta atualização; o painel exibirá o último cache disponível." });
  });

  if (normalized.length > 0) await db.upsertPublicHazardEvents(normalized);
  return statuses;
}

export async function getOperationalHazardSnapshot(forceRefresh = false) {
  const lastCacheAt = await db.getPublicHazardCacheAge();
  const cacheExpired = !lastCacheAt || Date.now() - lastCacheAt.getTime() > db.ARCA_PUBLIC_HAZARD_CACHE_MINUTES * 60_000;
  let statuses: FeedStatus[];

  if (forceRefresh || cacheExpired) {
    statuses = await refreshPublicHazards();
  } else {
    statuses = [
      { source: "gdacs", status: "cached", message: "Cache público ainda dentro da janela de atualização." },
      { source: "usgs", status: "cached", message: "Cache público ainda dentro da janela de atualização." },
    ];
  }

  const [events, rescueHistory] = await Promise.all([
    db.getRecentPublicHazardEvents(),
    db.getPublishedRescueIncidentAggregates(),
  ]);

  return {
    events,
    rescueHistory,
    sources: statuses,
    cacheWindowMinutes: db.ARCA_PUBLIC_HAZARD_CACHE_MINUTES,
    lastCacheAt: await db.getPublicHazardCacheAge(),
  };
}

export function describeEventRisk(event: {
  source: "gdacs" | "usgs";
  alertLevel: "green" | "yellow" | "orange" | "red" | "unknown";
  hazardType: string;
  magnitude: number | null;
  title: string;
  sourceUrl: string;
}) {
  const seismicMagnitude = event.hazardType === "EQ" && typeof event.magnitude === "number" ? event.magnitude : null;
  const tier = event.alertLevel === "red" || (seismicMagnitude !== null && seismicMagnitude >= 7)
    ? "crítico"
    : event.alertLevel === "orange" || (seismicMagnitude !== null && seismicMagnitude >= 6)
      ? "elevado"
      : event.alertLevel === "yellow" || (seismicMagnitude !== null && seismicMagnitude >= 4.5)
        ? "atenção"
        : "monitorar";
  const rationale = seismicMagnitude !== null
    ? `Magnitude registrada: ${seismicMagnitude.toFixed(1)}. A classificação é informativa e depende de confirmação por autoridades locais.`
    : `Nível publicado pela fonte: ${event.alertLevel}. A classificação é informativa e depende de confirmação por autoridades locais.`;
  return {
    tier,
    title: `Alerta preventivo: ${event.title}`,
    rationale,
    sourceUrl: event.sourceUrl,
    sourceName: event.source === "gdacs" ? "GDACS" : "USGS",
    limitations: "O ARCA não define evacuação, não despacha equipes e não substitui alertas de autoridades competentes.",
  };
}

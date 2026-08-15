import { and, count, desc, eq, gt, gte, isNull, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  arcaAuditEvents,
  arcaConsentRecords,
  arcaConversations,
  arcaEvidenceCases,
  arcaMessages,
  arcaPublicHazardEvents,
  arcaProfiles,
  arcaRescueIncidentAggregates,
  arcaSafetySignals,
  InsertUser,
  users,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
export const ARCA_CONSENT_VERSION = "arca-private-assistance-v1";
export const ARCA_CONVERSATION_RETENTION_DAYS = 180;
export const ARCA_AUDIT_RETENTION_DAYS = 365;
export const ARCA_HOURLY_CHAT_LIMIT = 15;
export const ARCA_SAFETY_SIGNAL_RETENTION_DAYS = 30;
export const ARCA_PUBLIC_HAZARD_CACHE_MINUTES = 5;
export const ARCA_V1_READ_VIEWS = Object.freeze({
  publicHazardFeed: "arca_public_hazard_feed_v1",
  rescueAggregate: "arca_rescue_aggregate_v1",
  assessment: "arca_assessment_v1",
});

function retentionDate(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function ensureArcaProfile(userId: number, displayName?: string | null) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(arcaProfiles).values({
    userId,
    displayName: displayName ?? null,
  }).onDuplicateKeyUpdate({ set: { userId } });
}

export async function hasArcaPrivateConsent(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const records = await db.select({ id: arcaConsentRecords.id })
    .from(arcaConsentRecords)
    .where(and(
      eq(arcaConsentRecords.userId, userId),
      eq(arcaConsentRecords.policyVersion, ARCA_CONSENT_VERSION),
      eq(arcaConsentRecords.scope, "private_assistance"),
      isNull(arcaConsentRecords.revokedAt),
    ))
    .orderBy(desc(arcaConsentRecords.acceptedAt))
    .limit(1);

  return records.length > 0;
}

export async function acceptArcaPrivateConsent(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(arcaConsentRecords).values({
    userId,
    policyVersion: ARCA_CONSENT_VERSION,
    scope: "private_assistance",
  });
  await writeArcaAuditEvent(userId, "consent.accepted", "consent", ARCA_CONSENT_VERSION);
}

export async function writeArcaAuditEvent(userId: number | null, eventType: string, resourceType: string, resourceId?: string, metadata?: Record<string, unknown>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(arcaAuditEvents).values({
    userId,
    eventType,
    resourceType,
    resourceId: resourceId ?? null,
    metadata: metadata ?? null,
  });
}

export async function createArcaConversation(userId: number, title: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db.insert(arcaConversations).values({
    userId,
    title,
    expiresAt: retentionDate(ARCA_CONVERSATION_RETENTION_DAYS),
  });
  const conversationId = Number(result[0].insertId);
  await writeArcaAuditEvent(userId, "conversation.created", "conversation", String(conversationId));
  return conversationId;
}

export async function getArcaConversations(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.select({
    id: arcaConversations.id,
    title: arcaConversations.title,
    updatedAt: arcaConversations.updatedAt,
    lastMessageAt: arcaConversations.lastMessageAt,
  }).from(arcaConversations)
    .where(and(eq(arcaConversations.userId, userId), gt(arcaConversations.expiresAt, new Date())))
    .orderBy(desc(arcaConversations.lastMessageAt))
    .limit(20);
}

export async function getOwnedArcaConversation(userId: number, conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db.select().from(arcaConversations)
    .where(and(
      eq(arcaConversations.id, conversationId),
      eq(arcaConversations.userId, userId),
      gt(arcaConversations.expiresAt, new Date()),
    ))
    .limit(1);
  return result[0];
}

export async function getArcaMessages(userId: number, conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.select({
    id: arcaMessages.id,
    role: arcaMessages.role,
    content: arcaMessages.content,
    safetyStatus: arcaMessages.safetyStatus,
    createdAt: arcaMessages.createdAt,
  }).from(arcaMessages)
    .where(and(eq(arcaMessages.conversationId, conversationId), eq(arcaMessages.userId, userId)))
    .orderBy(arcaMessages.createdAt)
    .limit(60);
}

export async function getArcaRecentContext(userId: number, conversationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const rows = await db.select({ role: arcaMessages.role, content: arcaMessages.content })
    .from(arcaMessages)
    .where(and(eq(arcaMessages.conversationId, conversationId), eq(arcaMessages.userId, userId)))
    .orderBy(desc(arcaMessages.createdAt))
    .limit(14);
  return rows.reverse();
}

export async function addArcaMessage(userId: number, conversationId: number, role: "user" | "assistant" | "system", content: string, safetyStatus: "normal" | "needs_review" | "blocked" = "normal") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db.insert(arcaMessages).values({ userId, conversationId, role, content, safetyStatus });
  await db.update(arcaConversations).set({ lastMessageAt: new Date() })
    .where(and(eq(arcaConversations.id, conversationId), eq(arcaConversations.userId, userId)));
  return Number(result[0].insertId);
}

export async function countArcaMessagesSince(userId: number, since: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db.select({ total: count() }).from(arcaMessages).where(and(
    eq(arcaMessages.userId, userId),
    eq(arcaMessages.role, "user"),
    gte(arcaMessages.createdAt, since),
  ));
  return result[0]?.total ?? 0;
}

export async function getArcaReviewQueue() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.select({
    messageId: arcaMessages.id,
    conversationId: arcaMessages.conversationId,
    content: arcaMessages.content,
    createdAt: arcaMessages.createdAt,
    userId: arcaMessages.userId,
  }).from(arcaMessages)
    .where(eq(arcaMessages.safetyStatus, "needs_review"))
    .orderBy(desc(arcaMessages.createdAt))
    .limit(40);
}

export async function markArcaMessageReviewed(reviewerUserId: number, messageId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.update(arcaMessages).set({ safetyStatus: "reviewed" }).where(eq(arcaMessages.id, messageId));
  await writeArcaAuditEvent(reviewerUserId, "review.completed", "message", String(messageId));
}

export async function setArcaOperationalRole(adminUserId: number, userId: number, role: "member" | "operator" | "steward") {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.insert(arcaProfiles).values({ userId, operationalRole: role }).onDuplicateKeyUpdate({ set: { operationalRole: role } });
  await writeArcaAuditEvent(adminUserId, "profile.role_changed", "profile", String(userId), { role });
}

export async function purgeExpiredArcaData() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const now = new Date();
  const auditCutoff = new Date();
  auditCutoff.setUTCDate(auditCutoff.getUTCDate() - ARCA_AUDIT_RETENTION_DAYS);
  const expiredMessages = await db.delete(arcaMessages).where(lt(arcaMessages.createdAt, new Date(now.getTime() - ARCA_CONVERSATION_RETENTION_DAYS * 24 * 60 * 60 * 1000)));
  const expiredConversations = await db.delete(arcaConversations).where(lt(arcaConversations.expiresAt, now));
  const expiredAudit = await db.delete(arcaAuditEvents).where(lt(arcaAuditEvents.createdAt, auditCutoff));
  const expiredSignals = await db.delete(arcaSafetySignals).where(lt(arcaSafetySignals.expiresAt, now));
  return { expiredMessages, expiredConversations, expiredAudit, expiredSignals };
}

export async function createArcaSafetySignal(input: {
  userId: number;
  conversationId: number;
  messageId: number;
  areaKey: string;
  riskTier: "preventive" | "review_pending";
  reasonCodes: string[];
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const result = await db.insert(arcaSafetySignals).values({
    ...input,
    expiresAt: retentionDate(ARCA_SAFETY_SIGNAL_RETENTION_DAYS),
  });
  const signalId = Number(result[0].insertId);
  await writeArcaAuditEvent(input.userId, "safety.signal_created", "safety_signal", String(signalId), {
    areaKey: input.areaKey,
    riskTier: input.riskTier,
  });
  return signalId;
}

export async function getOpenArcaSafetySignals() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.select({
    id: arcaSafetySignals.id,
    userId: arcaSafetySignals.userId,
    conversationId: arcaSafetySignals.conversationId,
    messageId: arcaSafetySignals.messageId,
    areaKey: arcaSafetySignals.areaKey,
    riskTier: arcaSafetySignals.riskTier,
    reasonCodes: arcaSafetySignals.reasonCodes,
    createdAt: arcaSafetySignals.createdAt,
    expiresAt: arcaSafetySignals.expiresAt,
  }).from(arcaSafetySignals)
    .where(eq(arcaSafetySignals.status, "open"))
    .orderBy(desc(arcaSafetySignals.createdAt))
    .limit(40);
}

export async function resolveArcaSafetySignal(reviewerUserId: number, signalId: number, status: "resolved" | "no_external_action", resolutionNote: string) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db.update(arcaSafetySignals).set({
    status,
    reviewedByUserId: reviewerUserId,
    reviewedAt: new Date(),
    resolutionNote,
  }).where(eq(arcaSafetySignals.id, signalId));
  await writeArcaAuditEvent(reviewerUserId, "safety.signal_resolved", "safety_signal", String(signalId), { status });
}

export async function getPublishedArcaEvidence() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.select({
    evidenceKey: arcaEvidenceCases.evidenceKey,
    title: arcaEvidenceCases.title,
    environment: arcaEvidenceCases.environment,
    sourceOrganization: arcaEvidenceCases.sourceOrganization,
    sourceUrl: arcaEvidenceCases.sourceUrl,
    sourcePublishedAt: arcaEvidenceCases.sourcePublishedAt,
    factualSummary: arcaEvidenceCases.factualSummary,
    operationalLesson: arcaEvidenceCases.operationalLesson,
  }).from(arcaEvidenceCases)
    .where(eq(arcaEvidenceCases.status, "published"))
    .orderBy(desc(arcaEvidenceCases.reviewedAt))
    .limit(8);
}

export async function getArcaEvidenceForCuration() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  return db.select({
    id: arcaEvidenceCases.id,
    evidenceKey: arcaEvidenceCases.evidenceKey,
    title: arcaEvidenceCases.title,
    environment: arcaEvidenceCases.environment,
    sourceOrganization: arcaEvidenceCases.sourceOrganization,
    sourceUrl: arcaEvidenceCases.sourceUrl,
    sourcePublishedAt: arcaEvidenceCases.sourcePublishedAt,
    factualSummary: arcaEvidenceCases.factualSummary,
    operationalLesson: arcaEvidenceCases.operationalLesson,
    evidenceTier: arcaEvidenceCases.evidenceTier,
    status: arcaEvidenceCases.status,
    reviewedAt: arcaEvidenceCases.reviewedAt,
    updatedAt: arcaEvidenceCases.updatedAt,
  }).from(arcaEvidenceCases)
    .orderBy(desc(arcaEvidenceCases.updatedAt))
    .limit(50);
}

export type EvidenceInput = {
  evidenceKey: string;
  title: string;
  environment: string;
  sourceOrganization: string;
  sourceUrl: string;
  sourcePublishedAt?: Date | null;
  factualSummary: string;
  operationalLesson: string;
  evidenceTier: "official" | "peer_reviewed" | "institutional";
  status: "draft" | "published" | "archived";
};

export async function upsertArcaEvidence(adminUserId: number, evidence: EvidenceInput) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const values = {
    ...evidence,
    createdByUserId: adminUserId,
    reviewedByUserId: evidence.status === "published" ? adminUserId : null,
    reviewedAt: evidence.status === "published" ? new Date() : null,
  };
  await db.insert(arcaEvidenceCases).values(values).onDuplicateKeyUpdate({
    set: {
      title: evidence.title,
      environment: evidence.environment,
      sourceOrganization: evidence.sourceOrganization,
      sourceUrl: evidence.sourceUrl,
      sourcePublishedAt: evidence.sourcePublishedAt ?? null,
      factualSummary: evidence.factualSummary,
      operationalLesson: evidence.operationalLesson,
      evidenceTier: evidence.evidenceTier,
      status: evidence.status,
      reviewedByUserId: evidence.status === "published" ? adminUserId : null,
      reviewedAt: evidence.status === "published" ? new Date() : null,
    },
  });
  await writeArcaAuditEvent(adminUserId, "evidence.upserted", "evidence", evidence.evidenceKey, { status: evidence.status });
}

export type PublicHazardInput = {
  source: "gdacs" | "usgs";
  sourceEventId: string;
  title: string;
  hazardType: string;
  alertLevel: "green" | "yellow" | "orange" | "red" | "unknown";
  magnitude?: number | null;
  depthKm?: number | null;
  latitude: number;
  longitude: number;
  geometry?: Record<string, unknown> | null;
  countryOrPlace?: string | null;
  observedAt: Date;
  sourceUpdatedAt: Date;
  sourceUrl: string;
  isCurrent?: number;
};

export async function upsertPublicHazardEvents(events: PublicHazardInput[]) {
  const database = await getDb();
  if (!database) throw new Error("Database unavailable");

  for (const event of events) {
    await database.insert(arcaPublicHazardEvents).values({
      ...event,
      geometry: event.geometry ?? null,
      isCurrent: event.isCurrent ?? 1,
      ingestedAt: new Date(),
    }).onDuplicateKeyUpdate({
      set: {
        title: event.title,
        hazardType: event.hazardType,
        alertLevel: event.alertLevel,
        magnitude: event.magnitude ?? null,
        depthKm: event.depthKm ?? null,
        latitude: event.latitude,
        longitude: event.longitude,
        geometry: event.geometry ?? null,
        countryOrPlace: event.countryOrPlace ?? null,
        observedAt: event.observedAt,
        sourceUpdatedAt: event.sourceUpdatedAt,
        sourceUrl: event.sourceUrl,
        isCurrent: event.isCurrent ?? 1,
        ingestedAt: new Date(),
      },
    });
  }
}

export async function getRecentPublicHazardEvents(limit = 80) {
  const database = await getDb();
  if (!database) throw new Error("Database unavailable");

  const [rows] = await database.execute(sql`
    SELECT source, sourceEventId, title, hazardType, alertLevel, magnitude, depthKm,
      latitude, longitude, countryOrPlace, observedAt, sourceUpdatedAt, sourceUrl, ingestedAt
    FROM ${sql.raw(ARCA_V1_READ_VIEWS.publicHazardFeed)}
    ORDER BY sourceUpdatedAt DESC
    LIMIT ${Math.min(Math.max(limit, 1), 100)}
  `);
  return rows as unknown as Array<{
    source: "gdacs" | "usgs";
    sourceEventId: string;
    title: string;
    hazardType: string;
    alertLevel: "green" | "yellow" | "orange" | "red" | "unknown";
    magnitude: number | null;
    depthKm: number | null;
    latitude: number;
    longitude: number;
    countryOrPlace: string | null;
    observedAt: Date;
    sourceUpdatedAt: Date;
    sourceUrl: string;
    ingestedAt: Date;
  }>;
}

export async function getPublicHazardCacheAge() {
  const database = await getDb();
  if (!database) throw new Error("Database unavailable");

  const rows = await database.select({ ingestedAt: arcaPublicHazardEvents.ingestedAt })
    .from(arcaPublicHazardEvents)
    .orderBy(desc(arcaPublicHazardEvents.ingestedAt))
    .limit(1);
  return rows[0]?.ingestedAt ?? null;
}

export async function getPublishedRescueIncidentAggregates() {
  const database = await getDb();
  if (!database) throw new Error("Database unavailable");

  const [rows] = await database.execute(sql`
    SELECT aggregateKey, sourceOrganization, sourceUrl, scopeLabel, incidentCategory,
      incidentCount, coverageStart, coverageEnd, updatedAt
    FROM ${sql.raw(ARCA_V1_READ_VIEWS.rescueAggregate)}
    ORDER BY incidentCount DESC
  `);
  return rows as unknown as Array<{
    aggregateKey: string;
    sourceOrganization: string;
    sourceUrl: string;
    scopeLabel: string;
    incidentCategory: string;
    incidentCount: number;
    coverageStart: Date;
    coverageEnd: Date;
    updatedAt: Date;
  }>;
}

export async function getArcaAssessmentReceiptsV1() {
  const database = await getDb();
  if (!database) throw new Error("Database unavailable");

  const [rows] = await database.execute(sql`
    SELECT assessmentId, areaKey, riskTier, status, reasonCodes, createdAt, reviewedAt, expiresAt
    FROM ${sql.raw(ARCA_V1_READ_VIEWS.assessment)}
    ORDER BY reviewedAt DESC
    LIMIT 20
  `);
  return rows as unknown as Array<{
    assessmentId: number;
    areaKey: string;
    riskTier: "preventive" | "review_pending";
    status: "resolved" | "no_external_action";
    reasonCodes: unknown;
    createdAt: Date;
    reviewedAt: Date;
    expiresAt: Date;
  }>;
}

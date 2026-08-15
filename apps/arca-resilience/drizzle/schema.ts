import { double, index, int, json, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * ARCA tables intentionally use an arca_ prefix. This protects the shared database
 * from naming collisions and makes project-level data ownership explicit.
 */
export const arcaProfiles = mysqlTable("arca_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  displayName: varchar("displayName", { length: 120 }),
  operationalRole: mysqlEnum("operationalRole", ["member", "operator", "steward"]).default("member").notNull(),
  dataSharing: mysqlEnum("dataSharing", ["private", "aggregate_opt_in"]).default("private").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Records explicit, versioned consent before ARCA persists a private conversation. */
export const arcaConsentRecords = mysqlTable("arca_consent_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  policyVersion: varchar("policyVersion", { length: 48 }).notNull(),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
  scope: mysqlEnum("scope", ["private_assistance", "aggregate_insights"]).default("private_assistance").notNull(),
}, table => [index("arca_consent_user_idx").on(table.userId, table.acceptedAt)]);

/** A user-owned conversation. Records are never exposed through public procedures. */
export const arcaConversations = mysqlTable("arca_conversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 140 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
}, table => [
  index("arca_conversation_user_idx").on(table.userId, table.lastMessageAt),
  index("arca_conversation_expiry_idx").on(table.expiresAt),
]);

/** A protected message belonging simultaneously to one user and one conversation. */
export const arcaMessages = mysqlTable("arca_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant", "system"]).notNull(),
  content: text("content").notNull(),
  safetyStatus: mysqlEnum("safetyStatus", ["normal", "needs_review", "reviewed", "blocked"]).default("normal").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [
  index("arca_message_conversation_idx").on(table.conversationId, table.createdAt),
  index("arca_message_user_idx").on(table.userId, table.createdAt),
]);

/** Append-only audit trail for consent, access and assistant actions. */
export const arcaAuditEvents = mysqlTable("arca_audit_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  eventType: varchar("eventType", { length: 80 }).notNull(),
  resourceType: varchar("resourceType", { length: 80 }).notNull(),
  resourceId: varchar("resourceId", { length: 80 }),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => [index("arca_audit_event_idx").on(table.userId, table.createdAt)]);

/**
 * A private review record for explicit, imminent safety concerns. It never sends
 * a notification externally; a human steward must review and decide next steps.
 */
export const arcaSafetySignals = mysqlTable("arca_safety_signals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  conversationId: int("conversationId").notNull(),
  messageId: int("messageId").notNull(),
  areaKey: varchar("areaKey", { length: 80 }).notNull(),
  riskTier: mysqlEnum("riskTier", ["preventive", "review_pending"]).notNull(),
  status: mysqlEnum("status", ["open", "resolved", "no_external_action"]).default("open").notNull(),
  reasonCodes: json("reasonCodes").notNull(),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  resolutionNote: text("resolutionNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
}, table => [
  index("arca_safety_signal_status_idx").on(table.status, table.riskTier, table.createdAt),
  index("arca_safety_signal_expiry_idx").on(table.expiresAt),
]);

/**
 * Curated, public evidence used by the assistant. Private user conversations
 * never become evidence records automatically.
 */
export const arcaEvidenceCases = mysqlTable("arca_evidence_cases", {
  id: int("id").autoincrement().primaryKey(),
  evidenceKey: varchar("evidenceKey", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 240 }).notNull(),
  environment: varchar("environment", { length: 120 }).notNull(),
  sourceOrganization: varchar("sourceOrganization", { length: 180 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1000 }).notNull(),
  sourcePublishedAt: timestamp("sourcePublishedAt"),
  factualSummary: text("factualSummary").notNull(),
  operationalLesson: text("operationalLesson").notNull(),
  evidenceTier: mysqlEnum("evidenceTier", ["official", "peer_reviewed", "institutional"]).default("official").notNull(),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  createdByUserId: int("createdByUserId"),
  reviewedByUserId: int("reviewedByUserId"),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("arca_evidence_status_environment_idx").on(table.status, table.environment),
]);

/**
 * Read-only public hazards cached with provenance. These records never contain
 * user positions, private conversation content or operational dispatch data.
 */
export const arcaPublicHazardEvents = mysqlTable("arca_public_hazard_events", {
  id: int("id").autoincrement().primaryKey(),
  source: mysqlEnum("source", ["gdacs", "usgs"]).notNull(),
  sourceEventId: varchar("sourceEventId", { length: 160 }).notNull(),
  title: varchar("title", { length: 320 }).notNull(),
  hazardType: varchar("hazardType", { length: 80 }).notNull(),
  alertLevel: mysqlEnum("alertLevel", ["green", "yellow", "orange", "red", "unknown"]).default("unknown").notNull(),
  magnitude: double("magnitude"),
  depthKm: double("depthKm"),
  latitude: double("latitude").notNull(),
  longitude: double("longitude").notNull(),
  geometry: json("geometry"),
  countryOrPlace: varchar("countryOrPlace", { length: 240 }),
  observedAt: timestamp("observedAt").notNull(),
  sourceUpdatedAt: timestamp("sourceUpdatedAt").notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1000 }).notNull(),
  isCurrent: int("isCurrent").default(1).notNull(),
  ingestedAt: timestamp("ingestedAt").defaultNow().notNull(),
}, table => [
  uniqueIndex("arca_public_hazard_source_event_unq").on(table.source, table.sourceEventId),
  index("arca_public_hazard_observed_idx").on(table.observedAt),
  index("arca_public_hazard_alert_idx").on(table.alertLevel, table.sourceUpdatedAt),
]);

/**
 * Aggregated, published rescue history. The source records are reduced to
 * counts and coverage windows before reaching this table.
 */
export const arcaRescueIncidentAggregates = mysqlTable("arca_rescue_incident_aggregates", {
  id: int("id").autoincrement().primaryKey(),
  aggregateKey: varchar("aggregateKey", { length: 120 }).notNull().unique(),
  sourceOrganization: varchar("sourceOrganization", { length: 180 }).notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1000 }).notNull(),
  scopeLabel: varchar("scopeLabel", { length: 240 }).notNull(),
  incidentCategory: varchar("incidentCategory", { length: 120 }).notNull(),
  incidentCount: int("incidentCount").notNull(),
  coverageStart: timestamp("coverageStart").notNull(),
  coverageEnd: timestamp("coverageEnd").notNull(),
  status: mysqlEnum("status", ["published", "archived"]).default("published").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => [
  index("arca_rescue_aggregate_status_idx").on(table.status, table.incidentCategory),
]);

export type ArcaProfile = typeof arcaProfiles.$inferSelect;
export type ArcaConversation = typeof arcaConversations.$inferSelect;
export type ArcaMessage = typeof arcaMessages.$inferSelect;
export type ArcaEvidenceCase = typeof arcaEvidenceCases.$inferSelect;
export type ArcaSafetySignal = typeof arcaSafetySignals.$inferSelect;
export type ArcaPublicHazardEvent = typeof arcaPublicHazardEvents.$inferSelect;
export type ArcaRescueIncidentAggregate = typeof arcaRescueIncidentAggregates.$inferSelect;

-- ARCA public and aggregate read contracts. Apply after migrations 0000–0005.
-- These views intentionally omit user identifiers, message content and precise user locations.
CREATE OR REPLACE VIEW arca_public_hazard_feed_v1 AS
SELECT source, sourceEventId, title, hazardType, alertLevel, magnitude, depthKm,
  latitude, longitude, countryOrPlace, observedAt, sourceUpdatedAt, sourceUrl, ingestedAt
FROM arca_public_hazard_events
WHERE isCurrent = 1;

CREATE OR REPLACE VIEW arca_rescue_aggregate_v1 AS
SELECT aggregateKey, sourceOrganization, sourceUrl, scopeLabel, incidentCategory,
  incidentCount, coverageStart, coverageEnd, updatedAt
FROM arca_rescue_incident_aggregates
WHERE status = 'published';

CREATE OR REPLACE VIEW arca_assessment_v1 AS
SELECT id AS assessmentId, areaKey, riskTier, status, reasonCodes, createdAt, reviewedAt, expiresAt
FROM arca_safety_signals
WHERE status IN ('resolved', 'no_external_action') AND reviewedAt IS NOT NULL;

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { ARCA_V1_READ_VIEWS } from "./db";

const viewsSql = readFileSync(resolve(process.cwd(), "drizzle/manual/arca_read_views_v1.sql"), "utf8");

describe("ARCA views v1", () => {
  it("mantém identificadores explícitos para os três contratos de leitura mínima", () => {
    expect(ARCA_V1_READ_VIEWS).toEqual({
      publicHazardFeed: "arca_public_hazard_feed_v1",
      rescueAggregate: "arca_rescue_aggregate_v1",
      assessment: "arca_assessment_v1",
    });
  });

  it("documenta as views sem identificadores de usuário, conversa ou conteúdo", () => {
    expect(viewsSql).toContain("CREATE OR REPLACE VIEW arca_public_hazard_feed_v1");
    expect(viewsSql).toContain("CREATE OR REPLACE VIEW arca_rescue_aggregate_v1");
    expect(viewsSql).toContain("CREATE OR REPLACE VIEW arca_assessment_v1");
    expect(viewsSql).not.toMatch(/userId|conversationId|messageId|resolutionNote/i);
  });
});

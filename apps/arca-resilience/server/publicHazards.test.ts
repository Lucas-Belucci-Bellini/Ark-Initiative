import { afterEach, describe, expect, it, vi } from "vitest";
import { describeEventRisk, fetchGdacsHazards, fetchUsgsHazards } from "./publicHazards";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("public hazard connectors", () => {
  it("normalizes GDACS events while retaining source provenance", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [{
          geometry: { type: "Point", coordinates: [121.3, -8.3] },
          properties: {
            eventtype: "EQ", eventid: 42, name: "Earthquake in Exampleland", country: "Exampleland",
            episodealertlevel: "Red", fromdate: "2026-08-14T21:58:21Z", datemodified: "2026-08-14T22:00:00Z",
            severitydata: { severity: 7.7 }, url: { report: "https://gdacs.example/report" }, iscurrent: "true",
          },
        }],
      }),
    }));

    const events = await fetchGdacsHazards();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ source: "gdacs", sourceEventId: "EQ-42", alertLevel: "red", latitude: -8.3, longitude: 121.3, magnitude: 7.7 });
  });

  it("preserves the yellow USGS signal instead of exaggerating its severity", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        features: [{
          id: "us7000test", geometry: { type: "Point", coordinates: [-70.2, -22.9, 12] },
          properties: { title: "M 5.1 — Example", type: "earthquake", alert: "yellow", mag: 5.1, time: 1_785_000_000_000, updated: 1_785_000_100_000, place: "Example place", url: "https://usgs.example/event" },
        }],
      }),
    }));

    const events = await fetchUsgsHazards();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ source: "usgs", sourceEventId: "us7000test", alertLevel: "yellow", depthKm: 12, magnitude: 5.1 });
  });

  it("describes risk without turning a public signal into a dispatch instruction", () => {
    const risk = describeEventRisk({ source: "usgs", alertLevel: "red", hazardType: "EQ", magnitude: 7.2, title: "M 7.2", sourceUrl: "https://usgs.example/event" });

    expect(risk.tier).toBe("crítico");
    expect(risk.limitations).toMatch(/não define evacuação/i);
    expect(risk.limitations).toMatch(/não despacha equipes/i);
  });
});

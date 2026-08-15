import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import OperationalPanel from "./OperationalPanel";

const useOverview = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: { operational: { overview: { useQuery: () => useOverview() } } },
}));

vi.mock("@/lib/arcaRiskCore", () => ({
  alertLevelCode: () => 0,
  loadArcaRiskCore: () => Promise.resolve({ classify_public_risk: () => 0, packet_is_fresh: () => 1 }),
}));

vi.mock("@/components/OperationalMap", () => ({
  default: ({ events, onSelect }: { events: Array<{ sourceEventId: string; title: string }>; onSelect: (id: string) => void }) => (
    <div data-testid="operational-map">{events.map(event => <button key={event.sourceEventId} onClick={() => onSelect(event.sourceEventId)}>Mapa: {event.title}</button>)}</div>
  ),
}));

const firstEvent = {
  source: "gdacs" as const, sourceEventId: "gdacs-1", title: "Earthquake A", hazardType: "EQ", alertLevel: "red" as const,
  magnitude: 7.1, depthKm: 12, latitude: -8.3, longitude: 121.3, countryOrPlace: "Exampleland",
  observedAt: new Date("2026-08-14T21:58:21Z"), sourceUpdatedAt: new Date("2026-08-14T22:00:00Z"), sourceUrl: "https://gdacs.example/1", ingestedAt: new Date(),
};
const secondEvent = { ...firstEvent, sourceEventId: "usgs-2", source: "usgs" as const, title: "Flood B", hazardType: "FL", alertLevel: "green" as const, magnitude: null };

function loadedOverview() {
  return {
    isLoading: false, isError: false, isFetching: false, refetch: vi.fn(),
    data: {
      events: [firstEvent, secondEvent],
      rescueHistory: [{ aggregateKey: "nps", sourceOrganization: "NPS", sourceUrl: "https://nps.example", scopeLabel: "Public aggregate", incidentCategory: "Busca terrestre", incidentCount: 1565, coverageStart: new Date("2013-01-01"), coverageEnd: new Date("2020-12-31") }],
      sources: [{ source: "gdacs" as const, status: "fresh" as const, message: "1 evento normalizado" }, { source: "usgs" as const, status: "cached" as const, message: "cache válido" }],
      cacheWindowMinutes: 5, lastCacheAt: new Date(),
      alerts: [
        { source: "gdacs" as const, sourceEventId: "gdacs-1", observedAt: firstEvent.observedAt, risk: { tier: "crítico", title: "Alerta preventivo: Earthquake A", rationale: "Fonte confirma magnitude.", sourceUrl: "https://gdacs.example/1", sourceName: "GDACS", limitations: "O ARCA não define evacuação." } },
        { source: "usgs" as const, sourceEventId: "usgs-2", observedAt: secondEvent.observedAt, risk: { tier: "monitorar", title: "Alerta preventivo: Flood B", rationale: "Fonte confirma nível.", sourceUrl: "https://usgs.example/2", sourceName: "USGS", limitations: "O ARCA não define evacuação." } },
      ],
    },
  };
}

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("OperationalPanel", () => {
  it("renderiza o overview público e o alerta explicável inicial", () => {
    useOverview.mockReturnValue(loadedOverview());
    render(<OperationalPanel />);

    expect(screen.getByText("Earthquake A")).toBeTruthy();
    expect(screen.getByText("Alerta preventivo: Earthquake A")).toBeTruthy();
    expect(screen.getByText("1.565")).toBeTruthy();
  });

  it("altera o alerta quando outro evento é selecionado no painel", () => {
    useOverview.mockReturnValue(loadedOverview());
    render(<OperationalPanel />);

    fireEvent.click(screen.getByText("Flood B"));
    expect(screen.getByText("Alerta preventivo: Flood B")).toBeTruthy();
  });

  it("mostra um estado vazio sem inventar alertas", () => {
    const overview = loadedOverview();
    overview.data.events = [];
    overview.data.alerts = [];
    overview.data.rescueHistory = [];
    useOverview.mockReturnValue(overview);
    render(<OperationalPanel />);

    expect(screen.getByText("EVENTOS PUBLICADOS")).toBeTruthy();
    expect(screen.queryByText(/Alerta preventivo:/)).toBeNull();
  });

  it("apresenta uma mensagem clara se o overview falhar", () => {
    useOverview.mockReturnValue({ isLoading: false, isError: true, isFetching: false });
    render(<OperationalPanel />);

    expect(screen.getByText(/Não foi possível carregar o painel agora/i)).toBeTruthy();
  });

  it("informa quando o dispositivo inicia offline sem alterar os dados públicos exibidos", () => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    useOverview.mockReturnValue(loadedOverview());
    render(<OperationalPanel />);

    expect(screen.getByText("offline · pacote local")).toBeTruthy();
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  });
});

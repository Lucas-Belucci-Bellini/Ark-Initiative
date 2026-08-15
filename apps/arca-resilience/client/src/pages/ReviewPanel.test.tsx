import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReviewPanel from "./ReviewPanel";

const useAuth = vi.fn();
const useSafetyBoard = vi.fn();
const useEvidenceCatalog = vi.fn();
const resolveMutate = vi.fn();
const upsertEvidenceMutate = vi.fn();
const invalidate = vi.fn();

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => useAuth() }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    administration: {
      safetyBoard: { useQuery: (...args: unknown[]) => useSafetyBoard(...args) },
      evidenceCatalog: { useQuery: (...args: unknown[]) => useEvidenceCatalog(...args) },
      resolveSafetySignal: { useMutation: () => ({ mutate: resolveMutate, isPending: false }) },
      upsertEvidence: { useMutation: () => ({ mutate: upsertEvidenceMutate, isPending: false, isError: false }) },
    },
    useUtils: () => ({ administration: { safetyBoard: { invalidate }, evidenceCatalog: { invalidate } } }),
  },
}));

function loadedBoard() {
  return {
    isLoading: false,
    isError: false,
    data: {
      externalDispatch: false,
      openSignals: [{ id: 42, userId: 7, conversationId: 8, messageId: 9, areaKey: "chornobyl_exclusion_zone", riskTier: "review_pending" as const, reasonCodes: ["restricted_area", "imminent_timeframe"], createdAt: new Date("2026-08-14T21:00:00Z"), expiresAt: new Date("2026-09-13T21:00:00Z") }],
      assessmentReceipts: [{ assessmentId: 11, areaKey: "restricted_disaster_area", riskTier: "review_pending" as const, status: "no_external_action" as const, reasonCodes: ["restricted_area"], createdAt: new Date("2026-08-10T21:00:00Z"), reviewedAt: new Date("2026-08-11T21:00:00Z"), expiresAt: new Date("2026-09-10T21:00:00Z") }],
    },
  };
}

function loadedEvidenceCatalog() {
  return {
    isLoading: false,
    isError: false,
    data: [
      { id: 3, evidenceKey: "iaea_chornobyl_faq", title: "IAEA Chornobyl FAQ", environment: "zona restrita", sourceOrganization: "IAEA", sourceUrl: "https://www.iaea.org/topics/chornobyl/faqs", sourcePublishedAt: new Date("2026-01-10T00:00:00Z"), factualSummary: "Resumo factual verificável para restrições e riscos documentados.", operationalLesson: "Consultar canais oficiais e não orientar entrada não autorizada.", evidenceTier: "official" as const, status: "draft" as const, reviewedAt: null, updatedAt: new Date("2026-08-15T00:00:00Z") },
      { id: 4, evidenceKey: "nps_yosemite_heat", title: "Yosemite Heat Safety", environment: "montanha", sourceOrganization: "National Park Service", sourceUrl: "https://www.nps.gov/yose/planyourvisit/weather.htm", sourcePublishedAt: new Date("2026-02-10T00:00:00Z"), factualSummary: "Fonte oficial sobre condições de calor e cuidados em área de montanha.", operationalLesson: "Preparar alternativas seguras e confirmar avisos antes do deslocamento.", evidenceTier: "institutional" as const, status: "published" as const, reviewedAt: new Date("2026-08-13T00:00:00Z"), updatedAt: new Date("2026-08-13T00:00:00Z") },
    ],
  };
}

function renderAdminPanel() {
  useAuth.mockReturnValue({ loading: false, user: { role: "admin", name: "Operador" } });
  useSafetyBoard.mockReturnValue(loadedBoard());
  useEvidenceCatalog.mockReturnValue(loadedEvidenceCatalog());
  return render(<ReviewPanel />);
}

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("ReviewPanel", () => {
  it("expõe somente metadados de revisão e declara que não há despacho externo", () => {
    renderAdminPanel();
    expect(screen.getByText("Canal externo: desativado")).toBeTruthy();
    expect(screen.getByText("chornobyl exclusion zone")).toBeTruthy();
    expect(screen.getByText(/conteúdo de conversa, identidade da pessoa/i)).toBeTruthy();
    expect(screen.queryByText("userId")).toBeNull();
  });

  it("exige justificativa antes de registrar uma decisão humana", () => {
    renderAdminPanel();
    const closeButton = screen.getByText("Encerrar sem ação externa") as HTMLButtonElement;
    expect(closeButton.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Justificativa do revisor"), { target: { value: "Contexto revisado de forma factual." } });
    expect(closeButton.disabled).toBe(false);
    fireEvent.click(closeButton);
    expect(resolveMutate).toHaveBeenCalledWith({ signalId: 42, status: "no_external_action", resolutionNote: "Contexto revisado de forma factual." });
  });

  it("permite preparar uma curadoria com proveniência e mantê-la como rascunho", () => {
    renderAdminPanel();
    expect(screen.getByText("IAEA Chornobyl FAQ")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Editar" })[0]);
    fireEvent.click(screen.getByText("Salvar curadoria"));
    expect(upsertEvidenceMutate).toHaveBeenCalledWith(expect.objectContaining({ evidenceKey: "iaea_chornobyl_faq", status: "draft", sourceOrganization: "IAEA" }));
  });

  it("filtra por texto e status e ordena o acervo sem alterar os registros", () => {
    renderAdminPanel();
    fireEvent.change(screen.getByPlaceholderText("Título, chave, fonte ou ambiente"), { target: { value: "yosemite" } });
    expect(screen.getByText("Yosemite Heat Safety")).toBeTruthy();
    expect(screen.queryByText("IAEA Chornobyl FAQ")).toBeNull();

    fireEvent.change(screen.getByPlaceholderText("Título, chave, fonte ou ambiente"), { target: { value: "" } });
    fireEvent.change(screen.getAllByLabelText("Status")[0], { target: { value: "published" } });
    expect(screen.getByText("Yosemite Heat Safety")).toBeTruthy();
    expect(screen.queryByText("IAEA Chornobyl FAQ")).toBeNull();

    fireEvent.change(screen.getAllByLabelText("Status")[0], { target: { value: "all" } });
    fireEvent.change(screen.getByLabelText("Ordenar"), { target: { value: "title_asc" } });
    const titles = within(screen.getByLabelText("Evidências cadastradas")).getAllByRole("heading", { level: 3 }).map(item => item.textContent);
    expect(titles).toEqual(["IAEA Chornobyl FAQ", "Yosemite Heat Safety"]);
  });

  it("bloqueia a tela para uma conta sem papel administrativo", () => {
    useAuth.mockReturnValue({ loading: false, user: { role: "user", name: "Leitor" } });
    useSafetyBoard.mockReturnValue({ isLoading: false, isError: false, data: null });
    useEvidenceCatalog.mockReturnValue({ isLoading: false, isError: false, data: null });
    render(<ReviewPanel />);
    expect(screen.getByText("Acesso restrito")).toBeTruthy();
    expect(useSafetyBoard).toHaveBeenCalledWith(undefined, { enabled: false });
  });
});

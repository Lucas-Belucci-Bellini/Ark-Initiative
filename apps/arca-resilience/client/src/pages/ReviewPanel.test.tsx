import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import ReviewPanel from "./ReviewPanel";

const useAuth = vi.fn();
const useSafetyBoard = vi.fn();
const resolveMutate = vi.fn();
const invalidate = vi.fn();

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => useAuth() }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    administration: {
      safetyBoard: { useQuery: (...args: unknown[]) => useSafetyBoard(...args) },
      resolveSafetySignal: { useMutation: () => ({ mutate: resolveMutate, isPending: false }) },
    },
    useUtils: () => ({ administration: { safetyBoard: { invalidate } } }),
  },
}));

function loadedBoard() {
  return {
    isLoading: false,
    isError: false,
    data: {
      externalDispatch: false,
      openSignals: [{
        id: 42,
        userId: 7,
        conversationId: 8,
        messageId: 9,
        areaKey: "chornobyl_exclusion_zone",
        riskTier: "review_pending" as const,
        reasonCodes: ["restricted_area", "imminent_timeframe"],
        createdAt: new Date("2026-08-14T21:00:00Z"),
        expiresAt: new Date("2026-09-13T21:00:00Z"),
      }],
      assessmentReceipts: [{
        assessmentId: 11,
        areaKey: "restricted_disaster_area",
        riskTier: "review_pending" as const,
        status: "no_external_action" as const,
        reasonCodes: ["restricted_area"],
        createdAt: new Date("2026-08-10T21:00:00Z"),
        reviewedAt: new Date("2026-08-11T21:00:00Z"),
        expiresAt: new Date("2026-09-10T21:00:00Z"),
      }],
    },
  };
}

afterEach(() => { cleanup(); vi.clearAllMocks(); });

describe("ReviewPanel", () => {
  it("expõe apenas metadados de revisão e declara que não há despacho externo", () => {
    useAuth.mockReturnValue({ loading: false, user: { role: "admin", name: "Operador" } });
    useSafetyBoard.mockReturnValue(loadedBoard());
    render(<ReviewPanel />);

    expect(screen.getByText("Canal externo: desativado")).toBeTruthy();
    expect(screen.getByText("chornobyl exclusion zone")).toBeTruthy();
    expect(screen.getByText(/conteúdo de conversa, identidade da pessoa/i)).toBeTruthy();
    expect(screen.queryByText("userId")).toBeNull();
  });

  it("exige justificativa antes de registrar uma decisão humana", () => {
    useAuth.mockReturnValue({ loading: false, user: { role: "admin", name: "Operador" } });
    useSafetyBoard.mockReturnValue(loadedBoard());
    render(<ReviewPanel />);

    const closeButton = screen.getByText("Encerrar sem ação externa") as HTMLButtonElement;
    expect(closeButton.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("Justificativa do revisor"), { target: { value: "Contexto revisado de forma factual." } });
    expect(closeButton.disabled).toBe(false);
    fireEvent.click(closeButton);
    expect(resolveMutate).toHaveBeenCalledWith({ signalId: 42, status: "no_external_action", resolutionNote: "Contexto revisado de forma factual." });
  });

  it("bloqueia a tela para uma conta sem papel administrativo", () => {
    useAuth.mockReturnValue({ loading: false, user: { role: "user", name: "Leitor" } });
    render(<ReviewPanel />);

    expect(screen.getByText("Acesso restrito")).toBeTruthy();
    expect(useSafetyBoard).toHaveBeenCalledWith(undefined, { enabled: false });
  });
});

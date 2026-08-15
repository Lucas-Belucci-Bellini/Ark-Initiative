import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createContext(role: "user" | "admin" = "user"): TrpcContext {
  return {
    user: {
      id: 987654,
      openId: "arca-test-user",
      name: "ARCA Test",
      email: "arca-test@example.com",
      loginMethod: "manus",
      role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => undefined } as TrpcContext["res"],
  };
}

describe("autorização e isolamento do ARCA", () => {
  it("recusa uma conversa antes do consentimento privado", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.assistant.chat({ content: "Quero organizar uma preparação comunitária." })).rejects.toMatchObject({
      code: "PRECONDITION_FAILED",
    });
  });

  it("não expõe uma conversa que não pertence ao usuário autenticado", async () => {
    const caller = appRouter.createCaller(createContext());
    await expect(caller.assistant.messages({ conversationId: 999999999 })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("impede que usuários comuns consultem a fila humana de revisão", async () => {
    const caller = appRouter.createCaller(createContext("user"));
    await expect(caller.administration.reviewQueue()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

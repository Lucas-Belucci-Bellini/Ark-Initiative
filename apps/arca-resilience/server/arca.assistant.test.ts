import { describe, expect, it } from "vitest";
import { ARCA_CONSENT_VERSION } from "./db";
import { ARCA_SYSTEM_PROMPT, classifyRestrictedAreaIntent, formatEvidenceCitations, immediateRiskPattern, restrictedAreaWarning, safeEmergencyReply, validateEvidenceCuration } from "./routers";

describe("guardrails do Assistente ARCA", () => {
  it("marca linguagem de risco imediato para resposta segura", () => {
    expect(immediateRiskPattern.test("Existe perigo imediato para uma pessoa" )).toBe(true);
    expect(immediateRiskPattern.test("Preciso organizar perguntas para a defesa civil" )).toBe(false);
  });

  it("orienta procura de emergência sem solicitar dados pessoais", () => {
    const reply = safeEmergencyReply();
    expect(reply).toContain("serviços locais de emergência");
    expect(reply).toContain("Evite compartilhar localização exata");
  });

  it("mantém o consentimento versionado e separado da conversa", () => {
    expect(ARCA_CONSENT_VERSION).toBe("arca-private-assistance-v1");
  });

  it("proíbe persuasão por medo e detalhes fabricados no uso de evidências", () => {
    expect(ARCA_SYSTEM_PROMPT).toContain("Nunca invente fontes");
    expect(ARCA_SYSTEM_PROMPT).toContain("Não use medo, pressão emocional ou comparação econômica");
  });

  it("anexa somente referências selecionadas e verificáveis à resposta", () => {
    const evidence = [{
      evidenceKey: "EVD-TEST-01",
      sourceOrganization: "Fonte Pública",
      sourceUrl: "https://example.org/fonte",
    }] as Parameters<typeof formatEvidenceCitations>[1];
    const reply = formatEvidenceCitations("Use uma alternativa mais segura.", evidence, ["EVD-TEST-01", "EVD-INEXISTENTE"]);
    expect(reply).toContain("[EVD-TEST-01]");
    expect(reply).toContain("https://example.org/fonte");
    expect(reply).not.toContain("EVD-INEXISTENTE");
  });

  it("bloqueia na curadoria o uso de medo, patrimônio ou quase-morte", () => {
    expect(() => validateEvidenceCuration("Uma pessoa rica quase morreu tentando.", "Use este caso para assustar."))
      .toThrow("não aceita patrimônio pessoal");
    expect(() => validateEvidenceCuration("Relato oficial de risco por calor.", "Explique limites e ofereça alternativas seguras."))
      .not.toThrow();
  });

  it("cria sinal apenas diante de intenção explícita de entrada não autorizada", () => {
    expect(classifyRestrictedAreaIntent("Quero entender a história de Chornobyl.")).toBeNull();
    expect(classifyRestrictedAreaIntent("Quero invadir Chornobyl sem autorização com amigos.")).toMatchObject({
      areaKey: "chornobyl_exclusion_zone",
      riskTier: "preventive",
    });
    expect(classifyRestrictedAreaIntent("Amanhã vamos invadir Chornobyl sem permissão.")).toMatchObject({
      riskTier: "review_pending",
    });
  });

  it("explica que a revisão humana não envia denúncia automática", () => {
    const warning = restrictedAreaWarning("chornobyl_exclusion_zone", true);
    expect(warning).toContain("não dispara contato automático com autoridades");
    expect(warning).toContain("Não posso ajudar a planejar");
    expect(warning).toContain("https://www.iaea.org/topics/chornobyl/faqs");
  });
});

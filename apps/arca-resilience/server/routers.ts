import { COOKIE_NAME } from "@shared/const";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM, listLLMModels } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import * as db from "./db";
import { describeEventRisk, getOperationalHazardSnapshot } from "./publicHazards";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";

let cachedAssistantModel: string | null = null;

async function getAssistantModel() {
  if (cachedAssistantModel) return cachedAssistantModel;
  const { data } = await listLLMModels();
  const preferred = data.find(model => model.id === "gpt-5-mini") ?? data.find(model => model.id.startsWith("gpt-5-"));
  if (!preferred) throw new Error("No compatible model is currently available");
  cachedAssistantModel = preferred.id;
  return cachedAssistantModel;
}

export const ARCA_SYSTEM_PROMPT = `Você é o Assistente ARCA, um apoio informacional de resiliência climática e proteção civil. Ajude pessoas a estruturar problemas, identificar incertezas, preparar perguntas para autoridades e encontrar próximos passos seguros. Seja claro sobre limites: você não tem acesso a dados em tempo real, não substitui autoridades, equipes de emergência, profissionais de saúde, advogados ou especialistas locais. Nunca invente fontes, dados, localização, patrimônio, relatos de quase-acidente ou capacidade operacional. Não use medo, pressão emocional ou comparação econômica para convencer alguém. Quando o acervo de evidências trouxer um caso pertinente, explique o fato de forma respeitosa, identifique a fonte pelo código e URL e conecte-o a uma limitação concreta; se não for pertinente, não cite o caso. Não forneça instruções para violência, armas, seleção de alvos, perseguição, sabotagem ou ações militares ofensivas. Não peça endereços exatos, documentos, credenciais, dados médicos ou outras informações pessoais desnecessárias. Se houver risco imediato à vida, violência, emergência médica ou desastre em curso, oriente a procurar os serviços locais de emergência e autoridades competentes agora. Responda em português brasileiro, com linguagem humana, prudente e orientada a ações civis seguras.`;

export const immediateRiskPattern = /suicid|me matar|matar algu[eé]m|atirar|ataque|explosiv|bomba|sequestro|perigo imediato|emerg[eê]ncia agora/i;
const restrictedAreaPattern = /chernobyl|chornobyl|zona de exclus[aã]o|zona de quarentena|[aá]rea de desastre|[aá]rea contaminada/i;
const unauthorizedEntryPattern = /entrar|invadir|passar|acessar|ir|visitar|explorar|entrar escondido|sem autoriza[cç][aã]o|sem permiss[aã]o/i;
const explicitUnauthorizedPattern = /sem autoriza[cç][aã]o|sem permiss[aã]o|escondido|burlar|driblar|invadir/i;
const imminentPattern = /hoje|amanh[aã]|esta noite|agora|j[aá] comprei|j[aá] estou indo|parto|partimos/i;
const coerciveCurationPattern = /\b(rico|rica|milion[aá]ri[oa]|bilion[aá]ri[oa]|patrim[oô]nio|quase morreu|quase morrer|amedront|p[aâ]nico|terror)\b/i;

type CuratedEvidence = Awaited<ReturnType<typeof db.getPublishedArcaEvidence>>[number];

export function validateEvidenceCuration(factualSummary: string, operationalLesson: string) {
  if (coerciveCurationPattern.test(`${factualSummary}\n${operationalLesson}`)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "O acervo não aceita patrimônio pessoal, relato de quase-morte ou linguagem de medo como técnica de persuasão.",
    });
  }
}

export function formatEvidenceCitations(answer: string, evidence: CuratedEvidence[], evidenceKeys: string[]) {
  const selected = evidence.filter(item => evidenceKeys.includes(item.evidenceKey));
  if (selected.length === 0) return answer;
  const references = selected.map(item => `- [${item.evidenceKey}] ${item.sourceOrganization}: ${item.sourceUrl}`).join("\n");
  return `${answer}\n\n**Fontes consultadas**\n${references}`;
}

export function safeEmergencyReply() {
  return "Não posso coordenar uma resposta de emergência ou orientar ações perigosas. Se existe risco imediato para você ou outra pessoa, procure agora os serviços locais de emergência, a defesa civil, autoridades competentes ou uma pessoa de confiança no local. Evite compartilhar localização exata, documentos ou credenciais nesta conversa.";
}

export function classifyRestrictedAreaIntent(content: string) {
  if (!restrictedAreaPattern.test(content) || !unauthorizedEntryPattern.test(content) || !explicitUnauthorizedPattern.test(content)) return null;
  const areaKey = /chernobyl|chornobyl/i.test(content) ? "chornobyl_exclusion_zone" : "restricted_disaster_area";
  const imminent = imminentPattern.test(content);
  return {
    areaKey,
    riskTier: imminent ? "review_pending" as const : "preventive" as const,
    reasonCodes: imminent
      ? ["restricted_area", "explicit_unauthorized_entry", "imminent_timeframe"]
      : ["restricted_area", "explicit_unauthorized_entry"],
  };
}

export function restrictedAreaWarning(areaKey: string, reviewPending: boolean) {
  const label = areaKey === "chornobyl_exclusion_zone" ? "a Zona de Exclusão de Chornobyl" : "uma área restrita de desastre";
  const sources = areaKey === "chornobyl_exclusion_zone"
    ? "Fontes oficiais: IAEA — https://www.iaea.org/topics/chornobyl/faqs ; SSE Chornobyl NPP — https://chnpp.gov.ua/en/home."
    : "Consulte exclusivamente autoridades competentes e os canais oficiais de proteção civil do local.";
  const reviewMessage = reviewPending
    ? "Como a mensagem descreve uma intenção explícita e iminente, ela foi registrada apenas na fila privada de revisão de segurança do ARCA. Isso não dispara contato automático com autoridades."
    : "O ARCA não contata autoridades automaticamente por uma conversa; o registro permanece privado e expira conforme a política de retenção.";
  return `Não posso ajudar a planejar, viabilizar ou orientar entrada não autorizada em ${label}. Esses locais podem ter riscos variáveis, restrições legais e operações de segurança em curso. Interrompa esse plano e consulte somente canais oficiais para informações atualizadas e alternativas seguras. ${sources} ${reviewMessage}`;
}

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  operational: router({
    overview: publicProcedure.query(async () => {
      const snapshot = await getOperationalHazardSnapshot();
      return {
        ...snapshot,
        alerts: snapshot.events.map(event => ({
          source: event.source,
          sourceEventId: event.sourceEventId,
          observedAt: event.observedAt,
          risk: describeEventRisk(event),
        })),
      };
    }),
  }),
  assistant: router({
    consent: protectedProcedure.query(async ({ ctx }) => ({
      accepted: await db.hasArcaPrivateConsent(ctx.user.id),
      policyVersion: db.ARCA_CONSENT_VERSION,
    })),
    acceptConsent: protectedProcedure.mutation(async ({ ctx }) => {
      await db.ensureArcaProfile(ctx.user.id, ctx.user.name);
      await db.acceptArcaPrivateConsent(ctx.user.id);
      return { accepted: true } as const;
    }),
    conversations: protectedProcedure.query(async ({ ctx }) => db.getArcaConversations(ctx.user.id)),
    messages: protectedProcedure.input(z.object({ conversationId: z.number().int().positive() })).query(async ({ ctx, input }) => {
      const conversation = await db.getOwnedArcaConversation(ctx.user.id, input.conversationId);
      if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Conversa não encontrada" });
      return db.getArcaMessages(ctx.user.id, input.conversationId);
    }),
    chat: protectedProcedure.input(z.object({
      content: z.string().trim().min(1).max(1800),
      conversationId: z.number().int().positive().optional(),
    })).mutation(async ({ ctx, input }) => {
      const hasConsent = await db.hasArcaPrivateConsent(ctx.user.id);
      if (!hasConsent) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Aceite o termo de privacidade antes de iniciar uma conversa." });

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentMessageCount = await db.countArcaMessagesSince(ctx.user.id, oneHourAgo);
      if (recentMessageCount >= db.ARCA_HOURLY_CHAT_LIMIT) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Limite de mensagens por hora atingido. Tente novamente mais tarde." });
      }

      const conversationId = input.conversationId ?? await db.createArcaConversation(ctx.user.id, "Conversa ARCA");
      if (input.conversationId) {
        const conversation = await db.getOwnedArcaConversation(ctx.user.id, input.conversationId);
        if (!conversation) throw new TRPCError({ code: "NOT_FOUND", message: "Conversa não encontrada" });
      }

      const requiresReview = immediateRiskPattern.test(input.content);
      const restrictedAreaIntent = classifyRestrictedAreaIntent(input.content);
      const userMessageId = await db.addArcaMessage(ctx.user.id, conversationId, "user", input.content, requiresReview || restrictedAreaIntent?.riskTier === "review_pending" ? "needs_review" : "normal");
      await db.writeArcaAuditEvent(ctx.user.id, "assistant.message_received", "conversation", String(conversationId), { requiresReview });

      if (requiresReview) {
        const reply = safeEmergencyReply();
        await db.addArcaMessage(ctx.user.id, conversationId, "assistant", reply, "blocked");
        await db.writeArcaAuditEvent(ctx.user.id, "assistant.safety_response", "conversation", String(conversationId));
        return { conversationId, reply, safetyStatus: "blocked" as const };
      }

      if (restrictedAreaIntent) {
        await db.createArcaSafetySignal({
          userId: ctx.user.id,
          conversationId,
          messageId: userMessageId,
          areaKey: restrictedAreaIntent.areaKey,
          riskTier: restrictedAreaIntent.riskTier,
          reasonCodes: restrictedAreaIntent.reasonCodes,
        });
        const reply = restrictedAreaWarning(restrictedAreaIntent.areaKey, restrictedAreaIntent.riskTier === "review_pending");
        await db.addArcaMessage(ctx.user.id, conversationId, "assistant", reply, "blocked");
        return { conversationId, reply, safetyStatus: "blocked" as const };
      }

      try {
        const context = await db.getArcaRecentContext(ctx.user.id, conversationId);
        const model = await getAssistantModel();
        const evidence = await db.getPublishedArcaEvidence();
        const evidenceContext = evidence.length === 0
          ? "Nenhum caso publicado está disponível no acervo para esta resposta."
          : evidence.map(item => `[${item.evidenceKey}] ${item.title}\nOrganização: ${item.sourceOrganization}\nAmbiente: ${item.environment}\nResumo factual: ${item.factualSummary}\nLição: ${item.operationalLesson}\nURL: ${item.sourceUrl}`).join("\n\n");
        const response = await invokeLLM({
          model,
          maxTokens: 700,
          messages: [
            { role: "system", content: `${ARCA_SYSTEM_PROMPT}\n\nACERVO CURADO DE EVIDÊNCIAS:\n${evidenceContext}` },
            ...context.map(message => ({ role: message.role as "user" | "assistant", content: message.content })),
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "arca_response",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  answer: { type: "string" },
                  evidenceKeys: { type: "array", items: { type: "string" }, maxItems: 3 },
                },
                required: ["answer", "evidenceKeys"],
                additionalProperties: false,
              },
            },
          },
        });
        const output = response.choices[0]?.message?.content;
        const parsed = typeof output === "string" ? JSON.parse(output) as { answer?: unknown; evidenceKeys?: unknown } : null;
        const answer = typeof parsed?.answer === "string" ? parsed.answer.trim() : "";
        const evidenceKeys = Array.isArray(parsed?.evidenceKeys)
          ? parsed.evidenceKeys.filter((key): key is string => typeof key === "string")
          : [];
        const reply = answer ? formatEvidenceCitations(answer, evidence, evidenceKeys) : "Não consegui produzir uma resposta agora. Tente novamente em alguns instantes.";
        await db.addArcaMessage(ctx.user.id, conversationId, "assistant", reply);
        await db.writeArcaAuditEvent(ctx.user.id, "assistant.response_created", "conversation", String(conversationId), { model });
        return { conversationId, reply, safetyStatus: "normal" as const };
      } catch (error) {
        await db.writeArcaAuditEvent(ctx.user.id, "assistant.response_failed", "conversation", String(conversationId));
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "O assistente está indisponível no momento. Tente novamente mais tarde." });
      }
    }),
  }),
  administration: router({
    reviewQueue: adminProcedure.query(() => db.getArcaReviewQueue()),
    markReviewed: adminProcedure.input(z.object({ messageId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      await db.markArcaMessageReviewed(ctx.user.id, input.messageId);
      return { success: true } as const;
    }),
    setOperationalRole: adminProcedure.input(z.object({
      userId: z.number().int().positive(),
      role: z.enum(["member", "operator", "steward"]),
    })).mutation(async ({ ctx, input }) => {
      await db.setArcaOperationalRole(ctx.user.id, input.userId, input.role);
      return { success: true } as const;
    }),
    upsertEvidence: adminProcedure.input(z.object({
      evidenceKey: z.string().trim().min(4).max(80),
      title: z.string().trim().min(8).max(240),
      environment: z.string().trim().min(3).max(120),
      sourceOrganization: z.string().trim().min(3).max(180),
      sourceUrl: z.string().url().max(1000),
      sourcePublishedAt: z.date().nullable().optional(),
      factualSummary: z.string().trim().min(30).max(4000),
      operationalLesson: z.string().trim().min(20).max(2000),
      evidenceTier: z.enum(["official", "peer_reviewed", "institutional"]),
      status: z.enum(["draft", "published", "archived"]),
    })).mutation(async ({ ctx, input }) => {
      validateEvidenceCuration(input.factualSummary, input.operationalLesson);
      await db.upsertArcaEvidence(ctx.user.id, input);
      return { success: true } as const;
    }),
    safetySignals: adminProcedure.query(() => db.getOpenArcaSafetySignals()),
    safetyBoard: adminProcedure.query(async () => ({
      openSignals: await db.getOpenArcaSafetySignals(),
      assessmentReceipts: await db.getArcaAssessmentReceiptsV1(),
      externalDispatch: false as const,
    })),
    evidenceCatalog: adminProcedure.query(() => db.getArcaEvidenceForCuration()),
    resolveSafetySignal: adminProcedure.input(z.object({
      signalId: z.number().int().positive(),
      status: z.enum(["resolved", "no_external_action"]),
      resolutionNote: z.string().trim().min(10).max(2000),
    })).mutation(async ({ ctx, input }) => {
      await db.resolveArcaSafetySignal(ctx.user.id, input.signalId, input.status, input.resolutionNote);
      return { success: true } as const;
    }),
    purgeExpired: adminProcedure.mutation(async () => db.purgeExpiredArcaData()),
  }),
});

export type AppRouter = typeof appRouter;

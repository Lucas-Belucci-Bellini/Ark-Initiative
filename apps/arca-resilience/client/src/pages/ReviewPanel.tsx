/** Design: Atlas de Campo Planetário — revisão humana, rastreável e sem despacho externo. */
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, CheckCircle2, ClipboardCheck, FileClock, LockKeyhole, ShieldCheck } from "lucide-react";
import React, { useState } from "react";
import "./ReviewPanel.css";

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function reasonLabels(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").join(" · ") : "classificação registrada";
}

export default function ReviewPanel() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  const board = trpc.administration.safetyBoard.useQuery(undefined, { enabled: isAdmin });
  const utils = trpc.useUtils();
  const resolve = trpc.administration.resolveSafetySignal.useMutation({
    onSuccess: () => utils.administration.safetyBoard.invalidate(),
  });
  const [notes, setNotes] = useState<Record<number, string>>({});

  if (loading) return <div className="review-loading">Carregando sessão de revisão…</div>;
  if (!user) return <div className="review-loading"><div><LockKeyhole size={26} /><h1>Revisão protegida</h1><p>Entre com uma conta autorizada para abrir o painel.</p><button onClick={() => startLogin()}>Entrar para revisar</button></div></div>;
  if (!isAdmin) return <div className="review-loading"><div><ShieldCheck size={26} /><h1>Acesso restrito</h1><p>Somente administradores ARCA podem revisar sinais de risco. Nenhuma ação externa é realizada por esta tela.</p><a href="/assistente">Voltar ao Assistente ARCA</a></div></div>;
  if (board.isLoading) return <div className="review-loading">Carregando sinais privados…</div>;
  if (board.isError || !board.data) return <div className="review-loading">Não foi possível carregar a fila de revisão agora.</div>;

  const resolveSignal = (signalId: number, status: "resolved" | "no_external_action") => {
    const note = notes[signalId]?.trim() ?? "";
    if (note.length < 10) return;
    resolve.mutate({ signalId, status, resolutionNote: note });
  };

  return <div className="review-page">
    <header className="review-header"><a href="/operacoes"><ArrowLeft size={15} /> Painel operacional</a><div><span>ARCA / REVISÃO HUMANA</span><strong>Decisão registrada, não despacho</strong></div><a href="/seguranca">Política de segurança</a></header>
    <main className="review-main">
      <section className="review-intro"><div><p className="eyebrow"><span /> CONTROLE HUMANO / ACESSO ADMINISTRATIVO</p><h1>Revisar um sinal não é comunicar uma autoridade.</h1><p>Esta fila apresenta somente classificação, área, tempo e motivo. Conteúdo de conversa, identidade da pessoa e dados de localização não são exibidos aqui.</p></div><div className="review-guardrail"><LockKeyhole size={20} /><div><b>Canal externo: desativado</b><span>{board.data.externalDispatch ? "Indisponível" : "Nenhuma integração externa configurada"}</span></div></div></section>

      <section className="review-board"><div className="review-rail"><p>FILA PENDENTE</p><strong>{board.data.openSignals.length}</strong><span>sinais requerem registro humano</span><div className="rail-rule" /><small>Retenção limitada · motivo obrigatório · recibo auditável</small></div><div className="review-list">
        {board.data.openSignals.length === 0 ? <div className="review-empty"><CheckCircle2 size={24} /><h2>Nenhum sinal aberto</h2><p>A fila está vazia. Quando um sinal explícito e iminente requerer revisão, ele aparecerá sem comunicação externa automática.</p></div> : board.data.openSignals.map(signal => <article key={signal.id} className="review-item"><div className="review-item-meta"><span className={signal.riskTier === "review_pending" ? "tier-pending" : "tier-preventive"}>{signal.riskTier === "review_pending" ? "REVISÃO PENDENTE" : "PREVENTIVO"}</span><small>{formatDate(signal.createdAt)} · expira em {formatDate(signal.expiresAt)}</small></div><h2>{signal.areaKey.replaceAll("_", " ")}</h2><p className="reason-line"><AlertTriangle size={15} /> {reasonLabels(signal.reasonCodes)}</p><label htmlFor={`note-${signal.id}`}>Justificativa do revisor</label><textarea id={`note-${signal.id}`} value={notes[signal.id] ?? ""} onChange={event => setNotes(current => ({ ...current, [signal.id]: event.target.value }))} placeholder="Registre fatos verificados, limites e decisão. Mínimo de 10 caracteres." maxLength={2000} /><div className="review-actions"><button className="secondary-review" onClick={() => resolveSignal(signal.id, "no_external_action")} disabled={(notes[signal.id]?.trim().length ?? 0) < 10 || resolve.isPending}>Encerrar sem ação externa</button><button className="primary-review" onClick={() => resolveSignal(signal.id, "resolved")} disabled={(notes[signal.id]?.trim().length ?? 0) < 10 || resolve.isPending}>Registrar revisão interna</button></div></article>)}</div></section>

      <section className="receipt-section"><div><p className="eyebrow"><span /> RECIBOS DE AVALIAÇÃO / VIEW V1</p><h2>Histórico agregado de decisões concluídas</h2></div><div className="receipt-list">{board.data.assessmentReceipts.length === 0 ? <p>Nenhum recibo de avaliação publicado ainda.</p> : board.data.assessmentReceipts.map(receipt => <div key={receipt.assessmentId}><FileClock size={16} /><span>{receipt.areaKey.replaceAll("_", " ")}</span><b>{receipt.status === "no_external_action" ? "sem ação externa" : "revisado"}</b><small>{receipt.reviewedAt ? formatDate(receipt.reviewedAt) : "sem revisão"}</small></div>)}</div></section>

      <section className="review-tutorial"><p className="eyebrow"><span /> GUIA DE USO</p><ol><li><b>01</b><span>Leia os motivos e confirme se o sinal tem contexto suficiente.</span></li><li><b>02</b><span>Registre uma justificativa factual, sem inferir identidade ou intenção além do dado disponível.</span></li><li><b>03</b><span>Encerre sem ação externa ou registre a revisão interna; qualquer canal institucional exige fluxo separado e autorizado.</span></li></ol></section>
    </main>
  </div>;
}

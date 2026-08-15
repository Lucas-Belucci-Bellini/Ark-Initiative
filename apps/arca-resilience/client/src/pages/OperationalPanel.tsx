/**
 * Design: Atlas de Campo Planetário aplicado a um console público de risco.
 * Sinais, fontes e limitações são mais importantes que efeitos de comando.
 */
import OperationalMap, { type MapHazardEvent } from "@/components/OperationalMap";
import { alertLevelCode, loadArcaRiskCore } from "@/lib/arcaRiskCore";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowLeft, ArrowUpRight, Bot, CircleDot, Database, Loader2, MapPinned, RefreshCw, ShieldCheck, Wifi } from "lucide-react";
import React from "react";
import { useEffect, useMemo, useState } from "react";
import "./OperationalPanel.css";

type RiskTier = "monitorar" | "atenção" | "elevado" | "crítico";

const tierByCode: Record<number, RiskTier> = { 0: "monitorar", 1: "atenção", 2: "elevado", 3: "crítico" };
const tierCopy: Record<RiskTier, string> = {
  monitorar: "Monitoramento informativo",
  atenção: "Atenção preventiva",
  elevado: "Atenção elevada",
  crítico: "Sinal crítico para consulta oficial",
};

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function sourceLabel(source: "gdacs" | "usgs") {
  return source === "gdacs" ? "GDACS / multirriscos" : "USGS / sismos";
}

export default function OperationalPanel() {
  const overview = trpc.operational.overview.useQuery(undefined, { refetchOnWindowFocus: false });
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [wasmReady, setWasmReady] = useState(false);
  const [wasmPacketFresh, setWasmPacketFresh] = useState<boolean | null>(null);
  const [wasmTierById, setWasmTierById] = useState<Record<string, RiskTier>>({});

  useEffect(() => {
    let alive = true;
    loadArcaRiskCore()
      .then(core => {
        if (!alive || !overview.data) return;
        const nextTiers: Record<string, RiskTier> = {};
        overview.data.events.forEach(event => {
          const magnitudeX10 = event.magnitude === null ? 0 : Math.round(event.magnitude * 10);
          nextTiers[event.sourceEventId] = tierByCode[core.classify_public_risk(alertLevelCode(event.alertLevel), magnitudeX10)] ?? "monitorar";
        });
        setWasmTierById(nextTiers);
        const cacheAgeMinutes = overview.data.lastCacheAt
          ? Math.max(0, Math.floor((Date.now() - new Date(overview.data.lastCacheAt).getTime()) / 60_000))
          : Number.MAX_SAFE_INTEGER;
        setWasmPacketFresh(core.packet_is_fresh(cacheAgeMinutes, overview.data.cacheWindowMinutes) === 1);
        setWasmReady(true);
      })
      .catch(() => setWasmReady(false));
    return () => { alive = false; };
  }, [overview.data]);

  useEffect(() => {
    if (!selectedEventId && overview.data?.events[0]) setSelectedEventId(overview.data.events[0].sourceEventId);
  }, [overview.data, selectedEventId]);

  const mapEvents = useMemo<MapHazardEvent[]>(() => overview.data?.events.map(event => ({
    source: event.source,
    sourceEventId: event.sourceEventId,
    title: event.title,
    hazardType: event.hazardType,
    alertLevel: event.alertLevel,
    magnitude: event.magnitude,
    latitude: event.latitude,
    longitude: event.longitude,
  })) ?? [], [overview.data]);

  const selected = overview.data?.events.find(event => event.sourceEventId === selectedEventId) ?? overview.data?.events[0];
  const selectedAlert = overview.data?.alerts.find(alert => alert.sourceEventId === selected?.sourceEventId);
  const selectedTier = selected ? wasmTierById[selected.sourceEventId] ?? selectedAlert?.risk.tier ?? "monitorar" : "monitorar";

  if (overview.isLoading) {
    return <div className="operational-loading"><Loader2 size={24} className="spin" /> Conectando às fontes públicas de risco…</div>;
  }

  if (overview.isError || !overview.data) {
    return <div className="operational-loading"><AlertTriangle size={24} /> Não foi possível carregar o painel agora. Tente novamente mais tarde.</div>;
  }

  return (
    <div className="operational-page">
      <header className="operational-header">
        <a href="/" className="operational-back"><ArrowLeft size={15} /> Voltar ao Atlas</a>
        <div className="operational-title"><span>ARCA / PAINEL OPERACIONAL</span><strong>Risco público, não comando</strong></div>
        <button className="refresh-button" onClick={() => overview.refetch()} disabled={overview.isFetching}>
          <RefreshCw size={15} className={overview.isFetching ? "spin" : ""} /> Atualizar
        </button>
      </header>

      <main className="operational-main">
        <section className="operational-intro">
          <div>
            <p className="eyebrow"><span></span> LEITURA PÚBLICA / GDACS + USGS</p>
            <h1>Veja o sinal. Confira a origem. Decida com autoridade humana.</h1>
            <p>Este painel reúne alertas públicos globais e sísmicos, mantendo separadas a observação técnica, o contexto histórico e qualquer decisão de resposta.</p>
          </div>
          <div className="panel-status-strip">
            <div><Wifi size={17} /><span>janela de cache</span><strong>{overview.data.cacheWindowMinutes} min</strong></div>
            <div><Database size={17} /><span>último pacote</span><strong>{overview.data.lastCacheAt ? formatDate(overview.data.lastCacheAt) : "sem cache"}</strong></div>
            <div><Bot size={17} /><span>núcleo local</span><strong>{wasmReady ? wasmPacketFresh ? "Rust/Wasm · pacote válido" : "Rust/Wasm · pacote vencido" : "validação JS disponível"}</strong></div>
          </div>
        </section>

        <section className="source-statuses" aria-label="Estado das fontes">
          {overview.data.sources.map(source => <div key={source.source} className={`source-status ${source.status}`}><CircleDot size={14} /><b>{source.source.toUpperCase()}</b><span>{source.status === "fresh" ? "atualizado" : source.status === "cached" ? "cache válido" : "indisponível"}</span><small>{source.message}</small></div>)}
        </section>

        <section className="operational-workspace">
          <div className="map-column">
            <OperationalMap events={mapEvents} selectedEventId={selected?.sourceEventId ?? null} onSelect={setSelectedEventId} />
            <p className="map-caption"><MapPinned size={15} /> Marcadores representam eventos publicados pelas fontes. A posição não representa uma rota segura, uma zona de evacuação ou uma área de operação.</p>
          </div>

          <aside className="event-rail" aria-label="Eventos recentes">
            <div className="rail-heading"><span>EVENTOS PUBLICADOS</span><b>{overview.data.events.length}</b></div>
            <div className="event-list">
              {overview.data.events.slice(0, 14).map(event => {
                const tier = wasmTierById[event.sourceEventId] ?? overview.data.alerts.find(alert => alert.sourceEventId === event.sourceEventId)?.risk.tier ?? "monitorar";
                return <button key={`${event.source}-${event.sourceEventId}`} onClick={() => setSelectedEventId(event.sourceEventId)} className={event.sourceEventId === selected?.sourceEventId ? "event-selected" : ""}>
                  <span className={`tier-dot tier-${tier}`} />
                  <div><small>{sourceLabel(event.source)} · {event.hazardType}</small><strong>{event.title}</strong><em>{event.magnitude !== null ? `M ${event.magnitude.toFixed(1)} · ` : ""}{formatDate(event.observedAt)}</em></div>
                </button>;
              })}
            </div>
          </aside>
        </section>

        {selected && selectedAlert && <section className="preventive-alert-grid">
          <article className={`preventive-alert tier-${selectedTier}`}>
            <p className="eyebrow"><span></span> ALERTA PREVENTIVO / EXPLICÁVEL</p>
            <div className="alert-title-row"><h2>{tierCopy[selectedTier]}</h2><span>{selectedTier.toUpperCase()}</span></div>
            <h3>{selectedAlert.risk.title}</h3>
            <p>{selectedAlert.risk.rationale}</p>
            <a href={selectedAlert.risk.sourceUrl} target="_blank" rel="noreferrer">Abrir fonte {selectedAlert.risk.sourceName} <ArrowUpRight size={15} /></a>
          </article>
          <article className="alert-limit">
            <ShieldCheck size={23} />
            <div><h2>Limite de decisão</h2><p>{selectedAlert.risk.limitations}</p><p>O painel usa regras determinísticas publicadas e o histórico agregado abaixo como contexto, não como previsão individual.</p></div>
          </article>
        </section>}

        <section className="rescue-context">
          <div className="rescue-context-heading"><p className="eyebrow"><span></span> CONTEXTO DE RESGATE / DADO AGREGADO</p><h2>Aprender com registros sem expor quem precisou de ajuda.</h2><p>As contagens são históricas, agregadas e específicas à cobertura publicada da fonte. Elas não estimam a chance de resgate no evento selecionado.</p></div>
          <div className="rescue-metrics">
            {overview.data.rescueHistory.map(item => <a key={item.aggregateKey} href={item.sourceUrl} target="_blank" rel="noreferrer"><span>{item.incidentCategory}</span><strong>{item.incidentCount.toLocaleString("pt-BR")}</strong><small>{new Date(item.coverageStart).getUTCFullYear()}–{new Date(item.coverageEnd).getUTCFullYear()} · {item.sourceOrganization}</small><ArrowUpRight size={15} /></a>)}
          </div>
        </section>

        <section className="operational-tutorial">
          <p className="eyebrow"><span></span> COMO USAR O PAINEL</p>
          <ol><li><b>01</b><span>Selecione um evento no mapa ou na lista para ler fonte, horário e classificação.</span></li><li><b>02</b><span>Abra a fonte primária antes de compartilhar ou agir sobre o alerta.</span></li><li><b>03</b><span>Use o contexto histórico para preparar perguntas, nunca para substituir orientação local.</span></li></ol>
        </section>
      </main>
    </div>
  );
}

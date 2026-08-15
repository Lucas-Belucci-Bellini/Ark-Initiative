/**
 * Design: mapa operacional ARCA — sinais públicos no território, sem dados de
 * usuário, rotas privadas ou comandos de despacho.
 */

export type MapHazardEvent = {
  source: "gdacs" | "usgs";
  sourceEventId: string;
  title: string;
  hazardType: string;
  alertLevel: "green" | "yellow" | "orange" | "red" | "unknown";
  magnitude: number | null;
  latitude: number;
  longitude: number;
};

const markerColor = {
  green: "#16856f",
  yellow: "#e2ac43",
  orange: "#d97a3a",
  red: "#c64b43",
  unknown: "#61716a",
};

export default function OperationalMap({ events, selectedEventId, onSelect }: {
  events: MapHazardEvent[];
  selectedEventId: string | null;
  onSelect: (eventId: string) => void;
}) {
  return (
    <div className="operational-map-shell" aria-label="Mapa global de eventos públicos">
      <div className="operational-map" role="img" aria-label="Carta global em projeção equiretangular com marcadores de eventos públicos">
        <div className="map-latitude-label north">90°N</div><div className="map-latitude-label equator">0°</div><div className="map-latitude-label south">90°S</div>
        <div className="map-longitude-label west">180°W</div><div className="map-longitude-label prime">0°</div><div className="map-longitude-label east">180°E</div>
        <div className="map-field-stamp">ARCA / CARTA PÚBLICA<br />COORDENADAS NORMALIZADAS</div>
        {events.map(event => {
          const left = Math.max(2, Math.min(98, ((event.longitude + 180) / 360) * 100));
          const top = Math.max(3, Math.min(97, ((90 - event.latitude) / 180) * 100));
          const active = event.sourceEventId === selectedEventId;
          return <button
            key={`${event.source}-${event.sourceEventId}`}
            className={`map-event-marker ${active ? "map-event-selected" : ""}`}
            style={{ left: `${left}%`, top: `${top}%`, backgroundColor: markerColor[event.alertLevel] }}
            onClick={() => onSelect(event.sourceEventId)}
            title={`${event.title} — ${event.source.toUpperCase()}`}
            aria-label={`Selecionar ${event.title}`}
          ><span>{event.hazardType}</span></button>;
        })}
      </div>
      <div className="operational-map-key" aria-label="Legenda de risco">
        <span><i className="risk-red" /> crítico</span>
        <span><i className="risk-orange" /> elevado</span>
        <span><i className="risk-yellow" /> atenção</span>
        <span><i className="risk-green" /> monitorar</span>
      </div>
    </div>
  );
}

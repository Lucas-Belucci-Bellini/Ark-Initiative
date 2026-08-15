/**
 * ARCA Field Core loader — Rust/WebAssembly only validates presentation tiers
 * and cache freshness. All emergency authority remains with human institutions.
 */
const ARCA_RISK_WASM_URL = "/manus-storage/arca-risk-core_721b356f.wasm";

type ArcaRiskExports = {
  classify_public_risk: (alertLevel: number, magnitudeX10: number) => number;
  packet_is_fresh: (ageMinutes: number, maxAgeMinutes: number) => number;
};

let corePromise: Promise<ArcaRiskExports> | null = null;

export function loadArcaRiskCore() {
  if (!corePromise) {
    corePromise = fetch(ARCA_RISK_WASM_URL)
      .then(response => {
        if (!response.ok) throw new Error("Não foi possível carregar o núcleo local ARCA.");
        return response.arrayBuffer();
      })
      .then(bytes => WebAssembly.instantiate(bytes))
      .then(instance => instance.instance.exports as unknown as ArcaRiskExports);
  }
  return corePromise;
}

export function alertLevelCode(level: "green" | "yellow" | "orange" | "red" | "unknown") {
  return { unknown: 0, green: 1, yellow: 2, orange: 3, red: 4 }[level];
}

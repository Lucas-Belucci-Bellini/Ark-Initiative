# Validação visual do painel operacional

## Desktop — 15 de agosto de 2026

O resumo público carregou com eventos GDACS, métricas agregadas NPS, alerta preventivo com fonte, status de cache e confirmação de núcleo Rust/WebAssembly ativo. O mapa baseado em provedor externo não renderizou o mosaico durante a captura, apesar de a lista e a seleção de eventos estarem disponíveis. A próxima revisão deve oferecer uma camada cartográfica local de fallback para garantir leitura de coordenadas e seleção de eventos sem depender do carregamento do provedor externo.

## Correção aplicada

O painel passou a usar uma carta equiretangular local com grade de latitude/longitude, referências territoriais abstratas e marcadores interativos. A captura em desktop confirmou a leitura de eventos, alerta explicável, limite de decisão e contexto NPS. A captura em tela móvel confirmou que a carta, lista de eventos, alerta e métricas agregadas se reorganizam sem sobreposição.

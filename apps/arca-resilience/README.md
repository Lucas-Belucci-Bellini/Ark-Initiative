# Aplicação ARCA — Painel Operacional

Esta pasta contém a aplicação web do Projeto ARCA. Ela reúne uma landing page pública, o Assistente ARCA com salvaguardas de privacidade e o painel operacional em `/operacoes`.

O painel consulta dados públicos em modo somente leitura. O **GDACS** fornece eventos multirriscos globais e o **USGS** complementa os eventos sísmicos. O cache mantém origem, horário e URL de cada sinal. As métricas históricas de busca e resgate são armazenadas apenas em forma agregada; conversas privadas e localizações de usuários não são usadas no painel.

> O ARCA informa e contextualiza. Ele não emite ordens de evacuação, não despacha equipes e não substitui órgãos oficiais ou autoridades humanas.

## Executar localmente

Instale dependências com `pnpm install`. Configure as variáveis de autenticação e banco previstas pelo template, aplique as migrações em `drizzle/` ao banco MySQL/TiDB compatível e execute `pnpm dev`. A suíte completa é executada com `pnpm test`; `pnpm check` faz a verificação de tipos e `pnpm build` produz o build de produção.

## Rust/WebAssembly

O núcleo determinístico fica em `rust/arca_risk_core`. Ele classifica a ênfase visual de eventos públicos e verifica a idade de pacotes em cache. Para recompilar, instale o alvo `wasm32-unknown-unknown` e execute:

```bash
cd rust/arca_risk_core
cargo build --release --target wasm32-unknown-unknown
```

O arquivo resultante deve ser hospedado como ativo estático e a URL deve substituir `ARCA_RISK_WASM_URL` em `client/src/lib/arcaRiskCore.ts`. Se o artefato não estiver disponível, a interface continua com validação de fallback no cliente, sem tomar decisões operacionais.

## Fontes e limites

As referências, endpoints e limites dos conectores estão em `research/public_operational_sources.md`. A documentação de dados, privacidade e arquitetura Rust está em `docs/ARCA_RESCUE_DATA_RUST_ARCHITECTURE.md`.

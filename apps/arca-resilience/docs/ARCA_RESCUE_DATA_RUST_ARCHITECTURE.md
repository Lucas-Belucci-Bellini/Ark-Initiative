# ARCA — Arquitetura de Dados, Decisão Assistida e Interface Rust

**Status:** proposta técnica inicial.  
**Escopo:** apoio à consciência situacional, preparação e coordenação autorizada.  
**Limite fundamental:** o ARCA **não** despacha equipes, não triagem pacientes, não substitui comando de incidente e não publica alertas oficiais por conta própria.

## 1. Modelo de integração do banco de dados

O banco deve separar informações públicas sobre risco de qualquer dado sobre pessoas. Alertas e camadas geográficas podem ser cruzados com indicadores **agregados** de incidentes históricos para apoiar planejamento, mas o resultado deve permanecer uma hipótese explicável — nunca uma ordem operacional.

| Camada | Conteúdo | Fontes candidatas | Regra de privacidade |
|---|---|---|---|
| `hazard_sources` | Cadastro da fonte, licença, versão, nível de confiança e frequência de atualização. | GDACS, USGS, NASA FIRMS, agências locais. | Apenas metadados de origem. |
| `hazard_events` | Evento, tipo, severidade declarada, geometria de referência, horário de observação e URL da fonte. | GDACS; USGS em GeoJSON; FIRMS para anomalias térmicas. | Não recebe localização de usuários. |
| `risk_zones` | Polígonos, áreas de exclusão, rotas fechadas e avisos emitidos por autoridades. | Órgãos públicos e parceiros formalmente autorizados. | Publicar somente geometrias aprovadas para divulgação. |
| `rescue_incident_aggregates` | Contagem por área, janela temporal, tipo de incidente, recurso mobilizado e desfecho agregado. | Registros públicos, FOIA, parceiro de resgate com acordo formal. | Sem nome, telefone, relato livre, identificador de dispositivo ou coordenada residencial. |
| `operational_assessments` | Proposta do ARCA, fontes usadas, incerteza, aprovação humana e prazo de validade. | Produção interna. | Controle de acesso por papel; trilha de auditoria. |

O cruzamento deve ocorrer por **evento, geografia, tempo e proveniência**. Exemplo: um evento de incêndio obtido da NASA FIRMS não deve ser exibido como “zona de evacuação”; ele deve aparecer como uma observação de satélite, com horário, origem e aviso de que a autoridade local é quem define restrições. A NASA FIRMS publica dados de incêndio e anomalias térmicas, enquanto o USGS disponibiliza consultas sísmicas em GeoJSON e registra o estado de revisão do evento [1] [2]. O GDACS é apropriado para uma camada global de alertas e coordenação, não para determinar táticas locais de resgate [3].

### Fluxo de ingestão recomendado

1. **Coletar** somente de conectores aprovados, cada qual com URL, licença, horário de busca e hash da resposta.
2. **Validar** esquema, unidade, fuso horário, CRS/GeoJSON e atraso de atualização antes de gravar.
3. **Normalizar** para um modelo de evento canônico, mantendo o identificador original do provedor.
4. **Separar** a tabela operacional da tabela de dados pessoais. O motor de risco recebe apenas agregados ou dados pseudonimizados quando houver base legal e necessidade real.
5. **Apresentar** uma recomendação com fontes, confiança, lacunas e prazo de expiração. Se faltar uma fonte crítica, o resultado deve ser “informação insuficiente”, não uma recomendação improvisada.

EM-DAT pode apoiar análises históricas globais porque reúne eventos e impactos de desastres desde 1900, mas seus registros devem ser usados para contexto e planejamento, não como telemetria em tempo real [4]. Para histórico de busca e resgate, o NPS disponibiliza listas e painéis públicos de incidentes; o ARCA deve importar somente os campos agregados e legitimamente publicados [5].

## 2. Protocolos de segurança e decisão assistida

> O assistente deve explicar, priorizar e registrar incertezas. A autorização de uma ação de resgate permanece com a autoridade competente e o comando humano responsável.

| Controle | Implementação no ARCA | O que ele impede |
|---|---|---|
| **Minimização de dados** | Não coletar localização precisa, nome ou contato até haver finalidade declarada, base legal e consentimento apropriado. | Transformar ajuda em rastreamento. |
| **Separação de domínios** | Dados de risco público, dados de operações e conversas privadas vivem em tabelas, chaves e permissões distintas. | Correlação indevida entre uma pergunta e a identidade da pessoa. |
| **ABAC/RBAC** | Acesso por papel e atributos: pessoa usuária, analista, operador autorizado, administrador e auditor. | Acesso amplo por conveniência. |
| **Criptografia e chaves** | TLS em trânsito, criptografia em repouso, rotação de segredo e nenhum segredo operacional longo no navegador. | Exposição de credenciais e dados sensíveis. |
| **Registro de decisão** | Toda proposta mostra fonte, versão do modelo, pessoa aprovadora, horário, escopo e validade. | Decisões invisíveis ou sem responsabilização. |
| **Humano no circuito** | A IA pode sugerir “verificar”, “priorizar revisão” ou “consultar autoridade”; não pode despachar, bloquear vias, emitir CAP ou contactar órgãos externos. | Automação indevida de decisões críticas. |
| **Modo degradado** | Sem conectividade, o app mostra último pacote verificado, idade do dado e ações de baixo risco; não simula atualização. | Falsa sensação de tempo real. |

As orientações do ICRC tratam proteção de dados como parte da proteção da vida, integridade e dignidade em ação humanitária [6]. As diretrizes da OCHA enquadram responsabilidade de dados como gestão segura, ética e eficaz de dados pessoais e não pessoais no contexto operacional [7]. Para a IA, aplique o ciclo **Governar → Mapear → Medir → Gerenciar**, mantendo avaliação de risco antes da adoção, monitoramento após mudanças e possibilidade de recusa/encaminhamento humano [8].

### Limiar operacional do assistente

| Situação | Ação permitida da IA | Ação proibida |
|---|---|---|
| Dado público de risco disponível | Exibir fonte, horário, incerteza e canais oficiais. | Declarar uma área segura ou emitir ordem de evacuação. |
| Pedido de ajuda sem ameaça imediata | Estruturar perguntas, checklist e alternativas seguras. | Solicitar dados pessoais desnecessários. |
| Evento real, mas sem autorização operacional | Preparar um rascunho de avaliação e encaminhar para operador humano. | Acionar equipes, aeronaves, sirenes ou autoridades. |
| Integração formal com autoridade | Gerar um **rascunho** CAP sujeito à assinatura e publicação da autoridade. | Assinar, publicar ou difundir alerta por conta própria. |

O Common Alerting Protocol (CAP) é um formato padronizado para troca de alertas de emergência por múltiplos canais [9]. O ARCA deve produzir, no máximo, um **preview de CAP** para revisão; a autoridade credenciada é a única responsável por compor, aprovar e publicar um alerta oficial [10].

## 3. Interface em Rust: proposta prática

Rust é adequado para a camada de **validação local, modelos de domínio, cache offline e consistência de dados**, mas não elimina as regras do navegador nem substitui o backend seguro. Para o ARCA atual, a melhor migração é gradual:

```text
Portal público atual (React/TypeScript)
        │
        ├── API versionada do ARCA (servidor existente)
        │       ├── autenticação, autorização e auditoria
        │       ├── conectores de fontes públicas
        │       └── decisões e publicação sempre humanas
        │
        └── ARCA Field Console (Rust + Leptos + WebAssembly)
                ├── modelos de domínio e validação de pacotes
                ├── cache de baixo risco no IndexedDB
                ├── fila offline assinada pelo usuário autorizado
                └── tela de transparência e aprovação
```

### Escolha recomendada

Use **Leptos em CSR/WebAssembly** para o console de campo, mantendo o backend atual como fonte de verdade. Leptos pode compilar a interface Rust para WebAssembly e operar como cliente de uma API já existente; o próprio projeto documenta CSR como opção para integrar com um backend existente [11]. Dioxus é uma alternativa quando houver uma decisão futura de compartilhar a maior parte da interface entre web, desktop e móvel [12].

O módulo Rust/WASM deve conter tipos como `HazardEvent`, `RiskZone`, `SourceProvenance`, `OperationalAssessment` e `ApprovalReceipt`. Ele deve validar campos obrigatórios, expiração do pacote, versão do esquema e compatibilidade de fontes **antes** de mostrar uma proposta ao operador. Cache local deve guardar somente camadas públicas ou pacotes explicitamente autorizados; IndexedDB permite transações que podem ser abortadas em caso de erro [13].

### Estrutura de tela operacional

| Região da tela | Conteúdo obrigatório | Comportamento transparente |
|---|---|---|
| Faixa superior | Estado de conectividade, idade da última sincronização e ambiente. | Nunca rotular dado expirado como “ao vivo”. |
| Mapa principal | Camadas selecionáveis, fonte, precisão e horário de cada camada. | Separar observação, alerta oficial e hipótese analítica por cores e rótulos. |
| Painel de decisão | Evidências, incertezas, impacto estimado e alternativas. | Exigir leitura e aprovação humana para qualquer encaminhamento. |
| Linha do tempo | Mudanças de dado, autorizações e reversões. | Permitir auditoria e exportação do recibo. |
| Modo offline | Pacotes válidos, data de expiração e fila de sincronização. | Bloquear ações que dependem de confirmação em tempo real. |

## 4. Contratos mínimos de API

```ts
type HazardEvent = {
  source: "gdacs" | "usgs" | "nasa_firms" | "authority";
  sourceEventId: string;
  observedAtUtc: string;
  geometry: GeoJSON.Geometry;
  confidence: "declared" | "reviewed" | "estimated";
  sourceUrl: string;
};

type OperationalAssessment = {
  assessmentId: string;
  evidenceIds: string[];
  uncertainty: "low" | "medium" | "high" | "insufficient";
  proposedAction: "monitor" | "request_human_review" | "prepare_cap_draft";
  externalDispatch: false;
  requiresHumanApproval: true;
  expiresAtUtc: string;
};
```

O campo `externalDispatch` permanece sempre `false` no ARCA base. Uma integração de autoridade só deve ser criada após contrato, análise jurídica por jurisdição, avaliação de impacto, autenticação mútua, lista formal de usuários autorizados e auditoria independente.

## 5. Próxima implementação recomendada

Primeiro, adicionar as tabelas `arca_hazard_sources`, `arca_hazard_events` e `arca_rescue_incident_aggregates`, com proveniência e classificação de acesso. Segundo, construir um conector de **somente leitura** para uma fonte de risco, começando pelo USGS ou GDACS. Terceiro, criar no portal atual uma tela de “origem e confiança do dado” antes de iniciar qualquer migração em Rust. Só depois disso iniciar o `Field Console` em Leptos/WASM como aplicação separada.

## Referências

[1] [USGS — Earthquake Catalog API Documentation](https://earthquake.usgs.gov/fdsnws/event/1/)  
[2] [NASA FIRMS — API](https://firms.modaps.eosdis.nasa.gov/api/)  
[3] [GDACS — Global Disaster Awareness and Coordination System](https://gdacs.org/)  
[4] [EM-DAT — The International Disaster Database](https://www.emdat.be/)  
[5] [NPS — FOIA: Search and Rescue incident lists](https://www.nps.gov/aboutus/foia/foia-frd.htm)  
[6] [ICRC — Handbook on Data Protection in Humanitarian Action](https://www.icrc.org/en/data-protection-humanitarian-action-handbook)  
[7] [OCHA Centre for Humanitarian Data — Data Responsibility Guidelines](https://centre.humdata.org/the-ocha-data-responsibility-guidelines/)  
[8] [NIST — AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)  
[9] [OASIS — Common Alerting Protocol v1.2](https://www.oasis-open.org/standard/cap/)  
[10] [FEMA — Common Alerting Protocol](https://www.fema.gov/emergency-managers/practitioners/integrated-public-alert-warning-system/technology-developers/common-alerting-protocol)  
[11] [Leptos Book — Getting Started](https://book.leptos.dev/getting_started/index.html)  
[12] [Dioxus — Web platform](https://dioxuslabs.com/learn/0.7/guides/platforms/web/)  
[13] [indexed-db crate documentation](https://docs.rs/indexed-db)

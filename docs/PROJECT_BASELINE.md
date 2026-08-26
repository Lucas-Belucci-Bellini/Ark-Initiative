# Ark Initiative — Project Baseline

**Data da avaliação:** 2026-08-26 (UTC)  
**Repositório:** [Lucas-Belucci-Bellini/Ark-Initiative](https://github.com/Lucas-Belucci-Bellini/Ark-Initiative)  
**Commit de referência auditado:** `138072d6900cd85f7774309b7ac47a0acf74d068`  
**Branch de referência auditada:** `main`  
**Branch desta documentação:** `docs/project-baseline-initial-audit`

## 1. Identidade e propósito

O repositório identifica-se como **Projeto ARCA — Arquitetura de Resiliência Climática e Ambiental**. Sua visão é uma infraestrutura de resiliência que observa, contextualiza, simula e prepara respostas para ameaças naturais, preservando a distinção entre sinal público, contexto histórico, recomendação informacional e decisão humana autorizada.

A implementação efetivamente presente no repositório não é ainda o gêmeo digital planetário descrito na visão de longo prazo. O produto operacional atual é uma aplicação ARCA concentrada em um painel público de eventos, um assistente informacional com salvaguardas de privacidade e uma área administrativa de revisão humana e curadoria de evidências.

As fontes primárias para essa identificação são `Readme.md`, `apps/arca-resilience/README.md`, `apps/arca-resilience/server/routers.ts` e `apps/arca-resilience/server/publicHazards.ts`.

## 2. Versão e estado de release

| Item | Estado observado |
|---|---|
| Versão do aplicativo | `0.2.0`, declarada em `apps/arca-resilience/package.json` |
| Tags Git | `0.1.0`, `0.2.0` |
| Release mais recente no GitHub | `0.2.0 — Desktop, curadoria e conectividade` |
| Release anterior | `0.1.0 — Fundação operacional` |
| Estado da `0.2.0` | Publicada, mas o próprio TODO ainda registra como pendentes a publicação/verificação de instaladores, checksums e notas completas |
| Próximo marco recomendado | Hardening de CI, testes de autorização com banco isolado e fechamento do pacote de release desktop |

A numeração existente representa evolução real documentada no histórico, mas não deve ser incrementada até que os itens pendentes da versão atual e os gates de validação estejam resolvidos.

## 3. Arquitetura atual

O repositório possui uma estrutura simples de monorepo, com a aplicação operacional em `apps/arca-resilience` e documentação de visão/arquitetura em `docs/`. A aplicação combina frontend React/Vite, servidor Express com tRPC, persistência Drizzle sobre MySQL/TiDB compatível, autenticação do template, integração de modelo de linguagem no servidor, PWA/offline e empacotamento desktop com Tauri.

O núcleo Rust em `rust/arca_risk_core` é compilado como WebAssembly. Seu escopo é deliberadamente limitado: classificação de ênfase visual de eventos públicos e validação da idade de pacotes em cache. O núcleo não toma decisões operacionais nem realiza comunicação externa.

O fluxo implementado atualmente pode ser resumido assim:

```text
GDACS/USGS públicos
        ↓
normalização + cache com proveniência
        ↓
painel operacional público e pacote offline
        ↓
contexto informacional e alertas explicáveis
        ↓
assistente autenticado, evidências curadas e revisão humana
```

O assistente possui consentimento privado obrigatório, histórico por usuário, limite de uso, auditoria, classificação de mensagens sinalizadas e bloqueios para emergência, entrada não autorizada em áreas restritas e pedidos que poderiam facilitar violência ou operações ofensivas. A camada administrativa permite revisão, gestão de papéis, curadoria de evidências e resolução de sinais de segurança.

## 4. Stack atual

| Camada | Tecnologia observada | Estado |
|---|---|---|
| Interface | React 19, Vite 7, TypeScript, Tailwind/Radix, Wouter | Implementada |
| Servidor | Node.js, Express, tRPC, TypeScript | Implementada |
| Dados | Drizzle ORM, MySQL/TiDB compatível | Implementada; depende de configuração externa para execução completa |
| IA | Integração de modelo no servidor com resposta estruturada e evidências selecionadas | Implementada no fluxo do assistente |
| Dados públicos | GDACS e USGS, normalização e cache com proveniência | Implementada em leitura |
| Offline | Manifesto PWA, service worker e pacote público em cache | Implementada |
| Desktop | Tauri 2 | Base configurada; artefatos de distribuição ainda pendentes |
| Núcleo local | Rust/WebAssembly | Implementado para validação limitada de apresentação e frescor do cache |
| Testes | Vitest, Testing Library, jsdom | Implementados |
| Build | Vite + esbuild | Passa no ambiente auditado |

## 5. Capacidades presentes

A aplicação oferece uma landing page pública, a rota operacional `/operacoes`, o Assistente ARCA, a tela de revisão, a área de segurança e fallback para rota inexistente. O painel operacional consulta eventos públicos multirriscos do GDACS e eventos sísmicos do USGS, mantém origem, horário e identificador do evento, mostra estado de conectividade e usa cache público offline sem armazenar rotas privadas ou dados administrativos.

O assistente exige consentimento, restringe o acesso às conversas ao proprietário autenticado, aplica limite horário, utiliza um acervo de evidências publicadas, adiciona citações de fonte quando aplicável e registra eventos de auditoria. A administração possui fila de revisão, papéis operacionais, catálogo de evidências, sinais de segurança e limpeza de dados expirados.

Essas capacidades não equivalem à visão completa descrita no README. Não foram encontrados motores científicos de enchente, fogo, seca, calor, tsunami, vulcanismo ou sismo; simulador de cenários; grafo de infraestrutura; rede de sensores; digital twin; logística operacional; despacho de equipes; emissão de ordens de evacuação; ou integração automática com autoridades.

## 6. Segurança, privacidade e governança

A implementação contém salvaguardas importantes para um produto informacional: consentimento explícito para conversas privadas, ownership de conversas, minimização de dados, retenção limitada, trilha de auditoria, curadoria de evidências, revisão humana e ausência explícita de despacho externo automático. O README também afirma que o sistema não substitui autoridades nem decide ações críticas.

A varredura estática dos arquivos rastreados não encontrou padrões óbvios de chaves privadas, tokens conhecidos ou senhas incorporadas. Essa verificação não substitui uma análise completa de dependências, infraestrutura, segredos do ambiente ou segurança de produção.

Não foi encontrado arquivo de licença na raiz, embora `package.json` declare `MIT`. Também não foi encontrado um arquivo independente de política de segurança no repositório auditado. A ausência desses artefatos deve ser tratada como pendência documental, não como ausência de controles no código.

## 7. Bugs e problemas conhecidos

| Classificação | Observação | Evidência e impacto |
|---|---|---|
| Confirmado — P0/P1 de validação | A suíte completa falha em dois testes de autorização | `server/arca.authorization.test.ts`: os testes esperavam `PRECONDITION_FAILED` e `NOT_FOUND`, mas o ambiente sem banco produziu `INTERNAL_SERVER_ERROR: Database unavailable`. Isso impede declarar a suíte verde; ainda não prova um defeito funcional em produção. |
| Confirmado — P1 de qualidade | O ambiente de testes não isola adequadamente o caminho de banco para esses testes | A autorização é mascarada pela indisponibilidade da dependência externa. É necessário fixture, mock ou banco efêmero determinístico. |
| Confirmado — P2 de manutenção | A configuração `pnpm` embutida em `package.json` é ignorada pela versão de pnpm usada no ambiente | O install emitiu aviso de que `patchedDependencies` e `overrides` não são mais lidos nesse local. |
| Confirmado — P3 de performance | O build gera chunks JavaScript acima de 500 kB | O build passou, mas o Vite recomendou code-splitting ou configuração explícita de chunks. |
| Confirmado — P4 de configuração | Variáveis de analytics não estavam definidas durante o build | O build emitiu avisos para `VITE_ANALYTICS_ENDPOINT` e `VITE_ANALYTICS_WEBSITE_ID`; o artefato ainda foi gerado. |

Nenhuma falha deve ser marcada como resolvida antes de uma nova execução com infraestrutura de dados controlada e evidência reproduzível.

## 8. Limitações atuais

O produto está concentrado em sinais públicos e recomendações informacionais. Não possui ingestão de sensores próprios, modelos físicos de risco, dados geoespaciais de infraestrutura crítica, simulação de impacto, previsão operacional ou execução de ações no mundo real. O modo offline cobre o shell público e o pacote operacional público; rotas autenticadas e administrativas não devem ser armazenadas no cache.

A release desktop ainda não possui, no estado auditado, os pacotes Linux `.deb` e AppImage, checksums SHA-256 e verificação final anexada à release. O TODO também registra como pendentes filtros e ordenação da curadoria e restrição explícita de CORS/origem para o cliente desktop com preservação do fluxo OAuth.

## 9. Roadmap existente

O roadmap conceitual de longo prazo evolui de plataforma básica de dados e mapas para monitoramento, modelos de risco, simulação, digital twins, infraestrutura crítica, rede nacional, rede continental, sistema global e infraestrutura planetária de resiliência. A aplicação atual constitui apenas a primeira fatia operacional dessa visão.

O TODO de `apps/arca-resilience/todo.md` registra como concluídos os marcos de fundação operacional, backend, autenticação, assistente, revisão humana, evidências, feeds públicos, PWA, Rust/WASM, Tauri e integração ao repositório. Permanecem pendentes filtros/ordenação de curadoria, CORS explícito do desktop, geração/verificação dos pacotes Linux e publicação/verificação completa da release `0.2.0`.

## 10. Testes e validação executados

A avaliação local foi realizada no diretório `apps/arca-resilience` com dependências instaladas a partir do lockfile e lifecycle scripts desativados.

| Verificação | Resultado |
|---|---|
| `pnpm install --frozen-lockfile --ignore-scripts` | Passou; emitido aviso sobre configuração `pnpm` obsoleta |
| `pnpm check` | Passou |
| `pnpm test` | Falhou: 33 testes passaram, 2 falharam, em 10 arquivos de teste |
| `pnpm build` | Passou; emitidos avisos de analytics não configurado e chunks grandes |
| Rust/WASM | Presença e contrato documentados; compilação do artefato não foi necessária para esta baseline |

## 11. CI/CD, branches, issues e pull requests

A branch local de referência `main` está alinhada ao remoto e não possui alterações antes da criação desta branch de documentação. O repositório remoto expõe somente `main` como branch de trabalho observada na auditoria; não há workflows GitHub Actions registrados, não há Issues e não há Pull Requests listados.

A política de desenvolvimento recomendada para a próxima etapa é manter `main` intacta, trabalhar em branches específicas, configurar CI com instalação, typecheck, testes, build e checagens de segurança, e só publicar artefatos após todos os gates passarem.

## 12. Release status e technical debt

O ARCA possui um núcleo operacional real e uma sequência inicial de releases coerente, mas ainda está em fase alpha/early foundation. A dívida técnica mais importante é a distância entre a visão planetária e a superfície implementada, seguida pela ausência de CI, pelos testes dependentes de banco indisponível, pela configuração de package manager obsoleta, pela ausência de licença/política de segurança explícita e pelo processo de release desktop incompleto.

## 13. Próximo milestone recomendado

O próximo milestone recomendado é **ARCA 0.2.1 — Validation and Release Hardening**. Ele deve, sem ampliar a superfície funcional de forma aleatória, fazer o seguinte:

1. tornar os testes de autorização determinísticos com banco mockado, fixture ou banco efêmero;
2. adicionar GitHub Actions para `install`, `check`, `test`, `build` e checagens de segurança;
3. corrigir a configuração de `pnpm` e documentar o ambiente suportado;
4. resolver ou documentar os avisos de analytics e de chunking;
5. gerar, testar, calcular checksums e verificar os artefatos desktop;
6. fechar a documentação de licença, segurança, release e rollback;
7. publicar `0.2.1` somente após CI, testes e build verdes.

Esse milestone deve preceder qualquer salto de versão major ou qualquer alegação de maturidade de plataforma planetária.

## 14. Evidências auditadas

- `Readme.md` — visão, propósito, limites e roadmap conceitual do ARCA.
- `apps/arca-resilience/README.md` — execução local, painel, fontes públicas, PWA e Rust/WASM.
- `apps/arca-resilience/package.json` — versão, scripts, dependências e stack.
- `apps/arca-resilience/server/routers.ts` — rotas, capacidades atuais e salvaguardas do assistente.
- `apps/arca-resilience/server/publicHazards.ts` — conectores públicos GDACS/USGS e cache.
- `apps/arca-resilience/todo.md` — roadmap executado e pendências.
- Git tag `0.1.0` e Git tag `0.2.0`.
- Release GitHub `0.1.0` e `0.2.0`.
- Logs desta auditoria em `/home/ubuntu/repository-audits/ark-audit/`.

> **Conclusão:** o Ark Initiative já contém uma aplicação ARCA operacional e testável em escopo limitado, com boas salvaguardas informacionais e de privacidade. O estado correto não é “plataforma planetária completa”, mas “fundação operacional ARCA 0.2.0 com hardening de validação, CI e release ainda necessário”.

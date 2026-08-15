# ARCA — Roteiro de Dados Compartilhados, Alertas e Lançamento Multiplataforma

**Status:** roteiro de execução.  
**Princípio:** o ARCA apoia consciência situacional e prevenção; decisões críticas, publicação de alertas oficiais e contato externo continuam sob autoridade humana competente.

## 1. Próximos passos para o banco compartilhado

O banco compartilhado não deve se tornar um banco onde todos os projetos leem e escrevem tudo. O modelo recomendado é uma **plataforma de dados com ownership por domínio**: cada aplicação controla suas próprias tabelas e publica somente contratos de leitura mínimos para os demais projetos. No ARCA, as tabelas privadas continuam com prefixo `arca_`; integrações externas recebem somente views ou procedimentos de leitura que exponham dados públicos, agregados e versionados.

| Etapa | Entrega | Regra de segurança | Critério de pronto |
|---|---|---|---|
| 1. Inventário | Catálogo de tabelas, proprietários, classificação e retenção. | Identificar PII, dados operacionais, dados públicos e dados agregados. | Cada tabela tem responsável e finalidade. |
| 2. Contratos | Views/API `v1` para eventos públicos, zonas aprovadas e agregados históricos. | Nenhum outro projeto escreve diretamente em tabelas `arca_*`. | Consumidores leem apenas o contrato necessário. |
| 3. Identidade | Perfis de serviço e permissões por finalidade. | Separar leitura pública, curadoria, operação e auditoria. | Cada integração usa identidade própria, sem credencial compartilhada. |
| 4. Sincronização | Ingestão idempotente com origem, hash, data e versão. | Conflitos nunca sobrescrevem silenciosamente um dado de fonte. | Cada registro possui proveniência e prazo de validade. |
| 5. Auditoria | Log de acesso e mudança para dados não públicos. | Consultas entre domínios ficam rastreáveis. | Relatório de acesso por projeto e período. |

> **Regra de arquitetura:** a aplicação que produz o dado é a fonte de verdade; outras aplicações consomem um contrato de leitura documentado, em vez de depender do formato interno das tabelas.

### Contratos mínimos sugeridos

| Contrato | Conteúdo permitido | Consumidores possíveis | Proibido incluir |
|---|---|---|---|
| `arca_public_hazard_feed_v1` | Fonte, evento, nível declarado, geometria pública, horário, URL e expiração. | Painel público, pesquisa, visualização. | Conversas, identificadores de usuários, localização de dispositivo. |
| `arca_rescue_aggregate_v1` | Categoria, período, cobertura, contagem e origem. | Planejamento, educação, contexto no assistente. | Fichas individuais de resgate, nomes, telefones, relatos livres. |
| `arca_assessment_v1` | Evidência, incerteza, rascunho de recomendação, aprovador e validade. | Operadores autorizados e auditoria. | Credenciais, chaves, dados de terceiros sem autorização. |
| `arca_audit_receipt_v1` | Ação, autor, horário, finalidade e resultado. | Auditoria e administração. | Conteúdo integral de conversa por padrão. |

O primeiro passo técnico é criar **views de leitura** e procedimentos de consulta com escopo reduzido, depois conceder permissões apenas a perfis de serviço específicos. Quando uma integração precisar escrever, ela deve usar uma API autenticada e validada pelo projeto proprietário — nunca SQL direto de outro projeto. Essa separação aplica os princípios de minimização, limitação de finalidade e responsabilidade de dados usados em contextos humanitários [1] [2].

## 2. Fluxo do Assistente ARCA para alertas de segurança

O assistente deve ser uma camada de explicação e triagem, não um sistema de despacho. O fluxo abaixo substitui qualquer ideia de vigilância entre pessoas, análise oculta de conversas ou denúncia automática.

```text
Mensagem da pessoa usuária
        ↓
Classificação de intenção e contexto
        ↓
Consulta a fontes públicas + evidências curadas
        ↓
Resposta preventiva explicável e alternativa segura
        ↓
Sinal explícito, específico e iminente?
   ├── Não → Encerrar com orientação, fontes e retenção limitada
   └── Sim → Criar fila privada de revisão humana
                     ↓
          Operador autorizado confirma fatos, base legal e urgência
                     ↓
          Sem confirmação → encerrar/registrar decisão
          Com confirmação → canal institucional autorizado e auditável
```

| Momento | A IA pode fazer | A IA não pode fazer |
|---|---|---|
| Risco geral ou zona perigosa | Explicar risco, fonte, hora do dado e canais oficiais. | Ensinar invasão, rota clandestina ou burlar restrições. |
| Pedido de ajuda comum | Mostrar checklist, fontes e alternativas de baixo risco. | Coletar dados pessoais sem necessidade e consentimento. |
| Intenção perigosa explícita | Recusar facilitação, alertar claramente e abrir sinal privado com expiração. | Contatar autoridade, punir, publicar nome ou cruzar conversas de usuários. |
| Revisão humana | Gerar resumo verificável, evidências e limites. | Tomar a decisão final ou ocultar o fato de que houve revisão. |
| Integração formal futura | Produzir rascunho de CAP para assinatura humana. | Emitir CAP ou mensagem oficial por conta própria. |

O sinal de revisão precisa ser **episódico e limitado**: criado somente para intenção explícita, específica e iminente; acessível a um grupo mínimo de revisores; retido por prazo definido; e encerrado com justificativa. O modelo não deve inferir intenção a partir do histórico de outras pessoas. Quando houver integração institucional aprovada, o ARCA gera apenas um rascunho estruturado; o Common Alerting Protocol é um formato de interoperabilidade, não uma autorização para publicar alertas [3] [4].

## 3. Plano de versões: web, computador e celular

A versão **web responsiva** é o lançamento inicial recomendado, porque já existe, funciona em qualquer dispositivo com navegador e permite validar fontes, modelos de permissão, usabilidade e governança antes de distribuir binários. O site deve ganhar modo PWA antes da primeira distribuição nativa: cache de pacotes públicos, indicação visível de idade do dado, tutorial de uso offline e bloqueio de ações que exigem informação em tempo real.

| Fase | Produto | Tecnologia | Condição de lançamento |
|---|---|---|---|
| **Fase 1 — agora** | Web responsiva + PWA instalável | React/TypeScript atual + Rust/WASM para validação local. | Fontes rastreáveis, consentimento, testes, modo degradado e revisão humana operantes. |
| **Fase 2 — piloto de campo** | Aplicativo para Windows, macOS e Linux. | **Tauri 2** envolvendo a interface web atual, com plugins mínimos e permissões restritas. | Usuários-piloto, política de atualização, cache offline testado e inventário de dispositivos. |
| **Fase 3 — Android** | Aplicativo móvel de campo. | Tauri 2 ou console Rust/Dioxus, conforme o teste de protótipo. | Funciona offline, sem armazenar dados pessoais desnecessários, com sincronização explícita. |
| **Fase 4 — iOS** | Aplicativo móvel para iPhone/iPad. | Mesmo contrato de API e modelo de dados; build requer macOS e Xcode. | Revisão de privacidade, testes em aparelho real e processo de distribuição definido. |

O Tauri 2 permite aproveitar o frontend existente e empacotá-lo para Linux, macOS, Windows, Android e iOS com lógica de aplicação em Rust [5]. Para uma interface que seja reescrita integralmente em Rust, Dioxus também oferece alvos web, desktop e mobile, mas a migração deve acontecer somente quando o protótipo de campo justificar substituir a interface já validada [6].

> **Quando soltar?** Primeiro após a Fase 1 passar os critérios de segurança e usabilidade; depois como piloto fechado para operadores autorizados; e somente após validar atualizações, cache, consentimento e suporte em campo deve haver distribuição pública. Não é seguro escolher uma data antes desses critérios serem comprovados.

Para começar o aplicativo de computador, será preciso selecionar uma pasta em um computador compatível para gerar e testar os binários locais. Para iOS, o build e a assinatura precisam ocorrer em ambiente macOS com Xcode; Android requer Android SDK/NDK. A documentação do Tauri descreve fluxos separados de desenvolvimento para desktop, Android e iOS [7].

## 4. Ordem prática de execução

1. Criar os contratos de dados `v1` e perfis de serviço de leitura mínima.
2. Implementar a PWA com cache público, tela de idade do pacote e tutorial offline.
3. Criar painel administrativo de curadoria, revisão humana e recibos de auditoria.
4. Rodar um piloto web com poucos operadores, documentando falhas de dados, confusões de interface e necessidades reais de campo.
5. Empacotar o mesmo frontend em Tauri para desktop, sem abrir permissões locais além do necessário.
6. Prototipar Android, validar o modo offline e só então decidir entre Tauri móvel e uma interface Dioxus mais nativa.

## Referências

[1] [ICRC — Handbook on Data Protection in Humanitarian Action](https://www.icrc.org/en/data-protection-humanitarian-action-handbook)  
[2] [OCHA Centre for Humanitarian Data — Data Responsibility Guidelines](https://centre.humdata.org/the-ocha-data-responsibility-guidelines/)  
[3] [OASIS — Common Alerting Protocol v1.2](https://www.oasis-open.org/standard/cap/)  
[4] [FEMA — Common Alerting Protocol](https://www.fema.gov/emergency-managers/practitioners/integrated-public-alert-warning-system/technology-developers/common-alerting-protocol)  
[5] [Tauri 2 — Cross-platform applications](https://v2.tauri.app/)  
[6] [Dioxus 0.7 — Getting Started](https://dioxuslabs.com/learn/0.7/getting_started/)  
[7] [Tauri 2 — Development for desktop and mobile](https://v2.tauri.app/develop/)

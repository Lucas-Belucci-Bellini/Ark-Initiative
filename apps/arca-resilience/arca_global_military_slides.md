## Cover

# Projeto ARCA

## Resiliência planetária, acesso extremo e coordenação militar-humanitária

**Arquitetura de Resiliência Climática e Ambiental**

## Slide 1

# O risco climático também bloqueia o socorro

- Uma crise pode interromper simultaneamente água, energia, comunicação, estradas e acesso à saúde.
- O desafio não é apenas prever o evento: é verificar se pessoas, suprimentos e equipes conseguem chegar com segurança.
- O ARCA conecta **ameaça → acesso → missão → sustentação → recuperação**.

## Slide 2

# O ARCA é uma federação, não um centro único

- Nós locais mantêm mapas, alertas e protocolos mesmo sem internet contínua.
- Camadas municipal, nacional, regional e global compartilham apenas o necessário.
- Soberania de dados e interoperabilidade coexistem por contratos de dados e níveis de confiança.

## Slide 3

# Ambiente define viabilidade, não a promessa do equipamento

- Cada missão recebe um envelope: terreno, calor, poeira, altitude, carga, autonomia, equipe e manutenção.
- Ativos são classificados como **civil convencional**, **modificado/reforçado** ou **austere/especializado**.
- O resultado é objetivo: **viável**, **viável com mitigação**, **não recomendado** ou **indeterminado**.

## Slide 4

# Offline é uma malha de transporte de mensagens

- Rádio autorizado, satélite, rede local e transporte físico de dados funcionam como portadores intercambiáveis.
- Uma fila tolerante a atraso guarda, transporta e encaminha pacotes quando surge conectividade.
- Pacotes recebem prioridade, prazo de validade, confirmação de entrega e registro de sincronização.
- O Bundle Protocol v7 formaliza esse padrão *store-carry-forward* para conectividade intermitente.[1]

## Slide 5

# Dados seguem a missão e o menor privilégio

- Cada pacote é classificado: público, operacional, restrito ou sensível.
- Acesso depende de pessoa, dispositivo, finalidade e janela da missão — não apenas da rede utilizada.
- Assinatura, confidencialidade, armazenamento cifrado e log encadeado permitem verificar origem e alteração.
- BPSec adiciona integridade e confidencialidade ao tráfego tolerante a atraso.[2]

## Slide 6

# Deserto exige sustentação em camadas

- O plano de combustível separa estoque de base, reserva avançada e autonomia carregada na missão.
- Demanda considera percurso, carga, ambiente, geradores, comunicações, contingência, retorno e resgate.
- Recebimento, qualidade, emissão e saldo são medidos e reconciliados; nada depende de estimativa informal.
- A ONU integra telemetria de combustível e infraestrutura para reduzir perdas, identificar manutenção e aumentar disponibilidade.[3]

## Slide 7

# Manutenção avança junto com a missão

- **Nível 0:** inspeção do operador e checklist antes/depois de cada deslocamento.
- **Nível 1:** célula avançada para filtros, pneus, refrigeração, bateria, correias e recuperação.
- **Nível 2:** oficina regional para diagnóstico, reparo programado e rotação de módulos.
- **Nível 3:** reparo especializado/depot; a missão recebe rota de retorno e gatilhos de abortagem.

## Slide 8

# Ativos militares ampliam acesso, não substituem a autoridade civil

- Apoio autorizado inclui busca e salvamento, engenharia, transporte, hospitais de campanha, água e comunicações.
- Cada missão registra finalidade humanitária, autoridade, prazo, regras de proteção e responsável.
- A coordenação civil-militar protege acesso, reduz competição e deixa a divisão de tarefas explícita.[4]
- O ARCA não seleciona alvos, não planeja ataques e não autoriza uso de força.

## Slide 9

# Heliponto e rota só existem depois da validação

- O módulo aéreo cruza peso, combustível, temperatura, altitude-densidade, poeira, vento, visibilidade e zona de pouso.
- Calor e altitude podem reduzir potência, razão de subida e margens de decolagem/pouso.[5]
- A aeronave não é tratada como solução automática: dados ausentes resultam em **indeterminado**, não em aprovação.

## Slide 10

# Um site leve hoje; um núcleo Rust onde ele importa

- A interface pública usa HTML, CSS e TypeScript estáticos: abre em qualquer navegador e não exige instalação.
- O próximo passo pode usar Rust em edge nodes e WebAssembly para validação local, sincronização e processamento seguro.
- O site não expõe mapas sensíveis, credenciais, localização de equipes ou controles operacionais reais.

## Slide 11

# Roteiro de execução

- **Piloto:** uma região, um tipo de risco e um corredor logístico verificável.
- **Validação:** exercício com defesa civil, operadores locais, telecomunicações e logística humanitária.
- **Escala:** nós edge, contratos de dados, padrões de mensagem e coordenação transfronteiriça.
- **Maturidade:** simulações auditáveis, aprendizagem pós-missão e infraestrutura de resiliência global.

**Referências:** IETF RFC 9171/9172; UNGSC; OCHA; FAA; CISA; WFP.

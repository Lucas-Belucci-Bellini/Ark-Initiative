# Arquitetura de conteúdo e tecnologia — site ARCA

## Objetivo do primeiro lançamento

Apresentar a expansão global do Projeto ARCA de forma pública, clara e leve. O site explica como a plataforma conecta risco climático, acesso a ambientes extremos, comunicação offline, proteção de dados, logística de sustentação e coordenação militar-humanitária sem simular comando operacional real.

## Estrutura de navegação

| Seção | Função | Conteúdo principal |
|---|---|---|
| Início | Estabelecer a visão | manifesto, visão global e acesso à apresentação |
| Rede Global | Explicar a federação | nós edge, soberania de dados e coordenação em camadas |
| Ambientes Extremos | Demonstrar capacidade | motor de acesso, classes de ativos e envelope de missão |
| Protocolos Offline | Mostrar resiliência | malha de comunicação, mensageria tolerante a atraso e estados de sincronização |
| Sustentação no Deserto | Explicar logística | combustível, água, peças, manutenção avançada e rota de retorno |
| Governança | Proteger a finalidade | coordenação civil-militar, supervisão humana e limites de uso |
| Roteiro | Tornar o plano executável | fases de implementação e próximos pilotos |
| Como usar | Orientar o visitante | guia breve de leitura do site e da apresentação |

## Modelo operacional exibido no site

```text
ameaça → acesso → missão → sustentação → confirmação → aprendizagem
```

### Entidades de domínio

| Entidade | Finalidade |
|---|---|
| `OperationalEnvelope` | Representa limites de equipamento, ambiente, equipe e rota. |
| `EdgeNode` | Nó local capaz de operar e armazenar dados sem internet contínua. |
| `MissionPacket` | Pacote de missão assinado, classificado, com prazo e critério de abortagem. |
| `FuelCell` | Estoque físico, qualidade, medição de emissão e autonomia prevista. |
| `MaintenanceCell` | Capacidade de inspeção, reparo, peças e escalonamento técnico. |
| `SafetyCase` | Evidência, incertezas, mitigação e aprovação humana da missão. |

## Decisão tecnológica

O primeiro lançamento é um **site estático React/TypeScript**, porque navegadores executam tecnologias web diretamente em telefones, tablets e computadores sem exigir instalação especial. A entrega final é leve, pré-gerada e não carrega servidor de aplicação, banco de dados ou dependência pesada de navegador.

**Rust continua parte relevante da arquitetura ARCA**, mas no lugar correto: um núcleo futuro de edge/simulação pode usar Rust compilado como serviço nativo ou WebAssembly para validação local, processamento geoespacial, criptografia aprovada e sincronização tolerante a atraso. O site não precisa forçar Rust como interface para ser leve; ele preserva a compatibilidade universal e deixa o núcleo Rust preparado para as camadas que exigem desempenho e segurança de memória.

## Requisitos de desempenho e acesso

1. Priorizar HTML/CSS/JS estático e imagens comprimidas.
2. Garantir navegação por teclado, contraste alto e legibilidade em telas pequenas.
3. Não inserir telemetria, formulário ou rastreamento de pessoas no primeiro lançamento.
4. Manter o conteúdo explicativo sem dados operacionais reais, credenciais, mapas sensíveis ou localizações de equipes.
5. Estruturar o conteúdo para futura camada PWA e cache offline, sem alegar que o protótipo é um sistema de comando.

## Medidas de sucesso

O lançamento inicial será considerado útil se um visitante conseguir entender, em menos de cinco minutos, a finalidade humanitária do ARCA, a diferença entre um ativo nominal e um ativo realmente viável no ambiente, a cadeia de sustentação de uma missão remota e os limites de autonomia do sistema.

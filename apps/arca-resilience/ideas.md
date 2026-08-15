# Direção visual — Projeto ARCA

## Três abordagens consideradas

### 1. Atlas de Campo Planetário

Uma linguagem editorial de cartografia de emergência que une mapas topográficos, marcas de coordenadas e fichas de campo. A sensação é de um centro de comando humano, calmo e tecnicamente rigoroso.

**Probabilidade:** 0.07

### 2. Abrigo Brutalista Solar

Uma direção de arquitetura em concreto claro, sinalização industrial e energia solar, construída para comunicar resistência física em ambientes extremos. É direta, tátil e monumental.

**Probabilidade:** 0.03

### 3. Sinal de Vigília

Uma interface escura e altamente contrastada, inspirada em painéis de observação noturna e sinais de rádio. A proposta privilegia estados de alerta e leitura rápida sob baixa luminosidade.

**Probabilidade:** 0.08

## Direção escolhida — Atlas de Campo Planetário

### Movimento de design

**Cartografia editorial contemporânea**, inspirada em atlas científicos, manuais de missão e sinalização de proteção civil. O projeto deve parecer uma infraestrutura pública confiável, não uma interface de ficção militar.

### Princípios centrais

1. **Clareza antes de espetáculo:** hierarquia visual forte, texto legível e estados de risco compreensíveis em poucos segundos.
2. **Evidência visível:** coordenadas, fontes, níveis de confiança e limites de decisão aparecem como elementos de interface.
3. **Profundidade territorial:** mapas, curvas de nível, trilhas e camadas geográficas estruturam a página sem poluí-la.
4. **Humanidade operacional:** a estética técnica é equilibrada com fotografia e linguagem centradas na proteção de pessoas e serviços essenciais.

### Filosofia de cor

O fundo será o **Papel Mineral**, um off-white quente que lembra um mapa físico e diminui a fadiga visual. Grafite profundo representa precisão e controle; o azul glaciar indica informação e água; tons de areia comunicam ambiente extremo. Alertas não dominam a interface: são acionados apenas em pontos que exigem atenção.

### Paradigma de layout

Uma página em **faixa cartográfica vertical**, na qual cada seção funciona como uma camada territorial. Em vez de uma sequência centralizada de cartões, a leitura alterna entre uma coluna de narrativa, um trilho de dados e blocos horizontais que parecem mapas dobrados.

### Elementos de assinatura

1. Marcas de coordenadas e escala cartográfica no início e fim das seções.
2. Linhas topográficas discretas e trajetos pontilhados como textura estrutural.
3. Etiquetas de missão com bordas retas, código de estado e microtipografia monoespaçada.

### Filosofia de interação

Interações devem parecer consulta de um atlas: navegação suave até camadas da página, filtros simples e revelação progressiva de informações. Nada deve simular controle operacional real ou emitir alertas falsos.

### Animação

Usar transições de opacidade e deslocamento curto, com duração entre 160 e 260 ms. Linhas de rota podem se desenhar discretamente na entrada; cartões e números entram em cascata sutil. Respeitar `prefers-reduced-motion` e não usar animações contínuas que concorram com a leitura.

### Sistema tipográfico

**Space Grotesk** para títulos e navegação, com pesos de 500 a 700; **Source Serif 4** para manifestos e explicações longas; **IBM Plex Mono** para coordenadas, estatísticas e metadados. Evitar Inter e hierarquia indiferenciada.

### Essência da marca

**Uma infraestrutura de resiliência climática que transforma risco complexo em preparação verificável para comunidades e governos.**

Personalidade: **precisa, protetora e global**.

### Voz da marca

A voz é serena, específica e responsável. Títulos apresentam uma capacidade concreta; chamadas à ação convidam a explorar evidências, não a “começar” de forma genérica.

Exemplos:

> “Antecipe o colapso antes que ele interrompa serviços essenciais.”

> “Verifique a rota, a margem e a responsabilidade antes da missão.”

### Wordmark e símbolo

O símbolo é uma **arca geométrica aberta** que também sugere um abrigo, uma curva de nível e um horizonte. O wordmark combina letras largas e um corte angular na letra A, reforçando a ideia de acesso seguro e planejamento de terreno.

### Cor de assinatura

**Verde Órbita — `#127C66`**: um verde mineral, associado a continuidade, ação coordenada e regeneração; será aplicado como sinal de estado e detalhe de navegação, nunca como gradiente decorativo.

## Style Decisions

- Títulos operacionais, navegação, rótulos e hierarquia estrutural usam **Space Grotesk**; a Source Serif 4 fica reservada para o manifesto e ênfases editoriais.
- O aparato cartográfico aparece em toda a jornada por marcas de coordenada, identificadores de camada, bordas de mapa, escalas de estado e metadados de missão.
- As imagens priorizam terreno, kit de campo, logística, infraestrutura e proteção de pessoas; não são usados globos luminosos, visual de vigilância ou consoles de ficção científica.
- O símbolo aberto da ARCA reaparece como selo institucional ligado a princípio, coordenada ou metadado, e não apenas como ícone de navegação.
- O Verde Órbita permanece o sinal de ação, validação e continuidade; âmbar fica limitado a ambiente/atenção e o azul não compete como cor de marca.

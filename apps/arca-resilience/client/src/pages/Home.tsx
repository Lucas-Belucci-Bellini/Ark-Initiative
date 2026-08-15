/**
 * Design: Atlas de Campo Planetário — cartografia editorial, papel mineral,
 * grafite, azul glaciar e Verde Órbita. Clareza operacional antes de espetáculo.
 */
import { useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronRight,
  CloudSun,
  MapPin,
  Menu,
  Radio,
  ShieldCheck,
  Truck,
  Wrench,
  X,
} from "lucide-react";

const profiles = {
  deserto: {
    label: "Deserto quente",
    code: "AR-01",
    title: "Calor, poeira e autonomia transformam deslocamento em missão.",
    copy: "O corredor só é viável quando ativo, carga, recuperação, água, combustível, filtragem e plano de retorno permanecem dentro da mesma margem de segurança.",
    environment: ["Areia profunda", "Calor prolongado", "Poeira abrasiva"],
    state: "Viável com mitigação",
    requirements: "Filtro, refrigeração, estoque avançado e equipe de recuperação",
  },
  montanha: {
    label: "Alta montanha",
    code: "AR-02",
    title: "Altitude e terreno reduzem a margem antes mesmo de a equipe partir.",
    copy: "A análise reúne declive, gelo, visibilidade, aclimatação, potência disponível, janela meteorológica e alternativas de evacuação em uma única decisão verificável.",
    environment: ["Altitude-densidade", "Vento variável", "Acesso estreito"],
    state: "Indeterminado até validação local",
    requirements: "Reconhecimento, meteorologia, equipe habilitada e rota alternativa",
  },
  alagado: {
    label: "Zona alagada",
    code: "AR-03",
    title: "Quando a estrada deixa de existir, a logística precisa mudar de modo.",
    copy: "O ARCA compõe transporte terrestre, fluvial e aéreo de forma gradual, preservando a rastreabilidade de água, medicamentos, comunicação e pessoas afetadas.",
    environment: ["Acesso interrompido", "Água variável", "Conectividade limitada"],
    state: "Viável com operação multimodal",
    requirements: "Transbordo, nó edge, rota fluvial e confirmação de recebimento",
  },
} as const;

type ProfileKey = keyof typeof profiles;

const navItems = [
  ["Visão", "#visao"],
  ["Operações", "/operacoes"],
  ["Acesso", "#acesso"],
  ["Protocolos", "#protocolos"],
  ["Sustentação", "#sustentacao"],
  ["Roteiro", "#roteiro"],
];

const protocolSteps = [
  ["01", "Criar", "O pacote nasce com finalidade, classificação, prioridade, expiração e origem verificável."],
  ["02", "Proteger", "Assinatura, confidencialidade e armazenamento cifrado preservam o conteúdo em trânsito e em repouso."],
  ["03", "Transportar", "Rádio autorizado, satélite, rede local ou transporte físico encaminham a mesma fila tolerante a atraso."],
  ["04", "Conciliar", "Recibos e logs encadeados registram cada passagem quando a conectividade retorna."],
];

export default function Home() {
  const [activeProfile, setActiveProfile] = useState<ProfileKey>("deserto");
  const [menuOpen, setMenuOpen] = useState(false);
  const profile = profiles[activeProfile];

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="arca-site">
      <header className="site-header">
        <a className="brand" href="#visao" aria-label="Projeto ARCA — início">
          <img src="/manus-storage/arca-mark_e311354d.png" alt="Símbolo do Projeto ARCA" />
          <span>
            <b>ARCA</b>
            <i>RESILIÊNCIA PLANETÁRIA</i>
          </span>
        </a>

        <nav className={menuOpen ? "nav-links nav-open" : "nav-links"} aria-label="Navegação principal">
          {navItems.map(([label, href]) => (
            <a key={href} href={href} onClick={closeMenu}>{label}</a>
          ))}
          <a className="nav-action" href="#tutorial" onClick={closeMenu}>Como usar <ArrowUpRight size={15} /></a>
          <a className="nav-action nav-assistant" href="/assistente" onClick={closeMenu}>Assistente <ArrowUpRight size={15} /></a>
        </nav>

        <button className="menu-button" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      <main>
        <section id="visao" className="hero-section">
          <div className="hero-copy">
            <p className="eyebrow"><span></span> ARCA / INFRAESTRUTURA DE RESILIÊNCIA</p>
            <h1>Antecipe o colapso <em>antes</em> que ele interrompa o essencial.</h1>
            <p className="hero-lead">Uma arquitetura global para observar riscos, avaliar acesso extremo, sustentar missões e proteger decisões humanitárias com evidência.</p>
            <div className="hero-actions">
              <a className="primary-link" href="/operacoes">Abrir painel operacional <ChevronRight size={19} /></a>
              <a className="plain-link" href="/assistente">Abrir assistente ARCA <ArrowUpRight size={17} /></a>
            </div>
            <div className="hero-meta">
              <span><b>05</b> camadas de decisão</span>
              <span><b>04</b> portadores de comunicação</span>
              <span><b>01</b> finalidade: proteção civil</span>
            </div>
          </div>
          <div className="hero-visual">
            <img src="/manus-storage/arca-hero-atlas_d8530bc7.jpg" alt="Modelo editorial de um atlas planetário com rotas de resiliência" />
            <div className="hero-stamp stamp-top">GLOBAL / FEDERADO</div>
            <div className="hero-stamp stamp-bottom">OBSERVAR → PREPARAR → RESPONDER</div>
          </div>
        </section>

        <section className="manifest-section" aria-label="Princípio do ARCA">
          <div className="section-index"><img className="institution-mark" src="/manus-storage/arca-mark_e311354d.png" alt="" />01 <span>PRINCÍPIO / SINAL INSTITUCIONAL</span></div>
          <div>
            <p className="large-quote">O ARCA não pergunta apenas <strong>“o que vai acontecer?”</strong> Ele pergunta <strong>“quem ainda consegue chegar, com que margem e sob qual responsabilidade?”</strong></p>
            <p className="quote-source">UMA CAMADA DE RISCO, ACESSO, SUSTENTAÇÃO E GOVERNANÇA</p>
          </div>
        </section>

        <section id="acesso" className="access-section section-wrap">
          <div className="section-heading">
            <div><p className="eyebrow"><span></span> 02 / ACESSO EXTREMO</p><h2>O ambiente define a viabilidade.</h2></div>
            <div className="heading-note"><span>ARCA / ACESSO 47°S · 52°W</span><p>O mesmo ativo pode ser adequado em uma estrada preservada e inadequado em areia profunda, lama, gelo, fumaça ou altitude elevada. A missão começa pelo envelope operacional — não pela promessa do equipamento.</p></div>
          </div>

          <div className="access-board">
            <div className="profile-selector" role="tablist" aria-label="Perfis de ambiente">
              {(Object.keys(profiles) as ProfileKey[]).map((key) => (
                <button key={key} role="tab" aria-selected={activeProfile === key} className={activeProfile === key ? "profile-active" : ""} onClick={() => setActiveProfile(key)}>
                  <span>{profiles[key].code}</span>{profiles[key].label}
                </button>
              ))}
            </div>
            <div className="profile-content" role="tabpanel">
              <div className="profile-code">{profile.code} / PERFIL ATIVO</div>
              <h3>{profile.title}</h3>
              <p>{profile.copy}</p>
              <div className="risk-tags">{profile.environment.map((item) => <span key={item}>{item}</span>)}</div>
            </div>
            <div className="profile-status">
              <span>ESTADO DA MISSÃO</span>
              <strong>{profile.state}</strong>
              <p>{profile.requirements}</p>
              <div className="status-scale"><i></i><i></i><i className="amber"></i><i></i></div>
            </div>
          </div>

          <div className="envelope-grid">
            <div><MapPin size={20} /><strong>Terreno</strong><p>Superfície, inclinação, pontes, travessias e pontos de recuperação.</p></div>
            <div><CloudSun size={20} /><strong>Ambiente</strong><p>Calor, poeira, gelo, vento, fumaça, água e visibilidade.</p></div>
            <div><Truck size={20} /><strong>Ativo + carga</strong><p>Configuração real, peso, autonomia, reserva e condição de manutenção.</p></div>
            <div><CheckCircle2 size={20} /><strong>Equipe + retorno</strong><p>Habilitação, descanso, comunicação, plano de abortagem e resgate.</p></div>
          </div>
        </section>

        <section className="federation-section section-wrap">
          <div className="federation-image"><img src="/manus-storage/arca-edge-field-kit_62c12441.jpg" alt="Kit de comunicação offline e planejamento de campo do Projeto ARCA" /></div>
          <div className="federation-copy">
            <p className="eyebrow"><span></span> 03 / REDE GLOBAL</p>
            <h2>Uma federação, não um centro único.</h2>
            <p>O ARCA conecta nós locais, nacionais, regionais e globais por contratos de dados e níveis de confiança. Isso permite compartilhar alertas e pedidos de apoio sem transferir toda a soberania de dados para um único centro.</p>
            <div className="layer-list">
              <div><b>EDGE LOCAL</b><span>Mapas, contatos e mensagens quando a internet falha.</span></div>
              <div><b>NACIONAL</b><span>Infraestrutura, recursos e coordenação interagências.</span></div>
              <div><b>GLOBAL</b><span>Padrões, ciência, ajuda mútua e aprendizagem compartilhada.</span></div>
            </div>
          </div>
        </section>

        <section id="protocolos" className="protocol-section">
          <div className="protocol-intro section-wrap">
            <div><p className="eyebrow light"><span></span> 04 / COMUNICAÇÃO OFFLINE</p><h2>Uma mensagem não precisa de internet contínua para ser confiável.</h2></div>
            <p>O pacote de missão atravessa rádio autorizado, satélite, rede local ou transporte físico de dados. Cada entrega é registrada, classificada e protegida; a decisão humana continua no centro.</p>
          </div>
          <div className="protocol-flow section-wrap">
            {protocolSteps.map(([number, title, copy], index) => (
              <div className="protocol-step" key={number}>
                <span>{number}</span><h3>{title}</h3><p>{copy}</p>{index < protocolSteps.length - 1 && <i>→</i>}
              </div>
            ))}
          </div>
          <div className="protocol-foot section-wrap"><Radio size={20} /><p><strong>Padrão de referência:</strong> o Bundle Protocol v7 usa uma abordagem <em>store-carry-forward</em> adequada a conectividade intermitente; o BPSec adiciona integridade e confidencialidade à mensagem.[1][2]</p></div>
        </section>

        <section id="sustentacao" className="sustain-section section-wrap">
          <div className="section-heading">
            <div><p className="eyebrow"><span></span> 05 / SUSTENTAÇÃO REMOTA</p><h2>Deserto exige logística que consiga voltar.</h2></div>
            <div className="heading-note"><span>CAMADA / SUSTENTAÇÃO / VERIFICAR</span><p>Autonomia não é só combustível no tanque. É estoque de base, reserva avançada, qualidade, consumo, manutenção, água, peças e margem para retorno ou resgate.</p></div>
          </div>
          <div className="desert-layout">
            <div className="desert-photo"><img src="/manus-storage/arca-desert-logistics_5e5e14e0.jpg" alt="Operação logística humanitária em ambiente desértico" /><span>CAMPO / AMANHECER / NÃO COMBATE</span></div>
            <div className="sustain-table">
              <div className="table-row table-head"><span>CAMADA</span><span>FUNÇÃO</span><span>CONTROLE</span></div>
              <div className="table-row"><b>01 — BASE</b><span>Energia, água, estoque e manutenção regional.</span><i>saldo + qualidade</i></div>
              <div className="table-row amber-row"><b>02 — AVANÇADA</b><span>Reserva próxima ao corredor e apoio de recuperação.</span><i>emissão + telemetria</i></div>
              <div className="table-row"><b>03 — MISSÃO</b><span>Autonomia embarcada para ida, desvio, retorno e resgate.</span><i>margem + abortagem</i></div>
              <div className="maintenance-callout"><Wrench size={19} /><p><strong>Manutenção acompanha a missão.</strong> Inspeção do operador, célula avançada, oficina regional e reparo especializado formam uma única cadeia de disponibilidade.</p></div>
            </div>
          </div>
        </section>

        <section className="governance-section section-wrap">
          <div className="governance-copy">
            <p className="eyebrow"><span></span> 06 / GOVERNANÇA</p>
            <h2>Capacidade especializada, finalidade humanitária.</h2>
            <p>Ativos de defesa civil e militares podem ampliar busca e salvamento, engenharia, transporte, saúde, água e comunicações quando formalmente autorizados. O ARCA organiza evidências e rastreia a missão; não assume comando de forças.</p>
            <a className="plain-link dark-link" href="#tutorial">Ver limites de uso <ArrowUpRight size={17} /></a>
          </div>
          <div className="governance-rules">
            <div className="allowed"><span>PERMITIDO</span><p>Busca e salvamento, engenharia, evacuação médica, hospitais de campanha, água, telecomunicações e logística humanitária.</p></div>
            <div className="blocked"><span>PROIBIDO</span><p>Selecionar alvos, planejar ataques, perseguir pessoas, vigilância política ou uso autônomo de força.</p></div>
            <div className="human"><ShieldCheck size={28} /><p><strong>Humano autoriza.</strong> Toda decisão crítica exige finalidade registrada, autoridade competente, prazo de validade e trilha de auditoria.</p></div>
          </div>
        </section>

        <section className="technology-section">
          <div className="section-wrap tech-grid">
            <div className="tech-text"><p className="eyebrow light"><span></span> 07 / TECNOLOGIA</p><h2>Interface leve hoje. Núcleo Rust onde ele importa.</h2><p>O site público usa tecnologias web estáticas porque todo dispositivo abre um navegador. Rust entra no núcleo futuro: edge nodes, WebAssembly, validação local e sincronização de alto desempenho.</p></div>
            <div className="tech-stack">
              <div><span>NO NAVEGADOR</span><strong>HTML + CSS + TS</strong><p>Compatibilidade direta, pouca instalação e entrega leve.</p></div>
              <div className="stack-bridge">↔</div>
              <div className="rust-block"><span>NO EDGE</span><strong>RUST + WASM</strong><p>Portabilidade, segurança de memória e processamento local.</p></div>
            </div>
          </div>
        </section>

        <section id="roteiro" className="roadmap-section section-wrap">
          <div className="section-heading"><div><p className="eyebrow"><span></span> 08 / ROTEIRO</p><h2>Escalar por evidência, não por promessa.</h2></div><div className="heading-note"><span>ARCA / ROTA DE MATURIDADE</span><p>O primeiro passo é um piloto pequeno, auditável e útil. A visão permanece global; a validação acontece por corredor, comunidade e exercício.</p></div></div>
          <div className="roadmap-line">
            <div><b>01</b><span>PILOTO</span><h3>Uma região.<br />Um corredor.</h3><p>Risco prioritário, nó edge e inventário de ativos.</p></div>
            <div><b>02</b><span>VALIDAÇÃO</span><h3>Exercitar antes<br />da crise.</h3><p>Testar comunicação, sustentação e governança.</p></div>
            <div><b>03</b><span>ESCALA</span><h3>Conectar sem<br />centralizar.</h3><p>Expandir contratos de dados e ajuda mútua.</p></div>
            <div><b>04</b><span>MATURIDADE</span><h3>Aprender em<br />escala global.</h3><p>Atualizar modelos a partir de missões concluídas.</p></div>
          </div>
        </section>

        <section id="tutorial" className="tutorial-section section-wrap">
          <div><p className="eyebrow"><span></span> COMO USAR ESTE ATLAS</p><h2>Leia o ARCA em três movimentos.</h2></div>
          <ol>
            <li><span>01</span><p><strong>Comece pelo ambiente.</strong> Selecione um perfil e veja quais condições alteram a viabilidade da missão.</p></li>
            <li><span>02</span><p><strong>Confira a sustentação.</strong> Avalie como combustível, comunicação, manutenção e retorno entram antes do deslocamento.</p></li>
            <li><span>03</span><p><strong>Valide a governança.</strong> Diferencie recomendação técnica, autorização humana e limites de proteção civil.</p></li>
          </ol>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand"><img src="/manus-storage/arca-mark_e311354d.png" alt="" /><span><b>ARCA</b><i>PREPARAÇÃO VERIFICÁVEL</i></span></div>
        <p>Projeto de visão para infraestrutura de resiliência climática, proteção civil e coordenação humanitária.</p>
        <div className="sources">FONTES: IETF RFC 9171/9172 · OCHA · CISA · UNGSC · WFP · FAA</div>
      </footer>
    </div>
  );
}

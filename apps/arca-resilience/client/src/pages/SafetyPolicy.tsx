/**
 * Design: Atlas de Campo Planetário — transparência operacional em linguagem
 * simples, com a mesma hierarquia e materialidade do Assistente ARCA.
 */
import { ArrowLeft, Eye, FileLock2, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

export default function SafetyPolicy() {
  return (
    <main className="assistant-page">
      <section className="assistant-gate policy-page">
        <Link href="/" className="assistant-back"><ArrowLeft size={16} /> Voltar ao Atlas</Link>
        <p className="eyebrow"><span></span> TRANSPARÊNCIA E SEGURANÇA</p>
        <h1>Segurança sem vigilância oculta.</h1>
        <p>O ARCA bloqueia orientações que facilitem ações perigosas e mostra fontes oficiais. Ele não monitora pessoas entre conversas, não cria perfis secretos e não contata autoridades automaticamente.</p>

        <div className="policy-grid">
          <article>
            <FileLock2 size={20} />
            <h2>Conversa privada por padrão</h2>
            <p>As conversas ficam separadas por conta, têm finalidade declarada e não se tornam dados agregados sem autorização específica.</p>
          </article>
          <article>
            <ShieldCheck size={20} />
            <h2>Alerta preventivo, não acusação</h2>
            <p>Uma intenção explícita de entrada não autorizada em área restrita recebe bloqueio, explicação de risco e fontes oficiais. Uma pergunta histórica ou hipotética não gera sinal.</p>
          </article>
          <article>
            <Eye size={20} />
            <h2>Revisão humana com prazo</h2>
            <p>Sinais explícitos e iminentes podem entrar em fila privada de revisão autorizada, com registro de decisão e expiração. O ARCA base não executa contato externo.</p>
          </article>
        </div>

        <div className="assistant-guardrail policy-rule"><ShieldCheck size={20} /><span>Qualquer integração futura com uma autoridade exigirá política pública, base legal aplicável, usuários autorizados, aprovação humana e auditoria. O assistente não toma essa decisão sozinho.</span></div>
        <Link href="/assistente" className="assistant-login">Abrir Assistente ARCA</Link>
      </section>
    </main>
  );
}

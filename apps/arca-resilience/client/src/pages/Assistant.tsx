/**
 * Design: Atlas de Campo Planetário — área privada com o mesmo papel mineral,
 * identidade cartográfica e sinais de confiança da landing pública.
 */
import { useState } from "react";
import { ArrowLeft, FileLock2, LogIn, MessageSquarePlus, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";

const suggestedPrompts = [
  "Como estruturo um plano comunitário de preparação para ondas de calor?",
  "Quais perguntas devo validar antes de propor um corredor de abastecimento remoto?",
  "Ajude-me a transformar um problema complexo em próximos passos seguros.",
];

export default function Assistant() {
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [draftMessages, setDraftMessages] = useState<Message[]>([]);

  const consent = trpc.assistant.consent.useQuery(undefined, { enabled: isAuthenticated });
  const conversations = trpc.assistant.conversations.useQuery(undefined, { enabled: isAuthenticated && Boolean(consent.data?.accepted) });
  const messages = trpc.assistant.messages.useQuery(
    { conversationId: activeConversationId ?? 1 },
    { enabled: isAuthenticated && Boolean(consent.data?.accepted) && activeConversationId !== null },
  );

  const acceptConsent = trpc.assistant.acceptConsent.useMutation({
    onSuccess: () => {
      void utils.assistant.consent.invalidate();
      void utils.assistant.conversations.invalidate();
    },
  });

  const chat = trpc.assistant.chat.useMutation({
    onSuccess: result => {
      setActiveConversationId(result.conversationId);
      setDraftMessages(current => [...current, { role: "assistant", content: result.reply }]);
      void utils.assistant.conversations.invalidate();
      void utils.assistant.messages.invalidate();
    },
  });

  const serverMessages: Message[] = (messages.data ?? []).map(message => ({
    role: message.role,
    content: message.content,
  }));
  const visibleMessages = activeConversationId === null ? draftMessages : serverMessages;

  const startConversation = () => {
    setActiveConversationId(null);
    setDraftMessages([]);
  };

  const sendMessage = (content: string) => {
    if (activeConversationId === null) {
      setDraftMessages(current => [...current, { role: "user", content }]);
    }
    chat.mutate({ content, conversationId: activeConversationId ?? undefined });
  };

  if (loading) {
    return <main className="assistant-page"><div className="assistant-status">CARREGANDO IDENTIDADE ARCA…</div></main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="assistant-page">
        <section className="assistant-gate">
          <Link href="/" className="assistant-back"><ArrowLeft size={16} /> Voltar ao Atlas</Link>
          <p className="eyebrow"><span></span> ÁREA PROTEGIDA / ASSISTENTE ARCA</p>
          <h1>Converse com o ARCA sob sua própria identidade.</h1>
          <p>Para proteger o histórico e evitar que conversas de pessoas diferentes se misturem, o assistente exige uma sessão autenticada antes de guardar qualquer mensagem.</p>
          <button className="assistant-login" onClick={startLogin}>Entrar para continuar <LogIn size={17} /></button>
          <div className="assistant-guardrail"><ShieldCheck size={20} /><span>O assistente não substitui autoridades, equipes de emergência ou profissionais especializados. <Link href="/seguranca">Leia como funcionam alertas, privacidade e revisão humana.</Link></span></div>
        </section>
      </main>
    );
  }

  if (consent.isLoading) {
    return <main className="assistant-page"><div className="assistant-status">VERIFICANDO PREFERÊNCIAS DE PRIVACIDADE…</div></main>;
  }

  if (!consent.data?.accepted) {
    return (
      <main className="assistant-page">
        <section className="assistant-gate">
          <Link href="/" className="assistant-back"><ArrowLeft size={16} /> Voltar ao Atlas</Link>
          <p className="eyebrow"><span></span> PRIVACIDADE ANTES DA CONVERSA</p>
          <h1>Seu histórico ARCA é privado por padrão.</h1>
          <p>Ao continuar, o ARCA guardará suas conversas na sua área autenticada para você retomar o contexto. Ele não compartilha esse conteúdo com outros usuários nem o transforma em dados agregados sem uma autorização específica posterior.</p>
          <button className="assistant-login" disabled={acceptConsent.isPending} onClick={() => acceptConsent.mutate()}>
            <FileLock2 size={17} /> {acceptConsent.isPending ? "Registrando escolha…" : "Aceitar e iniciar conversa"}
          </button>
          <div className="assistant-guardrail"><ShieldCheck size={20} /><span>Evite inserir endereços exatos, credenciais, documentos ou dados médicos. O ARCA bloqueia orientação perigosa, mas não realiza denúncias secretas nem contato externo automático. <Link href="/seguranca">Entenda o protocolo.</Link></span></div>
        </section>
      </main>
    );
  }

  return (
    <main className="assistant-page">
      <header className="assistant-header">
        <Link href="/" className="assistant-back"><ArrowLeft size={16} /> Atlas público</Link>
        <div className="assistant-identity"><span>ARCA / ASSISTENTE PRIVADO</span><strong>{user?.name || "Pessoa usuária"}</strong></div>
      </header>
      <section className="assistant-workspace">
        <aside className="conversation-rail">
          <button className="new-conversation" onClick={startConversation}><MessageSquarePlus size={17} /> Nova conversa</button>
          <p>CONVERSAS RECENTES</p>
          <div className="conversation-list">
            {conversations.data?.length ? conversations.data.map(conversation => (
              <button key={conversation.id} className={activeConversationId === conversation.id ? "conversation-active" : ""} onClick={() => { setActiveConversationId(conversation.id); setDraftMessages([]); }}>
                <strong>{conversation.title}</strong><span>{new Date(conversation.lastMessageAt).toLocaleDateString("pt-BR")}</span>
              </button>
            )) : <small>Ainda não há histórico. Comece por uma pergunta segura.</small>}
          </div>
          <div className="rail-rule"><ShieldCheck size={17} /><span>Dados privados, finalidade declarada e registro de acesso.</span></div>
        </aside>
        <section className="assistant-chat-area">
          <div className="assistant-chat-heading">
            <p className="eyebrow"><span></span> APOIO INFORMACIONAL</p>
            <h1>Estruture o problema. Preserve o julgamento humano.</h1>
            <p>O ARCA ajuda a transformar situações complexas em perguntas, riscos, hipóteses e próximos passos seguros. Ele não opera ativos, não autoriza missões e não substitui a resposta local. <Link href="/seguranca">Veja os limites de alerta e escalonamento.</Link></p>
          </div>
          <AIChatBox
            messages={visibleMessages}
            onSendMessage={sendMessage}
            isLoading={chat.isPending || messages.isLoading}
            height="510px"
            placeholder="Escreva uma situação, pergunta ou plano que deseja estruturar…"
            emptyStateMessage="Comece com uma situação que você quer entender ou preparar."
            suggestedPrompts={suggestedPrompts}
            className="arca-chat-box"
          />
          {chat.error && <p className="assistant-error">{chat.error.message}</p>}
        </section>
      </section>
    </main>
  );
}

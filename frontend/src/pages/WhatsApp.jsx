import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, CheckCheck, AlertCircle, RefreshCw, MessageCircleOff, ArrowLeft, Eye, ExternalLink } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import useApi from '../hooks/useApi';
import useSocket from '../hooks/useSocket';
import useMediaQuery from '../hooks/useMediaQuery';
import { fetchMessages, fetchClients } from '../services/api';

// ------- Helpers -------
const formatTime = (dateStr) => {
  if (!dateStr) return '';
  try { return format(parseISO(dateStr), 'HH:mm', { locale: ptBR }); }
  catch { return ''; }
};

// Agrupa mensagens por telefone para montar a lista de conversas
const groupByPhone = (messages, clientsData = []) => {
  const map = new Map();
  messages.forEach((m) => {
    const key = m.phone || 'desconhecido';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(m);
  });
  return Array.from(map.entries())
    .map(([phone, msgs]) => {
      const rawPhone = phone.replace(/\D/g, '');
      const client = clientsData.find(c => c.phone?.replace(/\D/g, '') === rawPhone);
      const name = client?.name || null;
      return {
        phone,
        clientName: name,
        label: name || phone,
        lastMsg: msgs[msgs.length - 1],
        messages: msgs,
      };
    })
    .sort((a, b) => {
      if (!a.lastMsg || !b.lastMsg) return 0;
      return new Date(b.lastMsg.created_at) - new Date(a.lastMsg.created_at);
    });
};

// ------- Loading Skeleton (mensagem) -------
const MsgSkeleton = ({ right = false }) => (
  <div className={`flex ${right ? 'justify-end' : 'justify-start'} animate-pulse`}>
    <div className={`h-10 rounded-2xl bg-dark-200 dark:bg-dark-700 ${right ? 'w-48' : 'w-56'}`} />
  </div>
);

// ------- Skeleton de conversa -------
const ConvSkeleton = () => (
  <div className="p-4 animate-pulse flex gap-3 border-b border-dark-100 dark:border-dark-800">
    <div className="w-10 h-10 rounded-full bg-dark-200 dark:bg-dark-700 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-3 w-24 rounded bg-dark-200 dark:bg-dark-700" />
      <div className="h-3 w-40 rounded bg-dark-200 dark:bg-dark-700" />
    </div>
  </div>
);

// ------- WhatsApp Page (somente leitura) -------
const WhatsApp = () => {
  const { isMobile } = useMediaQuery();

  const [mobileView, setMobileView] = useState('list');
  const [selectedPhone, setSelectedPhone] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [messagesData, setMessagesData] = useState([]);
  const messagesEndRef = useRef(null);

  const { data: initialMessages, loading, error, refetch: refetchMsgs } = useApi(fetchMessages);
  const { data: clientsData, refetch: refetchClients } = useApi(fetchClients);

  useEffect(() => {
    if (initialMessages) setMessagesData(initialMessages);
  }, [initialMessages]);

  const handleRefetch = () => {
    refetchMsgs();
    refetchClients();
  };

  // Real-time via Socket.io — só leitura, apenas recebe mensagens novas
  useSocket('new_message', (msg) => {
    setMessagesData((prev) => {
      if (prev.find(m => m.id === msg.id)) return prev;
      return [...prev, msg];
    });
  });

  const conversations = useMemo(() => {
    return groupByPhone(messagesData, clientsData || []);
  }, [messagesData, clientsData]);

  // Seleciona a primeira conversa automaticamente (só no desktop)
  useEffect(() => {
    if (!isMobile && !selectedPhone && conversations.length > 0) {
      setSelectedPhone(conversations[0].phone);
    }
  }, [conversations, selectedPhone, isMobile]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.phone === selectedPhone),
    [conversations, selectedPhone]
  );

  const filteredConversations = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return conversations.filter((c) => c.phone.includes(q));
  }, [conversations, searchTerm]);

  // Scroll automático ao fundo quando chegam mensagens
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleSelectConversation = (phone) => {
    setSelectedPhone(phone);
    if (isMobile) setMobileView('chat');
  };

  const handleBack = () => {
    setMobileView('list');
    setSelectedPhone(null);
  };

  const showList = !isMobile || mobileView === 'list';
  const showChat = !isMobile || mobileView === 'chat';

  return (
    <div className="animate-fade-in -mx-4 md:mx-0 -mt-4 md:mt-0">
      <div
        className="flex gap-0 md:gap-6"
        style={{ height: 'calc(100dvh - 3.5rem)' }}
      >
        {/* ====== COLUNA ESQUERDA: lista de conversas ====== */}
        {showList && (
          <div className={`${isMobile ? 'w-full' : 'w-80 shrink-0'} glass-panel md:rounded-2xl flex flex-col overflow-hidden`}>
            {/* Header da lista */}
            <div className="p-4 border-b border-dark-200 dark:border-dark-800 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-dark-900 dark:text-white">Mensagens</h2>
                  {/* Badge somente leitura */}
                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-dark-100 dark:bg-dark-800 text-dark-400 dark:text-dark-500 border border-dark-200 dark:border-dark-700 select-none">
                    <Eye size={10} />
                    Somente leitura
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <button
                    onClick={handleRefetch}
                    title="Sincronizar Manualmente"
                    className="p-1.5 rounded-lg text-dark-400 hover:text-dark-900 dark:hover:text-white hover:bg-dark-100 dark:hover:bg-dark-800 transition-all active:scale-90"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={15} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar conversa..."
                  className="w-full bg-dark-50 dark:bg-dark-800 border-none rounded-xl py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 text-dark-900 dark:text-dark-100 placeholder-dark-400 shadow-sm"
                />
              </div>
            </div>

            {/* Erro */}
            {error && (
              <div className="mx-3 mt-3 flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs">
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            {/* Lista de conversas */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {loading && messagesData.length === 0 ? (
                Array.from({ length: 4 }).map((_, i) => <ConvSkeleton key={i} />)
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 gap-2 text-dark-400">
                  <MessageCircleOff size={24} />
                  <span className="text-sm">Nenhuma conversa</span>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.phone === selectedPhone;
                  return (
                    <div
                      key={conv.phone}
                      onClick={() => handleSelectConversation(conv.phone)}
                      className={`p-4 border-b border-dark-100 dark:border-dark-800/50 cursor-pointer transition-colors hover:shadow-md active:scale-[0.98] ${
                        isActive && !isMobile
                          ? 'border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                          : 'border-l-4 border-transparent hover:bg-dark-50 dark:hover:bg-dark-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold shrink-0 text-sm shadow-sm">
                          {conv.clientName ? conv.clientName.charAt(0).toUpperCase() : (conv.phone || '?').charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <div className="flex justify-between items-baseline mb-0.5">
                            <h3 className="font-semibold text-dark-900 dark:text-white text-sm truncate max-w-[160px]">
                              {conv.clientName ? conv.clientName : conv.phone}
                            </h3>
                            <span className="text-[10px] text-dark-400 shrink-0 ml-1 font-medium">
                              {conv.lastMsg ? formatTime(conv.lastMsg.created_at) : ''}
                            </span>
                          </div>
                          {conv.clientName && (
                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400/80 mb-0.5 truncate font-medium">
                              {conv.phone}
                            </p>
                          )}
                          <p className="text-xs text-dark-500 dark:text-dark-400 truncate">
                            {conv.lastMsg?.message || '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ====== COLUNA DIREITA: área de visualização ====== */}
        {showChat && (
          <div className={`${isMobile ? 'w-full' : 'flex-1'} glass-panel md:rounded-2xl flex flex-col overflow-hidden relative bg-[url('https://i.pinimg.com/1200x/8c/98/99/8c98994518b575bfd8c949e91d20548b.jpg')] bg-cover bg-center before:content-[''] before:absolute before:inset-0 before:bg-white/90 dark:before:bg-dark-900/90 before:backdrop-blur-sm`}>

            {/* Header do chat */}
            <div className="h-14 md:h-16 border-b border-dark-200 dark:border-dark-800 bg-white/70 dark:bg-dark-900/70 px-4 md:px-6 flex items-center gap-3 shrink-0 relative z-10 backdrop-blur-md">
              {isMobile && (
                <button
                  onClick={handleBack}
                  className="p-2 -ml-1 rounded-xl text-dark-500 hover:bg-dark-100 dark:text-dark-400 dark:hover:bg-dark-800 transition-colors"
                  aria-label="Voltar para lista"
                >
                  <ArrowLeft size={20} />
                </button>
              )}

              {activeConversation ? (
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm shrink-0 shadow-sm">
                    {activeConversation.clientName ? activeConversation.clientName.charAt(0).toUpperCase() : (activeConversation.phone || '?').charAt(0)}
                  </div>
                  <div className="min-w-0 flex flex-col">
                    <h2 className="font-bold text-dark-900 dark:text-white text-sm truncate leading-tight">
                      {activeConversation.clientName ? activeConversation.clientName : activeConversation.phone}
                    </h2>
                    <p className="text-[11px] text-dark-400 font-medium">
                      {activeConversation.clientName && <span>{activeConversation.phone} • </span>}
                      {activeConversation.messages.length} mensagem{activeConversation.messages.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-dark-400">Selecione uma conversa</span>
              )}
            </div>

            {/* Mensagens — somente leitura */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 relative z-10 custom-scrollbar">
              {loading && messagesData.length === 0 ? (
                <>
                  <MsgSkeleton />
                  <MsgSkeleton right />
                  <MsgSkeleton />
                  <MsgSkeleton right />
                </>
              ) : !activeConversation ? (
                <div className="h-full flex items-center justify-center text-dark-400">
                  <div className="text-center px-6 bg-white/50 dark:bg-dark-800/50 p-6 rounded-3xl backdrop-blur-md shadow-sm">
                    <MessageCircleOff size={36} className="mx-auto mb-3 opacity-60" />
                    <p className="text-sm font-medium">Selecione uma conversa para visualizar o histórico</p>
                  </div>
                </div>
              ) : (
                activeConversation.messages.map((msg) => {
                  const isOut = msg.sender === 'admin' || msg.sender === 'ai';
                  const isAi = msg.sender === 'ai';

                  return (
                    <div key={msg.id} className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
                        isOut
                          ? 'bg-[#005c4b] dark:bg-emerald-600 text-white rounded-tr-none shadow-emerald-900/20'
                          : 'bg-white dark:bg-dark-800 text-dark-900 dark:text-white rounded-tl-none border border-dark-100 dark:border-dark-700'
                      }`}>
                        {isAi && (
                          <div className="text-[10px] font-bold text-emerald-200 mb-1 flex items-center gap-1 opacity-80">
                            🤖 AI Assistente
                          </div>
                        )}
                        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.message}</p>
                        <div className={`text-[10px] flex items-center justify-end mt-1.5 gap-1 ${isOut ? 'text-emerald-100/70' : 'text-dark-400'}`}>
                          {formatTime(msg.created_at)}
                          {isOut && <CheckCheck size={14} className="text-emerald-300" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Rodapé somente leitura */}
            <div className="p-3 md:p-4 bg-white/70 dark:bg-dark-900/70 backdrop-blur-xl border-t border-dark-200 dark:border-dark-800 shrink-0 safe-area-bottom relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-dark-400 dark:text-dark-500 text-xs py-1 select-none text-center sm:text-left">
                <Eye size={13} className="shrink-0" />
                <span>Visualização somente leitura — respostas são gerenciadas pelo Agente IA</span>
              </div>
              {activeConversation && (
                <a 
                  href={`https://wa.me/${activeConversation.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-full sm:w-auto gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm hover:shadow-emerald-500/20 active:scale-95"
                >
                  <ExternalLink size={16} />
                  Abrir no WhatsApp
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhatsApp;

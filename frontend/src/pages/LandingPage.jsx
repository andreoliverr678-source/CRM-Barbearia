import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Scissors, 
  Calendar, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  DollarSign, 
  ArrowRight, 
  ShieldCheck, 
  Smartphone, 
  ChevronRight,
  Star,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const whatsappUrl = "https://wa.me/5521966636956?text=Ol%C3%A1%21+Vi+a+p%C3%A1gina+do+Cadeira+Cheia+e+tenho+interesse+em+conhecer+o+sistema+e+elevar+o+faturamento+da+minha+barbearia.";

  return (
    <div className="min-h-screen bg-dark-950 text-white font-sans overflow-x-hidden selection:bg-amber-500 selection:text-white">
      {/* ── GLOWING BACKGROUND DECORATIONS (GOLD & CHARCOAL) ───────────────────── */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[6000ms]" />
      <div className="absolute top-[30%] right-1/4 w-[500px] h-[500px] bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] left-10 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── HEADER / NAVIGATION ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-dark-950/85 backdrop-blur-md border-b border-dark-800/60 transition-all duration-350">
        <div className="max-w-7xl mx-auto px-6 h-18 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/cadeira_cheia_logo.jpg" 
              className="w-10 h-10 rounded-xl object-cover border border-amber-500/30" 
              alt="Logo Cadeira Cheia" 
            />
            <span className="text-xl font-bold tracking-wider text-white">
              Cadeira<span className="text-amber-555 text-[#c5a880]">Cheia</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-dark-400 font-medium">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#demonstracao" className="hover:text-white transition-colors">Visualização</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
            <a href="#beneficios" className="hover:text-white transition-colors">Benefícios</a>
          </nav>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="text-sm text-dark-300 hover:text-white transition-colors font-medium px-4 py-2"
            >
              Entrar
            </button>
            <a 
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-amber-600 hover:bg-amber-550 text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-all shadow-lg shadow-amber-600/10 hover:scale-[1.02] flex items-center gap-2"
            >
              Testar Grátis
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ──────────────────────────────────────────────────────── */}
      <section className="relative pt-12 pb-20 md:pt-24 md:pb-32 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left copy */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              Mais agendamentos. Menos faltas. Mais faturamento.
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
              Sua Barbearia com a <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-[#c5a880]">Cadeira Cheia</span> todos os dias
            </h1>

            <p className="text-dark-300 text-base sm:text-lg leading-relaxed max-w-xl">
              Atendimento 24h automatizado com Inteligência Artificial, envio de lembretes automáticos e gestão simplificada para barbearias de alto nível.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2">
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-600 hover:bg-amber-550 text-white font-bold rounded-2xl px-8 py-4 transition-all shadow-xl shadow-amber-600/20 hover:scale-[1.02] text-center flex items-center justify-center gap-3 text-base"
              >
                Garantir Cadeira Cheia
                <ArrowRight size={18} />
              </a>
              <a 
                href="#funcionalidades"
                className="bg-dark-900 hover:bg-dark-850 text-dark-200 border border-dark-800 font-medium rounded-2xl px-8 py-4 transition-all text-center flex items-center justify-center gap-2 text-base hover:text-white"
              >
                Conhecer Recursos
              </a>
            </div>

            {/* Quick trust proof */}
            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-dark-900 w-full">
              <div>
                <p className="text-2xl font-bold text-white">IA 24h</p>
                <p className="text-xs text-dark-500">Agendamentos no WhatsApp</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">0% Faltas</p>
                <p className="text-xs text-dark-500">Com lembretes automáticos</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">Lucro Máximo</p>
                <p className="text-xs text-dark-500">Cadeira sempre ocupada</p>
              </div>
            </div>
          </div>

          {/* Right Preview - Cadeira Cheia Widescreen Banner */}
          <div className="lg:col-span-5 relative w-full flex justify-center lg:justify-end">
            <div className="relative w-full max-w-xl animate-fade-in">
              {/* Glow decoration */}
              <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/10 to-yellow-600/10 rounded-3xl blur-2xl pointer-events-none" />
              
              <div className="relative rounded-2xl border border-amber-500/30 bg-dark-900 p-2.5 shadow-2xl overflow-hidden transition-all hover:scale-[1.01] duration-300">
                <img 
                  src="/cadeira_cheia_banner.png" 
                  alt="Apresentação Cadeira Cheia" 
                  className="w-full h-auto rounded-xl object-cover"
                />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── BANNER BOTTOM TEXT LINE ────────────────────────────────────────────── */}
      <div className="bg-dark-900/60 border-y border-dark-800/80 py-4 px-6 text-center">
        <p className="text-sm font-bold tracking-widest text-[#c5a880] uppercase flex items-center justify-center gap-2">
          <Sparkles size={16} />
          Transformamos conversas em clientes na cadeira.
          <Sparkles size={16} />
        </p>
      </div>

      {/* ── FUNCIONALIDADES / CARDS ────────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-20 md:py-28 px-6 bg-dark-900/40 border-b border-dark-900 relative">
        <div className="max-w-7xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Funcionalidades Principais</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Como enchemos a cadeira da sua barbearia
          </h2>
          <p className="text-dark-400 text-sm md:text-base max-w-xl mx-auto">
            Uma estrutura inteligente focada em reter clientes, reduzir o tempo gasto na recepção e automatizar tudo por WhatsApp.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-850 hover:border-amber-500/30 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
              <Bot size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Atendimento 24h com IA</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Responda seus clientes no WhatsApp a qualquer hora do dia ou da noite, tirando dúvidas e realizando agendamentos de forma imediata.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-850 hover:border-amber-500/30 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
              <Calendar size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Agendamentos Automáticos</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              O cliente agenda sozinho em segundos. O horário cai direto no painel do administrador e na agenda do barbeiro responsável.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-850 hover:border-amber-500/30 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Lembretes Automáticos</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Reduza o esquecimento e as faltas em até 80% enviando mensagens de confirmação inteligentes antes do horário marcado.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-850 hover:border-amber-500/30 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Mais Clientes, Mais Lucro</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Fidelização inteligente com ações direcionadas para clientes sumidos e lembretes para retorno periódico com base no histórico.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-850 hover:border-amber-500/30 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
              <Smartphone size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">BarberApp Integrado</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Aplicativo exclusivo para que seus barbeiros gerenciem sua própria rotina diária de agendamentos e acompanhem suas comissões em tempo real.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-850 hover:border-amber-500/30 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 group-hover:scale-110 transition-transform">
              <DollarSign size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Gestão Financeira e Caixa</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Acompanhe o faturamento geral, comissões de barbeiros e ticket médio, de forma organizada em gráficos simplificados.
            </p>
          </div>

        </div>
      </section>

      {/* ── SEÇÃO DE TELAS / PRINTS DO APP ───────────────────────────────────── */}
      <section id="demonstracao" className="py-20 md:py-28 px-6 bg-dark-900/20 border-b border-dark-900 relative">
        <div className="max-w-7xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Demonstração Visual</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Uma interface pensada para facilidade de uso
          </h2>
          <p className="text-dark-400 text-sm md:text-base max-w-xl mx-auto">
            Veja como o sistema se adapta perfeitamente ao seu computador e como sua equipe acompanha os horários no celular.
          </p>
        </div>

        <div className="max-w-7xl mx-auto space-y-20">
          {/* Painel PC */}
          <div className="space-y-6">
            <h3 className="text-xl md:text-2xl font-bold text-white flex items-center gap-3 justify-center md:justify-start">
              <span className="w-2 h-6 bg-amber-500 rounded-full inline-block" />
              Painel Geral do Administrador (Versão Computador - 16:9)
            </h3>
            <div className="rounded-2xl border border-dark-850 bg-dark-900/50 p-2 shadow-2xl overflow-hidden max-w-5xl mx-auto">
              <img 
                src="/dashboard_desktop.png" 
                alt="Painel Geral PC" 
                className="w-full h-auto rounded-xl"
              />
            </div>
          </div>

          {/* Celulares Lado a Lado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 max-w-4xl mx-auto">
            
            {/* Celular 1: Visão Geral Admin */}
            <div className="space-y-6 flex flex-col items-center">
              <h4 className="text-lg font-bold text-white flex items-center gap-2 self-start md:self-center">
                <span className="w-2 h-5 bg-amber-500 rounded-full inline-block" />
                Painel do Administrador (Versão Celular - 9:16)
              </h4>
              <div className="w-full max-w-[280px] rounded-[36px] border-8 border-dark-800 bg-dark-950 shadow-2xl overflow-hidden transition-transform hover:scale-[1.02] duration-300">
                <img 
                  src="/dashboard_mobile.jpg" 
                  alt="Painel Administrador Celular" 
                  className="w-full h-auto"
                />
              </div>
              <p className="text-sm text-dark-400 text-center max-w-xs leading-relaxed">
                Acompanhe o faturamento mensal, total de clientes e atendimentos da semana na palma da sua mão.
              </p>
            </div>

            {/* Celular 2: BarberApp */}
            <div className="space-y-6 flex flex-col items-center">
              <h4 className="text-lg font-bold text-white flex items-center gap-2 self-start md:self-center">
                <span className="w-2 h-5 bg-amber-500 rounded-full inline-block" />
                Minha Agenda - BarberApp (Barbeiros - 9:16)
              </h4>
              <div className="w-full max-w-[280px] rounded-[36px] border-8 border-dark-800 bg-dark-950 shadow-2xl overflow-hidden transition-transform hover:scale-[1.02] duration-300">
                <img 
                  src="/barberapp_mobile.jpg" 
                  alt="BarberApp Celular" 
                  className="w-full h-auto"
                />
              </div>
              <p className="text-sm text-dark-400 text-center max-w-xs leading-relaxed">
                Seus colaboradores consultam os horários agendados, marcam serviços como concluídos e controlam o dia com facilidade.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ──────────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          <div className="space-y-6">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Processo Simples</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              Instalação rápida e suporte dedicado para sua Barbearia
            </h2>
            <p className="text-dark-400 text-sm md:text-base leading-relaxed">
              Nossa plataforma foi pensada para ser extremamente intuitiva. Em poucos minutos, você estará com o Cadeira Cheia configurado e seus barbeiros integrados.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-amber-500/20 text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Ativação da IA & WhatsApp</h4>
                  <p className="text-sm text-dark-400">Vinculamos o chatbot de inteligência artificial ao seu número de atendimento em minutos.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-amber-500/20 text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Importação da Equipe</h4>
                  <p className="text-sm text-dark-400">Cadastre seus profissionais, serviços prestados, valores e envie os links de acesso móvel.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center shrink-0 border border-amber-500/20 text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Cadeira Cheia</h4>
                  <p className="text-sm text-dark-400">Acompanhe seus relatórios de faturamento diário enquanto a IA atende e enche a sua agenda.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive details */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-3xl blur-lg opacity-10 pointer-events-none" />
            <div className="relative glass-panel rounded-3xl border border-dark-850 p-6 md:p-8 bg-dark-900/70 space-y-6">
              <h3 className="text-xl font-bold text-white">Quanto o Cadeira Cheia agrega ao seu negócio?</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-dark-300 mb-1">
                    <span>Aumento médio de faturamento</span>
                    <span className="text-amber-400 font-bold">+35%</span>
                  </div>
                  <div className="w-full h-2 bg-dark-950 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-amber-500 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-dark-300 mb-1">
                    <span>Redução de Faltas (WhatsApp Lembretes)</span>
                    <span className="text-amber-400 font-bold">-80%</span>
                  </div>
                  <div className="w-full h-2 bg-dark-950 rounded-full overflow-hidden">
                    <div className="w-[90%] h-full bg-amber-500 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-dark-300 mb-1">
                    <span>Otimização de Horários Ociosos</span>
                    <span className="text-amber-400 font-bold">+40%</span>
                  </div>
                  <div className="w-full h-2 bg-dark-950 rounded-full overflow-hidden">
                    <div className="w-[75%] h-full bg-amber-500 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800 space-y-2">
                <p className="text-xs text-dark-400 leading-relaxed italic">
                  "Depois que ativei o Cadeira Cheia, as mensagens de clientes fora do horário comercial são respondidas pela IA na hora e o agendamento cai pronto. Meu faturamento aumentou muito!"
                </p>
                <p className="text-xs font-bold text-white text-right">- Leandro S., Proprietário da Cadeira Gold</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── BENEFÍCIOS SECTION ────────────────────────────────────────────────── */}
      <section id="beneficios" className="py-20 md:py-28 px-6 bg-dark-900/40 border-t border-dark-900">
        <div className="max-w-7xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">Benefícios Reais</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Por que escolher o Cadeira Cheia?
          </h2>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="flex flex-col space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <CheckCircle2 size={20} />
            </div>
            <h4 className="text-lg font-bold text-white">Suporte & Integração</h4>
            <p className="text-dark-400 text-sm leading-relaxed">
              Fazemos toda a configuração inicial para você. Nosso suporte especializado configura o robô e o painel em seu WhatsApp rapidamente.
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Clock size={20} />
            </div>
            <h4 className="text-lg font-bold text-white">Automação de Verdade</h4>
            <p className="text-dark-400 text-sm leading-relaxed">
              Chega de ficar respondendo mensagens repetitivas ou mandando listas de horários. Deixe que o sistema gerencie e confirme os atendimentos.
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <TrendingUp size={20} />
            </div>
            <h4 className="text-lg font-bold text-white">Mais Retorno de Clientes</h4>
            <p className="text-dark-400 text-sm leading-relaxed">
              O sistema monitora a frequência de cada cliente e entra em contato educadamente quando passa do prazo normal de retorno daquele corte.
            </p>
          </div>

        </div>
      </section>

      {/* ── CALL TO ACTION FINAL ───────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-6 relative">
        <div className="max-w-5xl mx-auto relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-yellow-600 rounded-3xl blur-xl opacity-20 pointer-events-none" />
          
          <div className="relative glass-panel rounded-3xl p-8 md:p-14 bg-dark-900 border border-dark-800 text-center flex flex-col items-center space-y-8 overflow-hidden">
            
            {/* Background glowing ball inside box */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 max-w-2xl relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Diga adeus à agenda vazia e profissionalize sua barbearia
              </h2>
              <p className="text-dark-350 text-dark-300 text-sm sm:text-base leading-relaxed">
                Fale com a nossa equipe no WhatsApp, tire todas as dúvidas e comece a rodar o Cadeira Cheia na sua barbearia hoje mesmo.
              </p>
            </div>

            <div className="relative z-10 w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4 justify-center">
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-amber-600 hover:bg-amber-550 text-white font-bold rounded-2xl px-10 py-5 transition-all shadow-xl shadow-amber-600/30 hover:scale-[1.02] flex items-center gap-3 w-full sm:w-auto text-center justify-center text-base sm:text-lg"
              >
                Falar Conosco no WhatsApp
                <ArrowRight size={20} />
              </a>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs text-dark-400 relative z-10 font-semibold uppercase tracking-wider">
              <span>✓ IA Atendimento 24h</span>
              <span>✓ Sem Taxa de Adesão</span>
              <span>✓ Suporte Especializado</span>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="bg-dark-950 border-t border-dark-900 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-dark-400">
          <div className="flex items-center gap-3 text-white font-semibold">
            <img 
              src="/cadeira_cheia_logo.jpg" 
              className="w-6 h-6 rounded-md object-cover" 
              alt="Logo Cadeira Cheia Footer" 
            />
            <span>CadeiraCheia</span>
          </div>
          
          <p className="text-xs text-center md:text-left text-dark-500">
            &copy; {new Date().getFullYear()} Cadeira Cheia. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Suporte</a>
            <span className="text-dark-750 text-dark-700">|</span>
            <span className="text-dark-500 font-medium">WhatsApp: +55 (21) 96663-6956</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

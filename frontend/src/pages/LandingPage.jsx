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
  Clock
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const whatsappUrl = "https://wa.me/5521966636956?text=Ol%C3%A1%21+Vi+a+p%C3%A1gina+do+BarberCRM+e+tenho+interesse+em+conhecer+o+sistema+e+elevar+o+nível+da+minha+barbearia.";

  return (
    <div className="min-h-screen bg-dark-950 text-white font-sans overflow-x-hidden selection:bg-primary-500 selection:text-white">
      {/* ── GLOWING BACKGROUND DECORATIONS ────────────────────────────────────── */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-[6000ms]" />
      <div className="absolute top-[30%] right-1/4 w-[500px] h-[500px] bg-primary-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] left-10 w-80 h-80 bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* ── HEADER / NAVIGATION ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-dark-950/70 backdrop-blur-md border-b border-dark-800/60 transition-all duration-350">
        <div className="max-w-7xl mx-auto px-6 h-18 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 text-primary-500">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center border border-primary-500/20">
              <Scissors size={22} className="rotate-45" />
            </div>
            <span className="text-xl font-bold tracking-wider text-white">
              BARBER<span className="text-primary-500">CRM</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-dark-400 font-medium">
            <a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#como-funciona" className="hover:text-white transition-colors">Como Funciona</a>
            <a href="#beneficios" className="hover:text-white transition-colors">Benefícios</a>
            <a href="#depoimentos" className="hover:text-white transition-colors">Por que escolher</a>
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
              className="bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold rounded-xl px-5 py-2.5 transition-all shadow-lg shadow-primary-600/10 hover:scale-[1.02] flex items-center gap-2"
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
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-xs font-semibold uppercase tracking-wider">
              <Star size={12} className="fill-primary-400" />
              O Sistema de Gestão nº 1 para Barbearias
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
              Sua Barbearia no próximo nível com <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-green-500">Gestão Inteligente</span>
            </h1>

            <p className="text-dark-300 text-base sm:text-lg leading-relaxed max-w-xl">
              Faturamento em tempo real, agenda ágil, controle financeiro, comissão da equipe e ferramentas automáticas para trazer de volta clientes que não aparecem há semanas.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto pt-2">
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl px-8 py-4 transition-all shadow-xl shadow-primary-600/20 hover:scale-[1.02] text-center flex items-center justify-center gap-3 text-base"
              >
                Garantir BarberCRM Agora
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
                <p className="text-2xl font-bold text-white">100%</p>
                <p className="text-xs text-dark-500">Online & na Nuvem</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">+35%</p>
                <p className="text-xs text-dark-500">Retenção de Clientes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">BarberApp</p>
                <p className="text-xs text-dark-500">Para os Barbeiros</p>
              </div>
            </div>
          </div>

          {/* Right Preview - Interactive looking Mockup dashboard */}
          <div className="lg:col-span-5 relative w-full flex justify-center lg:justify-end">
            <div className="w-full max-w-md relative animate-fade-in">
              {/* Decorative behind card */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-primary-500 to-green-600 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
              
              {/* Main Panel */}
              <div className="relative glass-panel rounded-3xl p-6 border border-dark-800 bg-dark-900/90 shadow-2xl flex flex-col space-y-6">
                
                {/* Header of mockup */}
                <div className="flex justify-between items-center pb-4 border-b border-dark-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                  </div>
                  <span className="text-xs font-semibold text-dark-400">Dashboard de Hoje</span>
                </div>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-950/50 border border-dark-800/80 rounded-2xl p-4">
                    <p className="text-[11px] font-semibold text-dark-500 uppercase tracking-wider">Faturamento Hoje</p>
                    <p className="text-xl font-bold text-primary-400 mt-1">R$ 455,00</p>
                    <p className="text-[10px] text-green-500 flex items-center gap-0.5 mt-0.5 font-medium">
                      <TrendingUp size={10} /> +12% vs ontem
                    </p>
                  </div>
                  <div className="bg-dark-950/50 border border-dark-800/80 rounded-2xl p-4">
                    <p className="text-[11px] font-semibold text-dark-500 uppercase tracking-wider">Agendamentos</p>
                    <p className="text-xl font-bold text-white mt-1">14</p>
                    <p className="text-[10px] text-dark-450 mt-0.5 text-dark-400">12 Confirmados</p>
                  </div>
                </div>

                {/* Mini Schedule list mockup */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-dark-350 text-dark-300 flex items-center gap-1.5">
                    <Calendar size={13} className="text-primary-500" />
                    Próximos Clientes
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-dark-950/30 border border-dark-850 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-400 font-semibold flex items-center justify-center text-[10px]">
                          AM
                        </div>
                        <div>
                          <p className="font-semibold text-white">Arthur Melo</p>
                          <p className="text-[10px] text-dark-450 text-dark-400">Corte + Sobrancelha</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">14:30</p>
                        <p className="text-[9px] text-primary-500 font-medium">Pendente</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-dark-950/30 border border-dark-850 text-xs opacity-75">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-dark-800 text-dark-300 font-semibold flex items-center justify-center text-[10px]">
                          GB
                        </div>
                        <div>
                          <p className="font-semibold text-white">Gustavo Borges</p>
                          <p className="text-[10px] text-dark-450 text-dark-400">Barba Completa</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">15:15</p>
                        <p className="text-[9px] text-green-500 font-medium">Confirmado</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Inactive Client Alert Trigger */}
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center text-red-400">
                      <MessageSquare size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Fidelidade Alerta</p>
                      <p className="text-[10px] text-red-300">32 clientes inativos há +30 dias</p>
                    </div>
                  </div>
                  <a 
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] font-bold bg-red-600 hover:bg-red-500 px-2.5 py-1.5 rounded-lg text-white transition-all"
                  >
                    Ativar Recuperação
                  </a>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── FUNCIONALIDADES / CARDS ────────────────────────────────────────────── */}
      <section id="funcionalidades" className="py-20 md:py-28 px-6 bg-dark-900/40 border-y border-dark-900 relative">
        <div className="max-w-7xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-primary-500 uppercase tracking-widest">Funcionalidades Completas</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Tudo o que sua barbearia precisa para crescer
          </h2>
          <p className="text-dark-400 text-sm md:text-base max-w-xl mx-auto">
            Esqueça planilhas confusas e anotações que somem. Projetado especificamente para gerenciar todos os aspectos do seu negócio em segundos.
          </p>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-850 hover:border-primary-500/30 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-6 group-hover:scale-110 transition-transform">
              <Calendar size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Agenda Inteligente</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Grade de horários fluida, bloqueios imediatos de folgas ou almoço, controle de andamento do atendimento e atualização de status em tempo real.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-850 hover:border-primary-500/30 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-6 group-hover:scale-110 transition-transform">
              <MessageSquare size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">WhatsApp & Lembretes</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Disparos integrados e facilidades de conversação. Veja relatórios de mensagens e fale com os clientes em poucos cliques.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-850 hover:border-primary-500/30 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-6 group-hover:scale-110 transition-transform">
              <Smartphone size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Painel do Barbeiro (BarberApp)</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Cada profissional da sua equipe tem acesso a um painel mobile-first próprio para ver sua agenda, listar clientes e acompanhar suas comissões diárias.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-850 hover:border-primary-500/30 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-6 group-hover:scale-110 transition-transform">
              <DollarSign size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Controle Financeiro</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Cadastro e controle de fluxos de entrada e saída. Acompanhe relatórios detalhados com faturamento total e ticket médio por cliente.
            </p>
          </div>

          {/* Card 5 */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-850 hover:border-primary-500/30 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-6 group-hover:scale-110 transition-transform">
              <Users size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Recuperação de Inativos</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              O sistema detecta automaticamente clientes que estão há 30 ou 60 dias sem agendar e cria uma lista rápida de follow-up para reengajá-los.
            </p>
          </div>

          {/* Card 6 */}
          <div className="glass-panel p-6 rounded-2xl border border-dark-850 hover:border-primary-500/30 transition-all group hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-500 mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Organização de Equipe</h3>
            <p className="text-dark-400 text-sm leading-relaxed">
              Controle o perfil e comissão individual de cada barbeiro. Cadastre horários de funcionamento personalizados para cada membro do time.
            </p>
          </div>

        </div>
      </section>

      {/* ── COMO FUNCIONA ──────────────────────────────────────────────────────── */}
      <section id="como-funciona" className="py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          
          <div className="space-y-6">
            <span className="text-xs font-bold text-primary-500 uppercase tracking-widest">Processo Simples</span>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white leading-tight">
              Instalação rápida e suporte dedicado para sua Barbearia
            </h2>
            <p className="text-dark-400 text-sm md:text-base leading-relaxed">
              Nossa plataforma foi pensada para ser extremamente intuitiva. Em poucos minutos, você estará com sua agenda funcionando e seus barbeiros cadastrados no sistema.
            </p>

            <div className="space-y-4 pt-4">
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-400 font-bold flex items-center justify-center shrink-0 border border-primary-500/20 text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Configuração Inicial</h4>
                  <p className="text-sm text-dark-400">Cadastre seus barbeiros, serviços fornecidos, valores e tempos de duração em segundos.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-400 font-bold flex items-center justify-center shrink-0 border border-primary-500/20 text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Uso Diário & Acessos</h4>
                  <p className="text-sm text-dark-400">Utilize o painel principal na recepção ou no computador e libere o acesso exclusivo aos barbeiros via smartphone.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary-500/10 text-primary-400 font-bold flex items-center justify-center shrink-0 border border-primary-500/20 text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-white text-base">Alavanque sua Retenção</h4>
                  <p className="text-sm text-dark-400">Acompanhe as métricas de faturamento e use a lista de lembretes para lotar os horários ociosos da semana.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive details */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-primary-600 rounded-3xl blur-lg opacity-10 pointer-events-none" />
            <div className="relative glass-panel rounded-3xl border border-dark-850 p-6 md:p-8 bg-dark-900/70 space-y-6">
              <h3 className="text-xl font-bold text-white">Quanto o BarberCRM agrega ao seu negócio?</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-dark-300 mb-1">
                    <span>Aumento médio de faturamento</span>
                    <span className="text-primary-400 font-bold">+25%</span>
                  </div>
                  <div className="w-full h-2 bg-dark-950 rounded-full overflow-hidden">
                    <div className="w-4/5 h-full bg-primary-500 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-dark-300 mb-1">
                    <span>Redução de Faltas com Lembretes</span>
                    <span className="text-primary-400 font-bold">-80%</span>
                  </div>
                  <div className="w-full h-2 bg-dark-950 rounded-full overflow-hidden">
                    <div className="w-[90%] h-full bg-primary-500 rounded-full" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold text-dark-300 mb-1">
                    <span>Economia de horas em relatórios e comissões</span>
                    <span className="text-primary-400 font-bold">12h/mês</span>
                  </div>
                  <div className="w-full h-2 bg-dark-950 rounded-full overflow-hidden">
                    <div className="w-3/4 h-full bg-primary-500 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-dark-950 border border-dark-800 space-y-2">
                <p className="text-xs text-dark-400 leading-relaxed italic">
                  "Antes do BarberCRM eu perdia horas no fim do sábado somando comissões dos barbeiros e anotando no caderno. Hoje a equipe vê no próprio celular e o sistema calcula tudo sozinho!"
                </p>
                <p className="text-xs font-bold text-white text-right">- João P., Proprietário da BarberClub</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── BENEFÍCIOS SECTION ────────────────────────────────────────────────── */}
      <section id="beneficios" className="py-20 md:py-28 px-6 bg-dark-900/40 border-t border-dark-900">
        <div className="max-w-7xl mx-auto text-center space-y-4 mb-16">
          <span className="text-xs font-bold text-primary-500 uppercase tracking-widest">Benefícios Reais</span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Por que o BarberCRM é o investimento ideal?
          </h2>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="flex flex-col space-y-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
              <CheckCircle2 size={20} />
            </div>
            <h4 className="text-lg font-bold text-white">Agilidade Absoluta</h4>
            <p className="text-dark-400 text-sm leading-relaxed">
              Chega de interfaces lentas. O BarberCRM foi desenvolvido com tecnologias modernas de alto desempenho, carregando instantaneamente no celular ou computador.
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
              <Clock size={20} />
            </div>
            <h4 className="text-lg font-bold text-white">Organização Sem Esforço</h4>
            <p className="text-dark-400 text-sm leading-relaxed">
              Uma visualização limpa da agenda de cada barbeiro na mesma tela. Reduza duplicidades de horários e evite conflitos de atendimento na equipe.
            </p>
          </div>

          <div className="flex flex-col space-y-4">
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center text-primary-400">
              <TrendingUp size={20} />
            </div>
            <h4 className="text-lg font-bold text-white">Aumento no Ticket Médio</h4>
            <p className="text-dark-400 text-sm leading-relaxed">
              Tenha dados dos serviços mais buscados e trace promoções para alavancar serviços secundários como hidratação e sobrancelha de forma direcionada.
            </p>
          </div>

        </div>
      </section>

      {/* ── CALL TO ACTION FINAL ───────────────────────────────────────────────── */}
      <section className="py-20 md:py-28 px-6 relative">
        <div className="max-w-5xl mx-auto relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-green-600 rounded-3xl blur-xl opacity-20 pointer-events-none" />
          
          <div className="relative glass-panel rounded-3xl p-8 md:p-14 bg-dark-900 border border-dark-800 text-center flex flex-col items-center space-y-8 overflow-hidden">
            
            {/* Background glowing ball inside box */}
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="space-y-4 max-w-2xl relative z-10">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Eleve o patamar de profissionalismo da sua barbearia hoje mesmo
              </h2>
              <p className="text-dark-350 text-dark-300 text-sm sm:text-base leading-relaxed">
                Fale conosco pelo WhatsApp, tire suas dúvidas e comece a otimizar sua rotina de agendamentos e finanças.
              </p>
            </div>

            <div className="relative z-10 w-full sm:w-auto flex flex-col sm:flex-row items-center gap-4 justify-center">
              <a 
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-2xl px-10 py-5 transition-all shadow-xl shadow-primary-600/30 hover:scale-[1.02] flex items-center gap-3 w-full sm:w-auto text-center justify-center text-base sm:text-lg"
              >
                Falar Conosco no WhatsApp
                <ArrowRight size={20} />
              </a>
            </div>

            <div className="flex items-center gap-6 pt-4 text-xs text-dark-400 relative z-10 font-semibold uppercase tracking-wider">
              <span>✓ Sem Fidelidade</span>
              <span>✓ Suporte Exclusivo</span>
              <span>✓ Setup Gratuito</span>
            </div>

          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="bg-dark-950 border-t border-dark-900 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-dark-400">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Scissors size={18} className="text-primary-500" />
            <span>BARBERCRM</span>
          </div>
          
          <p className="text-xs text-center md:text-left text-dark-500">
            &copy; {new Date().getFullYear()} BarberCRM. Todos os direitos reservados.
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

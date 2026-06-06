import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Scissors, User, Building2, MapPin, TrendingUp,
  ChevronRight, ChevronLeft, CheckCircle2, Phone,
  Mail, Instagram, Clock, Users, DollarSign,
  ArrowRight, Sparkles, Star, AlertCircle, Loader2,
} from 'lucide-react';
import { createLead } from '../services/supabase';

/* ─────────────────────────────────────────────────────────────
   CONSTANTES
───────────────────────────────────────────────────────────── */
const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA',
  'MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN',
  'RS','RO','RR','SC','SP','SE','TO',
];

const DIAS_SEMANA = [
  { id: 'seg', label: 'Seg' },
  { id: 'ter', label: 'Ter' },
  { id: 'qua', label: 'Qua' },
  { id: 'qui', label: 'Qui' },
  { id: 'sex', label: 'Sex' },
  { id: 'sab', label: 'Sáb' },
  { id: 'dom', label: 'Dom' },
];

const SERVICOS = [
  'Corte de Cabelo', 'Barba', 'Corte + Barba', 'Sobrancelha',
  'Pigmentação de Barba', 'Hidratação', 'Relaxamento', 'Progressiva',
  'Coloração', 'Outros',
];

const COMO_CONHECEU = [
  'Instagram', 'Indicação de amigo', 'WhatsApp', 'Google',
  'TikTok', 'Facebook', 'Outro',
];

const FATURAMENTOS = [
  'Até R$ 5.000', 'R$ 5.000 - R$ 10.000', 'R$ 10.000 - R$ 20.000',
  'R$ 20.000 - R$ 50.000', 'Acima de R$ 50.000',
];

const STEPS = [
  { id: 1, label: 'Proprietário', icon: User },
  { id: 2, label: 'Barbearia',   icon: Building2 },
  { id: 3, label: 'Endereço',    icon: MapPin },
  { id: 4, label: 'Negócio',     icon: TrendingUp },
];

/* ─────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────── */
const maskCPF = (v) =>
  v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');

const maskCNPJ = (v) =>
  v.replace(/\D/g, '').slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');

const maskPhone = (v) =>
  v.replace(/\D/g, '').slice(0, 11)
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');

const maskCEP = (v) =>
  v.replace(/\D/g, '').slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');

/* ─────────────────────────────────────────────────────────────
   COMPONENTE PRINCIPAL
───────────────────────────────────────────────────────────── */
const CadastroBarbearia = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    // Step 1 — Proprietário
    nome_proprietario: '',
    cpf: '',
    email: '',
    whatsapp: '',
    // Step 2 — Barbearia
    nome_barbearia: '',
    cnpj: '',
    instagram: '',
    telefone_barbearia: '',
    // Step 3 — Endereço
    cep: '',
    rua: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    // Step 4 — Negócio
    num_barbeiros: '',
    faturamento_mensal: '',
    horario_abertura: '',
    horario_fechamento: '',
    dias_funcionamento: [],
    servicos_interesse: [],
    como_conheceu: '',
    observacoes: '',
  });

  /* ── Handlers ─────────────────────────────────────────── */
  const set = (field, value) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: undefined }));
  };

  const toggleArray = (field, value) => {
    setForm((p) => {
      const arr = p[field];
      return {
        ...p,
        [field]: arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value],
      };
    });
  };

  const buscarCEP = async () => {
    const cep = form.cep.replace(/\D/g, '');
    if (cep.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setForm((p) => ({
          ...p,
          rua: data.logradouro || p.rua,
          bairro: data.bairro || p.bairro,
          cidade: data.localidade || p.cidade,
          estado: data.uf || p.estado,
        }));
      }
    } catch (_) {}
  };

  /* ── Validação por etapa ──────────────────────────────── */
  const validate = (s) => {
    const e = {};
    if (s === 1) {
      if (!form.nome_proprietario.trim()) e.nome_proprietario = 'Nome é obrigatório';
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email inválido';
      if (!form.whatsapp.trim() || form.whatsapp.replace(/\D/g, '').length < 10) e.whatsapp = 'WhatsApp inválido';
    }
    if (s === 2) {
      if (!form.nome_barbearia.trim()) e.nome_barbearia = 'Nome da barbearia é obrigatório';
    }
    if (s === 3) {
      if (!form.cidade.trim()) e.cidade = 'Cidade é obrigatória';
      if (!form.estado) e.estado = 'Estado é obrigatório';
    }
    if (s === 4) {
      if (!form.como_conheceu) e.como_conheceu = 'Selecione como nos conheceu';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate(step)) setStep((s) => Math.min(s + 1, STEPS.length));
  };
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  /* ── Submit ───────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!validate(4)) return;
    setLoading(true);
    try {
      await createLead({
        ...form,
        num_barbeiros: form.num_barbeiros ? Number(form.num_barbeiros) : null,
        cpf: form.cpf || null,
        cnpj: form.cnpj || null,
        instagram: form.instagram || null,
        telefone_barbearia: form.telefone_barbearia || null,
        cep: form.cep || null,
        rua: form.rua || null,
        numero: form.numero || null,
        complemento: form.complemento || null,
        bairro: form.bairro || null,
        horario_abertura: form.horario_abertura || null,
        horario_fechamento: form.horario_fechamento || null,
        observacoes: form.observacoes || null,
        nota_interna: null,
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setErrors({ submit: 'Erro ao enviar. Tente novamente ou entre em contato pelo WhatsApp.' });
    } finally {
      setLoading(false);
    }
  };

  /* ── Tela de sucesso ─────────────────────────────────── */
  if (success) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative glass-panel bg-dark-900/80 border border-amber-500/30 rounded-3xl p-10 md:p-16 max-w-lg w-full text-center flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-2">Cadastro Recebido! 🎉</h2>
            <p className="text-dark-300 text-sm md:text-base leading-relaxed">
              Obrigado, <strong className="text-white">{form.nome_proprietario.split(' ')[0]}</strong>! Recebemos os dados de{' '}
              <strong className="text-amber-400">{form.nome_barbearia}</strong>.
              <br /><br />
              Nossa equipe vai analisar e entrar em contato pelo WhatsApp em breve. 💈
            </p>
          </div>
          <a
            href={`https://wa.me/5521966636956?text=Olá!%20Acabei%20de%20preencher%20o%20cadastro%20da%20${encodeURIComponent(form.nome_barbearia)}%20e%20quero%20saber%20mais%20sobre%20o%20Cadeira%20Cheia!`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold rounded-2xl px-8 py-4 transition-all flex items-center justify-center gap-2"
          >
            Falar agora no WhatsApp
            <ArrowRight size={18} />
          </a>
          <button
            onClick={() => navigate('/')}
            className="text-sm text-dark-400 hover:text-white transition-colors"
          >
            ← Voltar para a página inicial
          </button>
        </div>
      </div>
    );
  }

  /* ── Formulário ──────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-dark-950 text-white font-sans selection:bg-amber-500 selection:text-white overflow-x-hidden">
      {/* Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-950/90 backdrop-blur-md border-b border-dark-800/60">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <Scissors size={18} />
            </div>
            <span className="text-base font-bold text-white">
              Cadeira<span className="text-[#c5a880]">Cheia</span>
            </span>
          </button>
          <span className="text-xs text-dark-400 font-medium hidden sm:block">
            <Star size={10} className="inline fill-amber-400 text-amber-400 mr-1" />
            Cadastre sua barbearia gratuitamente
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10 md:py-16">

        {/* Título */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles size={12} />
            Formulário de Cadastro
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            Cadastre sua Barbearia
          </h1>
          <p className="text-dark-400 text-sm md:text-base max-w-lg mx-auto">
            Preencha os dados abaixo e nossa equipe entrará em contato para ativar o Cadeira Cheia na sua barbearia.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isDone
                      ? 'bg-amber-500 border-amber-500 text-white'
                      : isActive
                      ? 'bg-dark-800 border-amber-500 text-amber-400'
                      : 'bg-dark-900 border-dark-700 text-dark-500'
                  }`}>
                    {isDone ? <CheckCircle2 size={18} /> : <Icon size={17} />}
                  </div>
                  <span className={`text-[10px] font-semibold hidden sm:block ${
                    isActive ? 'text-amber-400' : isDone ? 'text-amber-500/70' : 'text-dark-600'
                  }`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 transition-all duration-500 ${step > s.id ? 'bg-amber-500' : 'bg-dark-800'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Card do formulário */}
        <div className="relative">
          <div className="absolute -inset-px bg-gradient-to-r from-amber-500/20 to-transparent rounded-3xl blur-sm pointer-events-none" />
          <div className="relative bg-dark-900 border border-dark-800 rounded-3xl p-6 md:p-10 shadow-2xl">

            {/* ── ETAPA 1: PROPRIETÁRIO ─────────────────────────── */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <StepHeader icon={User} title="Dados do Proprietário" subtitle="Informações pessoais de quem gerencia a barbearia" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Nome Completo *" error={errors.nome_proprietario} className="md:col-span-2">
                    <Input
                      id="nome_proprietario"
                      placeholder="Ex: João da Silva"
                      value={form.nome_proprietario}
                      onChange={(v) => set('nome_proprietario', v)}
                      icon={<User size={16} />}
                    />
                  </Field>
                  <Field label="CPF" error={errors.cpf}>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={form.cpf}
                      onChange={(v) => set('cpf', maskCPF(v))}
                      icon={<User size={16} />}
                    />
                  </Field>
                  <Field label="E-mail *" error={errors.email}>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@exemplo.com"
                      value={form.email}
                      onChange={(v) => set('email', v)}
                      icon={<Mail size={16} />}
                    />
                  </Field>
                  <Field label="WhatsApp *" error={errors.whatsapp} className="md:col-span-2">
                    <Input
                      id="whatsapp"
                      placeholder="(21) 99999-9999"
                      value={form.whatsapp}
                      onChange={(v) => set('whatsapp', maskPhone(v))}
                      icon={<Phone size={16} />}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ── ETAPA 2: BARBEARIA ───────────────────────────── */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <StepHeader icon={Building2} title="Dados da Barbearia" subtitle="Informações sobre o seu estabelecimento" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Nome da Barbearia *" error={errors.nome_barbearia} className="md:col-span-2">
                    <Input
                      id="nome_barbearia"
                      placeholder="Ex: Barbearia do João"
                      value={form.nome_barbearia}
                      onChange={(v) => set('nome_barbearia', v)}
                      icon={<Building2 size={16} />}
                    />
                  </Field>
                  <Field label="CNPJ" error={errors.cnpj}>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0001-00"
                      value={form.cnpj}
                      onChange={(v) => set('cnpj', maskCNPJ(v))}
                      icon={<Building2 size={16} />}
                    />
                  </Field>
                  <Field label="Telefone Fixo" error={errors.telefone_barbearia}>
                    <Input
                      id="telefone_barbearia"
                      placeholder="(21) 9999-9999"
                      value={form.telefone_barbearia}
                      onChange={(v) => set('telefone_barbearia', maskPhone(v))}
                      icon={<Phone size={16} />}
                    />
                  </Field>
                  <Field label="Instagram" error={errors.instagram} className="md:col-span-2">
                    <Input
                      id="instagram"
                      placeholder="@barbearia"
                      value={form.instagram}
                      onChange={(v) => set('instagram', v)}
                      icon={<Instagram size={16} />}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ── ETAPA 3: ENDEREÇO ────────────────────────────── */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <StepHeader icon={MapPin} title="Endereço da Barbearia" subtitle="Localização do estabelecimento" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <Field label="CEP" error={errors.cep} className="md:col-span-1">
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={form.cep}
                      onChange={(v) => set('cep', maskCEP(v))}
                      onBlur={buscarCEP}
                      icon={<MapPin size={16} />}
                    />
                  </Field>
                  <Field label="Rua / Logradouro" error={errors.rua} className="md:col-span-2">
                    <Input
                      id="rua"
                      placeholder="Ex: Rua das Flores"
                      value={form.rua}
                      onChange={(v) => set('rua', v)}
                      icon={<MapPin size={16} />}
                    />
                  </Field>
                  <Field label="Número" error={errors.numero}>
                    <Input
                      id="numero"
                      placeholder="Ex: 42"
                      value={form.numero}
                      onChange={(v) => set('numero', v)}
                      icon={<MapPin size={16} />}
                    />
                  </Field>
                  <Field label="Complemento" error={errors.complemento}>
                    <Input
                      id="complemento"
                      placeholder="Ap, Sala..."
                      value={form.complemento}
                      onChange={(v) => set('complemento', v)}
                      icon={<MapPin size={16} />}
                    />
                  </Field>
                  <Field label="Bairro" error={errors.bairro}>
                    <Input
                      id="bairro"
                      placeholder="Ex: Centro"
                      value={form.bairro}
                      onChange={(v) => set('bairro', v)}
                      icon={<MapPin size={16} />}
                    />
                  </Field>
                  <Field label="Cidade *" error={errors.cidade} className="md:col-span-2">
                    <Input
                      id="cidade"
                      placeholder="Ex: Rio de Janeiro"
                      value={form.cidade}
                      onChange={(v) => set('cidade', v)}
                      icon={<MapPin size={16} />}
                    />
                  </Field>
                  <Field label="Estado *" error={errors.estado}>
                    <select
                      id="estado"
                      value={form.estado}
                      onChange={(e) => set('estado', e.target.value)}
                      className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    >
                      <option value="">UF</option>
                      {ESTADOS_BR.map((uf) => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                    {errors.estado && <p className="mt-1 text-xs text-red-400">{errors.estado}</p>}
                  </Field>
                </div>
              </div>
            )}

            {/* ── ETAPA 4: NEGÓCIO ─────────────────────────────── */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <StepHeader icon={TrendingUp} title="Dados do Negócio" subtitle="Nos conte mais sobre o funcionamento da barbearia" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="Número de Barbeiros" error={errors.num_barbeiros}>
                    <Input
                      id="num_barbeiros"
                      type="number"
                      min="1"
                      placeholder="Ex: 3"
                      value={form.num_barbeiros}
                      onChange={(v) => set('num_barbeiros', v)}
                      icon={<Users size={16} />}
                    />
                  </Field>
                  <Field label="Faturamento Mensal Médio" error={errors.faturamento_mensal}>
                    <select
                      id="faturamento_mensal"
                      value={form.faturamento_mensal}
                      onChange={(e) => set('faturamento_mensal', e.target.value)}
                      className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all"
                    >
                      <option value="">Selecione...</option>
                      {FATURAMENTOS.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </Field>

                  {/* Horários */}
                  <Field label="Horário de Abertura" error={errors.horario_abertura}>
                    <Input
                      id="horario_abertura"
                      type="time"
                      value={form.horario_abertura}
                      onChange={(v) => set('horario_abertura', v)}
                      icon={<Clock size={16} />}
                    />
                  </Field>
                  <Field label="Horário de Fechamento" error={errors.horario_fechamento}>
                    <Input
                      id="horario_fechamento"
                      type="time"
                      value={form.horario_fechamento}
                      onChange={(v) => set('horario_fechamento', v)}
                      icon={<Clock size={16} />}
                    />
                  </Field>

                  {/* Dias de funcionamento */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-dark-200 mb-3">Dias de Funcionamento</label>
                    <div className="flex flex-wrap gap-2">
                      {DIAS_SEMANA.map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => toggleArray('dias_funcionamento', d.id)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                            form.dias_funcionamento.includes(d.id)
                              ? 'bg-amber-500 border-amber-500 text-dark-950'
                              : 'bg-dark-800 border-dark-700 text-dark-400 hover:border-amber-500/40 hover:text-white'
                          }`}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Serviços de interesse */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-dark-200 mb-3">Serviços Oferecidos</label>
                    <div className="flex flex-wrap gap-2">
                      {SERVICOS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleArray('servicos_interesse', s)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            form.servicos_interesse.includes(s)
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-dark-800 border-dark-700 text-dark-400 hover:border-amber-500/30 hover:text-white'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Como conheceu */}
                  <Field label="Como nos conheceu? *" error={errors.como_conheceu} className="md:col-span-2">
                    <div className="flex flex-wrap gap-2">
                      {COMO_CONHECEU.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => set('como_conheceu', c)}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                            form.como_conheceu === c
                              ? 'bg-amber-500 border-amber-500 text-dark-950'
                              : 'bg-dark-800 border-dark-700 text-dark-400 hover:border-amber-500/40 hover:text-white'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                    {errors.como_conheceu && (
                      <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.como_conheceu}
                      </p>
                    )}
                  </Field>

                  {/* Observações */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-dark-200 mb-2">Observações / Dúvidas</label>
                    <textarea
                      id="observacoes"
                      rows={3}
                      value={form.observacoes}
                      onChange={(e) => set('observacoes', e.target.value)}
                      placeholder="Alguma dúvida ou informação adicional que queira nos contar..."
                      className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Erro de submit */}
                {errors.submit && (
                  <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                    <AlertCircle size={16} className="shrink-0" />
                    {errors.submit}
                  </div>
                )}
              </div>
            )}

            {/* ── Navegação ────────────────────────────────────── */}
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-dark-800">
              <button
                type="button"
                onClick={prev}
                disabled={step === 1}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-dark-400 hover:text-white hover:bg-dark-800 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
                Anterior
              </button>

              <span className="text-xs text-dark-600 font-medium">
                Etapa {step} de {STEPS.length}
              </span>

              {step < STEPS.length ? (
                <button
                  type="button"
                  onClick={next}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl px-6 py-3 text-sm transition-all shadow-lg shadow-amber-600/20 hover:scale-[1.02]"
                >
                  Próximo
                  <ChevronRight size={18} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl px-8 py-3 text-sm transition-all shadow-lg shadow-amber-600/20 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed min-w-[160px] justify-center"
                >
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" />Enviando...</>
                  ) : (
                    <><CheckCircle2 size={18} />Enviar Cadastro</>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Rodapé */}
        <p className="text-center text-xs text-dark-600 mt-8">
          Seus dados estão seguros e não serão compartilhados com terceiros.
          <br />Ao enviar, você concorda com nossos termos de uso.
        </p>
      </main>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   SUBCOMPONENTES
───────────────────────────────────────────────────────────── */
const StepHeader = ({ icon: Icon, title, subtitle }) => (
  <div className="flex items-start gap-4 pb-2">
    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
      <Icon size={22} />
    </div>
    <div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-sm text-dark-400 mt-0.5">{subtitle}</p>
    </div>
  </div>
);

const Field = ({ label, error, children, className = '' }) => (
  <div className={`flex flex-col gap-1 ${className}`}>
    <label className="text-sm font-semibold text-dark-200">{label}</label>
    {children}
    {error && (
      <p className="text-xs text-red-400 flex items-center gap-1">
        <AlertCircle size={11} /> {error}
      </p>
    )}
  </div>
);

const Input = ({ id, type = 'text', placeholder, value, onChange, onBlur, icon, min }) => (
  <div className="relative">
    {icon && (
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500 pointer-events-none">
        {icon}
      </span>
    )}
    <input
      id={id}
      type={type}
      min={min}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      className={`w-full bg-dark-800 border border-dark-700 rounded-xl py-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all ${
        icon ? 'pl-10 pr-4' : 'px-4'
      }`}
    />
  </div>
);

export default CadastroBarbearia;

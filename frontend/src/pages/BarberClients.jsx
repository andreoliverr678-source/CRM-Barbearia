import React, { useState, useEffect, useMemo } from 'react';
import { Users, Search, Phone, MessageCircle, AlertCircle, RefreshCw, Sparkles, UserSquare2 } from 'lucide-react';
import { useBarberAuth } from '../context/BarberAuthContext';
import { fetchClients } from '../services/api';

const BarberClients = () => {
  const { barber } = useBarberAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  const loadClients = async () => {
    if (!barber) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClients({ barber_id: barber.id });
      setClients(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao carregar seus clientes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [barber]);

  const filtered = useMemo(() => {
    if (!clients) return [];
    const q = search.toLowerCase();
    return clients.filter(c => 
      (c.name || '').toLowerCase().includes(q) || 
      (c.phone || '').includes(q)
    );
  }, [clients, search]);

  const getInitial = (name) => (name || '?').charAt(0).toUpperCase();

  const handleWhatsApp = (phone) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Users size={18} className="text-primary-500" /> Meus Clientes
          </h1>
          <p className="text-xs text-dark-400 mt-0.5">Clientes fixos vinculados a você.</p>
        </div>
        <button
          onClick={loadClients}
          title="Sincronizar"
          className="p-2.5 rounded-xl bg-dark-900 border border-dark-800 text-dark-400 hover:text-white transition-all active:scale-90"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-400" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="w-full bg-dark-900 border border-dark-800 rounded-2xl py-3 pl-10 pr-4 text-xs text-white placeholder-dark-500 focus:ring-2 focus:ring-primary-500 outline-none transition-shadow"
        />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle size={16} className="shrink-0" />
          <span className="text-xs font-medium">{error}</span>
        </div>
      )}

      {/* Clientes List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-dark-900 border border-dark-800 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-panel border border-dark-800 bg-dark-900/40 rounded-3xl py-12 flex flex-col items-center justify-center text-center gap-3 text-dark-500">
            <UserSquare2 size={32} className="opacity-20" />
            <p className="text-sm px-6">
              {search ? 'Nenhum cliente atende a essa pesquisa.' : 'Você ainda não possui clientes fixos associados.'}
            </p>
          </div>
        ) : (
          filtered.map(client => (
            <div 
              key={client.id}
              className="glass-panel border border-dark-800 bg-dark-900/50 rounded-3xl p-4.5 flex items-center justify-between gap-4"
            >
              {/* Avatar + Info */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-base font-bold shadow-md shadow-primary-500/20 shrink-0">
                  {getInitial(client.name)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-white text-sm truncate">{client.name || 'Sem nome'}</h3>
                  <p className="text-xs text-dark-400 truncate">{client.phone || 'Sem telefone'}</p>
                  {client.notes && (
                    <p className="text-[10px] text-dark-550 text-dark-500 mt-1 italic line-clamp-1">Obs: {client.notes}</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                {client.phone && (
                  <>
                    <a
                      href={`tel:${client.phone}`}
                      className="p-2.5 bg-dark-850 hover:bg-dark-800 text-dark-300 hover:text-white rounded-xl transition-all border border-dark-800 active:scale-90"
                      title="Ligar"
                    >
                      <Phone size={14} />
                    </a>
                    <button
                      onClick={() => handleWhatsApp(client.phone)}
                      className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-all border border-emerald-550/20 border-emerald-500/10 active:scale-90"
                      title="WhatsApp"
                    >
                      <MessageCircle size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BarberClients;

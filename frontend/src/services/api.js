import axios from 'axios';

const BASE_URL = "https://agente-backend.amxxqr.easypanel.host/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Interceptor REQUEST: injeta Bearer token ──────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const isBarberPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/barber');
    const token = isBarberPath
      ? localStorage.getItem('barber_app_token')
      : localStorage.getItem('barber_crm_token');
      
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Interceptor RESPONSE: logout automático em 401 ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg = error.response?.data?.error || error.message;
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${msg}`);

    if (
      error.response?.status === 401 && 
      !error.config?.url?.includes('/auth/login') && 
      !error.config?.url?.includes('/auth/barber/login') && 
      error.response?.data?.error !== 'Senha atual incorreta'
    ) {
      const isBarberPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/barber');
      if (isBarberPath) {
        localStorage.removeItem('barber_app_token');
        window.location.href = '/barber/login';
      } else {
        localStorage.removeItem('barber_crm_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const fetchDashboard    = () => api.get('/dashboard').then((r) => r.data);

// ── Financial ─────────────────────────────────────────────────────────────────
/**
 * Retorna métricas de faturamento: diário, semanal, mensal, ticket médio, top serviço.
 */
export const fetchRevenue      = () => api.get('/financial/revenue').then((r) => r.data);

/**
 * Lista registros financeiros.
 * @param {Object} params - { status, payment_method, period, page, limit }
 */
export const fetchFinancial    = (params = {}) => api.get('/financial', { params }).then((r) => r.data);

/**
 * Cria ou atualiza um registro financeiro.
 * @param {Object} data - { appointment_id, client_id, service, amount, payment_method, status }
 */
export const createFinancial   = (data) => api.post('/financial', data).then((r) => r.data);

/**
 * Atualiza um registro financeiro existente (ex: definir método de pagamento).
 * @param {string} id - UUID do registro
 * @param {Object} data - { payment_method, status, amount }
 */
export const updateFinancial   = (id, data) => api.put(`/financial/${id}`, data).then((r) => r.data);

// ── Services ──────────────────────────────────────────────────────────────────
export const fetchServices     = () => api.get('/services').then((r) => r.data);
export const createService     = (data) => api.post('/services', data).then((r) => r.data);
export const updateService     = (id, data) => api.put(`/services/${id}`, data).then((r) => r.data);
export const deleteService     = (id) => api.delete(`/services/${id}`).then((r) => r.data);

// ── Clientes ──────────────────────────────────────────────────────────────────
export const fetchMetrics      = () => api.get('/metrics').then((r) => r.data);
export const fetchClients      = (params = {}) => api.get('/clients', { params }).then((r) => r.data);
export const fetchClient       = (id) => api.get(`/clients/${id}`).then((r) => r.data);
export const createClient      = (data) => api.post('/clients', data).then((r) => r.data);
export const updateClient      = (id, data) => api.put(`/clients/${id}`, data).then((r) => r.data);
export const deleteClient      = (id) => api.delete(`/clients/${id}`).then((r) => r.data);

// ── Agendamentos ──────────────────────────────────────────────────────────────
export const fetchAppointments = (params = {}) => api.get('/appointments', { params }).then((r) => r.data);
export const createAppointment = (data) => api.post('/appointments', data).then((r) => r.data);
export const updateAppointment = (id, data) => api.put(`/appointments/${id}`, data).then((r) => r.data);
export const deleteAppointment = (id) => api.delete(`/appointments/${id}`).then((r) => r.data);

// ── Mensagens ─────────────────────────────────────────────────────────────────
export const fetchMessages        = () => api.get('/messages').then((r) => r.data);
export const fetchMessagesByPhone = (phone) => api.get(`/messages/${phone}`).then((r) => r.data);
export const sendChatMessage      = (data) => api.post('/messages/send', data).then((r) => r.data);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const loginApi     = (email, password) => api.post('/auth/login', { email, password });
export const fetchMe      = ()                 => api.get('/auth/me');

// ── Profile ───────────────────────────────────────────────────────────────────
export const fetchProfile   = ()     => api.get('/profile');
export const updateProfile  = (data) => api.put('/profile', data);
export const changePassword = (data) => api.put('/profile/password', data);
export const uploadAvatar   = (file) => {
  const form = new FormData();
  form.append('avatar', file);
  return api.post('/profile/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);
};
export const removeAvatar   = () => api.delete('/profile/avatar').then((r) => r.data);

// ── Notifications ─────────────────────────────────────────────────────────────
export const fetchNotifications       = ()   => api.get('/notifications');
export const markNotificationRead     = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = ()   => api.put('/notifications/read-all');

// ── Barbers ───────────────────────────────────────────────────────────────────
export const fetchBarbers             = () => api.get('/barbers').then((r) => r.data);
export const fetchBarber              = (id) => api.get(`/barbers/${id}`).then((r) => r.data);
export const createBarber             = (data) => api.post('/barbers', data).then((r) => r.data);
export const updateBarber             = (id, data) => api.put(`/barbers/${id}`, data).then((r) => r.data);
export const deleteBarber             = (id) => api.delete(`/barbers/${id}`).then((r) => r.data);

// ── Barber Auth ───────────────────────────────────────────────────────────────
export const loginBarberApi           = (email, password) => api.post('/auth/barber/login', { email, password });
export const fetchBarberMe            = () => api.get('/auth/barber/me');

// ── Barber Dashboard ──────────────────────────────────────────────────────────
export const fetchBarberDashboard     = () => api.get('/barber/dashboard').then((r) => r.data);

export default api;
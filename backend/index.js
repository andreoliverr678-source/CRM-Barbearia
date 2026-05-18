const express = require('express');
const cors = require('cors');
require('dotenv').config({ override: true });
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.set('io', io);

app.use(cors());
app.use(express.json());

// Rotas
const clientsRouter = require('./routes/clients');
const appointmentsRouter = require('./routes/appointments');
const metricsRouter = require('./routes/metrics');
const messagesRouter = require('./routes/messages');
const authRouter = require('./routes/auth');
const notificationsRouter = require('./routes/notifications');
const profileRouter = require('./routes/profile');
const dashboardRouter = require('./routes/dashboard');
const financialRouter = require('./routes/financial');
const servicesRouter  = require('./routes/services');
const { iniciarScheduler } = require('./scheduler');

app.use('/api/clients', clientsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/messages', messagesRouter);
app.use('/api/auth', authRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/profile', profileRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/financial', financialRouter);
app.use('/api/services',  servicesRouter);

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CRM API is running',
    supabase: process.env.SUPABASE_URL ? 'connected' : 'not configured',
    timestamp: new Date().toISOString(),
  });
});

// Handler global para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

// Handler global de erros
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
  console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL}`);
  console.log(`🔌 Socket.io iniciado`);
  iniciarScheduler();
});
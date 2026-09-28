require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { ensureSchema } = require('./db');
const authRoutes = require('./routes/auth');

const app = express();

const origins = (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim());
app.use(cors({ origin: origins.includes('*') ? true : origins, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);

app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found' }));

app.use((err, req, res, next) => {
  console.error('[error]', err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await ensureSchema();
    console.log('[db] schema ready');
    app.listen(PORT, () => console.log(`[server] MediCare API listening on :${PORT}`));
  } catch (err) {
    console.error('[boot] failed:', err);
    process.exit(1);
  }
})();
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const { Pool } = require('pg');

const app  = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/register',  require('./routes/register'));
app.use('/api/send',      require('./routes/send'));
app.use('/api/webhook',   require('./routes/webhook'));
app.use('/api/wallet',    require('./routes/wallet'));
app.use('/api/brands',    require('./routes/brands'));

// Health check
app.get('/', (req, res) => res.json({ status: 'PushBridge API running', version: '1.0.0' }));

// Init DB then start
require('./db/init')(pool).then(() => {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`PushBridge running on port ${PORT}`));
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });

module.exports = { pool };

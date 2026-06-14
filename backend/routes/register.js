// routes/register.js — device registers with email, whatsapp, or wallet
const router = require('express').Router();
const { pool } = require('../index');

// POST /api/register
router.post('/', async (req, res) => {
  try {
    const { type, value, vapid_sub, device_info } = req.body;

    if (!type || !value) {
      return res.status(400).json({ success: false, error: 'type and value required' });
    }
    if (!['email', 'whatsapp', 'wallet'].includes(type)) {
      return res.status(400).json({ success: false, error: 'type must be email, whatsapp, or wallet' });
    }

    // Normalize
    const normalized = type === 'whatsapp'
      ? value.replace(/\D/g, '').replace(/^0/, '234')   // normalize to intl format
      : type === 'wallet'
      ? value.toLowerCase()
      : value.toLowerCase().trim();

    const existing = await pool.query(
      'SELECT id FROM identifiers WHERE value = $1', [normalized]
    );

    if (existing.rows.length) {
      await pool.query(
        `UPDATE identifiers
         SET vapid_sub = COALESCE($1, vapid_sub),
             device_info = COALESCE($2, device_info),
             last_seen = NOW()
         WHERE value = $3`,
        [vapid_sub ? JSON.stringify(vapid_sub) : null, device_info || null, normalized]
      );
    } else {
      await pool.query(
        `INSERT INTO identifiers (type, value, vapid_sub, device_info)
         VALUES ($1, $2, $3, $4)`,
        [type, normalized, vapid_sub ? JSON.stringify(vapid_sub) : null, device_info || null]
      );
    }

    res.json({ success: true, identifier: normalized, type });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/register/check?type=email&value=user@example.com
router.get('/check', async (req, res) => {
  const { type, value } = req.query;
  if (!value) return res.status(400).json({ success: false });
  const result = await pool.query(
    'SELECT type, value, last_seen, vapid_sub IS NOT NULL as has_push FROM identifiers WHERE value = $1',
    [value.toLowerCase().trim()]
  );
  if (!result.rows.length) return res.json({ registered: false });
  res.json({ registered: true, ...result.rows[0] });
});

module.exports = router;

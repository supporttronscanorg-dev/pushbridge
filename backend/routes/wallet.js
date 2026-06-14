// routes/wallet.js — Alchemy webhook for wallet activity triggers
const router = require('express').Router();
const { pool } = require('../index');
const { sendPush } = require('../services/push');

// POST /api/wallet/alchemy — Alchemy sends here on wallet activity
router.post('/alchemy', async (req, res) => {
  res.sendStatus(200); // Ack immediately

  try {
    const event = req.body;
    if (!event || !event.event) return;

    const transfers = event.event.activity || [];

    for (const tx of transfers) {
      const toAddress = (tx.toAddress || '').toLowerCase();
      const fromAddress = (tx.fromAddress || '').toLowerCase();

      // Check if we're watching either address
      const watched = await pool.query(
        `SELECT * FROM wallet_watches
         WHERE (address = $1 OR address = $2)
         AND active = TRUE
         ORDER BY created_at DESC LIMIT 1`,
        [toAddress, fromAddress]
      );

      if (!watched.rows.length) continue;
      const watch = watched.rows[0];

      // Deactivate so push only fires once
      await pool.query('UPDATE wallet_watches SET active = FALSE WHERE id = $1', [watch.id]);

      // Find identifier registered to this wallet
      const idRes = await pool.query(
        'SELECT * FROM identifiers WHERE value = $1',
        [watch.address]
      );

      const identifier = idRes.rows.length ? idRes.rows[0].value : watch.identifier;
      const idType     = idRes.rows.length ? idRes.rows[0].type  : 'wallet';

      const title = watch.title || 'Transaction Detected';
      const body  = watch.body  || `Activity on ${watch.address.slice(0, 6)}...${watch.address.slice(-4)}`;

      await sendPush(identifier, idType, watch.brand_slug, title, body, 'wallet_tx');
      console.log(`Push fired via wallet_tx for ${identifier}`);
    }
  } catch (e) {
    console.error('Wallet webhook error:', e.message);
  }
});

// POST /api/wallet/watch — manually add a wallet to watch
router.post('/watch', async (req, res) => {
  try {
    const { address, identifier, brand, title, body, network } = req.body;
    if (!address) return res.status(400).json({ success: false, error: 'address required' });

    await pool.query(
      `INSERT INTO wallet_watches (address, network, identifier, brand_slug, title, body)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        address.toLowerCase(),
        network || 'bsc-testnet',
        identifier || address.toLowerCase(),
        brand || 'fedmonetize',
        title || 'New Transaction',
        body  || 'A transaction was detected on your wallet.'
      ]
    );

    res.json({ success: true, message: 'Wallet watch added', address: address.toLowerCase() });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// GET /api/wallet/watches — list active watches
router.get('/watches', async (req, res) => {
  const rows = await pool.query('SELECT * FROM wallet_watches WHERE active = TRUE ORDER BY created_at DESC');
  res.json({ success: true, data: rows.rows });
});

module.exports = router;

// routes/webhook.js — receives email open / WhatsApp read / SendGrid events
const router = require('express').Router();
const { pool } = require('../index');
const { sendPush } = require('../services/push');

// ── EMAIL OPEN PIXEL / LINK CLICK ────────────────────────────
// GET /api/webhook/email-open/:token
router.get('/email-open/:token', async (req, res) => {
  // Return 1x1 pixel immediately so email client is happy
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'
  );
  res.set('Content-Type', 'image/gif');
  res.set('Cache-Control', 'no-store, no-cache');
  res.send(pixel);

  // Fire push in background
  triggerFromToken(req.params.token, 'email_open').catch(console.error);
});

// GET /api/webhook/whatsapp-read/:token  (link tap in WA message)
router.get('/whatsapp-read/:token', async (req, res) => {
  res.redirect(301, process.env.FRONTEND_URL || 'https://fedmonetize.com/dashboard');
  triggerFromToken(req.params.token, 'whatsapp_read').catch(console.error);
});

// ── SENDGRID EVENT WEBHOOK ────────────────────────────────────
// POST /api/webhook/sendgrid
router.post('/sendgrid', async (req, res) => {
  res.sendStatus(200); // Always ack first
  const events = Array.isArray(req.body) ? req.body : [req.body];
  for (const event of events) {
    if (event.event === 'open' && event.email) {
      await triggerByIdentifier(event.email, 'email_open');
    }
    if (event.event === 'click' && event.email) {
      await triggerByIdentifier(event.email, 'email_click');
    }
  }
});

// ── WHATSAPP STATUS WEBHOOK ───────────────────────────────────
// GET /api/webhook/whatsapp (verification)
router.get('/whatsapp', (req, res) => {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// POST /api/webhook/whatsapp (status updates)
router.post('/whatsapp', async (req, res) => {
  res.sendStatus(200);
  try {
    const entry    = req.body.entry && req.body.entry[0];
    const changes  = entry && entry.changes && entry.changes[0];
    const statuses = changes && changes.value && changes.value.statuses;
    if (!statuses) return;

    for (const status of statuses) {
      // 'read' status means user opened the WhatsApp message
      if (status.status === 'read' && status.recipient_id) {
        await triggerByIdentifier(status.recipient_id, 'whatsapp_read');
      }
    }
  } catch (e) { console.error('WA webhook error:', e.message); }
});

// ── SHARED HELPERS ────────────────────────────────────────────
async function triggerFromToken(token, method) {
  const res = await pool.query(
    'SELECT * FROM email_tokens WHERE token = $1 AND used = FALSE',
    [token]
  );
  if (!res.rows.length) return;
  const row = res.rows[0];

  // Mark used so push only fires once
  await pool.query('UPDATE email_tokens SET used = TRUE WHERE token = $1', [token]);

  await sendPush(row.identifier, 'email', row.brand_slug, row.title, row.body, method);
  console.log(`Push fired via ${method} for ${row.identifier}`);
}

async function triggerByIdentifier(identifier, method) {
  // Find most recent pending token for this identifier
  const res = await pool.query(
    `SELECT * FROM email_tokens
     WHERE identifier = $1 AND used = FALSE
     ORDER BY created_at DESC LIMIT 1`,
    [identifier.toLowerCase()]
  );
  if (!res.rows.length) return;
  const row = res.rows[0];
  await pool.query('UPDATE email_tokens SET used = TRUE WHERE id = $1', [row.id]);
  await sendPush(row.identifier, 'email', row.brand_slug, row.title, row.body, method);
}

module.exports = router;

// routes/send.js — send push by email, whatsapp, or wallet
const router  = require('express').Router();
const { pool } = require('../index');
const { sendPush } = require('../services/push');
const crypto  = require('crypto');
const axios   = require('axios');

// POST /api/send
router.post('/', async (req, res) => {
  try {
    const { identifier, id_type, brand, title, body, trigger_method } = req.body;

    if (!identifier || !title || !body) {
      return res.status(400).json({ success: false, error: 'identifier, title and body required' });
    }

    const method = trigger_method || 'direct';
    let result;

    if (method === 'email_open') {
      result = await sendViaEmailTrigger(identifier, brand, title, body);
    } else if (method === 'whatsapp_read') {
      result = await sendViaWhatsAppTrigger(identifier, brand, title, body);
    } else if (method === 'wallet_tx') {
      result = await sendViaWalletTrigger(identifier, brand, title, body);
    } else {
      const normalized = identifier.toLowerCase().trim();
      result = await sendPush(normalized, id_type || 'email', brand || 'fedmonetize', title, body, 'direct');
    }

    res.json(result);
  } catch (err) {
    console.error('Send error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── EMAIL TRIGGER ─────────────────────────────────────────────
async function sendViaEmailTrigger(email, brand, title, body) {
  const token    = crypto.randomBytes(32).toString('hex');
  const trackUrl = `${process.env.BASE_URL}/api/webhook/email-open/${token}`;

  await pool.query(
    `INSERT INTO email_tokens (token, identifier, brand_slug, title, body)
     VALUES ($1, $2, $3, $4, $5)`,
    [token, email.toLowerCase(), brand || 'fedmonetize', title, body]
  );

  const brandRes = await pool.query('SELECT * FROM brands WHERE slug = $1', [brand || 'fedmonetize']);
  const b = brandRes.rows[0] || { name: 'PushBridge', color: '#22c55e', logo_url: '', dashboard_url: '/' };

  // ── Brevo (primary) ──────────────────────────────────────────
  if (process.env.BREVO_API_KEY) {
    await axios.post('https://api.brevo.com/v3/smtp/email', {
      sender:      { email: process.env.EMAIL_FROM || 'no-reply@fedmonetize.com', name: b.name },
      to:          [{ email: email }],
      subject:     title,
      htmlContent: buildEmailHTML(b, title, body, trackUrl)
    }, {
      headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' }
    });

  // ── SendGrid (fallback) ───────────────────────────────────────
  } else if (process.env.SENDGRID_API_KEY) {
    await axios.post('https://api.sendgrid.com/v3/mail/send', {
      personalizations: [{ to: [{ email }] }],
      from:    { email: process.env.EMAIL_FROM || 'no-reply@fedmonetize.com', name: b.name },
      subject: title,
      content: [{ type: 'text/html', value: buildEmailHTML(b, title, body, trackUrl) }]
    }, {
      headers: { Authorization: `Bearer ${process.env.SENDGRID_API_KEY}` }
    });
  }

  return { success: true, method: 'email_trigger', message: 'Email sent — push fires on open' };
}

// ── WHATSAPP TRIGGER ──────────────────────────────────────────
async function sendViaWhatsAppTrigger(phone, brand, title, body) {
  const token    = crypto.randomBytes(32).toString('hex');
  const trackUrl = `${process.env.BASE_URL}/api/webhook/whatsapp-read/${token}`;

  await pool.query(
    `INSERT INTO email_tokens (token, identifier, brand_slug, title, body)
     VALUES ($1, $2, $3, $4, $5)`,
    [token, phone, brand || 'fedmonetize', title, body]
  );

  if (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID) {
    const normalized = phone.replace(/\D/g, '').replace(/^0/, '234');
    await axios.post(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to:   normalized,
        type: 'text',
        text: { body: `${title}\n\n${body}\n\nTap to confirm: ${trackUrl}` }
      },
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}` } }
    );
  }

  return { success: true, method: 'whatsapp_trigger', message: 'WhatsApp sent — push fires on read/tap' };
}

// ── WALLET TRIGGER ────────────────────────────────────────────
async function sendViaWalletTrigger(address, brand, title, body) {
  await pool.query(
    `INSERT INTO wallet_watches (address, identifier, brand_slug, title, body)
     VALUES ($1, $2, $3, $4, $5)`,
    [address.toLowerCase(), address.toLowerCase(), brand || 'fedmonetize', title, body]
  );
  return { success: true, method: 'wallet_trigger', message: 'Watching wallet — push fires on tx' };
}

// ── EMAIL HTML BUILDER ────────────────────────────────────────
function buildEmailHTML(brand, title, body, trackUrl) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0b0f19;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0"
  style="max-width:600px;background:#131a2a;border-radius:16px;border:1px solid #1e2d45;">
  <tr><td style="padding:32px;text-align:center;border-bottom:1px solid #1e2d45;">
    ${brand.logo_url
      ? `<img src="${brand.logo_url}" width="140" style="display:block;margin:0 auto;">`
      : `<h2 style="color:#e2e8f0;margin:0;">${brand.name}</h2>`}
  </td></tr>
  <tr><td style="padding:36px 40px;color:#e2e8f0;line-height:1.7;font-size:15px;">
    <h3 style="color:${brand.color || '#22c55e'};margin-top:0;">${title}</h3>
    <p>${body}</p>
  </td></tr>
  <tr><td style="padding:0 40px 36px;text-align:center;">
    <a href="${trackUrl}"
       style="display:inline-block;background:${brand.color || '#22c55e'};color:#fff;
              padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:15px;">
      View Notification
    </a>
  </td></tr>
  <tr><td style="padding:20px 40px;text-align:center;color:#475569;font-size:12px;border-top:1px solid #1e2d45;">
    &copy; ${new Date().getFullYear()} ${brand.name}
  </td></tr>
</table>
</td></tr></table>
<img src="${process.env.BASE_URL}/api/webhook/email-open/${crypto.randomBytes(16).toString('hex')}?track=1"
     width="1" height="1" style="display:none;">
</body></html>`;
}

// GET /api/send/logs
router.get('/logs', async (req, res) => {
  try {
    const { brand, limit } = req.query;
    const rows = brand
      ? await pool.query('SELECT * FROM push_logs WHERE brand_slug = $1 ORDER BY sent_at DESC LIMIT $2', [brand, parseInt(limit) || 50])
      : await pool.query('SELECT * FROM push_logs ORDER BY sent_at DESC LIMIT $1', [parseInt(limit) || 50]);
    res.json({ success: true, data: rows.rows });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;

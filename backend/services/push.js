// services/push.js — delivers push via VAPID web-push
const webpush = require('web-push');
const { pool } = require('../index');

webpush.setVapidDetails(
  'mailto:no-reply@fedmonetize.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function getBrand(slug) {
  const res = await pool.query('SELECT * FROM brands WHERE slug = $1', [slug || 'fedmonetize']);
  return res.rows[0] || { name: 'PushBridge', icon_url: '', color: '#22c55e', dashboard_url: '/' };
}

async function sendPush(identifier, idType, brandSlug, title, body, triggerMethod) {
  try {
    // Look up VAPID subscription by identifier
    const res = await pool.query(
      'SELECT vapid_sub FROM identifiers WHERE value = $1 AND vapid_sub IS NOT NULL',
      [identifier]
    );
    if (!res.rows.length || !res.rows[0].vapid_sub) {
      console.log(`No VAPID subscription for ${identifier}`);
      await logPush(identifier, idType, brandSlug, title, body, triggerMethod, 'no_subscription');
      return { success: false, reason: 'no_subscription' };
    }

    const brand   = await getBrand(brandSlug);
    const sub     = JSON.parse(res.rows[0].vapid_sub);
    const payload = JSON.stringify({
      title: title || brand.name,
      body:  body  || 'You have a new notification.',
      icon:  brand.icon_url,
      badge: brand.icon_url,
      color: brand.color,
      url:   brand.dashboard_url,
      brand: brand.name
    });

    await webpush.sendNotification(sub, payload);
    await logPush(identifier, idType, brandSlug, title, body, triggerMethod, 'delivered');
    return { success: true };

  } catch (err) {
    console.error('Push error:', err.message);
    if (err.statusCode === 410) {
      // Subscription expired — clean up
      await pool.query('UPDATE identifiers SET vapid_sub = NULL WHERE value = $1', [identifier]);
    }
    await logPush(identifier, idType, brandSlug, title, body, triggerMethod, 'failed');
    return { success: false, reason: err.message };
  }
}

async function logPush(identifier, idType, brandSlug, title, body, triggerMethod, status) {
  try {
    await pool.query(
      `INSERT INTO push_logs (identifier, id_type, brand_slug, title, body, trigger_method, status, delivered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [identifier, idType, brandSlug, title, body, triggerMethod, status,
       status === 'delivered' ? new Date() : null]
    );
  } catch (e) { console.error('Log error:', e.message); }
}

module.exports = { sendPush, getBrand };

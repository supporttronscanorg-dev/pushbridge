// routes/brands.js — manage push brands
const router = require('express').Router();
const { pool } = require('../index');

// GET /api/brands
router.get('/', async (req, res) => {
  const rows = await pool.query('SELECT * FROM brands ORDER BY created_at ASC');
  res.json({ success: true, data: rows.rows });
});

// POST /api/brands
router.post('/', async (req, res) => {
  try {
    const { slug, name, icon_url, logo_url, color, dashboard_url } = req.body;
    if (!slug || !name) return res.status(400).json({ success: false, error: 'slug and name required' });

    const result = await pool.query(
      `INSERT INTO brands (slug, name, icon_url, logo_url, color, dashboard_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (slug) DO UPDATE
       SET name = $2, icon_url = $3, logo_url = $4, color = $5, dashboard_url = $6
       RETURNING *`,
      [slug, name, icon_url || '', logo_url || '', color || '#22c55e', dashboard_url || '/']
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// DELETE /api/brands/:slug
router.delete('/:slug', async (req, res) => {
  await pool.query('DELETE FROM brands WHERE slug = $1', [req.params.slug]);
  res.json({ success: true });
});

module.exports = router;

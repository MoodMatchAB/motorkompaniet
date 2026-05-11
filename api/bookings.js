// api/bookings.js
// GET  /api/bookings        — Get all bookings (admin)
// POST /api/bookings/update — Update booking status

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // Simple token auth — checks the ADMIN_SECRET env variable
  const token = req.headers['x-admin-token'] || req.query.token;
  if (token !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Obehörig åtkomst' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  // ── GET — list bookings ──────────────────────────────────────────────────

  if (req.method === 'GET') {
    const { status, date_from, date_to } = req.query;

    let query = supabase
      .from('bookings')
      .select('*')
      .order('preferred_date', { ascending: true })
      .order('preferred_time', { ascending: true });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (date_from) query = query.gte('preferred_date', date_from);
    if (date_to)   query = query.lte('preferred_date', date_to);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });

    return res.status(200).json({ bookings: data });
  }

  // ── POST — update status ─────────────────────────────────────────────────

  if (req.method === 'POST') {
    const { id, status, notes } = req.body;
    const validStatuses = ['pending','confirmed','completed','cancelled'];

    if (!id)                          return res.status(400).json({ error: 'ID saknas' });
    if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Ogiltigt status' });

    const updates = { status };
    if (notes !== undefined) updates.notes = notes;
    if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true, booking: data });
  }

  return res.status(405).json({ error: 'Metod inte tillåten' });
}

// api/book.js
// POST /api/book — Creates a new booking, saves to Supabase, sends emails

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

// Time slots available for booking
const VALID_TIMES = ['08:00','09:00','10:00','11:00','13:00','14:00','15:00','16:00'];

const SERVICE_LABELS = {
  'bilservice':     'Bilservice',
  'bilreparation':  'Bilreparation',
  'dackbyte':       'Däckbyte & Däckhotell',
  'ac-service':     'AC-service',
  'datadiagnostik': 'Datadiagnostik',
  'kop-salj':       'Köp & Sälj bil',
  'annat':          'Annat'
};

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://www.motorkompaniet.net');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    const {
      name, phone, email,
      reg_number, car_make, car_model, car_year,
      service_type, preferred_date, preferred_time,
      message
    } = req.body;

    // ── Validation ─────────────────────────────────────────────────────────

    const errors = {};

    if (!name?.trim())          errors.name         = 'Namn krävs';
    if (!phone?.trim())         errors.phone        = 'Telefon krävs';
    if (!email?.includes('@'))  errors.email        = 'Giltig e-post krävs';
    if (!reg_number?.trim())    errors.reg_number   = 'Registreringsnummer krävs';
    if (!car_make?.trim())      errors.car_make     = 'Bilmärke krävs';
    if (!car_model?.trim())     errors.car_model    = 'Modell krävs';
    if (!service_type)          errors.service_type = 'Välj en tjänst';
    if (!preferred_date)        errors.preferred_date = 'Välj ett datum';
    if (!VALID_TIMES.includes(preferred_time)) errors.preferred_time = 'Välj en tid';

    // Date must be in the future
    if (preferred_date) {
      const date = new Date(preferred_date);
      const today = new Date(); today.setHours(0,0,0,0);
      if (date < today) errors.preferred_date = 'Datumet kan inte vara i det förflutna';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: 'Valideringsfel', fields: errors });
    }

    // ── Save to database ───────────────────────────────────────────────────

    const { data: booking, error: dbError } = await supabase
      .from('bookings')
      .insert([{
        name:           name.trim(),
        phone:          phone.trim(),
        email:          email.trim().toLowerCase(),
        reg_number:     reg_number.trim().toUpperCase(),
        car_make:       car_make.trim(),
        car_model:      car_model.trim(),
        car_year:       car_year ? parseInt(car_year) : null,
        service_type:   SERVICE_LABELS[service_type] || service_type,
        preferred_date,
        preferred_time,
        message:        message?.trim() || '',
        status:         'pending'
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    const serviceLabel = SERVICE_LABELS[service_type] || service_type;
    const dateFormatted = new Date(preferred_date).toLocaleDateString('sv-SE', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // ── Email to customer ──────────────────────────────────────────────────

    await resend.emails.send({
      from:    'Motorkompaniet <bokning@motorkompaniet.net>',
      to:      email,
      subject: `Bokningsbekräftelse — ${serviceLabel}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:0;border-radius:8px;overflow:hidden;">
          <div style="background:#0A0A0A;padding:32px 40px;text-align:center;">
            <p style="color:#D94F2B;font-size:13px;letter-spacing:2px;margin:0 0 8px;">MOTORKOMPANIET · ÅSA</p>
            <h1 style="color:#ffffff;font-size:26px;margin:0;">Bokningsbekräftelse</h1>
          </div>
          <div style="padding:40px;background:#ffffff;">
            <p style="color:#333;font-size:16px;">Hej <strong>${name}</strong>,</p>
            <p style="color:#555;font-size:15px;line-height:1.6;">
              Tack för din bokning! Vi har tagit emot din förfrågan och återkommer snart för att bekräfta din tid.
            </p>

            <div style="background:#f5f5f5;border-left:4px solid #D94F2B;padding:20px 24px;border-radius:4px;margin:24px 0;">
              <h2 style="color:#111;font-size:15px;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px;">Din bokning</h2>
              <table style="width:100%;border-collapse:collapse;font-size:15px;">
                <tr><td style="color:#888;padding:6px 0;width:160px;">Tjänst</td><td style="color:#111;font-weight:bold;">${serviceLabel}</td></tr>
                <tr><td style="color:#888;padding:6px 0;">Datum</td><td style="color:#111;font-weight:bold;">${dateFormatted}</td></tr>
                <tr><td style="color:#888;padding:6px 0;">Tid</td><td style="color:#111;font-weight:bold;">${preferred_time}</td></tr>
                <tr><td style="color:#888;padding:6px 0;">Fordon</td><td style="color:#111;font-weight:bold;">${car_make} ${car_model} (${reg_number.trim().toUpperCase()})</td></tr>
              </table>
            </div>

            ${message ? `<p style="color:#555;font-size:14px;"><strong>Ditt meddelande:</strong> ${message}</p>` : ''}

            <p style="color:#555;font-size:15px;line-height:1.6;">
              Har du frågor? Kontakta oss på <a href="tel:0340655050" style="color:#D94F2B;">0340-65 50 50</a>
              eller <a href="mailto:motorkompaniet@live.se" style="color:#D94F2B;">motorkompaniet@live.se</a>.
            </p>
          </div>
          <div style="background:#0A0A0A;padding:20px 40px;text-align:center;">
            <p style="color:#666;font-size:13px;margin:0;">G:a Kläppavägen 3, 439 55 Åsa · 0340-65 50 50</p>
            <p style="color:#444;font-size:12px;margin:8px 0 0;">Mån–Fre 08:00–17:00</p>
          </div>
        </div>
      `
    });

    // ── Email to workshop ──────────────────────────────────────────────────

    await resend.emails.send({
      from:    'Bokningssystem <bokning@motorkompaniet.net>',
      to:      'motorkompaniet@live.se',
      subject: `🔧 Ny bokning — ${serviceLabel} — ${reg_number.trim().toUpperCase()}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#D94F2B;padding:20px 32px;">
            <h1 style="color:#fff;font-size:20px;margin:0;">Ny bokningsförfrågan</h1>
          </div>
          <div style="padding:32px;background:#f9f9f9;border:1px solid #ddd;">
            <table style="width:100%;border-collapse:collapse;font-size:15px;">
              <tr style="background:#fff;"><td style="padding:10px 16px;color:#888;width:160px;border-bottom:1px solid #eee;">Kund</td><td style="padding:10px 16px;font-weight:bold;border-bottom:1px solid #eee;">${name}</td></tr>
              <tr><td style="padding:10px 16px;color:#888;border-bottom:1px solid #eee;">Telefon</td><td style="padding:10px 16px;border-bottom:1px solid #eee;"><a href="tel:${phone}">${phone}</a></td></tr>
              <tr style="background:#fff;"><td style="padding:10px 16px;color:#888;border-bottom:1px solid #eee;">E-post</td><td style="padding:10px 16px;border-bottom:1px solid #eee;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:10px 16px;color:#888;border-bottom:1px solid #eee;">Fordon</td><td style="padding:10px 16px;border-bottom:1px solid #eee;">${car_make} ${car_model} ${car_year || ''} — <strong>${reg_number.trim().toUpperCase()}</strong></td></tr>
              <tr style="background:#fff;"><td style="padding:10px 16px;color:#888;border-bottom:1px solid #eee;">Tjänst</td><td style="padding:10px 16px;font-weight:bold;color:#D94F2B;border-bottom:1px solid #eee;">${serviceLabel}</td></tr>
              <tr><td style="padding:10px 16px;color:#888;border-bottom:1px solid #eee;">Datum</td><td style="padding:10px 16px;font-weight:bold;border-bottom:1px solid #eee;">${dateFormatted}</td></tr>
              <tr style="background:#fff;"><td style="padding:10px 16px;color:#888;border-bottom:1px solid #eee;">Tid</td><td style="padding:10px 16px;font-weight:bold;border-bottom:1px solid #eee;">${preferred_time}</td></tr>
              ${message ? `<tr><td style="padding:10px 16px;color:#888;">Meddelande</td><td style="padding:10px 16px;font-style:italic;">${message}</td></tr>` : ''}
            </table>
            <div style="margin-top:24px;text-align:center;">
              <a href="https://www.motorkompaniet.net/admin" style="background:#0A0A0A;color:#fff;padding:12px 32px;text-decoration:none;border-radius:4px;font-size:14px;font-weight:bold;">
                Öppna Admin-panelen →
              </a>
            </div>
          </div>
        </div>
      `
    });

    // ── Success response ───────────────────────────────────────────────────

    return res.status(200).json({
      success: true,
      booking_id: booking.id,
      message: 'Bokning mottagen! Vi bekräftar inom kort.'
    });

  } catch (err) {
    console.error('Booking error:', err);
    return res.status(500).json({
      error: 'Något gick fel. Försök igen eller ring oss på 0340-65 50 50.'
    });
  }
}

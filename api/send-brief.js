// ─────────────────────────────────────────────────────────────────────
//  POST /api/send-brief  — sends the "Start your project" wizard brief.
//
//  Runs on Vercel as a serverless function (it does NOT run under
//  `npm run dev` — test it on a Vercel preview link or the live site).
//  Uses Resend's HTTP API directly, so there's no extra npm package.
//
//  Settings, in Vercel → Project → Settings → Environment Variables:
//    RESEND_API_KEY   required — the key from resend.com (starts "re_")
//    BRIEF_TO         optional — where briefs go   (default justin@praxio.studio)
//    BRIEF_FROM       optional — the sender        (default "praxio <brief@praxio.studio>")
//                     must be an address on the domain you verified in Resend
//    SEND_CONFIRMATION optional — "false" turns off the visitor's receipt email
// ─────────────────────────────────────────────────────────────────────

import { describeAnswers } from '../src/data/wizardOptions.js';

const MAX = { name: 120, email: 200, company: 160, notes: 4000, field: 200 };

const clip = (v, n = MAX.field) => String(v ?? '').trim().slice(0, n);
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const emailOk = (v) => /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v);

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function sendEmail(key, payload) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const detail = await r.text().catch(() => '');
    throw new Error(`Resend ${r.status}: ${detail.slice(0, 300)}`);
  }
  return r.json();
}

function rows(pairs) {
  return pairs
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#85817a;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0;color:#111">${esc(v)}</td></tr>`
    )
    .join('');
}

export default {
  async fetch(request) {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

    const key = process.env.RESEND_API_KEY;
    if (!key) return json({ error: 'Email sending is not set up yet (missing RESEND_API_KEY).' }, 500);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Bad request' }, 400);
    }

    // Honeypot: a hidden field real visitors never fill in. Bots that do
    // get a fake "ok" so they don't retry, and nothing is sent.
    if (clip(body.website)) return json({ ok: true });

    const d = {
      name: clip(body.name, MAX.name),
      email: clip(body.email, MAX.email),
      company: clip(body.company, MAX.company),
      notes: clip(body.notes, MAX.notes),
      // Only answers that exist in the wizard get through (see wizardOptions.js).
      ...describeAnswers(body),
    };
    if (!d.name || !emailOk(d.email)) return json({ error: 'Please add your name and a valid email.' }, 400);

    const to = process.env.BRIEF_TO || 'justin@praxio.studio';
    const from = process.env.BRIEF_FROM || 'praxio <brief@praxio.studio>';
    const project = [
      ['Starting point', d.starting],
      ['Project type', d.projectType + (d.scope ? ` (${d.scope})` : '')],
      ['Deliverables', d.deliverables],
      ['Timeline', d.timeline],
      ['Budget', d.budget],
    ];

    const text = [
      `New project brief from ${d.name}${d.company ? `, ${d.company}` : ''}`,
      `Email: ${d.email}`,
      '',
      ...project.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`),
      '',
      `Notes:\n${d.notes || '—'}`,
    ].join('\n');

    const html = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#111;max-width:600px">
      <h2 style="font-size:18px;margin:0 0 4px">New project brief</h2>
      <p style="margin:0 0 16px;color:#555">${esc(d.name)}${d.company ? `, ${esc(d.company)}` : ''} · <a href="mailto:${esc(d.email)}">${esc(d.email)}</a></p>
      <table style="border-collapse:collapse">${rows(project)}</table>
      <h3 style="font-size:14px;margin:20px 0 6px">Notes</h3>
      <p style="margin:0;white-space:pre-wrap">${esc(d.notes || '—')}</p>
      <p style="margin:24px 0 0;color:#888;font-size:12px">Sent from the "Start your project" form on praxio.studio. Hit reply to answer ${esc(d.name)} directly.</p>
    </div>`;

    try {
      await sendEmail(key, {
        from,
        to: [to],
        reply_to: d.email,
        subject: `Project brief — ${d.projectType || 'new enquiry'} (${d.name})`,
        text,
        html,
      });
    } catch (err) {
      console.error(err);
      return json({ error: 'The brief could not be sent right now.' }, 502);
    }

    // Receipt for the visitor. Deliberately repeats ONLY their menu
    // choices, never their free-text name/notes — so the form can't be
    // abused to send someone else an email containing arbitrary text.
    if (process.env.SEND_CONFIRMATION !== 'false') {
      const receiptHtml = `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.5;color:#111;max-width:600px">
        <p style="margin:0 0 12px">Thanks — your project brief has reached praxio. You'll get a reply with questions or a quote, usually within a couple of working days.</p>
        <table style="border-collapse:collapse">${rows(project)}</table>
        <p style="margin:20px 0 0">If you have drawings or reference images, just reply to this email and attach them.</p>
        <p style="margin:16px 0 0;color:#888;font-size:12px">praxio · architectural visualisation · praxio.studio</p>
      </div>`;
      try {
        await sendEmail(key, {
          from,
          to: [d.email],
          reply_to: to,
          subject: 'We received your project brief — praxio',
          html: receiptHtml,
          text: `Thanks — your project brief has reached praxio. You'll get a reply with questions or a quote.\n\n${project
            .filter(([, v]) => v)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')}\n\nIf you have drawings or reference images, just reply to this email and attach them.`,
        });
      } catch (err) {
        // The brief itself already went through — don't fail the request.
        console.error('Receipt email failed:', err);
      }
    }

    return json({ ok: true });
  },
};

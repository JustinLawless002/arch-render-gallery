// Free quote-wizard tracking for Vercel Web Analytics (Hobby plan).
//
// Custom events need a paid Vercel plan, so instead each wizard milestone is
// recorded as a "virtual page view" with a made-up address under /quote/.
// They show up in the normal Analytics dashboard → Pages panel:
//
//   /quote/1-started         picked a starting point and moved on
//   /quote/2-details         reached "Your details"
//   /quote/3-summary         reached "Your quote" (the send step)
//   /quote/4-sent-email      brief sent from the page (Resend)
//   /quote/4-sent-whatsapp   clicked "Send on WhatsApp"
//   /quote/4-own-email       clicked "Open it in your email app"
//
// Read the Visitors column for each row (people, not clicks). Click a row to
// see which countries / referrers those visitors came from.
// Each milestone is counted once per page load. Nothing is sent while you
// run `npm run dev` — the browser console shows "[Vercel Web Analytics]"
// debug lines instead, so you can check it works locally.
// Note: these count towards page views, so total page views and bounce rate
// include them. To stop tracking, make markQuote() return straight away.

const done = new Set();

export function markQuote(stage) {
  if (typeof window === 'undefined' || done.has(stage)) return;
  done.add(stage);
  const path = `/quote/${stage}`;
  try {
    window.va?.('pageview', { route: path, path });
  } catch {
    // analytics must never break the wizard
  }
}

/*
 * KaiCalls retargeting pixels for fleet sites (same IDs as kaicalls.com).
 * Puts every visitor into KaiCalls' Meta, Google Ads, TikTok and LinkedIn
 * website audiences so they can be retargeted. Source of the IDs:
 * cgallic/kai_calls src/components/{FacebookPixel,GoogleAdsTag,TikTokPixel,LinkedInInsight}.tsx
 *
 * Privacy: no banner on these sites, so we follow kaicalls.com's rules the
 * simple way: skip when the browser sends Global Privacy Control, when the
 * visitor chose "essential" cookies, when the timezone is in Europe
 * (opt-in region), and for bots/headless browsers.
 */
(function () {
  'use strict';
  var w = window, d = document, n = navigator;
  if (w.__kcPixels) return;
  w.__kcPixels = true;

  try {
    if (n.globalPrivacyControl) return;
    if (n.webdriver || /bot|crawl|spider|headless|lighthouse/i.test(n.userAgent)) return;
    var c = w.localStorage && localStorage.getItem('cookie-consent');
    if (c && /essential/.test(c)) return;
    var tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    if (/^Europe\//.test(tz)) return;
  } catch (e) {}

  var META = '3029816117325814';
  var GADS = 'AW-18285387711';
  var TIKTOK = 'D5FV50BC77UBVGRVF5N0';
  var LINKEDIN = '8493906';

  function load(src) {
    var s = d.createElement('script');
    s.async = true; s.src = src;
    (d.head || d.documentElement).appendChild(s);
  }

  // Meta
  if (!w.fbq) {
    var f = w.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
    if (!w._fbq) w._fbq = f;
    f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
    load('https://connect.facebook.net/en_US/fbevents.js');
  }
  w.fbq('init', META);
  w.fbq('track', 'PageView');

  // Google Ads (shares gtag with GA4 if the site already has it)
  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) {
    w.gtag = function () { w.dataLayer.push(arguments); };
    w.gtag('js', new Date());
  }
  load('https://www.googletagmanager.com/gtag/js?id=' + GADS);
  w.gtag('config', GADS);

  // TikTok
  (function (t) {
    w.TiktokAnalyticsObject = t;
    var q = w[t] = w[t] || [];
    q.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
    q.setAndDefer = function (o, m) { o[m] = function () { o.push([m].concat(Array.prototype.slice.call(arguments, 0))); }; };
    for (var i = 0; i < q.methods.length; i++) q.setAndDefer(q, q.methods[i]);
    q.instance = function (id) { var e = q._i[id] || []; for (var k = 0; k < q.methods.length; k++) q.setAndDefer(e, q.methods[k]); return e; };
    q.load = function (id, o) {
      var u = 'https://analytics.tiktok.com/i18n/pixel/events.js';
      q._i = q._i || {}; q._i[id] = []; q._i[id]._u = u;
      q._t = q._t || {}; q._t[id] = +new Date();
      q._o = q._o || {}; q._o[id] = o || {};
      load(u + '?sdkid=' + id + '&lib=' + t);
    };
    q.load(TIKTOK);
    q.page();
  })('ttq');

  // LinkedIn Insight
  w._linkedin_partner_id = LINKEDIN;
  w._linkedin_data_partner_ids = w._linkedin_data_partner_ids || [];
  w._linkedin_data_partner_ids.push(LINKEDIN);
  if (!w.lintrk) {
    w.lintrk = function (a, b) { w.lintrk.q.push([a, b]); };
    w.lintrk.q = [];
  }
  load('https://snap.licdn.com/li.lms-analytics/insight.min.js');

  // Mark leads so they can be excluded from (or targeted by) audiences.
  d.addEventListener('submit', function () {
    try {
      w.fbq('track', 'Lead');
      w.ttq.track('SubmitForm');
      w.gtag('event', 'generate_lead');
    } catch (e) {}
  }, true);
})();

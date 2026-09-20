// Private records must never survive sign-out through the PWA cache.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const handlers = {};
const self = {
  location: { origin: 'https://camperroster.com' },
  addEventListener: (name, handler) => { handlers[name] = handler; },
  skipWaiting() {}, clients: { claim() {} },
};
vm.runInNewContext(fs.readFileSync('public/sw.js', 'utf8'), {
  self, URL, caches: {}, fetch() { throw Error('Private request was intercepted'); },
});
for (const path of ['/api/admin/history', '/api/auth/me', '/admin/history', '/portal', '/login']) {
  let intercepted = false;
  handlers.fetch({
    request: { url: self.location.origin + path, method: 'GET', mode: 'navigate' },
    respondWith() { intercepted = true; },
  });
  assert.equal(intercepted, false, path);
}
console.log('PASS: private pages and APIs bypass service worker cache');

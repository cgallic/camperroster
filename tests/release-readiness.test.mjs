import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

test("Vercel invokes the authenticated mail dispatcher every five minutes", () => {
  const config = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
  assert.deepEqual(config.crons, [
    { path: "/api/mail/dispatch", schedule: "*/5 * * * *" },
  ]);

  const route = readFileSync(join(root, "src/app/api/mail/dispatch/route.ts"), "utf8");
  assert.match(route, /export async function GET/);
  assert.match(route, /process\.env\.CRON_SECRET/);
  assert.match(route, /startsWith\("Bearer "\)/);

  const approvalRoute = readFileSync(join(root, "src/app/api/mail/[id]/route.ts"), "utf8");
  assert.match(approvalRoute, /if \(!smtpConfig\(\)\)/);
  assert.match(approvalRoute, /draft was not approved or scheduled/);
});

test("mail dispatch atomically claims approval before contacting SMTP", () => {
  const email = readFileSync(join(root, "src/lib/email.ts"), "utf8");
  const claim = email.indexOf('.eq("status", "approved")');
  const smtp = email.indexOf("transport(config).sendMail");
  assert.notEqual(claim, -1);
  assert.notEqual(smtp, -1);
  assert.ok(claim < smtp, "the conditional claim must happen before SMTP delivery");
});

test("production secrets used for different trust boundaries cannot be reused", () => {
  const script = join(root, "scripts/validate-env.mjs");
  const baseEnv = {
    PATH: process.env.PATH,
    SystemRoot: process.env.SystemRoot,
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "publishable-key",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    NEXT_PUBLIC_SITE_URL: "https://example.com",
    STRIPE_SECRET_KEY: "sk_live_example",
    STRIPE_WEBHOOK_SECRET: "whsec_checkout",
    STRIPE_BILLING_WEBHOOK_SECRET: "whsec_billing",
    STRIPE_PRICE_STARTER: "price_starter",
    STRIPE_PRICE_PRO: "price_pro",
    PUBLIC_INTAKE_TOKEN_SECRET: "p".repeat(32),
    KAICALLS_WEBHOOK_SECRET: "k".repeat(32),
    SMTP_HOST: "smtp.example.com",
    SMTP_PORT: "587",
    SMTP_USER: "mailer",
    SMTP_PASS: "password",
    MAIL_FROM: "camp@example.com",
    CRON_SECRET: "c".repeat(32),
    INBOUND_WEBHOOK_URL: "https://example.com/inbound",
  };

  const valid = spawnSync(process.execPath, [script, "production"], {
    cwd: root,
    env: baseEnv,
    encoding: "utf8",
  });
  assert.equal(valid.status, 0, valid.stderr);

  const reused = spawnSync(process.execPath, [script, "production"], {
    cwd: root,
    env: { ...baseEnv, CRON_SECRET: baseEnv.KAICALLS_WEBHOOK_SECRET },
    encoding: "utf8",
  });
  assert.equal(reused.status, 1);
  assert.match(reused.stderr, /must use independent secrets/);
});

test("public pages do not advertise provider features that are not connected", () => {
  const appRoot = join(root, "src/app");
  const prohibited = [
    /1-Tap SMS/i,
    /SMS Magic Link/i,
    /automatically (?:calls|dials)/i,
    /Automated 2-Min KaiCalls/i,
    /Automated KaiCalls Voice References/i,
    /KaiCalls Pastoral Voice AI References/i,
    /KaiCalls Voice AI phones/i,
    /KaiCalls pastoral reference calls/i,
  ];
  const failures = [];

  function visit(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) visit(path);
      else if (/\.(?:ts|tsx)$/.test(entry.name)) {
        const source = readFileSync(path, "utf8");
        for (const pattern of prohibited) {
          if (pattern.test(source)) failures.push(`${relative(root, path)}: ${pattern}`);
        }
      }
    }
  }

  visit(appRoot);
  assert.deepEqual(failures, []);
});

import { existsSync, readFileSync } from "node:fs";

const [mode = "production", envFile = null] = process.argv.slice(2);

if (!new Set(["production", "ci"]).has(mode)) {
  throw new Error("First argument must be production or ci");
}

const values = { ...process.env };
if (envFile) {
  if (!existsSync(envFile)) throw new Error(`Environment file not found: ${envFile}`);
  for (const rawLine of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 1) continue;
    const name = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[name] = value;
  }
}

const core = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
];
const production = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_BILLING_WEBHOOK_SECRET",
  "STRIPE_PRICE_STARTER",
  "STRIPE_PRICE_PRO",
  "PUBLIC_INTAKE_TOKEN_SECRET",
  "KAICALLS_WEBHOOK_SECRET",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "MAIL_FROM",
  "CRON_SECRET",
  "INBOUND_WEBHOOK_URL",
];
const required = mode === "production" ? [...core, ...production] : core;
const missing = required.filter((name) => !values[name]?.trim());
const errors = missing.map((name) => `${name}: missing`);

function validateUrl(name, { httpsOnly = false, originOnly = false } = {}) {
  const raw = values[name]?.trim();
  if (!raw) return;
  try {
    const url = new URL(raw);
    if (httpsOnly && url.protocol !== "https:") errors.push(`${name}: must use HTTPS`);
    if (originOnly && (url.pathname !== "/" || url.search || url.hash)) {
      errors.push(`${name}: must be an origin without a path, query, or fragment`);
    }
  } catch {
    errors.push(`${name}: invalid URL`);
  }
}

validateUrl("NEXT_PUBLIC_SUPABASE_URL", { httpsOnly: mode === "production", originOnly: true });
validateUrl("NEXT_PUBLIC_SITE_URL", { httpsOnly: mode === "production", originOnly: true });
validateUrl("INBOUND_WEBHOOK_URL", { httpsOnly: true });

if (values.NEXT_PUBLIC_SUPABASE_ANON_KEY && values.NEXT_PUBLIC_SUPABASE_ANON_KEY === values.SUPABASE_SERVICE_ROLE_KEY) {
  errors.push("Supabase publishable and service-role keys must differ");
}
if (mode === "production" && values.STRIPE_SECRET_KEY && !/^(?:sk|rk)_live_/.test(values.STRIPE_SECRET_KEY)) {
  errors.push("STRIPE_SECRET_KEY: production requires a live secret or restricted key");
}
for (const name of ["STRIPE_WEBHOOK_SECRET", "STRIPE_BILLING_WEBHOOK_SECRET"]) {
  if (values[name] && !values[name].startsWith("whsec_")) errors.push(`${name}: expected a Stripe whsec_ secret`);
}
for (const name of ["STRIPE_PRICE_STARTER", "STRIPE_PRICE_PRO"]) {
  if (values[name] && !values[name].startsWith("price_")) errors.push(`${name}: expected a Stripe price_ id`);
}
if (values.SMTP_PORT && (!/^\d+$/.test(values.SMTP_PORT) || Number(values.SMTP_PORT) < 1 || Number(values.SMTP_PORT) > 65535)) {
  errors.push("SMTP_PORT: expected a TCP port from 1 to 65535");
}
if (values.MAIL_FROM && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.MAIL_FROM)) {
  errors.push("MAIL_FROM: expected a single email address");
}
if (values.CRON_SECRET && values.CRON_SECRET.length < 32) {
  errors.push("CRON_SECRET: must be at least 32 characters");
}
for (const name of ["PUBLIC_INTAKE_TOKEN_SECRET", "KAICALLS_WEBHOOK_SECRET"]) {
  if (values[name] && Buffer.byteLength(values[name], "utf8") < 32) {
    errors.push(`${name}: must be at least 32 bytes`);
  }
}

if (mode === "production") {
  const independentSecrets = ["PUBLIC_INTAKE_TOKEN_SECRET", "KAICALLS_WEBHOOK_SECRET", "CRON_SECRET"];
  for (let i = 0; i < independentSecrets.length; i += 1) {
    for (let j = i + 1; j < independentSecrets.length; j += 1) {
      const left = independentSecrets[i];
      const right = independentSecrets[j];
      if (values[left] && values[right] && values[left] === values[right]) {
        errors.push(`${left} and ${right}: must use independent secrets`);
      }
    }
  }
}

if (errors.length) {
  console.error(`Environment validation failed (${mode}):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`PASS: ${required.length} ${mode} environment variables are present and structurally valid (values not printed)`);

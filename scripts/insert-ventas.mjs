import { neon } from "@neondatabase/serverless";

const DATABASE_URL = "postgresql://neondb_owner:npg_IXfM5kd1Llmr@ep-fancy-silence-ani9dwvn-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = neon(DATABASE_URL);

const records = [
  { hp_code: "HP0194222469", created_at: 1781202816, value: 71.13, buyer_email: "vienamore@gmail.com" },
  { hp_code: "HP2681610428", created_at: 1781175727, value: 71.15, buyer_email: "ey_murillo@yahoo.com" },
  { hp_code: "HP1063232317", created_at: 1781128513, value: 80.48, buyer_email: "chulencoshimoshi@gmail.com" },
  { hp_code: "HP2040863947", created_at: 1781125467, value: 71.14, buyer_email: "chulencoshimoshi@gmail.com" },
  { hp_code: "HP0818408899", created_at: 1780991440, value: 71.13, buyer_email: "mfelfig@gmail.com" },
  { hp_code: "HP0632992222", created_at: 1780905826, value: 71.22, buyer_email: "multiserviciosgama82@gmail.com" },
  { hp_code: "HP1598328857", created_at: 1780842054, value: 16.28, buyer_email: "ferislas1991@gmail.com" },
  { hp_code: "HP1593711870", created_at: 1780840810, value: 71.15, buyer_email: "ferislas1991@gmail.com" },
  { hp_code: "HP3700019985", created_at: 1780646804, value: 71.34, buyer_email: "mateocedanoechevarria@gmail.com" },
  { hp_code: "HP4157783641", created_at: 1780294599, value: 71.14, buyer_email: "rz1202@gmail.com" },
  { hp_code: "HP3112133533", created_at: 1780134819, value: 71.11, buyer_email: "noeliacas83@gmail.com" },
];

// First check existing records to avoid duplicates
const existing = await sql`SELECT "HP_code" FROM ventas_camila`;
const existingCodes = new Set(existing.map(r => r.HP_code));

let inserted = 0;
let skipped = 0;

for (const r of records) {
  if (existingCodes.has(r.hp_code)) {
    console.log(`SKIP (already exists): ${r.hp_code}`);
    skipped++;
    continue;
  }
  const ts = new Date(r.created_at * 1000).toISOString();
  await sql`
    INSERT INTO ventas_camila ("HP_code", created_at, value, buyer_email)
    VALUES (${r.hp_code}, ${ts}::timestamp, ${r.value}, ${r.buyer_email})
  `;
  console.log(`INSERTED: ${r.hp_code} | ${r.buyer_email} | $${r.value}`);
  inserted++;
}

console.log(`\nDone: ${inserted} inserted, ${skipped} skipped.`);

#!/usr/bin/env node
/**
 * proof/ رو اسکن می‌کنه و یه proof-manifest.json می‌سازه شامل:
 * اسم پوشه (slug کسب‌وکار)، مسیر پوشه مدارک، و لیست فایل‌های داخلش.
 *
 * اجرا:
 *   node scripts/scan-proof.js
 *
 * این اسکریپت به‌صورت خودکار هم در GitHub Action (.github/workflows/update-manifest.yml)
 * روی هر push به proof/ اجرا می‌شود.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PROOF_DIR = path.join(ROOT, 'proof');
const OUTPUT_FILE = path.join(ROOT, 'proof-manifest.json');

// پوشه‌ها/فایل‌هایی که نباید به‌عنوان یک "پرونده" حساب بشن
const IGNORE = new Set(['_example-business']);
const IGNORE_FILES = new Set(['README.md', '.gitkeep', '.DS_Store']);

function slugToName(slug) {
  return slug
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function scan() {
  if (!fs.existsSync(PROOF_DIR)) {
    console.error('پوشه proof/ پیدا نشد.');
    process.exit(1);
  }

  const folders = fs
    .readdirSync(PROOF_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && !IGNORE.has(d.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const manifest = folders.map(dir => {
    const slug = dir.name;
    const folderPath = path.join(PROOF_DIR, slug);

    const files = fs
      .readdirSync(folderPath, { withFileTypes: true })
      .filter(f => f.isFile() && !IGNORE_FILES.has(f.name) && !f.name.startsWith('.'))
      .map(f => f.name)
      .sort();

    return {
      slug,
      name: slugToName(slug),
      path: `proof/${slug}`,
      fileCount: files.length,
      files
    };
  });

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`✓ ${manifest.length} پوشه‌ی مدرک پیدا شد → proof-manifest.json به‌روزرسانی شد.`);

  const orphans = manifest.filter(m => !fs.existsSync(path.join(ROOT, 'entries', `${m.slug}.md`)));
  if (orphans.length) {
    console.log(`\n⚠ ${orphans.length} پوشه‌ی مدرک بدون فایل entry متناظر:`);
    orphans.forEach(o => console.log(`  - proof/${o.slug}  (نیاز به entries/${o.slug}.md)`));
  }
}

scan();

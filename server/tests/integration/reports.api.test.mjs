import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const createdIds = [];
let tempFiles = [];

async function req(method, p, { json, form, headers = {}, expectJson = true } = {}) {
  const init = { method, headers: { ...headers } };
  if (json !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(json);
  } else if (form) {
    init.body = form;
  }
  const res = await fetch(`${BASE}${p}`, init);
  const text = await res.text();
  let body = text;
  if (expectJson) {
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = text;
    }
  }
  return { status: res.status, body, text, headers: res.headers };
}

function validPayload(overrides = {}) {
  return {
    title: 'خرابی پمپ اسکله',
    description: 'نشتی روغن مشاهده شد و نیاز به بررسی دارد.',
    location: 'اسکله شماره ۱',
    priority: 'normal',
    ...overrides
  };
}

function makeImageFile(name, type, sizeBytes, contentByte = 0x41) {
  const buf = Buffer.alloc(sizeBytes, contentByte);
  if (sizeBytes >= 8) {
    if (type === 'image/png') {
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(buf, 0);
    } else if (type === 'image/jpeg') {
      Buffer.from([0xff, 0xd8, 0xff, 0xe0]).copy(buf, 0);
    } else if (type === 'image/gif' && sizeBytes >= 6) {
      Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]).copy(buf, 0);
    } else if (type === 'image/webp' && sizeBytes >= 12) {
      Buffer.from([0x52, 0x49, 0x46, 0x46]).copy(buf, 0);
      Buffer.from([0x57, 0x45, 0x42, 0x50]).copy(buf, 8);
    }
  }
  const tmp = path.join(os.tmpdir(), `kilo-${Date.now()}-${Math.random().toString(16).slice(2)}-${name}`);
  fs.writeFileSync(tmp, buf);
  tempFiles.push(tmp);
  return { path: tmp, type, name };
}

before(async () => {
  // quick reachability
  const h = await req('GET', '/health');
  assert.equal(h.status, 200, `health not reachable: ${h.status} ${h.text}`);
});

after(async () => {
  for (const id of createdIds.splice(0)) {
    await req('DELETE', `/api/reports/${id}`).catch(() => {});
  }
  for (const f of tempFiles.splice(0)) {
    try { fs.unlinkSync(f); } catch {}
  }
});

test('health returns ok', async () => {
  const r = await req('GET', '/health');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body, { status: 'ok' });
});

test('GET /api/reports returns array (real DB)', async () => {
  const r = await req('GET', '/api/reports');
  assert.equal(r.status, 200);
  assert.ok(Array.isArray(r.body), 'response must be an array');
});

test('POST /api/reports success (multipart, no image)', async () => {
  const fd = new FormData();
  const p = validPayload();
  for (const [k, v] of Object.entries(p)) fd.set(k, v);
  const r = await req('POST', '/api/reports', { form: fd });
  assert.equal(r.status, 201, r.text);
  assert.ok(r.body?.id);
  assert.ok(/^PORT-\d{6}-\d{2}$/.test(r.body.trackingCode), `trackingCode: ${r.body.trackingCode}`);
  assert.equal(r.body.title, p.title);
  assert.equal(r.body.status, 'در انتظار بررسی فنی');
  assert.equal(r.body.priority, 'normal');
  assert.equal(r.body.imageDataUrl, null);
  createdIds.push(r.body.id);
});

test('POST /api/reports maps medium -> warning', async () => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(validPayload({ priority: 'medium' }))) fd.set(k, v);
  const r = await req('POST', '/api/reports', { form: fd });
  assert.equal(r.status, 201, r.text);
  assert.equal(r.body.priority, 'warning');
  createdIds.push(r.body.id);
});

test('POST /api/reports success with image (PNG)', async () => {
  const img = makeImageFile('ok.png', 'image/png', 1024);
  const fd = new FormData();
  for (const [k, v] of Object.entries(validPayload({ title: 'خرابی با تصویر' }))) fd.set(k, v);
  fd.set('image', new Blob([fs.readFileSync(img.path)], { type: 'image/png' }), 'ok.png');
  const r = await req('POST', '/api/reports', { form: fd });
  assert.equal(r.status, 201, r.text);
  assert.equal(r.body.imageName, 'ok.png');
  assert.ok(
    r.body.imageDataUrl != null && String(r.body.imageDataUrl).includes('/uploads/'),
    `imageDataUrl must be a web path: ${r.body.imageDataUrl}`
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(r.body, 'imagePath'),
    false,
    'imagePath must not be exposed in API response'
  );
  createdIds.push(r.body.id);
});

test('POST /api/reports success with JPEG image', async () => {
  const img = makeImageFile('ok.jpg', 'image/jpeg', 512);
  const fd = new FormData();
  for (const [k, v] of Object.entries(validPayload({ title: 'خرابی با تصویر JPEG' }))) fd.set(k, v);
  fd.set('image', new Blob([fs.readFileSync(img.path)], { type: 'image/jpeg' }), 'ok.jpg');
  const r = await req('POST', '/api/reports', { form: fd });
  assert.equal(r.status, 201, r.text);
  assert.equal(r.body.imageName, 'ok.jpg');
  assert.equal(r.body.imageMimeType, 'image/jpeg');
  createdIds.push(r.body.id);
});

test('GET /api/reports/:id success', async () => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(validPayload())) fd.set(k, v);
  const c = await req('POST', '/api/reports', { form: fd });
  createdIds.push(c.body.id);
  const r = await req('GET', `/api/reports/${c.body.id}`);
  assert.equal(r.status, 200, r.text);
  assert.equal(r.body.id, c.body.id);
});

test('PATCH /api/reports/:id/status success', async () => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(validPayload())) fd.set(k, v);
  const c = await req('POST', '/api/reports', { form: fd });
  createdIds.push(c.body.id);
  const r = await req('PATCH', `/api/reports/${c.body.id}/status`, { json: { status: 'در حال تعمیر' } });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.body.status, 'در حال تعمیر');
});

test('DELETE /api/reports/:id success then 404', async () => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(validPayload())) fd.set(k, v);
  const c = await req('POST', '/api/reports', { form: fd });
  const id = c.body.id;
  const d = await req('DELETE', `/api/reports/${id}`);
  assert.equal(d.status, 200, d.text);
  assert.equal(d.body.id, id);
  const g = await req('GET', `/api/reports/${id}`);
  assert.equal(g.status, 404, g.text);
});

// --- Error scenarios ---
test('POST invalid: missing required fields -> 400', async () => {
  const fd = new FormData();
  fd.set('title', ''); // invalid
  fd.set('description', 'x');
  fd.set('location', 'اسکله شماره ۱');
  fd.set('priority', 'normal');
  const r = await req('POST', '/api/reports', { form: fd });
  assert.equal(r.status, 400, r.text);
  assert.ok(r.body?.message);
});

test('POST invalid: bad location -> 400', async () => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(validPayload({ location: 'محل نامعتبر' }))) fd.set(k, v);
  const r = await req('POST', '/api/reports', { form: fd });
  assert.equal(r.status, 400, r.text);
});

test('POST invalid: bad priority -> 400', async () => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(validPayload({ priority: 'urgent' }))) fd.set(k, v);
  const r = await req('POST', '/api/reports', { form: fd });
  assert.equal(r.status, 400, r.text);
});

test('POST invalid image type -> 415', async () => {
  const img = makeImageFile('bad.txt', 'text/plain', 100);
  const fd = new FormData();
  for (const [k, v] of Object.entries(validPayload())) fd.set(k, v);
  fd.set('image', new Blob([fs.readFileSync(img.path)], { type: 'text/plain' }), 'bad.txt');
  const r = await req('POST', '/api/reports', { form: fd });
  assert.equal(r.status, 415, r.text);
});

test('POST non-image with spoofed image/png MIME -> 415', async () => {
  // Real content is plain text, but client declares image/png.
  const img = makeImageFile('spoof.png', 'text/plain', 256);
  const fd = new FormData();
  for (const [k, v] of Object.entries(validPayload({ title: 'MIME جعلی' }))) fd.set(k, v);
  fd.set('image', new Blob([fs.readFileSync(img.path)], { type: 'image/png' }), 'spoof.png');
  const r = await req('POST', '/api/reports', { form: fd });
  assert.equal(r.status, 415, r.text);
  assert.equal(r.body?.message?.includes('محتوای فایل تصویر معتبر نیست') || r.body?.message?.includes('فرمت'), true, r.text);
});

test('POST image over 2MB -> 413', async () => {
  const big = makeImageFile('big.png', 'image/png', 2 * 1024 * 1024 + 1024);
  const fd = new FormData();
  for (const [k, v] of Object.entries(validPayload())) fd.set(k, v);
  fd.set('image', new Blob([fs.readFileSync(big.path)], { type: 'image/png' }), 'big.png');
  const r = await req('POST', '/api/reports', { form: fd });
  assert.equal(r.status, 413, r.text);
});

test('GET unknown id -> 404', async () => {
  const r = await req('GET', '/api/reports/00000000-0000-4000-8000-000000000000');
  assert.equal(r.status, 404, r.text);
});

test('GET invalid uuid -> 400', async () => {
  const r = await req('GET', '/api/reports/not-a-uuid');
  assert.equal(r.status, 400, r.text);
});

test('PATCH invalid status -> 400', async () => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(validPayload())) fd.set(k, v);
  const c = await req('POST', '/api/reports', { form: fd });
  createdIds.push(c.body.id);
  const r = await req('PATCH', `/api/reports/${c.body.id}/status`, { json: { status: 'نامعتبر' } });
  assert.equal(r.status, 400, r.text);
});

test('PATCH unknown id -> 404', async () => {
  const r = await req('PATCH', '/api/reports/00000000-0000-4000-8000-000000000000/status', {
    json: { status: 'در حال تعمیر' }
  });
  assert.equal(r.status, 404, r.text);
});

test('DELETE unknown id -> 404', async () => {
  const r = await req('DELETE', '/api/reports/00000000-0000-4000-8000-000000000000');
  assert.equal(r.status, 404, r.text);
});

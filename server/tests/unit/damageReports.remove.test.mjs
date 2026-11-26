import test, { mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';

// Provide minimal env required by config/env.js before importing service modules.
process.env.DATABASE_URL ||= 'postgresql://example.invalid/db?schema=public';

const fileStorage = await import('../../src/services/fileStorage.service.js');
const service = await import('../../src/services/damageReports.service.js');

function makeRow(overrides = {}) {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    trackingCode: 'PORT-000001-10',
    title: 't',
    description: 'd',
    location: 'اسکله شماره ۱',
    priority: 'normal',
    status: 'PENDING_TECH_REVIEW',
    imageName: null,
    imagePath: null,
    imageMimeType: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides
  };
}

afterEach(() => {
  service._resetTestDeps();
  mock.restoreAll();
});

test('deleteFileIfExists path guard: does not delete file outside upload dir', async () => {
  const tmp = path.join(os.tmpdir(), `kilo-outside-${crypto.randomUUID()}.txt`);
  await fs.writeFile(tmp, 'x');
  try {
    const res = await fileStorage.deleteFileIfExists(tmp);
    assert.equal(res.deleted, false);
    assert.equal(res.reason, 'outside_upload_dir');
    const still = await fs.stat(tmp);
    assert.ok(still.isFile());
  } finally {
    await fs.unlink(tmp).catch(() => {});
  }
});

test('removeReport: report without image deletes DB record', async () => {
  const deletedIds = [];
  service._setTestDeps({
    models: {
      deleteReportById: async (id) => {
        deletedIds.push(id);
        return makeRow({ id, imagePath: null });
      }
    },
    fileStorage
  });
  const res = await service.removeReport('22222222-2222-4222-8222-222222222222');
  assert.deepEqual(res, { id: '22222222-2222-4222-8222-222222222222', fileDeleted: true });
  assert.deepEqual(deletedIds, ['22222222-2222-4222-8222-222222222222']);
});

test('removeReport: report with image deletes DB record and file', async () => {
  const uploadDir = fileStorage.getUploadDir();
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, `kilo-unit-${crypto.randomUUID()}.png`);
  await fs.writeFile(filePath, Buffer.from([137, 80, 78, 71]));
  const id = '33333333-3333-4333-8333-333333333333';
  service._setTestDeps({
    models: { deleteReportById: async () => makeRow({ id, imagePath: filePath }) },
    fileStorage
  });
  const errors = [];
  const errMock = mock.method(console, 'error', (...args) => errors.push(args));
  try {
    const res = await service.removeReport(id);
    assert.deepEqual(res, { id, fileDeleted: true });
    await assert.rejects(() => fs.stat(filePath), /ENOENT/);
    assert.equal(errors.length, 0);
  } finally {
    errMock.mock.restore();
    await fs.unlink(filePath).catch(() => {});
  }
});

test('removeReport: DB deleted but file delete fails -> controlled response, error logged, no other reports touched', async () => {
  const uploadDir = fileStorage.getUploadDir();
  await fs.mkdir(uploadDir, { recursive: true });
  const filePath = path.join(uploadDir, `kilo-unit-fail-${crypto.randomUUID()}.png`);
  await fs.writeFile(filePath, Buffer.from([137, 80, 78, 71]));
  const id = '44444444-4444-4444-8444-444444444444';
  const otherId = '55555555-5555-4555-8555-555555555555';
  const deletedIds = [];
  service._setTestDeps({
    models: {
      deleteReportById: async (requestedId) => {
        deletedIds.push(requestedId);
        return makeRow({ id: requestedId, imagePath: filePath });
      }
    },
    fileStorage
  });
  const restoreUnlink = mock.method(fs, 'unlink', async () => {
    const e = new Error('mock permission denied');
    e.code = 'EPERM';
    throw e;
  });
  const errors = [];
  const errMock = mock.method(console, 'error', (...args) => errors.push(args));
  try {
    const res = await service.removeReport(id);
    // DB deletion succeeded; response must reflect real record state (not 500)
    assert.deepEqual(res, { id, fileDeleted: false });
    assert.deepEqual(deletedIds, [id], 'only requested report id must be deleted');
    assert.ok(!deletedIds.includes(otherId));
    const still = await fs.stat(filePath);
    assert.ok(still.isFile(), 'mocked file must remain; no real/existing files touched');
    const logged = errors.some((a) => JSON.stringify(a).includes('image file cleanup failed'));
    assert.ok(logged, 'internal error should be logged');
  } finally {
    errMock.mock.restore();
    restoreUnlink.mock.restore();
    await fs.unlink(filePath).catch(() => {});
  }
});


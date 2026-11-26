import test, { mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  ReportsApiError,
  getReports,
  getReportById,
  createReport,
  updateReportStatus,
  deleteReport,
} from '../reportsApi.js';

const originalFetch = globalThis.fetch;

function jsonResponse(body, { status = 200, ok = status >= 200 && status < 300, contentType = 'application/json' } = {}) {
  return {
    ok,
    status,
    headers: {
      get(name) {
        return name.toLowerCase() === 'content-type' ? contentType : null;
      },
    },
    async json() {
      return body;
    },
    async text() {
      return typeof body === 'string' ? body : JSON.stringify(body);
    },
  };
}

afterEach(() => {
  mock.restoreAll();
  globalThis.fetch = originalFetch;
});

test('getReports sends GET /api/reports with no params', async () => {
  const payload = [{ id: '1', trackingCode: 'PORT-000001-01' }];
  const fetchMock = mock.fn(async () => jsonResponse(payload));
  globalThis.fetch = fetchMock;

  const result = await getReports();

  assert.deepEqual(result, payload);
  assert.equal(fetchMock.mock.callCount(), 1);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, '/api/reports');
  assert.equal(options.method, 'GET');
});

test('getReports builds query string and skips empty params', async () => {
  const fetchMock = mock.fn(async () => jsonResponse([]));
  globalThis.fetch = fetchMock;

  await getReports({ status: 'در حال تعمیر', priority: 'warning', search: '', location: null, trackingCode: undefined });

  const [url, options] = fetchMock.mock.calls[0].arguments;
  const parsed = new URL(url, 'http://example.test');
  assert.equal(parsed.pathname, '/api/reports');
  assert.equal(parsed.searchParams.get('status'), 'در حال تعمیر');
  assert.equal(parsed.searchParams.get('priority'), 'warning');
  assert.equal(parsed.searchParams.has('search'), false);
  assert.equal(parsed.searchParams.has('location'), false);
  assert.equal(parsed.searchParams.has('trackingCode'), false);
  assert.equal(options.method, 'GET');
});

test('getReportById sends GET /api/reports/:id with encoded id', async () => {
  const payload = { id: 'abc/123', trackingCode: 'PORT-000002-02' };
  const fetchMock = mock.fn(async () => jsonResponse(payload));
  globalThis.fetch = fetchMock;

  const result = await getReportById('abc/123');

  assert.deepEqual(result, payload);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, '/api/reports/abc%2F123');
  assert.equal(options.method, 'GET');
});

test('createReport sends POST with FormData body and no manual Content-Type', async () => {
  const payload = { id: 'new-id', trackingCode: 'PORT-000003-03' };
  const fetchMock = mock.fn(async () => jsonResponse(payload, { status: 201 }));
  globalThis.fetch = fetchMock;
  const fd = new FormData();
  fd.set('title', 't');
  fd.set('description', 'd');
  fd.set('location', 'اسکله شماره ۱');
  fd.set('priority', 'normal');

  const result = await createReport(fd);

  assert.deepEqual(result, payload);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, '/api/reports');
  assert.equal(options.method, 'POST');
  assert.equal(options.body, fd);
  assert.equal(options.headers, undefined);
});

test('updateReportStatus sends PATCH with JSON body and correct URL', async () => {
  const payload = { id: 'u1', status: 'در حال تعمیر' };
  const fetchMock = mock.fn(async () => jsonResponse(payload));
  globalThis.fetch = fetchMock;

  const result = await updateReportStatus('u1', 'در حال تعمیر');

  assert.deepEqual(result, payload);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, '/api/reports/u1/status');
  assert.equal(options.method, 'PATCH');
  assert.deepEqual(options.headers, { 'Content-Type': 'application/json' });
  assert.equal(options.body, JSON.stringify({ status: 'در حال تعمیر' }));
});

test('deleteReport sends DELETE to correct URL', async () => {
  const payload = { id: 'd1', fileDeleted: true };
  const fetchMock = mock.fn(async () => jsonResponse(payload));
  globalThis.fetch = fetchMock;

  const result = await deleteReport('d1');

  assert.deepEqual(result, payload);
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url, '/api/reports/d1');
  assert.equal(options.method, 'DELETE');
});

test('HTTP error throws ReportsApiError with message, status, and errors', async () => {
  const fetchMock = mock.fn(async () =>
    jsonResponse({ message: 'داده نامعتبر', errors: [{ path: 'title', message: 'الزامی' }] }, { status: 400 })
  );
  globalThis.fetch = fetchMock;

  await assert.rejects(
    () => createReport(new FormData()),
    (err) => {
      assert.ok(err instanceof ReportsApiError);
      assert.equal(err.name, 'ReportsApiError');
      assert.equal(err.message, 'داده نامعتبر');
      assert.equal(err.status, 400);
      assert.deepEqual(err.errors, [{ path: 'title', message: 'الزامی' }]);
      assert.deepEqual(err.data, { message: 'داده نامعتبر', errors: [{ path: 'title', message: 'الزامی' }] });
      return true;
    }
  );
});

test('HTTP error without JSON message uses fallback message', async () => {
  const fetchMock = mock.fn(async () => ({
    ok: false,
    status: 500,
    headers: { get: () => 'text/plain' },
    async json() { throw new Error('not json'); },
    async text() { return ''; },
  }));
  globalThis.fetch = fetchMock;

  await assert.rejects(
    () => getReports(),
    (err) => {
      assert.ok(err instanceof ReportsApiError);
      assert.equal(err.message, 'خطا (500)');
      assert.equal(err.status, 500);
      return true;
    }
  );
});

test('network error throws ReportsApiError with status null and data.cause', async () => {
  const fetchMock = mock.fn(async () => {
    throw new TypeError('fetch failed');
  });
  globalThis.fetch = fetchMock;

  await assert.rejects(
    () => deleteReport('x'),
    (err) => {
      assert.ok(err instanceof ReportsApiError);
      assert.equal(err.message, 'عدم دسترسی به سرور');
      assert.equal(err.status, null);
      assert.equal(err.errors, undefined);
      assert.equal(err.data?.cause, 'fetch failed');
      return true;
    }
  );
  // DELETE was attempted via mocked fetch only (no real network).
  assert.equal(fetchMock.mock.callCount(), 1);
});

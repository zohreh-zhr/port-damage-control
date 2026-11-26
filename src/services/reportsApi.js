const API_BASE = '/api/reports';

export class ReportsApiError extends Error {
  constructor(message, { status, errors, data } = {}) {
    super(message || 'خطای ناشناخته در ارتباط با سرور');
    this.name = 'ReportsApiError';
    this.status = status ?? null;
    this.errors = errors;
    this.data = data;
  }
}

async function parseBody(response) {
  const contentType = response.headers?.get?.('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  try {
    const text = await response.text();
    return text ? { message: text } : null;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch (error) {
    throw new ReportsApiError('عدم دسترسی به سرور', {
      status: null,
      errors: undefined,
      data: { cause: error?.message },
    });
  }

  const data = await parseBody(response);

  if (!response.ok) {
    const message = data?.message || `خطا (${response.status})`;
    throw new ReportsApiError(message, {
      status: response.status,
      errors: data?.errors,
      data,
    });
  }

  return data;
}

export async function getReports(params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return request(qs ? `?${qs}` : '', { method: 'GET' });
}

export async function getReportById(id) {
  return request(`/${encodeURIComponent(id)}`, { method: 'GET' });
}

export async function createReport(formData) {
  // Content-Type is intentionally omitted so the browser sets multipart boundary.
  return request('', {
    method: 'POST',
    body: formData,
  });
}

export async function updateReportStatus(id, status) {
  return request(`/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
}

export async function deleteReport(id) {
  return request(`/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

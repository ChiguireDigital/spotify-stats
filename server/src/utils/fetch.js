import https from 'node:https';
import http from 'node:http';

export async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const target = new URL(url);
  const transport = target.protocol === 'http:' ? http : https;
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };
  let body = options.body;
  if (body && typeof body !== 'string' && !(body instanceof Uint8Array)) body = String(body);
  if (body && !headers['Content-Length'] && !headers['content-length']) headers['Content-Length'] = Buffer.byteLength(body);

  return new Promise((resolve, reject) => {
    const req = transport.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (target.protocol === 'http:' ? 80 : 443),
        path: `${target.pathname}${target.search}`,
        method,
        headers,
        family: 4,
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const text = buffer.toString('utf8');
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode || 0,
            headers: res.headers,
            buffer,
            async arrayBuffer() { return buffer; },
            async json() { try { return text ? JSON.parse(text) : {}; } catch { return {}; } },
            async text() { return text; },
          });
        });
      },
    );
    req.on('timeout', () => req.destroy(new Error(`Timeout conectando a ${url}`)));
    req.on('error', (error) => {
      if (error?.code === 'ETIMEDOUT' || /Timeout/i.test(error?.message || '')) {
        const e = new Error(`Timeout conectando a ${url}`); e.code = 'FETCH_TIMEOUT'; reject(e); return;
      }
      reject(error);
    });
    if (body) req.write(body);
    req.end();
  });
}

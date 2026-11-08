import { fetchWithTimeout } from '../utils/fetch.js';
import { config } from '../config/env.js';

function extractText(payload) {
  if (!payload || typeof payload !== 'object') return '';
  if (typeof payload.output_text === 'string' && payload.output_text) return payload.output_text;
  const candidates = [];
  const collect = (node) => {
    if (!node) return;
    if (Array.isArray(node)) { node.forEach(collect); return; }
    if (typeof node === 'object') {
      if (node.type === 'text' && typeof node.text === 'string') candidates.push(node.text);
      if (typeof node.output_text === 'string') candidates.push(node.output_text);
      collect(node.content); collect(node.outputs); collect(node.output); collect(node.steps); collect(node.delta);
    }
  };
  collect(payload.outputs || payload.output || payload.steps || payload.content);
  return candidates.join('').trim();
}

export async function generateChatReply({ systemInstruction, userMessage, history = [], context }) {
  const apiKey = config.gemini.apiKey;
  const model = config.gemini.model || 'gemini-3.5-flash-lite';
  if (!apiKey) {
    return 'El chatbot no está configurado todavía. Añade `GEMINI_API_KEY` en el archivo `.env` del backend y reinicia el servidor.';
  }

  const historyText = history.length
    ? '\nConversación reciente:\n' + history.map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`).join('\n')
    : '';
  const input = `Información disponible sobre este usuario:\n${context || 'Aún no hay datos suficientes.'}${historyText}\n\nPregunta del usuario: ${userMessage}`;

  let response;
  try {
    response = await fetchWithTimeout('https://generativelanguage.googleapis.com/v1beta/interactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
        'Api-Revision': '2026-05-20',
      },
      body: JSON.stringify({
        model,
        system_instruction: systemInstruction,
        input,
        store: false,
        generation_config: { max_output_tokens: 700 },
      }),
    }, 30000);
  } catch (error) {
    if (error?.code === 'FETCH_TIMEOUT' || /Timeout|ETIMEDOUT|UND_ERR_CONNECT_TIMEOUT/i.test(error?.message || '') || error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      throw new Error('No pude conectarme con el servicio de IA en este momento. Revisa tu conexión/VPN/firewall e inténtalo otra vez.');
    }
    throw error;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const msg = payload?.error?.message || payload?.message || `Gemini respondió con estado ${response.status}.`;
    if (response.status === 429) throw new Error('Límite de uso de Gemini alcanzado. Espera un momento (RPM) o hasta el reinicio diario (medianoche PT).');
    throw new Error(msg);
  }
  const text = extractText(payload);
  return text || 'No pude generar una respuesta con los datos disponibles.';
}

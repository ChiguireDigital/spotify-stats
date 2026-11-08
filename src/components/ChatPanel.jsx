import { useEffect, useRef, useState } from 'react';
import { createAppSocket } from '../api/socket';

export default function ChatPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [status, setStatus] = useState('connecting');
  const [error, setError] = useState('');
  const socketRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    const socket = createAppSocket();
    socketRef.current = socket;
    socket.on('connect', () => {
      setStatus('connected');
      setError('');
      socket.emit('chat:history', {}, (res) => {
        if (res?.ok && Array.isArray(res.messages)) setMessages(res.messages.map((m) => ({ role: m.role, content: m.content })));
      });
    });
    socket.on('connect_error', (e) => {
      setStatus('error');
      setError(e?.message === 'unauthorized' ? 'Inicia sesión para usar el chat.' : 'No se pudo conectar al chat.');
    });
    socket.on('chat:typing', ({ typing: t }) => setTyping(Boolean(t)));
    socket.on('chat:reply', ({ reply }) => { if (reply) setMessages((m) => [...m, { role: 'assistant', content: reply }]); });
    socket.on('chat:error', ({ error: err }) => { setError(err || 'Error en el chat.'); setMessages((m) => [...m, { role: 'assistant', content: `Error: ${err || 'No se pudo responder.'}` }]); });
    socket.on('disconnect', () => setStatus('disconnected'));
    return () => socket.disconnect();
  }, []);

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, [messages, typing, open]);

  const send = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !socketRef.current || status !== 'connected' || typing) return;
    setError('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    setInput('');
    socketRef.current.emit('chat:message', { message: text });
  };

  return (
    <div className={`chat-shell ${open ? 'is-open' : ''}`}>
      <div className="chat-panel" role={open ? 'dialog' : undefined} aria-label="Chat de estadísticas">
        <button type="button" className="chat-toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          <span className="chat-toggle-title">{open ? 'Chat' : 'Pregúntale a tus datos'}</span>
          <span className={`chat-status ${status === 'connected' ? 'is-live' : ''}`} aria-label={status === 'connected' ? 'conectado' : status} />
        </button>
        {open && (
          <>
            <div ref={listRef} className="chat-messages">
              {!messages.length && (
                <p className="chat-hint">Pregúntame por tus artistas, canciones o lo que estás escuchando. Respondo con tus datos guardados.</p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`chat-bubble ${m.role === 'user' ? 'is-user' : 'is-assistant'}`}>
                  {m.content}
                </div>
              ))}
              {typing && <div className="chat-typing">Escribiendo…</div>}
            </div>
            {error && <div className="chat-error" role="status">{error}</div>}
            <form onSubmit={send} className="chat-form">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={status === 'connected' ? 'Ej: “¿Qué estoy escuchando?”' : 'Conectando…'}
                disabled={status !== 'connected' || typing}
                aria-label="Mensaje"
              />
              <button type="submit" disabled={status !== 'connected' || typing || !input.trim()}>Enviar</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

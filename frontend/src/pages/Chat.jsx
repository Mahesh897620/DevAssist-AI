import { useState, useRef, useEffect, useCallback } from 'react';
import { postChat } from '../api';
import Spinner from '../components/ui/Spinner';

// ---------------------------------------------------------------------------
// Lightweight markdown → HTML (handles bold, inline code, code blocks, lists)
// ---------------------------------------------------------------------------
function renderMarkdown(text) {
  if (!text) return '';
  let html = text
    // code blocks
    .replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
      `<pre><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;').trim()}</code></pre>`)
    // inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // bullet lists
    .replace(/^[ \t]*[-*][ \t]+(.+)$/gm, '<li>$1</li>')
    // numbered lists
    .replace(/^[ \t]*\d+\.[ \t]+(.+)$/gm, '<li>$1</li>')
    // wrap consecutive <li> in <ul>
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    // paragraphs (double newline)
    .replace(/\n\n/g, '</p><p>')
    // single newlines
    .replace(/\n/g, '<br/>');
  return `<p>${html}</p>`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex items-end gap-2">
        <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-sm shrink-0">
          🤖
        </div>
        <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-1.5">
          {[0, 150, 300].map((delay) => (
            <span
              key={delay}
              className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function AssistantMeta({ meta }) {
  if (!meta) return null;
  const { model, tokens, cost, latency } = meta;
  const items = [
    model   && { icon: '🧠', label: model },
    tokens  && { icon: '🔢', label: `${Number(tokens).toLocaleString()} tok` },
    cost    && { icon: '💲', label: `$${Number(cost).toFixed(4)}` },
    latency && { icon: '⚡', label: `${latency}ms` },
  ].filter(Boolean);
  if (!items.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5 ml-9">
      {items.map(({ icon, label }) => (
        <span
          key={label}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
            bg-gray-100 text-gray-500 text-[10px] font-medium"
        >
          {icon} {label}
        </span>
      ))}
    </div>
  );
}

function ErrorBubble({ text }) {
  return (
    <div className="flex justify-start">
      <div className="max-w-md px-4 py-3 rounded-2xl rounded-bl-none
        bg-red-50 border border-red-200 text-red-600 text-sm leading-relaxed">
        ⚠️ {text}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const INITIAL_MESSAGES = [
  { id: 0, role: 'assistant', text: 'Hello! How can I help you today?', meta: null },
];

let _msgId = 1; // module-level counter — stable across re-renders

export default function Chat() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);

  const listRef  = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, loading, scrollToBottom]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { id: _msgId++, role: 'user', text }]);
    setInput('');
    setLoading(true);

    const startTs = Date.now();
    const result  = await postChat(text);
    const latency = Date.now() - startTs;

    setLoading(false);

    if (result.error) {
      setMessages((prev) => [...prev, { id: _msgId++, role: 'error', text: result.error }]);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: _msgId++,
        role: 'assistant',
        text: result.reply ?? JSON.stringify(result),
        meta: {
          model:   result.model   ?? null,
          tokens:  result.tokens  ?? null,
          cost:    result.cost    ?? null,
          latency,
        },
      },
    ]);
    inputRef.current?.focus();
  }, [input, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div className="flex flex-col h-full p-6 gap-4 bg-gray-50">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Chat</h1>
        <p className="text-sm text-gray-500 mt-1">
          Conversations are powered by your backend at{' '}
          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
            {import.meta.env.VITE_API_URL || 'VITE_API_URL not set'}
          </code>
        </p>
      </div>

      {/* ── Message list ────────────────────────────────────────── */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto rounded-2xl bg-white border border-gray-100
          shadow-sm p-5 space-y-5 scroll-smooth"
      >
        {messages.map((m) => {
          if (m.role === 'error') return <ErrorBubble key={m.id} text={m.text} />;
          if (m.role === 'user') return (
            <div key={m.id} className="flex justify-end">
              <div className="max-w-lg px-4 py-3 rounded-2xl rounded-br-none
                bg-indigo-600 text-white text-sm leading-relaxed shadow-sm">
                {m.text}
              </div>
            </div>
          );
          return (
            <div key={m.id} className="flex flex-col">
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-sm shrink-0">
                  🤖
                </div>
                <div
                  className="max-w-lg px-4 py-3 rounded-2xl rounded-bl-none
                    bg-white border border-gray-100 shadow-sm text-gray-800 text-sm leading-relaxed
                    prose-chat"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(m.text) }}
                />
              </div>
              <AssistantMeta meta={m.meta} />
            </div>
          );
        })}
        {loading && <TypingIndicator />}
      </div>

      {/* ── Input bar ───────────────────────────────────────────── */}
      <div className="shrink-0 flex gap-3 items-end">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
          rows={1}
          disabled={loading}
          className="flex-1 resize-none border border-gray-200 rounded-xl px-4 py-3
            text-sm leading-relaxed bg-white shadow-sm
            focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed transition-shadow"
          style={{ minHeight: '48px', maxHeight: '160px', overflowY: 'auto' }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="h-12 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800
            text-white text-sm font-semibold shadow-sm
            disabled:opacity-40 disabled:cursor-not-allowed
            flex items-center gap-2 transition-colors"
        >
          {loading ? (
            <><Spinner size="sm" color="text-white" /> Sending</>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M6 12L3.27 3.125A60.01 60.01 0 0121 12a60.01 60.01 0 01-17.73 8.875L6 12zm0 0h7.5" />
              </svg>
              Send
            </>
          )}
        </button>
      </div>
    </div>
  );
}

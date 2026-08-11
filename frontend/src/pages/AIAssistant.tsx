import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { apiClient } from '../api/client';

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const SUGGESTIONS = [
  'What follow-ups are due today?',
  'Pending payers for [practice name]',
  'Status for [provider name] payer [payer name]',
];

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: "Ask me about a provider's payer status, a practice's pending applications, or today's follow-ups." },
  ]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (question: string) => {
    if (!question.trim() || isThinking) return;
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setInput('');
    setIsThinking(true);
    try {
      const res = await apiClient.post('/ai/query', { question });
      setMessages((prev) => [...prev, { role: 'assistant', text: res.data.answer }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', text: 'Something went wrong reaching the assistant. Try again.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="ai-shell" style={{ display: 'flex', flexDirection: 'column' }}>
      <h1 style={{ fontSize: 'var(--fs-page-title)', margin: '0 0 6px' }}>AI assistant</h1>
      <p style={{ fontSize: 'var(--fs-body)', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
        Grounded in your own data — it only answers from what's actually in the portal.
      </p>

      <div className="surface-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.map((m, i) => (
            <div
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '75%',
                background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-surface-2)',
                color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                borderRadius: 14,
                padding: '10px 16px',
                fontSize: 14.5,
                lineHeight: 1.5,
              }}
            >
              {m.text}
            </div>
          ))}
          {isThinking && (
            <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)', fontSize: 13.5 }}>
              <Sparkles size={14} /> Thinking…
            </div>
          )}
        </div>

        {messages.length === 1 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '0 24px 16px' }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                style={{
                  fontSize: 12.5, padding: '7px 12px', borderRadius: 20, border: '1px solid var(--border-strong)',
                  background: 'var(--bg-surface)', color: 'var(--text-secondary)', cursor: 'pointer',
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 10, padding: 16, borderTop: '1px solid var(--border)' }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question…"
            style={{
              flex: 1, padding: '11px 14px', fontSize: 14.5, border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius)', outline: 'none', fontFamily: 'var(--font-body)',
            }}
          />
          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px', border: 'none',
              borderRadius: 'var(--radius)', background: isThinking || !input.trim() ? 'var(--text-muted)' : 'var(--accent)',
              color: '#fff', fontWeight: 600, fontSize: 14, cursor: isThinking || !input.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            <Send size={15} /> Send
          </button>
        </form>
      </div>
    </div>
  );
}

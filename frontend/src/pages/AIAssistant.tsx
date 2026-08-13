import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { Sparkles, Send, Bot, UserRound, ArrowUpRight } from 'lucide-react';
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
    {
      role: 'assistant',
      text: "Ask me about a provider's payer status, a practice's pending applications, or today's follow-ups.",
    },
  ]);

  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, isThinking]);

  const send = async (question: string) => {
    if (!question.trim() || isThinking) return;

    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        text: question.trim(),
      },
    ]);

    setInput('');
    setIsThinking(true);

    try {
      const res = await apiClient.post('/ai/query', {
        question: question.trim(),
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.data.answer,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Something went wrong reaching the assistant. Try again.',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="ai-page">
      {/* Header */}
      <div className="ai-header">
        <div>
          <div className="ai-title-row">
            <div className="ai-title-icon">
              <Sparkles size={18} />
            </div>

            <h1>AI assistant</h1>
          </div>

          <p>
            Ask questions about your credentialing data and get answers
            grounded in the portal.
          </p>
        </div>

        <div className="ai-grounded-badge">
          <span className="ai-grounded-dot" />
          Grounded in portal data
        </div>
      </div>

      {/* Chat */}
      <div className="ai-chat-card">
        <div className="ai-chat-body" ref={scrollRef}>
          {messages.length === 1 && (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">
                <Sparkles size={22} />
              </div>

              <h2>How can I help?</h2>

              <p>
                I can look through your providers, practices, credentialing
                records, and follow-ups to answer questions.
              </p>
            </div>
          )}

          <div className="ai-messages">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`ai-message ${message.role === 'user'
                    ? 'ai-message-user'
                    : 'ai-message-assistant'
                  }`}
              >
                <div className="ai-message-avatar">
                  {message.role === 'user' ? (
                    <UserRound size={15} />
                  ) : (
                    <Sparkles size={15} />
                  )}
                </div>

                <div className="ai-message-content">
                  <span className="ai-message-label">
                    {message.role === 'user' ? 'You' : 'AI assistant'}
                  </span>

                  <div className="ai-message-bubble">
                    {message.text}
                  </div>
                </div>
              </div>
            ))}

            {isThinking && (
              <div className="ai-message ai-message-assistant">
                <div className="ai-message-avatar">
                  <Sparkles size={15} />
                </div>

                <div className="ai-message-content">
                  <span className="ai-message-label">AI assistant</span>

                  <div className="ai-thinking">
                    <span className="ai-thinking-icon">
                      <Sparkles size={13} />
                    </span>

                    <span>Thinking</span>

                    <span className="ai-thinking-dots">
                      <i />
                      <i />
                      <i />
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Suggestions */}
        {messages.length === 1 && !isThinking && (
          <div className="ai-suggestions">
            <div className="ai-suggestions-label">
              <span>Try asking</span>
            </div>

            <div className="ai-suggestion-list">
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => send(suggestion)}
                  className="ai-suggestion"
                >
                  <span>{suggestion}</span>
                  <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Composer */}
        <form className="ai-composer" onSubmit={handleSubmit}>
          <div className="ai-input-wrapper">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about providers, payers, practices, or follow-ups…"
              disabled={isThinking}
            />

            <span className="ai-input-hint">Enter ↵</span>
          </div>

          <button
            type="submit"
            disabled={isThinking || !input.trim()}
            className="ai-send-button"
          >
            <Send size={15} />
            <span>Send</span>
          </button>
        </form>

        <div className="ai-footer">
          <Bot size={13} />
          <span>
            Responses are generated only from data available in your portal.
          </span>
        </div>
      </div>
    </div>
  );
}
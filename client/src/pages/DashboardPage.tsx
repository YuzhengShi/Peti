import { useState, useEffect, useRef } from 'react';
import { DraggableWindow } from '../components/DraggableWindow';
import { usePetStream, PetState } from '../hooks/usePetStream';
import { useWeather } from '../hooks/useWeather';
import { getMyPet, Pet } from '../api/pets';
import { getMessages, Message } from '../api/messages';
import { MemoriesPage } from './MemoriesPage';

export function DashboardPage() {
  const { sentences, proactiveMessage, petState, status, errorMessage, send } = usePetStream();
  const { weather } = useWeather();
  const [pet, setPet] = useState<Pet | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loadingPet, setLoadingPet] = useState(true);
  const [showMemories, setShowMemories] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const [petData, msgData] = await Promise.all([
          getMyPet().catch(() => null),
          getMessages(1, 50).catch(() => ({ data: [] as Message[], pagination: { page: 1, pageSize: 50, total: 0, totalPages: 0 } })),
        ]);
        if (petData) setPet(petData);
        setMessages(msgData.data);
      } finally {
        setLoadingPet(false);
      }
    })();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sentences]);

  // Build display messages: history + current streaming
  const currentResponse = sentences.join(' ');

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || status === 'streaming') return;

    // Add user message to display
    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      userId: '',
      role: 'user',
      content: msg,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    await send(msg);
  }

  // After stream completes, add pet response to message history
  useEffect(() => {
    if (status === 'done' && currentResponse) {
      const petMsg: Message = {
        id: `pet-${Date.now()}`,
        userId: '',
        role: 'pet',
        content: currentResponse,
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, petMsg]);
    }
  }, [status]);

  if (loadingPet) {
    return (
      <DraggableWindow title="Dashboard" defaultWidth={860} defaultHeight={640}>
        <div className="spinner">waking up peti...</div>
      </DraggableWindow>
    );
  }

  return (
    <>
    <DraggableWindow title="Dashboard" defaultWidth={860} defaultHeight={640}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Top bar: pet info + weather */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '1rem 1.5rem', borderBottom: '1px solid var(--glass-border)',
          flexShrink: 0,
        }}>
          {/* Pet info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Sprite placeholder */}
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem',
            }}>
              🐣
            </div>
            <div>
              <p style={{ fontSize: '0.55rem', marginBottom: '0.25rem' }}>
                {pet?.name ?? 'Peti'}
                <span style={{ fontSize: '0.4rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  Lv. {pet?.level ?? 1}
                </span>
              </p>
              <PetStateBar state={petState} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Weather */}
            {weather && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.5rem' }}>{Math.round(weather.temp)}°</p>
                <p style={{ fontSize: '0.4rem', color: 'var(--text-muted)' }}>{weather.description}</p>
              </div>
            )}
            {/* Memories toggle */}
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowMemories(prev => !prev)}
              style={{ fontSize: '0.4rem', whiteSpace: 'nowrap' }}
            >
              {showMemories ? 'Close' : 'Memories'}
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '1rem 1.5rem',
          display: 'flex', flexDirection: 'column', gap: '0.75rem',
        }}>
          {/* Proactive message */}
          {proactiveMessage && (
            <div style={{
              alignSelf: 'flex-start', maxWidth: '80%',
              padding: '0.75rem 1rem', borderRadius: '12px 12px 12px 4px',
              background: 'var(--success-bg)', fontSize: '0.5rem', lineHeight: 2,
              color: 'var(--text-primary)',
            }}>
              <span style={{ fontSize: '0.35rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                peti was thinking about you...
              </span>
              {proactiveMessage}
            </div>
          )}

          {/* Message history */}
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: '0.75rem 1rem',
                borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: msg.role === 'user' ? 'var(--accent)' : 'var(--glass-bg)',
                color: msg.role === 'user' ? 'var(--glass-bg-heavy)' : 'var(--text-primary)',
                fontSize: '0.5rem',
                lineHeight: 2,
              }}
            >
              {msg.content}
            </div>
          ))}

          {/* Streaming response */}
          {status === 'streaming' && currentResponse && (
            <div style={{
              alignSelf: 'flex-start', maxWidth: '80%',
              padding: '0.75rem 1rem', borderRadius: '12px 12px 12px 4px',
              background: 'var(--glass-bg)', fontSize: '0.5rem', lineHeight: 2,
            }}>
              {currentResponse}
              <span style={{ opacity: 0.5, animation: 'spin 1s linear infinite', display: 'inline-block', marginLeft: '0.25rem' }}>
                |
              </span>
            </div>
          )}

          {/* Streaming indicator */}
          {status === 'streaming' && !currentResponse && (
            <div style={{
              alignSelf: 'flex-start',
              padding: '0.75rem 1rem', borderRadius: '12px 12px 12px 4px',
              background: 'var(--glass-bg)', fontSize: '0.45rem', color: 'var(--text-muted)',
            }}>
              peti is thinking...
            </div>
          )}

          {/* Error */}
          {status === 'error' && errorMessage && (
            <div style={{
              alignSelf: 'center',
              padding: '0.5rem 1rem', borderRadius: 8,
              background: 'var(--error-bg)', color: 'var(--error)',
              fontSize: '0.45rem',
            }}>
              {errorMessage}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <form
          onSubmit={handleSend}
          style={{
            display: 'flex', gap: '0.5rem',
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--glass-border)',
            flexShrink: 0,
          }}
        >
          <input
            className="input"
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="say something to peti..."
            disabled={status === 'streaming'}
            style={{ flex: 1 }}
          />
          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={!input.trim() || status === 'streaming'}
          >
            Send
          </button>
        </form>
      </div>
    </DraggableWindow>

    {showMemories && <MemoriesPage onClose={() => setShowMemories(false)} />}
    </>
  );
}

function PetStateBar({ state }: { state: PetState }) {
  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <span className="badge" style={{ fontSize: '0.35rem' }}>
        {state.mood}
      </span>
      <span className="badge" style={{ fontSize: '0.35rem' }}>
        {state.energy} energy
      </span>
    </div>
  );
}

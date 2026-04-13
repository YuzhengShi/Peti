export interface SentenceEvent {
  type: 'sentence';
  text: string;
}

export interface StateEvent {
  type: 'state';
  mood?: string;
  energy?: string;
  animation?: string;
  activity?: string;
  spriteSheet?: string;
}

export interface ProactiveEvent {
  type: 'proactive';
  text: string;
}

export interface DoneEvent {
  type: 'done';
}

export interface ErrorEvent {
  type: 'error';
  message: string;
}

export type ChatEvent = SentenceEvent | StateEvent | ProactiveEvent | DoneEvent | ErrorEvent;

/**
 * Send a chat message and return a ReadableStream of SSE events.
 * The caller (usePetStream) handles parsing and state management.
 */
export async function sendChat(message: string): Promise<Response> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error?.message ?? `Chat request failed (${res.status})`);
  }

  return res;
}

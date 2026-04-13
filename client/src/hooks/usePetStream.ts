import { useState, useCallback, useRef } from 'react';
import { sendChat, ChatEvent, StateEvent } from '../api/chat';

export interface PetState {
  mood: string;
  energy: string;
  animation: string;
  activity: string;
  spriteSheet?: string;
}

type StreamStatus = 'idle' | 'streaming' | 'done' | 'error';

interface UsePetStreamReturn {
  /** Accumulated sentences from the current response. */
  sentences: string[];
  /** Proactive message delivered on connect (if any). */
  proactiveMessage: string | null;
  /** Current pet state from state events. */
  petState: PetState;
  /** Stream lifecycle status. */
  status: StreamStatus;
  /** Error message (set when status === 'error'). */
  errorMessage: string | null;
  /** Send a message and start streaming. */
  send: (message: string) => Promise<void>;
}

const DEFAULT_PET_STATE: PetState = {
  mood: 'content',
  energy: 'moderate',
  animation: 'idle',
  activity: 'resting',
};

/**
 * Hook for SSE streaming chat with Peti.
 *
 * Handles all event types: sentence, state, proactive, done, error.
 * Sentences are accumulated in an array — the consuming component
 * can animate them with a typewriter effect.
 */
export function usePetStream(): UsePetStreamReturn {
  const [sentences, setSentences] = useState<string[]>([]);
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);
  const [petState, setPetState] = useState<PetState>(DEFAULT_PET_STATE);
  const [status, setStatus] = useState<StreamStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const send = useCallback(async (message: string) => {
    // Abort any in-flight stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSentences([]);
    setProactiveMessage(null);
    setErrorMessage(null);
    setStatus('streaming');

    try {
      const res = await sendChat(message);
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done || controller.signal.aborted) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        // Keep the last incomplete line in the buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let event: ChatEvent;
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          switch (event.type) {
            case 'sentence':
              setSentences(prev => [...prev, event.text]);
              break;
            case 'state':
              setPetState(prev => ({
                ...prev,
                ...Object.fromEntries(
                  Object.entries(event as StateEvent).filter(([k, v]) => k !== 'type' && v !== undefined),
                ),
              }));
              break;
            case 'proactive':
              setProactiveMessage(event.text);
              break;
            case 'done':
              setStatus('done');
              break;
            case 'error':
              setErrorMessage(event.message);
              setStatus('error');
              break;
          }
        }
      }

      // If stream ended without a done event, mark done
      if (status !== 'error') setStatus('done');
    } catch (err) {
      if (!controller.signal.aborted) {
        setErrorMessage(err instanceof Error ? err.message : 'Connection lost');
        setStatus('error');
      }
    }
  }, []);

  return { sentences, proactiveMessage, petState, status, errorMessage, send };
}

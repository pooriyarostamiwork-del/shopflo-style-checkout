import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatStatus, IntelMessage, IntelThread } from "./types";
import { buildSeedThread, generateMockReply, newId } from "./mockIntelligence";

const STORAGE_KEY = "shift-dash-intel-threads-v1";
const ACTIVE_KEY = "shift-dash-intel-active-v1";

type Persisted = { threads: IntelThread[] };

const readInitial = (): { threads: IntelThread[]; activeId: string } => {
  if (typeof window === "undefined") {
    const seed = buildSeedThread();
    return { threads: [seed], activeId: seed.id };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: Persisted | null = raw ? JSON.parse(raw) : null;
    let threads = parsed?.threads ?? [];
    if (!Array.isArray(threads) || threads.length === 0) {
      threads = [buildSeedThread()];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ threads }));
    }
    const savedActive = window.localStorage.getItem(ACTIVE_KEY);
    const activeId =
      savedActive && threads.some((t) => t.id === savedActive)
        ? savedActive
        : threads[0].id;
    return { threads, activeId };
  } catch {
    const seed = buildSeedThread();
    return { threads: [seed], activeId: seed.id };
  }
};

const truncateTitle = (s: string) => {
  const clean = s.replace(/\s+/g, " ").trim();
  return clean.length > 42 ? clean.slice(0, 42) + "…" : clean;
};

export const useIntelligenceChat = () => {
  const [{ threads, activeId }, setState] = useState(readInitial);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const pending = useRef<number | null>(null);

  // persist threads
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ threads }));
  }, [threads]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeId) ?? threads[0],
    [threads, activeId],
  );

  const selectThread = useCallback((id: string) => {
    setState((s) => ({ ...s, activeId: id }));
  }, []);

  const createThread = useCallback(() => {
    // If an empty "چت جدید" already exists, jump to it instead of stacking blanks.
    setState((s) => {
      const existingBlank = s.threads.find(
        (t) => t.messages.length === 0 && t.title === "چت جدید",
      );
      if (existingBlank) return { ...s, activeId: existingBlank.id };
      const t: IntelThread = {
        id: newId(),
        title: "چت جدید",
        updatedAt: Date.now(),
        messages: [],
      };
      return { threads: [t, ...s.threads], activeId: t.id };
    });
  }, []);

  const deleteThread = useCallback((id: string) => {
    setState((s) => {
      const remaining = s.threads.filter((t) => t.id !== id);
      if (remaining.length === 0) {
        const seed = buildSeedThread();
        return { threads: [seed], activeId: seed.id };
      }
      const nextActive =
        s.activeId === id ? remaining[0].id : s.activeId;
      return { threads: remaining, activeId: nextActive };
    });
  }, []);

  const renameThread = useCallback((id: string, title: string) => {
    setState((s) => ({
      ...s,
      threads: s.threads.map((t) =>
        t.id === id ? { ...t, title: title.trim() || t.title } : t,
      ),
    }));
  }, []);

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || status === "thinking") return;

      const userMsg: IntelMessage = {
        id: newId(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };

      setState((s) => ({
        ...s,
        threads: s.threads.map((t) => {
          if (t.id !== s.activeId) return t;
          const isFirst = t.messages.length === 0;
          return {
            ...t,
            title: isFirst ? truncateTitle(trimmed) : t.title,
            updatedAt: Date.now(),
            messages: [...t.messages, userMsg],
          };
        }),
      }));

      setStatus("thinking");
      if (pending.current) window.clearTimeout(pending.current);
      const delay = 900 + Math.random() * 600;
      pending.current = window.setTimeout(() => {
        const reply = generateMockReply(trimmed);
        setState((s) => ({
          ...s,
          threads: s.threads.map((t) =>
            t.id === s.activeId
              ? {
                  ...t,
                  updatedAt: Date.now(),
                  messages: [...t.messages, reply],
                }
              : t,
          ),
        }));
        setStatus("idle");
      }, delay);
    },
    [status],
  );

  useEffect(() => {
    return () => {
      if (pending.current) window.clearTimeout(pending.current);
    };
  }, []);

  return {
    threads,
    activeThread,
    activeId,
    status,
    selectThread,
    createThread,
    deleteThread,
    renameThread,
    sendMessage,
  };
};

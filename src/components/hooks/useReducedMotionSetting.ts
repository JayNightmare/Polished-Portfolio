import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'reduced-motion';
const listeners = new Set<() => void>();

function readInitialValue() {
    if (typeof window === 'undefined') {
        return false;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'true' || stored === 'false') {
        return stored === 'true';
    }

    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

let current = readInitialValue();

function applyToDocument(value: boolean) {
    if (typeof document !== 'undefined') {
        document.documentElement.dataset.reducedMotion = String(value);
    }
}

applyToDocument(current);

function setReducedMotion(value: boolean) {
    current = value;
    applyToDocument(value);
    window.localStorage.setItem(STORAGE_KEY, String(value));
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function useReducedMotionSetting() {
    const reducedMotion = useSyncExternalStore(
        subscribe,
        () => current,
        () => false
    );
    const update = useCallback((value: boolean) => setReducedMotion(value), []);

    return [reducedMotion, update] as const;
}

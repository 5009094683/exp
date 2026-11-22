"use client";

import { useCallback, useRef } from "react";

/**
 * For dialogs opened from code rather than from a trigger element: remembers
 * what had focus when the dialog opened and returns focus there when it
 * closes, so keyboard users continue from where they were.
 *
 * Call `remember` when opening, and pass `restore` to `onCloseAutoFocus`.
 */
export function useReturnFocus() {
  const opener = useRef<HTMLElement | null>(null);

  const remember = useCallback(() => {
    const active = document.activeElement;
    opener.current = active instanceof HTMLElement && active !== document.body ? active : null;
  }, []);

  const restore = useCallback((event: Event) => {
    const element = opener.current;
    opener.current = null;
    if (element?.isConnected) {
      event.preventDefault();
      element.focus();
    }
  }, []);

  return { remember, restore };
}

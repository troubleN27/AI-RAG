"use client";

import { useEffect } from "react";

import { isBrowser } from "@/lib/utils";

// ==========================================================
// Хук
// ==========================================================

let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";

function lockScroll(): void {
  if (!isBrowser) return;

  lockCount += 1;
  if (lockCount > 1) return;

  const body = document.body;
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

  savedOverflow = body.style.overflow;
  savedPaddingRight = body.style.paddingRight;

  body.style.overflow = "hidden";
  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${scrollbarWidth}px`;
  }
}

function unlockScroll(): void {
  if (!isBrowser) return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;

  const body = document.body;
  body.style.overflow = savedOverflow;
  body.style.paddingRight = savedPaddingRight;
  savedOverflow = "";
  savedPaddingRight = "";
}

/**
 * Блокирует скролл body, пока `locked === true`.
 * Учитывает вложенные вызовы (ref-counting).
 */
export function useLockBodyScroll(locked: boolean): void {
  useEffect(() => {
    if (!locked) return;
    lockScroll();
    return () => unlockScroll();
  }, [locked]);
}
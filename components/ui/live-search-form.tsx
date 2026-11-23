"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useTransition, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { ProgressBar } from "./route-progress";

const TYPING_DELAY_MS = 300;

/**
 * Filter form that updates the URL as the user types, so results stay shareable
 * and survive a refresh. Any change returns the table to page 1.
 * Without JavaScript it still works as a normal GET form.
 */
export function LiveSearchForm({
  action,
  className,
  children,
}: {
  action: string;
  className?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<number | undefined>(undefined);
  const [pending, startTransition] = useTransition();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function apply() {
    window.clearTimeout(timer.current);
    if (!formRef.current) return;

    const params = new URLSearchParams();
    new FormData(formRef.current).forEach((value, key) => {
      if (typeof value === "string" && value.trim()) params.set(key, value.trim());
    });
    const query = params.toString();
    const target = query ? `${action}?${query}` : action;
    if (pathname === action && `${window.location.pathname}${window.location.search}` === target) return;

    startTransition(() => router.replace(target, { scroll: false }));
  }

  function onChange(event: ChangeEvent<HTMLFormElement>) {
    const field = event.target as unknown as HTMLInputElement | HTMLSelectElement;
    const typing = field.tagName === "INPUT" && field.type !== "checkbox";
    window.clearTimeout(timer.current);
    if (typing) timer.current = window.setTimeout(apply, TYPING_DELAY_MS);
    else apply();
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    apply();
  }

  return (
    <form ref={formRef} action={action} role="search" onChange={onChange} onSubmit={onSubmit} className={className}>
      {pending ? <ProgressBar /> : null}
      {children}
    </form>
  );
}

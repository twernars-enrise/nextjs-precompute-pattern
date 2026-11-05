"use client";

import { useRouter } from "next/navigation";
import { useSyncExternalStore, useTransition } from "react";
import type { Dictionary } from "@/i18n";
import { defaultSegment, isSegment, type Segment, segmentCookie, segments } from "@/segment";

// The cookie has no change event, so the switcher notifies its own listeners when it writes.
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);

  return () => listeners.delete(listener);
};

const readCookie = (): Segment => {
  const value = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${segmentCookie}=`))
    ?.slice(segmentCookie.length + 1);

  return isSegment(value) ? value : defaultSegment;
};

const writeCookie = (segment: Segment) => {
  document.cookie =
    segment === defaultSegment
      ? `${segmentCookie}=; path=/; max-age=0`
      : `${segmentCookie}=${segment}; path=/; max-age=31536000; samesite=lax`;
  listeners.forEach((listener) => listener());
};

type Props = {
  // The variant the server rendered. Only the home page knows it; other pages are the same for
  // every group, because reading the cookie on the server would make them dynamic.
  current?: Segment;
  groups: Dictionary["groups"];
};

export function GroupSwitcher({ current, groups }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  // Prerender and hydration use `current`. After hydration React reads the cookie, so pages
  // without `current` still show the visitor's group.
  const selected = useSyncExternalStore(subscribe, readCookie, () => current);

  const select = (value: string) => {
    if (!isSegment(value)) {
      return;
    }

    // Set the cookie in the browser. A Server Action would post to /<locale>, and the proxy would
    // rewrite that request with the old cookie.
    writeCookie(value);

    // The client router caches by URL, and the URL does not change. Refetch it.
    startTransition(() => router.refresh());
  };

  return (
    <label className="flex items-center gap-2 text-sm">
      {groups.label}
      <select
        name={segmentCookie}
        value={selected ?? ""}
        disabled={isPending}
        onChange={(event) => select(event.target.value)}
        className="rounded border px-2 py-1"
      >
        {selected === undefined && <option value="" disabled hidden />}
        {segments.map((segment) => (
          <option key={segment} value={segment}>
            {groups.names[segment]}
          </option>
        ))}
      </select>
    </label>
  );
}

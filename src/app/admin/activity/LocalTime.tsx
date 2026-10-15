"use client";

import { useEffect, useState } from "react";

/**
 * A timestamp in the reader's own time zone. The server does not know it, so
 * the first paint shows UTC and the browser swaps in local time on mount.
 */
export default function LocalTime({ iso }: { iso: string }) {
  const [text, setText] = useState(() => format(iso, "UTC"));
  useEffect(() => setText(format(iso)), [iso]);
  return <time dateTime={iso} title={iso}>{text}</time>;
}

function format(iso: string, timeZone?: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const text = date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone });
  return timeZone === "UTC" ? `${text} UTC` : text;
}

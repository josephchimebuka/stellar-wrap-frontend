"use client";

import { ErrorCard } from "@/components/ErrorCard";

export default function ConnectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <ErrorCard error={error} reset={reset} title="Connection Failed" />;
}

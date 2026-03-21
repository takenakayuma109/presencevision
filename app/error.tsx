"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center">
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-orange-500">
        <Sparkles className="h-7 w-7 text-white" />
      </div>
      <h1 className="text-4xl font-bold text-foreground">Something went wrong</h1>
      <p className="mt-4 max-w-md text-base text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <Button size="lg" onClick={reset} className="h-12 px-8">
          Try again
        </Button>
        <Link href="/">
          <Button variant="outline" size="lg" className="h-12 px-8">
            Go home
          </Button>
        </Link>
      </div>
      {process.env.NODE_ENV === "development" && (
        <details className="mt-8 w-full max-w-lg text-left">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Error details
          </summary>
          <pre className="mt-2 overflow-auto rounded-lg border bg-muted p-4 text-xs text-muted-foreground">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
            {error.stack && `\n\n${error.stack}`}
          </pre>
        </details>
      )}
    </div>
  );
}

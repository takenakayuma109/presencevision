"use client";

import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Input } from "@/components/ui";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-foreground text-background text-sm font-bold">
            PV
          </div>
          <CardTitle className="text-xl">PresenceVision</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Email</label>
            <Input type="email" placeholder="you@example.com" />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Password</label>
            <Input type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full">Sign In</Button>
        </CardContent>
      </Card>
    </div>
  );
}

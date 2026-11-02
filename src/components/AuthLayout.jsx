import { ArrowLeft } from "lucide-react";
import React from "react";
import Logo from "@/components/Logo";
import useAppBack from "@/hooks/useAppBack";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  const { goBack, exitHint } = useAppBack();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 pb-[env(safe-area-inset-bottom)]">
      <button type="button" onClick={goBack} aria-label="Go back" className="absolute left-4 top-[calc(env(safe-area-inset-top)+1rem)] flex h-10 w-10 items-center justify-center rounded-lg text-foreground"><ArrowLeft className="h-5 w-5" /></button>
      {exitHint && <p role="status" className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-3 py-2 text-sm text-background">Press Back again to exit</p>}
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Logo size={56} className="mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight pk-grad-text">{title}</h1>
          {subtitle && <p className="text-muted-foreground mt-2">{subtitle}</p>}
        </div>
        <div className="bg-card/40 rounded-2xl border border-primary/25 pk-glass p-8">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}

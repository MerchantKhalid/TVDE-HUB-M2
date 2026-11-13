"use client";

import { MotionConfig } from "framer-motion";
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
        <Toaster position="top-center" closeButton richColors />
      </ThemeProvider>
    </SessionProvider>
  );
}

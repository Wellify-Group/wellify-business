"use client";

import React from "react";

export default function CenteredLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-[calc(100vh-88px)] flex items-center justify-center px-4 pb-10">
      {children}
    </main>
  );
}


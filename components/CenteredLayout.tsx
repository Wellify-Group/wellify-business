"use client";

import React from "react";

export default function CenteredLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="flex items-center justify-center px-4 py-10"
      style={{
        minHeight: "calc(100vh - var(--navbar-height))",
        overflowY: "auto",
      }}
    >
      {children}
    </main>
  );
}


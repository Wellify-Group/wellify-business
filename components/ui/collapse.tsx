// components/ui/collapse.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import * as React from "react";
import { cn } from "@/lib/utils";

interface CollapseProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

export function Collapse({ isOpen, children, className }: CollapseProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [height, setHeight] = React.useState<number | "auto">("auto");

  // Измеряем высоту контента при каждом изменении
  React.useLayoutEffect(() => {
    if (contentRef.current) {
      const measuredHeight = contentRef.current.scrollHeight;
      setHeight(measuredHeight);
    }
  }, [isOpen, children]);

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          key="collapse"
          initial={{ opacity: 0, height: 0, y: -4 }}
          animate={{ 
            opacity: 1, 
            height: height === "auto" ? "auto" : height, 
            y: 0 
          }}
          exit={{ 
            opacity: 0, 
            height: 0, 
            y: -4 
          }}
          transition={{ 
            duration: 0.18, 
            ease: "easeOut"
          }}
          className={cn("overflow-hidden", className)}
        >
          <div ref={contentRef}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


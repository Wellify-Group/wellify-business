"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | undefined>(undefined);

interface DropdownMenuProps {
  children: React.ReactNode;
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      <div className="relative" ref={menuRef}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuTrigger must be used within DropdownMenu");

  const { isOpen, setIsOpen, triggerRef } = context;
  const internalRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (internalRef.current) {
      triggerRef.current = internalRef.current;
    }
  }, []);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: (node: HTMLElement) => {
        internalRef.current = node;
        triggerRef.current = node;
        if (typeof (children as any).ref === 'function') {
          (children as any).ref(node);
        }
      },
      onClick: () => setIsOpen(!isOpen),
      ...children.props,
    } as any);
  }

  return (
    <button
      ref={(node) => {
        internalRef.current = node;
        triggerRef.current = node;
      }}
      onClick={() => setIsOpen(!isOpen)}
      className="inline-flex items-center"
    >
      {children}
    </button>
  );
}

interface DropdownMenuContentProps {
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
}

export function DropdownMenuContent({ children, align = "end", className }: DropdownMenuContentProps) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuContent must be used within DropdownMenu");

  const { isOpen, triggerRef } = context;
  const [position, setPosition] = React.useState({ top: 0, left: 0, right: 0 });
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Calculate position when menu opens
  React.useEffect(() => {
    if (isOpen && triggerRef.current) {
      const updatePosition = () => {
        if (triggerRef.current) {
          const rect = triggerRef.current.getBoundingClientRect();
          const scrollY = window.scrollY;
          const scrollX = window.scrollX;
          
          if (align === "end") {
            setPosition({
              top: rect.bottom + scrollY + 8,
              right: window.innerWidth - rect.right + scrollX,
              left: 0
            });
          } else if (align === "start") {
            setPosition({
              top: rect.bottom + scrollY + 8,
              left: rect.left + scrollX,
              right: 0
            });
          } else {
            const centerX = rect.left + rect.width / 2;
            setPosition({
              top: rect.bottom + scrollY + 8,
              left: centerX + scrollX,
              right: 0
            });
          }
        }
      };

      updatePosition();
      
      // Update on scroll/resize
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isOpen, align, triggerRef]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[1040]"
            onClick={() => context.setIsOpen(false)}
          />
          <motion.div
            ref={contentRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'fixed',
              top: `${position.top}px`,
              ...(align === "end" ? { right: `${position.right}px`, left: 'auto' } : {}),
              ...(align === "start" ? { left: `${position.left}px`, right: 'auto' } : {}),
              ...(align === "center" ? { left: `${position.left}px`, transform: 'translateX(-50%)', right: 'auto' } : {}),
            }}
            className={cn(
              "min-w-[200px] bg-[var(--surface-1)] border border-[var(--border-color)] rounded-lg shadow-xl z-[1050] overflow-hidden",
              className
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  onSelect?: (e: { preventDefault: () => void }) => void;
  disabled?: boolean;
  className?: string;
}

export function DropdownMenuItem({ children, onClick, onSelect, disabled, className }: DropdownMenuItemProps) {
  const context = React.useContext(DropdownMenuContext);
  if (!context) throw new Error("DropdownMenuItem must be used within DropdownMenu");

  const handleClick = () => {
    if (disabled) return;
    
    let shouldClose = true;
    
    if (onSelect) {
      const event = {
        preventDefault: () => {
          shouldClose = false;
        }
      };
      onSelect(event);
    }
    
    if (onClick) {
      onClick();
    }
    
    if (shouldClose) {
      context.setIsOpen(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-[var(--border-color)] my-1" />;
}

// Submenu components
interface DropdownMenuSubContextValue {
  isSubOpen: boolean;
  setIsSubOpen: (open: boolean) => void;
  subTriggerRef: React.MutableRefObject<HTMLElement | null>;
}

const DropdownMenuSubContext = React.createContext<DropdownMenuSubContextValue | undefined>(undefined);

interface DropdownMenuSubProps {
  children: React.ReactNode;
}

export function DropdownMenuSub({ children }: DropdownMenuSubProps) {
  const [isSubOpen, setIsSubOpen] = React.useState(false);
  const subTriggerRef = React.useRef<HTMLElement | null>(null);

  return (
    <DropdownMenuSubContext.Provider value={{ isSubOpen, setIsSubOpen, subTriggerRef }}>
      <div className="relative">
        {children}
      </div>
    </DropdownMenuSubContext.Provider>
  );
}

interface DropdownMenuSubTriggerProps {
  children: React.ReactNode;
  onSelect?: (e: { preventDefault: () => void }) => void;
  className?: string;
}

export function DropdownMenuSubTrigger({ children, onSelect, className }: DropdownMenuSubTriggerProps) {
  const context = React.useContext(DropdownMenuSubContext);
  if (!context) throw new Error("DropdownMenuSubTrigger must be used within DropdownMenuSub");

  const { isSubOpen, setIsSubOpen, subTriggerRef } = context;
  const internalRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (internalRef.current) {
      subTriggerRef.current = internalRef.current;
    }
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onSelect) {
      const event = {
        preventDefault: () => {
          // Если preventDefault вызван, не меняем состояние подменю
        }
      };
      onSelect(event);
    }
    
    setIsSubOpen(!isSubOpen);
  };

  return (
    <button
      ref={(node) => {
        internalRef.current = node;
        subTriggerRef.current = node;
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={cn(
        "w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-2)] rounded-lg transition-colors text-left",
        className
      )}
    >
      {children}
    </button>
  );
}

interface DropdownMenuSubContentProps {
  children: React.ReactNode;
  align?: "start" | "end";
  side?: "left" | "right" | "top" | "bottom";
  sideOffset?: number;
  alignOffset?: number;
  className?: string;
}

export function DropdownMenuSubContent({ children, align = "start", side = "right", sideOffset = 4, alignOffset = 0, className }: DropdownMenuSubContentProps) {
  const context = React.useContext(DropdownMenuSubContext);
  if (!context) throw new Error("DropdownMenuSubContent must be used within DropdownMenuSub");

  const { isSubOpen, setIsSubOpen, subTriggerRef } = context;
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isSubOpen && subTriggerRef.current) {
      const updatePosition = () => {
        if (subTriggerRef.current) {
          const rect = subTriggerRef.current.getBoundingClientRect();
          const scrollY = window.scrollY;
          const scrollX = window.scrollX;
          
          if (side === "left") {
            setPosition({
              top: rect.top + scrollY + alignOffset,
              left: rect.left + scrollX - 200 - sideOffset, // Position to the left
            });
          } else if (side === "right") {
            setPosition({
              top: rect.top + scrollY + alignOffset,
              left: rect.right + scrollX + sideOffset, // Position to the right with sideOffset gap
            });
          } else if (side === "top") {
            setPosition({
              top: rect.top + scrollY - 200 - sideOffset + alignOffset,
              left: rect.left + scrollX,
            });
          } else {
            setPosition({
              top: rect.bottom + scrollY + sideOffset + alignOffset,
              left: rect.left + scrollX,
            });
          }
        }
      };

      updatePosition();
      
      window.addEventListener('scroll', updatePosition, true);
      window.addEventListener('resize', updatePosition);
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isSubOpen, align, side, sideOffset, alignOffset, subTriggerRef]);

  // Close on outside click
  React.useEffect(() => {
    if (!isSubOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        contentRef.current &&
        !contentRef.current.contains(target) &&
        subTriggerRef.current &&
        !subTriggerRef.current.contains(target)
      ) {
        setIsSubOpen(false);
      }
    };

    // Use setTimeout to avoid immediate closing on trigger click
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSubOpen, setIsSubOpen, subTriggerRef]);

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {isSubOpen && createPortal(
        <AnimatePresence>
          {isSubOpen && (
            <>
              <div
                className="fixed inset-0 z-[10000]"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSubOpen(false);
                }}
                onMouseDown={(e) => {
                  // Prevent closing when clicking on trigger
                  if (subTriggerRef.current?.contains(e.target as Node)) {
                    e.stopPropagation();
                  }
                }}
              />
                <motion.div
                ref={contentRef}
                initial={{ opacity: 0, x: side === "left" ? 5 : -5, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: side === "left" ? 5 : -5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                style={{
                  position: 'fixed',
                  top: `${position.top}px`,
                  left: `${position.left}px`,
                }}
                className={cn(
                  "min-w-[160px] bg-[var(--surface-1)] border border-[var(--border-color)] rounded-lg shadow-xl z-[10001] overflow-hidden",
                  className
                )}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                {children}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

interface DropdownMenuRadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export function DropdownMenuRadioGroup({ value, onValueChange, children }: DropdownMenuRadioGroupProps) {
  return (
    <div role="radiogroup" aria-label="Language selection">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const existingOnSelect = child.props.onSelect as ((e: { preventDefault: () => void }) => void) | undefined;
          return React.cloneElement(child, {
            ...child.props,
            checked: child.props.value === value,
            onSelect: (e: { preventDefault: () => void }) => {
              // Если есть существующий onSelect, вызываем его
              if (existingOnSelect) {
                existingOnSelect(e);
              } else {
                // Если onSelect не передан, вызываем onValueChange
                onValueChange(child.props.value);
              }
            },
          } as any);
        }
        return child;
      })}
    </div>
  );
}

interface DropdownMenuRadioItemProps {
  value: string;
  children: React.ReactNode;
  checked?: boolean;
  onSelect?: (e: { preventDefault: () => void }) => void;
  className?: string;
}

export function DropdownMenuRadioItem({ value, children, checked, onSelect, className }: DropdownMenuRadioItemProps) {
  const subContext = React.useContext(DropdownMenuSubContext);
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    let shouldCloseSub = true;
    
    if (onSelect) {
      const event = {
        preventDefault: () => {
          shouldCloseSub = false;
        }
      };
      onSelect(event);
    }
    
    if (subContext && shouldCloseSub) {
      subContext.setIsSubOpen(false);
    }
  };
  
  return (
    <button
      onClick={handleClick}
      className={cn(
        "w-full flex items-center justify-between px-3 py-2 text-sm text-left text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors",
        checked && "bg-[var(--surface-2)]",
        className
      )}
      role="radio"
      aria-checked={checked}
    >
      <span>{children}</span>
      {checked && (
        <svg
          className="h-4 w-4 text-[var(--accent-primary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}


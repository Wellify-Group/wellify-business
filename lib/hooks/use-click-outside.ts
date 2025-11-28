import { useEffect, RefObject } from "react";

/**
 * Hook to handle clicks outside of specified elements
 * 
 * @param refs - Array of refs to elements that should not trigger close (can be different element types)
 * @param handler - Function to call when click outside is detected
 * @param enabled - Whether the hook is enabled (default: true)
 * 
 * @example
 * const menuRef = useRef<HTMLDivElement>(null);
 * const buttonRef = useRef<HTMLButtonElement>(null);
 * useClickOutside([menuRef, buttonRef], () => setIsOpen(false), isOpen);
 */
export function useClickOutside(
  refs: RefObject<HTMLElement>[],
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Check if click is inside any of the provided refs
      const isInside = refs.some(ref => {
        const element = ref.current;
        return element && element.contains(target);
      });

      // If click is outside all refs, call handler
      if (!isInside) {
        handler(event);
      }
    };

    // Use mousedown instead of click for better UX (catches drags)
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [refs, handler, enabled]);
}


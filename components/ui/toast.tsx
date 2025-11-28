"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, Info, XCircle } from "lucide-react";
import { create } from "zustand";

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 3000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration }] }));
    
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getBgColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-success/10 border-success/20 text-success-foreground';
      case 'error':
        return 'bg-error/10 border-error/20 text-error-foreground';
      case 'warning':
        return 'bg-warning/10 border-warning/20 text-warning-foreground';
      default:
        return 'bg-info/10 border-info/20 text-info-foreground';
    }
  };

  const getIconColor = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'text-success';
      case 'error':
        return 'text-error';
      case 'warning':
        return 'text-warning';
      default:
        return 'text-info';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[1080] flex flex-col gap-2 pointer-events-none max-w-md">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 100, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`bg-card border rounded-xl shadow-lg ${getBgColor(toast.type)} pointer-events-auto p-4`}
          >
            <div className="flex items-start gap-3">
              <div className={getIconColor(toast.type)}>
                {getIcon(toast.type)}
              </div>
              <p className="flex-1 text-sm font-medium text-foreground">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="p-1 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function useToast() {
  const { addToast } = useToastStore();
  
  return {
    toast: useCallback((message: string, type?: ToastType) => {
      addToast(message, type);
    }, [addToast]),
    success: useCallback((message: string) => {
      addToast(message, 'success');
    }, [addToast]),
    error: useCallback((message: string) => {
      addToast(message, 'error');
    }, [addToast]),
    info: useCallback((message: string) => {
      addToast(message, 'info');
    }, [addToast]),
    warning: useCallback((message: string) => {
      addToast(message, 'warning');
    }, [addToast]),
  };
}






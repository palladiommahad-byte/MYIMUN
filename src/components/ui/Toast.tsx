'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

const ACCENT: Record<ToastType, string> = {
    success: '#3B82F6', // blue
    error: '#EF4444',   // red
    warning: '#F59E0B', // amber
    info: '#22D3EE',    // cyan
};

function ToastItem({ toast, onRemove }: { toast: Toast, onRemove: (id: number) => void }) {
    const accent = ACCENT[toast.type];
    const icons = {
        success: <CheckCircle size={20} style={{ color: accent }} />,
        error: <XCircle size={20} style={{ color: accent }} />,
        warning: <AlertCircle size={20} style={{ color: accent }} />,
        info: <Info size={20} style={{ color: accent }} />,
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            layout
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg min-w-[300px] backdrop-blur-md"
            style={{
                background: 'rgba(10,15,30,0.94)',
                border: `1px solid ${accent}55`,
                borderLeft: `3px solid ${accent}`,
            }}
        >
            <div className="shrink-0">
                {icons[toast.type]}
            </div>
            <p className="text-sm font-medium text-white flex-1">{toast.message}</p>
            <button
                onClick={() => onRemove(toast.id)}
                className="text-white/40 hover:text-white transition-colors"
            >
                <XCircle size={16} />
            </button>
        </motion.div>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

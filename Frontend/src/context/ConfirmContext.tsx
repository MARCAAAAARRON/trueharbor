import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import Button from '../components/Button';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({
    title: '',
    message: '',
  });

  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Branded Coastal Confirmation Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-tide/75 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 relative overflow-hidden"
            data-ui="confirm-modal"
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  options.variant === 'danger'
                    ? 'bg-buoy/10 text-buoy'
                    : 'bg-sand/40 text-harbor'
                }`}
              >
                {options.variant === 'danger' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <HelpCircle className="w-6 h-6" />
                )}
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-display font-bold text-tide leading-tight">
                  {options.title}
                </h3>
                <p className="text-sm text-slate mt-2 leading-relaxed">
                  {options.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 bg-mist -mx-6 -mb-6 px-6 py-4">
              <Button
                variant="ghost"
                onClick={handleCancel}
                className="h-9 px-4 text-xs font-medium"
              >
                {options.cancelText || 'Cancel'}
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                className={`h-9 px-4 text-xs font-semibold ${
                  options.variant === 'danger' ? 'bg-buoy hover:bg-buoy/90 text-white' : ''
                }`}
              >
                {options.confirmText || 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
}

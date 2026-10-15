import React from 'react';
import { Modal } from './Modal';
import { AlertCircle, Trash2, CheckCircle2 } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
}) => {
  const getButtonStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm';
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm';
      case 'primary':
      default:
        return 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm';
    }
  };

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="w-8 h-8 text-rose-600" />;
      case 'warning':
        return <AlertCircle className="w-8 h-8 text-amber-600" />;
      case 'primary':
      default:
        return <CheckCircle2 className="w-8 h-8 text-emerald-600" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex items-start gap-4 py-2">
        <div className="p-2.5 rounded-full bg-slate-50 border border-slate-100 shrink-0">
          {getIcon()}
        </div>
        <div className="text-sm text-slate-600 leading-relaxed">{message}</div>
      </div>
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors cursor-pointer ${getButtonStyles()}`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};

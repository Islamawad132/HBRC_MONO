import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Modal, ModalFooter } from '../ui/Modal';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title?: string;
  message?: string | React.ReactNode;
  itemName?: string;
  warning?: string;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  warning,
}: DeleteConfirmModalProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || t('common.deleteConfirmTitle')}
      icon={Trash2}
      variant="danger"
      loading={loading}
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmText={t('common.delete')}
          confirmVariant="danger"
          loading={loading}
        />
      }
    >
      <p className="text-white/80">
        {message || t('common.deleteConfirmMessage')}
      </p>

      {itemName && (
        <div className="mt-4 rounded-lg bg-white/5 p-3">
          <p className="font-medium text-white">{itemName}</p>
        </div>
      )}

      {warning && (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
          <p className="text-sm text-amber-400">{warning}</p>
        </div>
      )}
    </Modal>
  );
}

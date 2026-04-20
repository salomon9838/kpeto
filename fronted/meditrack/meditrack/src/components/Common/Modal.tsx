// components/Common/Modal.tsx
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, onClose, children, maxWidth = '600px' }) => {
  if (!isOpen) return null;

  return (
    <div className="modal active">
      <div className="modal-content" style={{ maxWidth }}>
        <div className="modal-header">
          <h3>{title}</h3>
          <span className="close-modal" onClick={onClose}>&times;</span>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;

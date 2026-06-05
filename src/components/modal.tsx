import React, { useEffect, useCallback } from 'react';
import '../css/modal.css';

export type ModalProps = {
    title: string;
    children: React.ReactNode;
    onClose: () => void;
    width?: string;
};

export const Modal: React.FC<ModalProps> = ({ title, children, onClose, width }) => {
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="modal__backdrop" onClick={onClose}>
            <div
                className="modal__content"
                style={width ? { maxWidth: width } : undefined}
                onClick={e => e.stopPropagation()}
            >
                <div className="modal__header">
                    <h2 className="modal__title">{title}</h2>
                    <button className="modal__close" onClick={onClose} aria-label="Close">
                        &times;
                    </button>
                </div>
                <div className="modal__body">
                    {children}
                </div>
            </div>
        </div>
    );
};

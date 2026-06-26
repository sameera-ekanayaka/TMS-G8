import React from 'react';
import { X, CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react';

const icons = {
  success: <CheckCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  error: <XCircle size={16} />,
  info: <Info size={16} />,
};

const styles = {
  success: {
    background: 'var(--color-success-soft)',
    border: '1px solid var(--color-success)',
    color: 'var(--color-success)',
  },
  warning: {
    background: '#fff8e6',
    border: '1px solid #f5a623',
    color: '#92600a',
  },
  error: {
    background: 'var(--color-danger-soft)',
    border: '1px solid var(--color-danger)',
    color: 'var(--color-danger)',
  },
  info: {
    background: 'var(--color-surface-soft)',
    border: '1px solid var(--color-hairline-strong)',
    color: 'var(--color-ink)',
  },
};

const Toast = ({ toasts, onRemove }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 360,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            ...styles[toast.type] || styles.info,
            borderRadius: 'var(--rounded-md)',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0,0,0,0.12))',
            animation: 'toast-in 0.25s ease',
            pointerEvents: 'all',
          }}
        >
          <span style={{ flexShrink: 0, marginTop: 1 }}>
            {icons[toast.type] || icons.info}
          </span>
          <p style={{ flex: 1, fontSize: 13, fontWeight: 500, lineHeight: 1.4, margin: 0 }}>
            {toast.message}
          </p>
          <button
            onClick={() => onRemove(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 2,
              flexShrink: 0,
              opacity: 0.6,
              color: 'inherit',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}

      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Toast;

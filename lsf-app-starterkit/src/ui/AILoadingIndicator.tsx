import React from 'react'

export const AILoadingIndicator: React.FC = () => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '0.35rem 0.7rem',
        borderRadius: 999,
        border: '1px solid rgba(129,140,248,0.7)',
        background:
          'radial-gradient(circle at top left, rgba(129,140,248,0.35), rgba(15,23,42,0.9))',
        fontSize: 11,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: '#e5e7eb',
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          borderRadius: '999px',
          border: '2px solid rgba(191,219,254,0.3)',
          borderTopColor: '#e5e7eb',
          animation: 'lsf-ai-spin 800ms linear infinite',
        }}
      />
      <span>AI thinking</span>
      <style>
        {`@keyframes lsf-ai-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }`}
      </style>
    </div>
  )
}


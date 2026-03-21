import React from 'react'

interface GhostButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export const GhostButton: React.FC<GhostButtonProps> = ({
  children,
  loading,
  disabled,
  ...props
}) => {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      style={{
        borderRadius: 999,
        padding: '0.45rem 0.75rem',
        border: 'none',
        background: 'rgba(15,23,42,0.6)',
        color: 'var(--lsf-text-main)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: disabled || loading ? 0.6 : 1,
        cursor: disabled || loading ? 'default' : 'pointer',
      }}
      {...props}
    >
      {loading ? '…' : children}
    </button>
  )
}


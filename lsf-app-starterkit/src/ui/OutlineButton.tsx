import React from 'react'

interface OutlineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean
  loading?: boolean
}

export const OutlineButton: React.FC<OutlineButtonProps> = ({
  children,
  fullWidth,
  loading,
  disabled,
  ...props
}) => {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      style={{
        width: fullWidth ? '100%' : undefined,
        borderRadius: 999,
        padding: '0.6rem 1rem',
        border: '1px solid rgba(148,163,184,0.7)',
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        background: 'transparent',
        color: 'var(--lsf-text-main)',
        opacity: disabled || loading ? 0.6 : 1,
        cursor: disabled || loading ? 'default' : 'pointer',
      }}
      {...props}
    >
      {loading ? 'Working…' : children}
    </button>
  )
}


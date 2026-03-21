import React from 'react'

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
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
        width: '100%',
        borderRadius: 999,
        padding: '0.7rem 1rem',
        border: 'none',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        background:
          'linear-gradient(135deg, var(--lsf-primary-strong), var(--lsf-primary))',
        color: 'white',
        boxShadow: '0 12px 30px rgba(248,113,113,0.4)',
        opacity: disabled || loading ? 0.7 : 1,
        cursor: disabled || loading ? 'default' : 'pointer',
      }}
      {...props}
    >
      {loading ? 'Processing…' : children}
    </button>
  )
}


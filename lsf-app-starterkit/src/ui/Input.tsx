import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input: React.FC<InputProps> = ({ label, error, ...props }) => {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--lsf-text-muted)',
          }}
        >
          {label}
        </span>
      )}
      <input
        {...props}
        style={{
          borderRadius: 999,
          border: `1px solid ${error ? '#f97373' : 'rgba(148,163,184,0.7)'}`,
          padding: '0.55rem 0.9rem',
          fontSize: 13,
          outline: 'none',
          background: 'rgba(15,23,42,0.9)',
          color: 'var(--lsf-text-main)',
        }}
      />
      {error && (
        <span style={{ fontSize: 11, color: '#f97373' }}>
          {error}
        </span>
      )}
    </label>
  )
}


import React from 'react'

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

export const Chip: React.FC<ChipProps> = ({ children, selected, ...props }) => {
  return (
    <button
      type="button"
      style={{
        borderRadius: 999,
        padding: '0.25rem 0.7rem',
        fontSize: 12,
        border: selected
          ? '1px solid rgba(52,211,153,1)'
          : '1px solid rgba(148,163,184,0.8)',
        background: selected
          ? 'rgba(16,185,129,0.15)'
          : 'rgba(15,23,42,0.7)',
        color: selected ? '#bbf7d0' : 'var(--lsf-text-main)',
        cursor: 'pointer',
      }}
      {...props}
    >
      {children}
    </button>
  )
}


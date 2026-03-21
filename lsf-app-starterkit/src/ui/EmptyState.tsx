import React from 'react'

interface EmptyStateProps {
  message: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div
      style={{
        padding: '1.5rem 1.25rem',
        borderRadius: 18,
        border: '1px dashed rgba(148,163,184,0.7)',
        background: 'rgba(15,23,42,0.5)',
        textAlign: 'center',
        fontSize: 13,
        color: 'var(--lsf-text-muted)',
      }}
    >
      {message}
    </div>
  )
}


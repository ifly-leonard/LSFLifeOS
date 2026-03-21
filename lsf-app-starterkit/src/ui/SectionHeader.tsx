import React from 'react'

interface SectionHeaderProps {
  title: string
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title }) => {
  return (
    <h3
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        color: 'var(--lsf-text-muted)',
        marginTop: 4,
        marginBottom: 4,
      }}
    >
      {title}
    </h3>
  )
}


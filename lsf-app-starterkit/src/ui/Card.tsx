import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ children, className = '', ...props }) => {
  return (
    <div
      className={className}
      style={{
        borderRadius: 18,
        padding: 16,
        border: '1px solid rgba(148,163,184,0.4)',
        background:
          'radial-gradient(circle at top, rgba(15,23,42,0.95), rgba(15,23,42,0.96))',
        boxShadow: '0 18px 45px rgba(0,0,0,0.55)',
      }}
      {...props}
    >
      {children}
    </div>
  )
}


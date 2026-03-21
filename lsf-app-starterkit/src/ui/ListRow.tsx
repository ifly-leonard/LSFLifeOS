import React from 'react'

interface ListRowProps {
  title: string
  meta?: string
  badge?: React.ReactNode
  onClick?: () => void
}

export const ListRow: React.FC<ListRowProps> = ({ title, meta, badge, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.65rem 0.25rem',
        border: 'none',
        background: 'transparent',
        borderBottom: '1px solid rgba(30,64,175,0.4)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ textAlign: 'left' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {title}
        </div>
        {meta && (
          <div
            style={{
              fontSize: 11,
              color: 'var(--lsf-text-muted)',
            }}
          >
            {meta}
          </div>
        )}
      </div>
      {badge && <div>{badge}</div>}
    </button>
  )
}


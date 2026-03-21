import React from 'react'
import { Card } from '../ui/Card'

const Profile: React.FC = () => {
  return (
    <>
      <section>
        <p className="page-kicker">Placeholder</p>
        <h2 className="page-title" style={{ marginTop: 4 }}>
          Profile surface
        </h2>
        <p
          style={{
            marginTop: 10,
            fontSize: 13,
            color: 'var(--lsf-text-muted)',
          }}
        >
          This tab is intentionally light-touch. Use it to wire your own auth,
          account settings, or environment selectors.
        </p>
      </section>

      <Card>
        <p
          style={{
            fontSize: 13,
            color: 'var(--lsf-text-muted)',
          }}
        >
          You can safely rip this page out and replace it with your own profile
          or settings experience without disturbing the rest of the shell.
        </p>
      </Card>
    </>
  )
}

export default Profile


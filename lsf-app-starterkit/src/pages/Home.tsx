import React from 'react'
import { useHistory } from 'react-router-dom'
import { PrimaryButton } from '../ui/PrimaryButton'
import { Card } from '../ui/Card'

const Home: React.FC = () => {
  const history = useHistory()

  return (
    <>
      <section>
        <p className="page-kicker">Starter surface</p>
        <h2 className="page-title" style={{ marginTop: 4 }}>
          Blank app, strong opinions
        </h2>
        <p
          style={{
            marginTop: 10,
            fontSize: 13,
            color: 'var(--lsf-text-muted)',
          }}
        >
          Use this shell to spin up LSFLifeOS-flavoured apps quickly. Tabs, UI
          kit, and integration demos are already wired.
        </p>
      </section>

      <Card>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          UI style guide
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--lsf-text-muted)',
            marginBottom: 12,
          }}
        >
          Browse the core components, spacing rules, and motion borrowed from
          the GFF mobile app and tuned for LSF.
        </p>
        <PrimaryButton onClick={() => history.push('/ui-style-guide')}>
          Open UI style guide
        </PrimaryButton>
      </Card>

      <Card>
        <h3
          style={{
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Integrations gallery
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--lsf-text-muted)',
            marginBottom: 12,
          }}
        >
          See WhatsApp share, JSON config import / export, calendar export, and
          AI flows wired with real code.
        </p>
        <PrimaryButton onClick={() => history.push('/integrations')}>
          View integrations
        </PrimaryButton>
      </Card>
    </>
  )
}

export default Home


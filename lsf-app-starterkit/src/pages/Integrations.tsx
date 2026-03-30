import React from 'react'
import { useHistory } from 'react-router-dom'
import { Card } from '../ui/Card'
import { PrimaryButton } from '../ui/PrimaryButton'

const Integrations: React.FC = () => {
  const history = useHistory()

  return (
    <>
      <section>
        <p className="page-kicker">Reference flows</p>
        <h2 className="page-title" style={{ marginTop: 4 }}>
          Integrations gallery
        </h2>
        <p
          style={{
            marginTop: 10,
            fontSize: 13,
            color: 'var(--lsf-text-muted)',
          }}
        >
          Each card mirrors something that already exists in LifeOS or the GFF
          mobile app so you can reuse the patterns, not re-invent them.
        </p>
      </section>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
          WhatsApp share
        </h3>
        <p style={{ fontSize: 13, color: 'var(--lsf-text-muted)', marginBottom: 10 }}>
          Inspired by the LifeOS Today view. Generate a concise human-readable
          summary and deep-link to the WhatsApp app.
        </p>
        <PrimaryButton onClick={() => history.push('/integrations/whatsapp')}>
          Open WhatsApp demo
        </PrimaryButton>
      </Card>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
          JSON config import / export
        </h3>
        <p style={{ fontSize: 13, color: 'var(--lsf-text-muted)', marginBottom: 10 }}>
          Based on LifeOS Settings. Export in-memory state as JSON, validate
          imports, and support overwrite vs merge.
        </p>
        <PrimaryButton onClick={() => history.push('/integrations/json-config')}>
          Open JSON demo
        </PrimaryButton>
      </Card>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
          Calendar export (.ics)
        </h3>
        <p style={{ fontSize: 13, color: 'var(--lsf-text-muted)', marginBottom: 10 }}>
          Minimal ICS export using the same approach as LifeOS, ready to import
          into Google Calendar.
        </p>
        <PrimaryButton onClick={() => history.push('/integrations/calendar')}>
          Open calendar demo
        </PrimaryButton>
      </Card>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>
          AI / ChatGPT-style flows
        </h3>
        <p style={{ fontSize: 13, color: 'var(--lsf-text-muted)', marginBottom: 10 }}>
          Mirrors the GFF opportunity AI service: typed payloads, backend proxy,
          and a small AI UX surface with loading and error handling.
        </p>
        <PrimaryButton onClick={() => history.push('/integrations/ai')}>
          Open AI demo
        </PrimaryButton>
      </Card>
    </>
  )
}

export default Integrations


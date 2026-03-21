import React, { useState } from 'react'
import { Card } from '../ui/Card'
import { SectionHeader } from '../ui/SectionHeader'
import { PrimaryButton } from '../ui/PrimaryButton'
import { OutlineButton } from '../ui/OutlineButton'
import { GhostButton } from '../ui/GhostButton'
import { Input } from '../ui/Input'
import { Chip } from '../ui/Chip'
import { ListRow } from '../ui/ListRow'
import { EmptyState } from '../ui/EmptyState'
import { AILoadingIndicator } from '../ui/AILoadingIndicator'

const UiStyleGuide: React.FC = () => {
  const [hasError, setHasError] = useState(false)

  return (
    <>
      <section>
        <p className="page-kicker">Design system</p>
        <h2 className="page-title" style={{ marginTop: 4 }}>
          UI style guide
        </h2>
        <p
          style={{
            marginTop: 10,
            fontSize: 13,
            color: 'var(--lsf-text-muted)',
          }}
        >
          Inspired by the GFF UIKit page. This is the single place to see how
          LSF apps should look and feel.
        </p>
      </section>

      <Card>
        <SectionHeader title="Typography & color" />
        <p style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          Large display headline
        </p>
        <p
          style={{
            fontSize: 14,
            color: 'var(--lsf-text-muted)',
            marginBottom: 12,
          }}
        >
          Body copy leans slightly condensed, with high contrast and plenty of
          negative space. Use color for intent, not decoration.
        </p>
        <div
          style={{
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              width: 80,
              height: 56,
              borderRadius: 16,
              background: 'var(--lsf-primary)',
            }}
          />
          <div
            style={{
              width: 80,
              height: 56,
              borderRadius: 16,
              border: '1px solid rgba(148,163,184,0.7)',
              background: 'rgba(15,23,42,0.9)',
            }}
          />
        </div>
      </Card>

      <Card>
        <SectionHeader title="Buttons" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <PrimaryButton>Primary</PrimaryButton>
          <OutlineButton>Outline</OutlineButton>
          <div style={{ display: 'flex', gap: 8 }}>
            <GhostButton>Ghost</GhostButton>
            <GhostButton loading>Ghost loading</GhostButton>
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Inputs" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input label="Project name" placeholder="Untitled app" />
          <Input
            label="With error"
            placeholder="Tap to simulate"
            error={hasError ? 'Example validation message' : undefined}
            onFocus={() => setHasError(true)}
          />
        </div>
      </Card>

      <Card>
        <SectionHeader title="Chips & list rows" />
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <Chip>Default</Chip>
          <Chip selected>Selected</Chip>
        </div>
        <ListRow
          title="Example integration"
          meta="Tap rows like this to open detail surfaces."
          badge={<Chip selected>Enabled</Chip>}
        />
        <ListRow
          title="Secondary action"
          meta="Use a lighter meta line to explain context."
        />
      </Card>

      <Card>
        <SectionHeader title="Empty state" />
        <EmptyState message="Nothing here yet. Start wiring your own domain data into this shell." />
      </Card>

      <Card>
        <SectionHeader title="AI activity" />
        <p
          style={{
            fontSize: 13,
            color: 'var(--lsf-text-muted)',
            marginBottom: 10,
          }}
        >
          Mirror the GFF AI indicator: a compact pill that can live inline with
          text to show that something is being generated.
        </p>
        <AILoadingIndicator />
      </Card>
    </>
  )
}

export default UiStyleGuide


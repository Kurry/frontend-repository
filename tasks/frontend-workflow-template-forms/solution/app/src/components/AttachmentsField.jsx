import { Button, Tag } from '@carbon/react'
import { Add, Close, DocumentAttachment } from '@carbon/icons-react'
import { REFERENCE_ASSETS } from '../domain'
import { useStudioStore } from '../store'

export default function AttachmentsField({ selected, onChange, idPrefix = 'attachments', active = true }) {
  const open = useStudioStore((state) => state.assetPickerOpen)
  const setChrome = useStudioStore((state) => state.setChrome)
  const available = REFERENCE_ASSETS.filter((asset) => !selected.includes(asset.name))
  const labelId = `${idPrefix}-reference-documents-label`
  const pickerId = `${idPrefix}-asset-picker`
  const pickerVisible = active && open

  function add(name) {
    onChange([...selected, name])
    setChrome({ assetPickerOpen: false })
  }

  return (
    <div className="field-stack attachment-field">
      <div className="field-heading">
        <div>
          <p className="field-label" id={labelId}>Reference documents</p>
          <p className="field-help">Optional · Ground the prompt in a source asset.</p>
        </div>
        <Button
          type="button"
          kind="tertiary"
          size="sm"
          renderIcon={(props) => <Add {...props} aria-hidden="true" />}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            if (!active) return
            setChrome({ assetPickerOpen: !open })
          }}
          aria-expanded={pickerVisible}
          aria-controls={pickerId}
        >
          Add document
        </Button>
      </div>

      {selected.length > 0 ? (
        <div className="attachment-list" aria-labelledby={labelId}>
          {selected.map((name) => {
            const asset = REFERENCE_ASSETS.find((item) => item.name === name)
            return (
              <span className="asset-badge" key={name} tabIndex={0}>
                <Tag type="cool-gray" renderIcon={(props) => <DocumentAttachment {...props} aria-hidden="true" />}>{name}</Tag>
                <span className="asset-preview" role="tooltip">
                  <strong>{name}</strong>
                  <span>{asset?.type} · {asset?.detail}</span>
                  <button
                    type="button"
                    className="asset-remove"
                    onClick={() => onChange(selected.filter((item) => item !== name))}
                    aria-label={`Remove ${name}`}
                  >
                    <Close size={14} aria-hidden="true" /> Remove
                  </button>
                </span>
              </span>
            )
          })}
        </div>
      ) : (
        <p className="empty-inline">No reference documents added.</p>
      )}

      {pickerVisible && (
        <div className="asset-picker" id={pickerId} role="listbox" aria-label="Choose a reference document">
          <div className="asset-picker__top">
            <div>
              <strong>Reference library</strong>
              <span>Choose one of 6 seeded assets</span>
            </div>
            <Button type="button" kind="ghost" size="sm" hasIconOnly renderIcon={(props) => <Close {...props} aria-hidden="true" />} iconDescription="Close document picker" aria-label="Close document picker" onClick={() => setChrome({ assetPickerOpen: false })} />
          </div>
          <div className="asset-grid">
            {REFERENCE_ASSETS.map((asset) => {
              const isSelected = selected.includes(asset.name)
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={isSelected}
                  className="asset-option"
                  key={asset.name}
                  onClick={() => add(asset.name)}
                >
                  <DocumentAttachment size={20} aria-hidden="true" />
                  <span><strong>{asset.name}</strong><small>{asset.type} · {asset.detail}</small></span>
                </button>
              )
            })}
          </div>
          {available.length === 0 && <p className="picker-complete">All documents are attached.</p>}
        </div>
      )}
    </div>
  )
}

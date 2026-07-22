import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { useDialog } from './useDialog';

// Accessible ink blue for text on light surfaces (>=6:1 on #E6EEF7 / white).
const INK = '#0052A3';
const ERROR = '#B42318';

const SettingsDialog: React.FC = () => {
  const open = useGameStore((s) => s.settingsOpen);
  const closeSettings = useGameStore((s) => s.closeSettings);
  const saveSettings = useGameStore((s) => s.saveSettings);
  const storeName = useGameStore((s) => s.playerName);
  const storeTier = useGameStore((s) => s.startingTier);

  const [name, setName] = useState(storeName);
  const [tier, setTier] = useState<1 | 2 | 3>(storeTier);
  const [touched, setTouched] = useState(false);

  // Re-seed the local draft every time the dialog is (re)opened so it always
  // reflects the currently saved settings, not a stale draft.
  useEffect(() => {
    if (open) {
      setName(storeName);
      setTier(storeTier);
      setTouched(false);
    }
  }, [open, storeName, storeTier]);

  const dialogRef = useDialog(open, closeSettings);

  const trimmed = name.trim();
  const nameValid = trimmed.length >= 2 && trimmed.length <= 20;
  const nameError =
    touched && !nameValid
      ? trimmed.length === 0
        ? 'playerName is required and must be 2-20 characters'
        : trimmed.length < 2
          ? 'playerName must be at least 2 characters (2-20)'
          : 'playerName must be at most 20 characters (2-20)'
      : null;
  const canSave = nameValid;

  const errorId = 'settings-name-error';

  const handleSave = () => {
    setTouched(true);
    if (!canSave) return;
    saveSettings(trimmed, tier);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="settings-title"
      aria-describedby="settings-desc"
      style={{
        border: 'none',
        borderRadius: '12px',
        padding: 0,
        width: 'min(92vw, 380px)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.22)',
        color: '#1D1D1E',
      }}
    >
      <div style={{ padding: '20px 22px 22px' }}>
        <h2 id="settings-title" style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px' }}>
          Player settings
        </h2>
        <p id="settings-desc" style={{ fontSize: '14px', color: '#4F4F55', margin: '0 0 16px' }}>
          These two fields form the saved settings payload (the player name carried on every
          finished run, and the tier a new run begins at).
        </p>

        <div style={{ marginBottom: '16px' }}>
          <label htmlFor="settings-playerName" style={{ display: 'block', fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>
            Player name
          </label>
          <input
            id="settings-playerName"
            autoFocus
            value={name}
            maxLength={24}
            onChange={(e) => {
              setName(e.target.value);
              if (!touched) setTouched(true);
            }}
            onBlur={() => setTouched(true)}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? errorId : undefined}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '16px',
              borderRadius: '8px',
              border: `1px solid ${nameError ? ERROR : '#C7CED6'}`,
              outline: 'none',
              minHeight: '44px',
            }}
          />
          {nameError && (
            <p id={errorId} role="alert" style={{ color: ERROR, fontSize: '13px', fontWeight: 600, margin: '6px 0 0' }}>
              {nameError}
            </p>
          )}
        </div>

        <fieldset style={{ border: 'none', padding: 0, margin: '0 0 18px' }}>
          <legend style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px' }}>Starting tier</legend>
          <div style={{ display: 'flex', gap: '8px' }}>
            {([1, 2, 3] as const).map((t) => {
              const active = tier === t;
              return (
                <label
                  key={t}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px 8px',
                    minHeight: '44px',
                    borderRadius: '1000px',
                    border: `1px solid ${active ? '#0066CC' : '#C7CED6'}`,
                    backgroundColor: active ? '#0066CC' : '#E6EEF7',
                    color: active ? '#FEFEFE' : INK,
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="startingTier"
                    value={t}
                    checked={active}
                    onChange={() => setTier(t)}
                    style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
                  />
                  Tier {t}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={closeSettings}
            className="ld-btn-secondary"
            style={{ color: INK, border: 'none', borderRadius: '1000px', padding: '10px 18px', fontSize: '15px', fontWeight: 600, cursor: 'pointer', minHeight: '44px' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            aria-disabled={!canSave}
            className="ld-btn-primary"
            style={{
              color: '#FEFEFE',
              border: 'none',
              borderRadius: '1000px',
              padding: '10px 22px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: canSave ? 'pointer' : 'not-allowed',
              minHeight: '44px',
              opacity: canSave ? 1 : 0.45,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </dialog>
  );
};

export default SettingsDialog;

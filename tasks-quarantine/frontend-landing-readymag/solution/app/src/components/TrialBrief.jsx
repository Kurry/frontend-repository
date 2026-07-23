import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import styled from '@emotion/styled';
import { colors, fonts } from '../theme/tokens';
import { z } from 'zod';
import { useStore } from '@nanostores/react';
import { appStore, defaultBriefState } from '../store';
import { webmcpBus } from '../webmcp/registerWebmcp';

const trialBriefSchema = z.object({
  product: z.literal("Canvasly"),
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name must not exceed 80 characters"),
  email: z.string().email("Email must be a valid address"),
  plan: z.enum(["Free trial", "Pro", "Team"], { errorMap: () => ({ message: "Plan required" }) }),
  team_size: z.enum(["1", "2-10", "11-50", "51+"], { errorMap: () => ({ message: "Team size required" }) }),
  interests: z.array(z.enum(["Portfolios", "Presentations", "Editorials", "Companies", "Freelancers", "Students"])),
  generated_at: z.string(),
}).strict().refine(data => {
    if (data.plan === "Free trial" && data.team_size !== "1") return false;
    return true;
}, {
    message: "Team size must be 1 for Free trial",
    path: ["team_size"]
}).refine(data => {
    if (data.plan === "Team" && data.team_size === "1") return false;
    return true;
}, {
    message: "Team size cannot be 1 for Team plan",
    path: ["team_size"]
}).refine(data => {
    if ((data.plan === "Pro" || data.plan === "Team") && data.interests.length === 0) return false;
    return true;
}, {
    message: "Interests required for Pro or Team",
    path: ["interests"]
}).refine(data => {
    const unique = new Set(data.interests);
    return unique.size === data.interests.length;
}, {
    message: "Interests must be unique",
    path: ["interests"]
});

const Container = styled.div`
  background: ${colors.white};
  padding: 32px;
  border-radius: 16px;
  max-width: 800px;
  margin: 0 auto;
  text-align: left;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  display: flex;
  flex-direction: column;
  gap: 24px;

  @media (min-width: 769px) {
    flex-direction: row;
  }
`;

const FormSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PreviewSection = styled.div`
  flex: 1;
  background: ${colors.grayF4};
  padding: 16px;
  border-radius: 8px;
  font-family: monospace;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
`;

const Title = styled.h3`
  font-family: ${fonts.pxGrotesk};
  font-size: 24px;
  margin: 0 0 16px;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-family: ${fonts.inter};
  font-size: 14px;
  font-weight: 500;
  color: ${colors.dark};
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid ${colors.grayB8};
  border-radius: 4px;
  font-family: ${fonts.inter};
`;

const Select = styled.select`
  padding: 10px;
  border: 1px solid ${colors.grayB8};
  border-radius: 4px;
  font-family: ${fonts.inter};
`;

const ChipContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Chip = styled.button`
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid ${props => props.$selected ? colors.dark : colors.grayB8};
  background: ${props => props.$selected ? colors.dark : 'transparent'};
  color: ${props => props.$selected ? colors.white : colors.dark};
  cursor: pointer;
  font-family: ${fonts.inter};
  font-size: 12px;
  transition: all 0.2s;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;

const Button = styled.button`
  padding: 8px 16px;
  border-radius: 4px;
  background: ${colors.dark};
  color: ${colors.white};
  border: none;
  cursor: pointer;
  font-family: ${fonts.inter};
  transition: all 0.2s ease-out;
  &:hover:not(:disabled) {
    background: ${colors.orange};
    transform: translateY(-2px);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background: ${colors.grayF4};
  color: ${colors.dark};
  border: 1px solid ${colors.grayB8};
`;

const ErrorText = styled.span`
  color: #b3261e;
  font-size: 12px;
`;

const LiveRegion = styled.div`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export default function TrialBrief() {
  const store = useStore(appStore);
  const brief = store.trialBrief;
  const undoStack = store.trialBriefUndoStore;
  const redoStack = store.trialBriefRedoStore;
  const [successMsg, setSuccessMsg] = useState("");
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [importError, setImportError] = useState("");
  const [importOk, setImportOk] = useState("");
  // Surface inline field errors only after the user has actually edited the
  // brief (or imported a payload). A fresh load and a Reset return to the empty
  // baseline with no error wall, while validation/import errors still show once
  // the form is dirty.
  const [touched, setTouched] = useState(false);
  const importFileRef = useRef(null);

  const updateBrief = useCallback((newBrief) => {
    appStore.setKey('trialBriefUndoStore', [...undoStack, brief]);
    appStore.setKey('trialBriefRedoStore', []);
    appStore.setKey('trialBrief', { ...newBrief, generated_at: new Date().toISOString() });
    setSuccessMsg("");
    setImportError("");
    setImportOk("");
    setTouched(true);
  }, [undoStack, brief]);

  const handleReset = useCallback(() => {
    appStore.setKey('trialBriefUndoStore', [...undoStack, brief]);
    appStore.setKey('trialBriefRedoStore', []);
    appStore.setKey('trialBrief', { ...defaultBriefState, generated_at: new Date().toISOString() });
    setSuccessMsg("");
    setImportError("");
    setImportOk("");
    setTouched(false);
  }, [undoStack, brief]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const previous = undoStack[undoStack.length - 1];
    appStore.setKey('trialBriefRedoStore', [...redoStack, brief]);
    appStore.setKey('trialBriefUndoStore', undoStack.slice(0, -1));
    appStore.setKey('trialBrief', previous);
    setSuccessMsg("");
    setImportError("");
    setImportOk("");
  }, [undoStack, redoStack, brief]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    appStore.setKey('trialBriefUndoStore', [...undoStack, brief]);
    appStore.setKey('trialBriefRedoStore', redoStack.slice(0, -1));
    appStore.setKey('trialBrief', next);
    setSuccessMsg("");
    setImportError("");
    setImportOk("");
  }, [undoStack, redoStack, brief]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (!isMod || e.key.toLowerCase() !== 'z') return;
      const target = e.target;
      const isTextInput = target && (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      );
      if (isTextInput) return;
      e.preventDefault();
      if (e.shiftKey) {
        handleRedo();
      } else {
        handleUndo();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const validationResult = useMemo(() => trialBriefSchema.safeParse(brief), [brief]);
  const isValid = validationResult.success;
  const errors = useMemo(() => {
    if (validationResult.success) return {};
    const formErrors = {};
    validationResult.error.issues.forEach(issue => {
      formErrors[issue.path[0]] = issue.message;
    });
    return formErrors;
  }, [validationResult]);

  // A field is "dirty" once it differs from the empty baseline. Inline field
  // errors are only rendered for dirty fields (or after any edit / import), so a
  // fresh load and a Reset show the clean empty baseline with no error wall,
  // while cross-field conflicts still appear the moment the relevant field is
  // touched (the form is then dirty).
  const dirtyFields = useMemo(() => ({
    name: brief.name !== "",
    email: brief.email !== "",
    plan: brief.plan !== "",
    team_size: brief.team_size !== "",
    interests: brief.interests.length > 0,
  }), [brief]);
  const showError = useCallback((field) => {
    if (!errors[field]) return false;
    return touched || dirtyFields[field];
  }, [errors, touched, dirtyFields]);

  const handleSubmit = useCallback(() => {
    setTouched(true);
    if (isValid) {
      setSuccessMsg("Trial brief ready — download or copy your JSON above");
    }
  }, [isValid]);

  const handleCopy = useCallback(() => {
    const data = JSON.stringify(brief, null, 2);
    navigator.clipboard.writeText(data);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 1500);
    return data;
  }, [brief]);

  const handleDownload = useCallback(() => {
    const data = JSON.stringify(brief, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "canvasly-trial-brief.json";
    a.click();
    URL.revokeObjectURL(url);
    return data;
  }, [brief]);

  const handleImport = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
          try {
              const imported = JSON.parse(evt.target.result);
              const result = trialBriefSchema.safeParse(imported);
              if (result.success) {
                  updateBrief(result.data);
                  setTouched(true);
                  setImportOk("Brief imported — form and preview restored");
              } else {
                  const issue = result.error.issues[0];
                  const field = issue.path.length ? issue.path.join(".") : "payload";
                  setImportError(`Import failed — ${field}: ${issue.message}`);
                  setImportOk("");
                  setTouched(true);
              }
          } catch {
              setImportError("Import failed — file is not valid JSON");
              setImportOk("");
              setTouched(true);
          }
      };
      reader.readAsText(file);
      e.target.value = null;
  };

  const handleLoadSample = useCallback(() => {
      if (window.confirm("Load sample brief?")) {
         updateBrief({
             product: "Canvasly",
             name: "Avery Lane",
             email: "avery@studio.example",
             plan: "Pro",
             team_size: "2-10",
             interests: ["Portfolios", "Editorials"],
             generated_at: new Date().toISOString()
         });
         setTouched(true);
         return true;
      }
      return false;
  }, [updateBrief]);

  // WebMCP Integration
  useEffect(() => {
    webmcpBus.exportBrief = (format) => {
        if (format === 'json') {
            handleDownload();
            return { ok: true, format: 'json', downloaded: true };
        }
        return { ok: false, error: 'format must be json' };
    };
    webmcpBus.copyBrief = () => {
        handleCopy();
        return { ok: true, copied: true };
    };
    webmcpBus.importBrief = (mode) => {
        if (mode !== 'replace') return { ok: false, error: 'mode must be replace' };
        const loaded = handleLoadSample();
        return loaded ? { ok: true, mode: 'replace', loadedSample: true } : { ok: false, error: 'cancelled' };
    };
    webmcpBus.validateBrief = () => {
         setTouched(true);
         return { ok: isValid, errors: errors };
    };
    webmcpBus.submitBrief = () => {
         if (isValid) {
             handleSubmit();
             return { ok: true };
         }
         setTouched(true);
         return { ok: false, errors: errors };
    };
    webmcpBus.resetBrief = () => {
        handleReset();
        return { ok: true };
    };
  }, [isValid, errors, handleSubmit, handleReset, handleCopy, handleDownload, handleLoadSample]);


  return (
    <Container id="rm-section-trial-brief">
      <FormSection>
        <Title>Build your Canvasly trial brief</Title>
        <Field>
          <Label htmlFor="brief-name">Name</Label>
          <Input
            id="brief-name"
            type="text"
            value={brief.name}
            onChange={e => updateBrief({...brief, name: e.target.value})}
            onBlur={e => {
              const trimmed = e.target.value.trim();
              if (trimmed !== brief.name) {
                updateBrief({...brief, name: trimmed});
              }
            }}
          />
          {showError('name') && <ErrorText>{errors.name}</ErrorText>}
        </Field>

        <Field>
          <Label htmlFor="brief-email">Email</Label>
          <Input
            id="brief-email"
            type="email"
            value={brief.email}
            onChange={e => updateBrief({...brief, email: e.target.value})}
          />
          {showError('email') && <ErrorText>{errors.email}</ErrorText>}
        </Field>

        <Field>
          <Label htmlFor="brief-plan">Plan</Label>
          <Select
            id="brief-plan"
            value={brief.plan || ""}
            onChange={e => updateBrief({...brief, plan: e.target.value})}
          >
            <option value="">Select a plan</option>
            <option value="Free trial">Free trial</option>
            <option value="Pro">Pro</option>
            <option value="Team">Team</option>
          </Select>
          {showError('plan') && <ErrorText>{errors.plan}</ErrorText>}
        </Field>

        <Field>
          <Label htmlFor="brief-team">Team size</Label>
          <Select
            id="brief-team"
            value={brief.team_size || ""}
            onChange={e => updateBrief({...brief, team_size: e.target.value})}
          >
            <option value="">Select team size</option>
            <option value="1">1</option>
            <option value="2-10">2-10</option>
            <option value="11-50">11-50</option>
            <option value="51+">51+</option>
          </Select>
          {showError('team_size') && <ErrorText>{errors.team_size}</ErrorText>}
        </Field>

        <Field>
          <Label>Interests</Label>
          <ChipContainer>
            {["Portfolios", "Presentations", "Editorials", "Companies", "Freelancers", "Students"].map(interest => (
              <Chip
                key={interest}
                type="button"
                $selected={brief.interests.includes(interest)}
                onClick={() => {
                  const newInterests = brief.interests.includes(interest)
                    ? brief.interests.filter(i => i !== interest)
                    : [...brief.interests, interest];
                  updateBrief({...brief, interests: newInterests});
                }}
              >
                {interest}
              </Chip>
            ))}
          </ChipContainer>
          {showError('interests') && <ErrorText>{errors.interests}</ErrorText>}
        </Field>

        <ButtonGroup>
          <SecondaryButton onClick={handleReset} aria-label="Reset">Reset</SecondaryButton>
          <SecondaryButton onClick={handleUndo} disabled={undoStack.length === 0} aria-label="Undo" aria-disabled={undoStack.length === 0}>Undo</SecondaryButton>
          <SecondaryButton onClick={handleRedo} disabled={redoStack.length === 0} aria-label="Redo" aria-disabled={redoStack.length === 0}>Redo</SecondaryButton>
          <Button onClick={handleSubmit} disabled={!isValid} aria-label="Submit trial brief">Submit trial brief</Button>
          <SecondaryButton onClick={handleLoadSample} aria-label="Load sample brief">Load sample brief</SecondaryButton>
        </ButtonGroup>
        {successMsg && <div style={{color: 'green', fontSize: '14px', fontWeight: 'bold'}}>{successMsg}</div>}
      </FormSection>

      <PreviewSection>
        <ButtonGroup style={{marginBottom: '16px'}}>
          <Button onClick={handleDownload} aria-label="Download JSON">Download JSON</Button>
          <Button onClick={handleCopy} aria-label="Copy brief">
            <span key={copiedMsg ? 'copied' : 'copy'} style={{ animation: 'fadeIn 0.2s ease-in-out' }}>
              {copiedMsg ? "Copied" : "Copy brief"}
            </span>
          </Button>
          <SecondaryButton
            type="button"
            aria-label="Import brief"
            onClick={() => importFileRef.current?.click()}
          >
            Import brief
          </SecondaryButton>
          <input
              ref={importFileRef}
              type="file"
              id="import-brief"
              accept=".json,application/json"
              aria-hidden="true"
              tabIndex={-1}
              style={{position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)'}}
              onChange={handleImport}
          />
        </ButtonGroup>
        {importError && <ErrorText style={{display: 'block', marginBottom: '16px'}}>{importError}</ErrorText>}
        {importOk && !importError && <div style={{color: '#1b6e2e', fontSize: '13px', marginBottom: '16px'}}>{importOk}</div>}
        {JSON.stringify(brief, null, 2)}
      </PreviewSection>
      <LiveRegion aria-live="polite">
        {touched ? Object.values(errors).join(". ") : ""}
        {successMsg ? ` ${successMsg}` : ""}
        {importError ? ` ${importError}` : ""}
        {importOk && !importError ? ` ${importOk}` : ""}
      </LiveRegion>
    </Container>
  );
}

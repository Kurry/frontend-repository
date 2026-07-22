import { importArtifact } from './utils/artifact';

export const setupWebMCP = (getRecords, setRecords, getDerived, setDerived, setHistory, getSelectedId, setSelectedId) => {
  window.webmcp_session_info = {
    name: 'Flashcard Cloze Authoring Studio',
    version: '1.0.0',
    capabilities: ['cloze_cards', 'audit_lens', 'artifact_exchange']
  };

  window.webmcp_list_tools = () => {
    return [
      {
        name: 'query_state',
        description: 'Query the current application state.',
        parameters: {}
      },
      {
        name: 'create_record',
        description: 'Create a new empty record.',
        parameters: {}
      },
      {
        name: 'edit_record',
        description: 'Edit a record by id.',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            front: { type: 'string' },
            back: { type: 'string' }
          },
          required: ['id', 'front', 'back']
        }
      },
      {
        name: 'select_record',
        description: 'Select a record.',
        parameters: {
          type: 'object',
          properties: {
            id: { type: 'string' }
          },
          required: ['id']
        }
      },
      {
        name: 'audit_resolve',
        description: 'Attach evidence to a selected record and resolve an audit discrepancy.',
        parameters: {
          type: 'object',
          properties: {
            evidence: { type: 'string' }
          },
          required: ['evidence']
        }
      },
      {
        name: 'undo',
        description: 'Undo the last mutation.',
        parameters: {}
      },
      {
        name: 'import_artifact',
        description: 'Import an artifact JSON string.',
        parameters: {
          type: 'object',
          properties: {
            content: { type: 'string' }
          },
          required: ['content']
        }
      }
    ];
  };

  window.webmcp_invoke_tool = (name, params) => {
    const records = getRecords();
    const derived = getDerived();
    const selectedId = getSelectedId();

    try {
      if (name === 'query_state') {
        return JSON.stringify({ records, derived, selectedId });
      }

      if (name === 'create_record') {
        const newRecord = {
          id: `record-${Date.now()}`,
          front: '',
          back: '',
          status: 'empty',
          evidence: null,
          auditDiscrepancy: null
        };
        setHistory(prev => [...prev, { type: 'CREATE', record: newRecord, timestamp: Date.now() }]);
        setRecords([...records, newRecord]);
        return JSON.stringify({ success: true, record: newRecord });
      }

      if (name === 'edit_record') {
        const { id, front, back } = params;
        if (typeof front !== 'string' || typeof back !== 'string') {
          return JSON.stringify({ error: 'Invalid required fields' });
        }
        let found = false;
        const newRecords = records.map(r => {
          if (r.id === id) {
            found = true;
            const updated = { ...r, front, back, status: 'draft' };
            setHistory(prev => [...prev, { type: 'UPDATE', record: updated, previousRecord: r, timestamp: Date.now() }]);
            return updated;
          }
          return r;
        });
        if (!found) return JSON.stringify({ error: 'Record not found' });
        setRecords(newRecords);
        return JSON.stringify({ success: true });
      }

      if (name === 'select_record') {
        const { id } = params;
        const found = records.find(r => r.id === id);
        if (!found) return JSON.stringify({ error: 'Record not found' });
        setSelectedId(id);
        return JSON.stringify({ success: true });
      }

      if (name === 'audit_resolve') {
        const { evidence } = params;
        if (!selectedId) return JSON.stringify({ error: 'No record selected' });
        const selectedRecord = records.find(r => r.id === selectedId);
        if (!evidence || typeof evidence !== 'string' || evidence.length < 5) {
          return JSON.stringify({ error: 'A conflicting or incomplete mutation is rejected without partial updates.' });
        }

        const updatedRecord = {
          ...selectedRecord,
          status: 'resolved',
          evidence: evidence,
          auditDiscrepancy: false
        };

        setRecords(records.map(r => r.id === selectedId ? updatedRecord : r));

        const newDerived = {
          ...derived,
          resolvedCount: (derived.resolvedCount || 0) + 1,
          lastAuditTime: Date.now()
        };
        setDerived(newDerived);

        setHistory(prev => [...prev, {
          type: 'AUDIT_RESOLVE',
          previousRecord: selectedRecord,
          previousDerived: derived,
          timestamp: Date.now()
        }]);

        return JSON.stringify({ success: true, record: updatedRecord });
      }

      if (name === 'undo') {
        const evt = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
        window.dispatchEvent(evt);
        return JSON.stringify({ success: true });
      }

      if (name === 'import_artifact') {
        const result = importArtifact(params.content);
        if (result) {
          setRecords(result.records);
          setDerived(result.derived);
          setHistory(result.history);
          return JSON.stringify({ success: true });
        }
        return JSON.stringify({ error: 'Invalid import' });
      }

      return JSON.stringify({ error: `Tool ${name} not found` });
    } catch (err) {
      return JSON.stringify({ error: err.message });
    }
  };
};

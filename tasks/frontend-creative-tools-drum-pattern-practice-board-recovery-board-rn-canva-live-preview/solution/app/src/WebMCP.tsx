import { useEffect } from 'react';
import { useDrumStore } from './store/useDrumStore';

export const WebMCP = () => {
  useEffect(() => {
    (window as any).webmcp_list_tools = () => {
      return [
        {
          name: 'get_pattern_state',
          description: 'Gets the current drum pattern state, including tracks and steps.',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'toggle_step',
          description: 'Toggles a drum step on or off.',
          inputSchema: {
            type: 'object',
            properties: {
              trackId: { type: 'string' },
              stepIndex: { type: 'number' },
            },
            required: ['trackId', 'stepIndex'],
          },
        },
        {
          name: 'undo_change',
          description: 'Undo the last action.',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'redo_change',
          description: 'Redo the previously undone action.',
          inputSchema: { type: 'object', properties: {} },
        },
        {
          name: 'set_tempo',
          description: 'Sets the playback tempo in BPM (20-300).',
          inputSchema: {
            type: 'object',
            properties: { tempo: { type: 'number' } },
            required: ['tempo'],
          },
        },
      ];
    };

    (window as any).webmcp_invoke_tool = (toolName: string, args: any) => {
      const state = useDrumStore.getState();

      if (toolName === 'get_pattern_state') {
        return { success: true, state: state.pattern };
      }
      if (toolName === 'toggle_step') {
        state.toggleStep(args.trackId, args.stepIndex);
        return { success: true };
      }
      if (toolName === 'undo_change') {
        state.undo();
        return { success: true };
      }
      if (toolName === 'redo_change') {
        state.redo();
        return { success: true };
      }
      if (toolName === 'set_tempo') {
        state.setTempo(args.tempo);
        return { success: true };
      }

      throw new Error(`Tool ${toolName} not found`);
    };
  }, []);

  return null;
};

export function initWebMCP(getState, dispatch) {
    window.webmcp_session_info = () => ({ status: 'ready', tools: ['editor', 'entity', 'artifact'] });
    window.webmcp_list_tools = () => [
        { name: 'editor_select', module: 'structured-editor-v1' },
        { name: 'editor_update_property', module: 'structured-editor-v1' },
        { name: 'entity_create', module: 'entity-collection-v1' },
        { name: 'entity_update', module: 'entity-collection-v1' },
        { name: 'artifact_export', module: 'artifact-transfer-v1' },
        { name: 'artifact_import', module: 'artifact-transfer-v1' },
    ];
    window.webmcp_invoke_tool = async (tool, args) => {
        if (tool === 'editor_update_property') {
            if (args.type === 'piece' && args.property === 'transform') {
                dispatch({ type: 'TRANSFORM_PIECE', pieceId: args.id, transform: args.value });
            }
        }
        if (tool === 'artifact_import') {
            dispatch({ type: 'IMPORT', payload: JSON.parse(args.data) });
        }
        return { success: true };
    };
}

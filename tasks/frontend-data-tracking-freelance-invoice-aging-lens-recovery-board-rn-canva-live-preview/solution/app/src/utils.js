export const exportArtifact = (state) => {
    const artifact = {
        ...state,
        exportedAt: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(artifact, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "invoice-aging-v1-recovery-board.json");
    document.body.appendChild(downloadAnchorNode); // required for firefox
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

export const importArtifact = (data) => {
    // Validation rules
    if (!data || data.schemaVersion !== 'v1') {
        throw new Error("Invalid schemaVersion. Expected 'v1'.");
    }

    if (!Array.isArray(data.records)) {
        throw new Error("Invalid schema: records must be an array.");
    }

    const ids = new Set();
    const validStatuses = ['draft', 'ready', 'changed', 'failed', 'archived'];

    for (const record of data.records) {
        if (!record.id || ids.has(record.id)) {
            throw new Error(`Duplicate or missing ID: ${record.id}`);
        }
        ids.add(record.id);

        if (!validStatuses.includes(record.status)) {
            throw new Error(`Invalid status: ${record.status}`);
        }

        if (typeof record.amount !== 'number' || record.amount < 0) {
            throw new Error(`Invalid amount for record ${record.id}`);
        }
    }

    // Valid import, return with newly generated exportedAt (or preserve)
    return {
        ...data,
        exportedAt: new Date().toISOString()
    };
};

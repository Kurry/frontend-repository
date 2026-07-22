import { useStore } from '../store';

export function importJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.schemaVersion !== 'kiln-firing-project/v1') {
                alert('Invalid schema version');
                return;
            }
            useStore.getState().importSession(data);
        } catch (err) {
            alert('Failed to parse JSON');
        }
    };
    reader.readAsText(file);
}

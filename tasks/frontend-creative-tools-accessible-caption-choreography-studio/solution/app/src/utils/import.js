import { updateProjectState } from '../store';

export const importJSON = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (data.schemaVersion !== "caption-choreography/v1") throw new Error("Invalid schema");
            updateProjectState(data);
        } catch (err) {
            alert("Failed to import JSON: " + err.message);
        }
    };
    reader.readAsText(file);
};

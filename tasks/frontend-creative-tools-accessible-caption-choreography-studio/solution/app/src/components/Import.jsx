import React, { useRef } from 'react';
import { importJSON } from '../utils/import';

const Import = () => {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.name.endsWith('.json')) {
            importJSON(file);
        } else {
            alert("Only JSON import is supported in this demo.");
        }
        e.target.value = null; // Reset input
    };

    return (
        <div>
            <input
                type="file"
                accept=".json,.vtt"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />
            <button
                onClick={() => fileInputRef.current.click()}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white"
            >
                Import
            </button>
        </div>
    );
};

export default Import;

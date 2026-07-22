import { useStore } from '../store';
import { Upload } from 'lucide-react';
import { useRef } from 'react';

export function ImportButton() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const loadPlan = useStore(state => state.loadPlan);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const plan = JSON.parse(text);
            if (plan.schema === "fictional-badge-pickup-rail/1.0" && plan.planId) {
                // Assuming it's the plan.json directly for this simplified import
                loadPlan(plan);
            } else {
                alert("Invalid plan schema.");
            }
        } catch (err) {
            console.error(err);
            alert("Failed to parse file.");
        }

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <>
            <input
                type="file"
                accept=".json,.zip"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium shadow-sm hover:bg-secondary/80 transition-colors"
            >
                <Upload size={18} />
                Import Plan
            </button>
        </>
    );
}

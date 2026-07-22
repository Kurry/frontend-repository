import { useStore } from '../store';
import { exportPacket } from '../utils/exportUtils';
import { Download } from 'lucide-react';

export function ExportButton() {
    const state = useStore();

    return (
        <button
            onClick={() => exportPacket(state)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium shadow-sm hover:bg-primary/90 transition-colors"
        >
            <Download size={18} />
            Export Packet
        </button>
    );
}

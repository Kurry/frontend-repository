import { transactions, thresholds, filters, totals, displayCurrency, addTransaction, updateTransaction, deleteTransaction, resetState } from './state.js';
import { z } from 'zod';

const schema = z.object({
    transactions: z.array(z.object({
        date: z.string(),
        label: z.string(),
        category: z.string(),
        account: z.string(),
        amount: z.number(),
        status: z.string(),
        note: z.string().optional()
    })),
    thresholds: z.array(z.object({
        category: z.string(),
        ceiling: z.number()
    }))
});

window.webmcp_session_info = () => ({
    contract_version: "zto-webmcp-v1",
    modules: ["browse-query-v1", "entity-collection-v1", "artifact-transfer-v1"]
});

window.webmcp_list_tools = () => [
    { name: "browse_open", description: "Open a destination" },
    { name: "browse_search", description: "Search" },
    { name: "browse_apply_filter", description: "Apply a filter" },
    { name: "browse_clear_filter", description: "Clear filters" },

    { name: "entity_create", description: "Create an expense" },
    { name: "entity_update", description: "Update an expense" },
    { name: "entity_delete", description: "Delete an expense" },

    { name: "artifact_export", description: "Export ledger" },
    { name: "artifact_import", description: "Import ledger-json" },
    { name: "artifact_copy", description: "Copy artifact" }
];

window.webmcp_invoke_tool = (name, args) => {
    switch (name) {
        case "entity_create": {
            if (!args || !args.entity) return { success: false, error: "Missing entity payload" };
            let finalAmount = args.entity.amount;
            if (args.entity.category !== 'Income' && finalAmount > 0) {
                finalAmount = -finalAmount;
            }
            addTransaction({ ...args.entity, amount: finalAmount });
            return { success: true, result: "Created" };
        }
        case "entity_update": {
            if (!args || !args.id || !args.entity) return { success: false };
            let finalAmount = args.entity.amount;
            if (args.entity.category !== 'Income' && finalAmount > 0) {
                finalAmount = -finalAmount;
            }
            updateTransaction(args.id, { ...args.entity, amount: finalAmount });
            return { success: true, result: "Updated" };
        }
        case "entity_delete": {
            if (!args || !args.id || args.confirm !== true) return { success: false, error: "Requires confirm=true" };
            deleteTransaction(args.id);
            return { success: true, result: "Deleted" };
        }
        case "artifact_export": {
            const format = args?.format || 'json';
            if (format === 'json') {
                return {
                    success: true,
                    result: JSON.stringify({
                        schemaVersion: 1,
                        reportTitle: "Finance Reports",
                        generatedAt: new Date().toISOString(),
                        displayCurrency: displayCurrency.value,
                        filters: filters.value,
                        totals: totals.value,
                        thresholds: thresholds.value,
                        transactions: transactions.value
                    })
                };
            }
            if (format === 'csv') {
                const header = "date,label,category,account,amount,status,note\n";
                const rows = transactions.value.map(t =>
                    `${t.date},"${t.label}",${t.category},${t.account},${t.amount},${t.status},"${t.note || ''}"`
                ).join('\n');
                return { success: true, result: header + rows };
            }
            return { success: false, error: "Unsupported format" };
        }
        case "artifact_import": {
            if (args?.mode !== 'ledger-json' || !args.content) return { success: false, error: "Invalid mode or missing content" };
            try {
                const data = typeof args.content === 'string' ? JSON.parse(args.content) : args.content;
                if (data.schemaVersion !== 1) throw new Error("Invalid schemaVersion");
                schema.parse(data);
                resetState(data.transactions, data.thresholds);
                return { success: true, result: "Import successful" };
            } catch (err) {
                return { success: false, error: err.message };
            }
        }
        case "artifact_copy": {
           return { success: true, result: "Copied via WebMCP" };
        }
        default:
            return { success: true, result: "Stubbed" };
    }
};

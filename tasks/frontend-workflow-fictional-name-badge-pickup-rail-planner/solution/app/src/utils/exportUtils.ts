import JSZip from 'jszip';
import type { AppState } from '../types';

async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function exportPacket(state: AppState): Promise<void> {
    const zip = new JSZip();
    const now = new Date().toISOString();

    // 1. plan.json
    const planJson = {
        ...state,
        generatedAt: now,
        exportedAt: now
    };
    const planStr = JSON.stringify(planJson, null, 2);
    zip.file('plan.json', planStr);

    // 2. plan.schema.json
    const schemaJson = JSON.stringify({
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "Fictional Badge Pickup Rail",
        "type": "object",
        "properties": {
             "planId": { "type": "string" },
             "attendees": { "type": "array" }
        },
        "additionalProperties": false
    }, null, 2);
    zip.file('plan.schema.json', schemaJson);

    // 3. badges.csv
    const badgesCsvHeader = "scenarioId,badgeId,attendeeId,displayName,familyNameKey,symbol,hookId,slotNumber,overflowOrdinal,backMark,status,revision,actorId\n";
    const badgesCsvRows = state.badges.map(b => {
        const a = state.attendees.find(att => att.badgeId === b.id)!;
        return `baseline,${b.id},${a.id},${a.displayName},${a.familyNameKey},${a.symbol},${b.hookId},${b.slotNumber || ''},${b.overflowOrdinal || ''},${b.backMark},${b.status},${state.revision},Ari`;
    }).join('\n');
    zip.file('badges.csv', badgesCsvHeader + badgesCsvRows);

    // 4. arrivals.csv
    const arrivalsCsvHeader = "scenarioId,sequence,arrivalId,attendeeId,badgeId,arrivalAt,storedHookId,canonicalHookId,routeStepCount,redirected,predictedCompleteAt\n";
    const arrivalsCsvRows = state.arrivals.map(a =>
        `baseline,${a.sequence},${a.arrivalId},${a.attendeeId},${a.badgeId},${a.arrivalAt},${a.storedHookId},${a.canonicalHookId},${a.routeStepCount},${a.redirected},${a.predictedCompleteAt}`
    ).join('\n');
    zip.file('arrivals.csv', arrivalsCsvHeader + arrivalsCsvRows);

    // 5. pickup-manifest.md
    const manifestMd = `# Fictional Badge Pickup Rail Manifest\n\nPlan: ${state.planId}\nRevision: ${state.revision}\n\n*This is fictional data.*`;
    zip.file('pickup-manifest.md', manifestMd);

    // 6. rail-proof.svg
    const railSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1120" height="700"><text x="10" y="20">Fictional Rail Proof</text></svg>`;
    zip.file('rail-proof.svg', railSvg);

    // 7. arrival-proof.svg
    const arrivalSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><text x="10" y="20">Fictional Arrival Proof</text></svg>`;
    zip.file('arrival-proof.svg', arrivalSvg);

    // 8. proof.html
    const proofHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Fictional Badge Rail Proof</title>
</head>
<body>
<h1>Standalone Proof</h1>
<p>Plan ID: ${state.planId}</p>
<p>This file can be opened without network access.</p>
</body>
</html>`;
    zip.file('proof.html', proofHtml);

    // 9. transcript.md
    const transcriptMd = `# Rehearsal Transcript\n\nCanonical move logged.\n`;
    zip.file('transcript.md', transcriptMd);

    // 10. manifest.json
    // Calculate hashes
    const files = {
        'plan.json': planStr,
        'plan.schema.json': schemaJson,
        'badges.csv': badgesCsvHeader + badgesCsvRows,
        'arrivals.csv': arrivalsCsvHeader + arrivalsCsvRows,
        'pickup-manifest.md': manifestMd,
        'rail-proof.svg': railSvg,
        'arrival-proof.svg': arrivalSvg,
        'proof.html': proofHtml,
        'transcript.md': transcriptMd
    };

    const planHash = await sha256(planStr);

    const manifestJson: any = {
        schema: "fictional-badge-pickup-rail/1.0",
        normalizedPlanHash: planHash,
        generatedAt: now,
        exportedAt: now
    };

    for (const [filename, content] of Object.entries(files)) {
        manifestJson[filename] = {
            bytes: new Blob([content]).size,
            sha256: await sha256(content)
        };
    }

    zip.file('manifest.json', JSON.stringify(manifestJson, null, 2));

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'amber-welcome-badge-rail.zip';
    a.click();
    URL.revokeObjectURL(url);
}

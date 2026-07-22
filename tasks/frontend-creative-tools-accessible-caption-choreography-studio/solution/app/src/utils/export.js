const formatTimeVTT = (ms) => {
    const d = new Date(ms);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
};

const formatTimeSRT = (ms) => {
    const d = new Date(ms);
    return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}:${String(d.getUTCSeconds()).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`;
};

export const exportJSON = (project) => {
    const data = JSON.stringify({
        ...project,
        exportedAt: new Date().toISOString()
    }, null, 2);
    downloadFile(data, 'project.json', 'application/json');
};

export const exportVTT = (project) => {
    let content = "WEBVTT\n\n";
    project.cues.sort((a,b) => a.start - b.start).forEach(cue => {
        content += `${cue.id}\n`;
        content += `${formatTimeVTT(cue.start)} --> ${formatTimeVTT(cue.end)}\n`;
        const speakerTag = cue.speaker ? `<v ${cue.speaker}>` : '';
        const closingTag = cue.speaker ? `</v>` : '';
        content += `${speakerTag}${cue.text}${closingTag}\n\n`;
    });
    downloadFile(content, 'captions.vtt', 'text/vtt');
};

export const exportSRT = (project) => {
    let content = "";
    project.cues.sort((a,b) => a.start - b.start).forEach((cue, index) => {
        content += `${index + 1}\n`;
        content += `${formatTimeSRT(cue.start)} --> ${formatTimeSRT(cue.end)}\n`;
        content += `${cue.text}\n\n`;
    });
    downloadFile(content, 'captions.srt', 'text/srt');
};

export const exportSVG = (project) => {
    const width = 1000;
    const height = 200;
    const scale = width / project.mediaDuration;

    let content = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`;
    content += `<rect width="100%" height="100%" fill="#1a202c" />`;

    project.cues.forEach(cue => {
        const x = cue.start * scale;
        const w = (cue.end - cue.start) * scale;
        const y = 20 + (cue.lane * 50);
        content += `<rect x="${x}" y="${y}" width="${w}" height="30" fill="#3182ce" rx="4" />`;
        content += `<text x="${x + 5}" y="${y + 20}" fill="white" font-size="12" font-family="sans-serif">${cue.text}</text>`;
    });
    content += `</svg>`;
    downloadFile(content, 'cuemap.svg', 'image/svg+xml');
};

const downloadFile = (content, filename, contentType) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

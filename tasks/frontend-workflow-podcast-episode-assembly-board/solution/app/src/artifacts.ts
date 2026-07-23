// Artifact builders. Every companion artifact (CSV, VTT, RSS, Markdown, SVG)
// is a pure function of the cut state — byte-identical across re-exports.
// Only the canonical JSON carries an exportedAt stamp.
import {
  AppState, AUTOMATION_LANES, Instance, lerpAutomation, PUBLISH_DATE,
  SAMPLE_STEP, tokensOfSource, cutChecksum, episodeEnd, LaneType,
} from './store';

type S = Pick<AppState,
  'instances' | 'tokenState' | 'citations' | 'chapters' | 'automation' |
  'notes' | 'sources' | 'branch' | 'renderPipeline' | 'laneFlags' | 'approvals' | 'tokens'>;

const pad = (n: number, w: number) => String(n).padStart(w, '0');
export const vttTime = (ms: number) => {
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000),
    s = Math.floor((ms % 60000) / 1000), f = ms % 1000;
  return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}.${pad(f, 3)}`;
};

export interface EpisodeToken {
  id: string; text: string; included: boolean;
  episodeStart: number; episodeEnd: number; instanceId: string;
}

// derive episode-time tokens for every dialogue instance from its source range
export const deriveEpisodeTokens = (s: S): EpisodeToken[] => {
  const out: EpisodeToken[] = [];
  [...s.instances]
    .filter(i => i.lane === 'dialogue')
    .sort((a, b) => a.start - b.start)
    .forEach(inst => {
      tokensOfSource(inst.sourceId)
        .filter(t => t.start >= inst.sourceStart && t.end <= inst.sourceEnd)
        .forEach(t => {
          const st = s.tokenState[t.id];
          out.push({
            id: t.id,
            text: st?.correction?.text ?? t.text,
            included: st?.included ?? true,
            episodeStart: inst.start + (t.start - inst.sourceStart),
            episodeEnd: inst.start + (t.end - inst.sourceStart),
            instanceId: inst.id,
          });
        });
    });
  return out;
};

const canonicalJson = (s: S): string => JSON.stringify({
  schemaVersion: 'podcast-episode-package/v1',
  exportedAt: new Date().toISOString(),
  episode: { show: 'Side Street Signals', title: 'Night Market Economies', publishDate: PUBLISH_DATE },
  branch: s.branch,
  checksum: cutChecksum(s),
  notes: s.notes,
  instances: s.instances,
  chapters: s.chapters,
  citations: s.citations,
  tokenState: s.tokenState,
  automation: s.automation,
  rights: Object.fromEntries(s.sources.map(src => [src.id, {
    rightsState: src.rightsState, allowedUsage: src.allowedUsage, territory: src.territory,
    attribution: src.attribution, expiryDaysAfterPublish: src.expiryDaysAfterPublish,
  }])),
  approvals: Object.fromEntries(Object.entries(s.approvals).map(([k, v]) => [k, { status: v.status, checksum: v.checksum }])),
  render: { attempts: s.renderPipeline.attempts.length, outputs: s.renderPipeline.outputs },
}, null, 2);

const edlCsv = (s: S): string => {
  const rows = [...s.instances]
    .sort((a, b) => a.lane === b.lane ? a.start - b.start : a.lane.localeCompare(b.lane))
    .map((i: Instance) =>
      [i.id, i.sourceId, i.lane, i.start, i.end, i.sourceStart, i.sourceEnd, i.gain, i.fadeIn, i.fadeOut, i.mute, i.crossfade].join(','));
  return ['id,sourceId,lane,startMs,endMs,sourceInMs,sourceOutMs,gainDb,fadeInMs,fadeOutMs,mute,crossfade', ...rows].join('\n');
};

const transcriptCsv = (s: S): string => {
  const rows = deriveEpisodeTokens(s).map(t => {
    const st = s.tokenState[t.id];
    const prov = st?.correction ? `corrected by ${st.correction.by} (rev ${st.correction.rev}): ${st.correction.note}` : 'fixture';
    return [t.id, t.instanceId, `"${t.text}"`, t.included, t.episodeStart, t.episodeEnd, `"${prov}"`].join(',');
  });
  return ['tokenId,instanceId,text,included,episodeStartMs,episodeEndMs,provenance', ...rows].join('\n');
};

const webVtt = (s: S): string => {
  const toks = deriveEpisodeTokens(s).filter(t => t.included);
  const cues: string[] = [];
  for (let i = 0; i < toks.length; i += 4) {
    const group = toks.slice(i, i + 4);
    cues.push(`${vttTime(group[0].episodeStart)} --> ${vttTime(group[group.length - 1].episodeEnd)}\n${group.map(t => t.text).join(' ')}`);
  }
  return `WEBVTT\n\n${cues.join('\n\n')}\n`;
};

const rssXml = (s: S): string => {
  const durMs = episodeEnd(s.instances);
  const durSec = Math.round(durMs / 1000);
  const chapterTags = [...s.chapters].sort((a, b) => a.start - b.start)
    .map(c => `      <psc:chapter start="${vttTime(c.start)}" title="${c.title}" />`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:psc="http://podlove.org/simple-chapters">
  <channel>
    <title>Side Street Signals</title>
    <item>
      <title>Night Market Economies</title>
      <description>${s.notes}</description>
      <guid isPermaLink="false">sss-night-market-economies-${cutChecksum(s)}</guid>
      <pubDate>Sat, 01 Aug 2026 08:00:00 GMT</pubDate>
      <enclosure url="https://example.com/audio/night-market-economies.mp3" length="${durMs}" type="audio/mpeg" />
      <itunes:duration>${durSec}</itunes:duration>
${chapterTags}
    </item>
  </channel>
</rss>`;
};

const showNotesMd = (s: S): string => {
  const chapters = [...s.chapters].sort((a, b) => a.start - b.start)
    .map(c => `- **${vttTime(c.start)} — ${c.title}** (${c.role}): ${c.summary}`).join('\n');
  const cites = s.citations
    .map(c => `- ${c.label} — ${c.status === 'bound' && c.span ? `"${c.span.text}" [${c.span.startMs}–${c.span.endMs} ms in ${c.span.sourceId}]` : 'UNBOUND'}`)
    .join('\n');
  const speakers = [...new Set(s.chapters.flatMap(c => c.speakers))];
  const attributions = [...new Set(s.instances.map(i => i.sourceId))]
    .map(id => s.sources.find(x => x.id === id)!)
    .map(src => `- ${src.name}: ${src.attribution || '(missing attribution)'} — ${src.allowedUsage}, ${src.territory}, expires ${src.expiryDaysAfterPublish} days after ${PUBLISH_DATE}`)
    .join('\n');
  return `# Night Market Economies\n\n${s.notes}\n\n## Chapters\n\n${chapters}\n\n## Citations\n\n${cites}\n\n## Credits\n\n${speakers.map(x => `- ${x}`).join('\n')}\n\n## Attributions\n\n${attributions}\n`;
};

const LANE_COLORS: Record<string, string> = {
  dialogue: '#3b82f6', crosstalk: '#6366f1', music: '#ec4899', ambient: '#14b8a6', marker: '#eab308',
};

const timelineSvg = (s: S): string => {
  const W = 720, laneH = 34, span = 360000;
  const lanes: LaneType[] = ['dialogue', 'crosstalk', 'music', 'ambient', 'marker'];
  const rects = s.instances.map(i => {
    const y = lanes.indexOf(i.lane) * laneH + 20;
    const x = Math.round((i.start / span) * W);
    const w = Math.max(2, Math.round(((i.end - i.start) / span) * W));
    return `  <rect x="${x}" y="${y + 4}" width="${w}" height="${laneH - 8}" rx="3" fill="${LANE_COLORS[i.lane]}" opacity="${i.mute ? 0.35 : 0.9}" />`;
  }).join('\n');
  const laneLabels = lanes.map((l, idx) =>
    `  <text x="4" y="${idx * laneH + 18 + 16}" font-size="10" fill="#94a3b8" font-family="monospace">${l}</text>`).join('\n');
  const loudY = lanes.length * laneH + 40;
  const loudH = 80;
  const polys = AUTOMATION_LANES.map(lane => {
    const pts: string[] = [];
    for (let t = 0; t <= 300000; t += SAMPLE_STEP) {
      const v = lerpAutomation(s.automation[lane] ?? [], t);
      const x = Math.round((t / span) * W);
      const y = Math.round(loudY + ((v * -1) / 40) * loudH);
      pts.push(`${x},${y}`);
    }
    return `  <polyline points="${pts.join(' ')}" fill="none" stroke="${LANE_COLORS[lane]}" stroke-width="1.5" />`;
  }).join('\n');
  const H = loudY + loudH + 20;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0f172a" />
  <text x="4" y="14" font-size="11" fill="#e2e8f0" font-family="monospace">Side Street Signals — timeline + loudness report (checksum ${cutChecksum(s)})</text>
${laneLabels}
${rects}
  <text x="4" y="${loudY - 6}" font-size="10" fill="#94a3b8" font-family="monospace">loudness automation (0 to -40 dB)</text>
${polys}
</svg>`;
};

export const ARTIFACT_META: Record<string, { label: string; ext: string; mime: string }> = {
  'canonical-json': { label: 'Canonical JSON', ext: 'json', mime: 'application/json' },
  'edl-csv': { label: 'EDL CSV', ext: 'csv', mime: 'text/csv' },
  'transcript-csv': { label: 'Transcript Ledger CSV', ext: 'csv', mime: 'text/csv' },
  'webvtt': { label: 'WebVTT Transcript', ext: 'vtt', mime: 'text/vtt' },
  'rss-xml': { label: 'RSS Item XML', ext: 'xml', mime: 'application/rss+xml' },
  'show-notes-markdown': { label: 'Show Notes Markdown', ext: 'md', mime: 'text/markdown' },
  'timeline-svg': { label: 'Timeline + Loudness SVG', ext: 'svg', mime: 'image/svg+xml' },
};

export const buildArtifacts = (s: S): Record<string, string> => ({
  'canonical-json': canonicalJson(s),
  'edl-csv': edlCsv(s),
  'transcript-csv': transcriptCsv(s),
  'webvtt': webVtt(s),
  'rss-xml': rssXml(s),
  'show-notes-markdown': showNotesMd(s),
  'timeline-svg': timelineSvg(s),
});

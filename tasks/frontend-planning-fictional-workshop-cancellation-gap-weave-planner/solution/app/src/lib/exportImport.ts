import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useStore } from '../store';
import { format } from 'date-fns';

export const exportZip = async () => {
  const state = useStore.getState();
  const zip = new JSZip();
  const totalMinutes = 480; // 09:00 - 17:00

  // Basic naive string hash for verification only
  const naiveHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).toLowerCase();
  };

  // 2. schedule.json
  const scheduleJson = {
    schema: "fictional-workshop-gap-weave/1.0",
    fixtureId: state.scheduleId,
    date: state.date,
    timezone: state.timezone,
    offset: state.offset,
    operatingWindow: [state.operatingWindowStart, state.operatingWindowEnd],
    bookings: state.bookings,
    waitlist: state.waitlist,
    offers: state.offers,
    events: state.events,
    notes: state.notes,
    exportedAt: new Date().toISOString()
  };
  const scheduleStr = JSON.stringify(scheduleJson, null, 2);
  zip.file("schedule.json", scheduleStr);

  // 1. manifest.json
  const manifest = {
    schema: "fictional-workshop-gap-weave-manifest/1.0",
    generatedAt: new Date().toISOString(),
    hashes: {
      schedule: naiveHash(scheduleStr),
      resource: naiveHash(JSON.stringify(state.bookings))
    }
  };
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // 3. bookings.csv
  const bookingsCsvHeaders = "bookingId,sourceRequestId,participantToken,serviceId,status,benchId,serviceStartMinute,serviceEndMinute,setupMinutes,cleanupMinutes,occupancyStartMinute,occupancyEndMinute,facilitatorClaims,toolClaims,locked,flexStartMin,flexStartMax,revision";
  const bookingsCsvRows = [...state.bookings].sort((a, b) => a.id.localeCompare(b.id)).map(b =>
    `${b.id},${b.sourceRequestId || ''},${b.participantToken},${b.serviceId},${b.status},${b.benchId},${b.serviceStartMinute},${b.serviceEndMinute},${b.setupMinutes},${b.cleanupMinutes},${b.serviceStartMinute - b.setupMinutes},${b.serviceEndMinute + b.cleanupMinutes},${b.facilitatorClaims.join(';')},${b.toolClaims.join(';')},${b.locked},${b.flexStartMin},${b.flexStartMax},${b.revision}`
  ).join('\n');
  zip.file("bookings.csv", bookingsCsvHeaders + '\n' + bookingsCsvRows);

  // 4. waitlist.csv
  const waitlistCsvHeaders = "requestId,participantToken,serviceId,durationMinutes,setupMinutes,cleanupMinutes,windowStartMinute,windowEndMinute,acceptableBenchIds,facilitatorIds,toolIds,priority,joinedLogicalMinute,status,offerId,bookingId";
  const waitlistCsvRows = [...state.waitlist].sort((a, b) => a.id.localeCompare(b.id)).map(w =>
    `${w.id},${w.participantToken},${w.serviceId},${w.durationMinutes},${w.setupMinutes},${w.cleanupMinutes},${w.windowStartMinute},${w.windowEndMinute},${w.acceptableBenchIds.join(';')},${w.requiredFacilitator},${w.requiredTool},${w.priority},${w.joinedLogicalMinute},${w.status},${w.offerId || ''},`
  ).join('\n');
  zip.file("waitlist.csv", waitlistCsvHeaders + '\n' + waitlistCsvRows);

  // 5. studio-day.ics
  let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Lantern Print Workshop//Fictional Schedule//EN\r\nCALSCALE:GREGORIAN\r\n";
  const confirmedBookings = state.bookings.filter(b => b.status === 'confirmed' || b.status === 'active');
  confirmedBookings.sort((a, b) => a.serviceStartMinute - b.serviceStartMinute).forEach(b => {
    // Generate deterministic dates for the ICS
    // 09:00 local is minute 0.
    const startHour = 9 + Math.floor(b.serviceStartMinute / 60);
    const startMin = b.serviceStartMinute % 60;
    const endHour = 9 + Math.floor(b.serviceEndMinute / 60);
    const endMin = b.serviceEndMinute % 60;

    // YYYYMMDDTHHMMSSZ (Assuming mock timezone handling by just appending Z and ignoring actual UTC conversion for this simple deterministic output)
    const ds = `20270417T${startHour.toString().padStart(2, '0')}${startMin.toString().padStart(2, '0')}00Z`;
    const de = `20270417T${endHour.toString().padStart(2, '0')}${endMin.toString().padStart(2, '0')}00Z`;

    icsContent += "BEGIN:VEVENT\r\n";
    icsContent += `UID:${b.id}@lantern-workshop.invalid\r\n`;
    icsContent += `DTSTART:${ds}\r\n`;
    icsContent += `DTEND:${de}\r\n`;
    icsContent += `SUMMARY:Booking ${b.id}\r\n`;
    icsContent += `X-STUDIO-TZID:${state.timezone}\r\n`;
    icsContent += `X-LOCAL-START-MINUTE:${b.serviceStartMinute}\r\n`;
    icsContent += `X-SETUP-MINUTES:${b.setupMinutes}\r\n`;
    icsContent += `X-CLEANUP-MINUTES:${b.cleanupMinutes}\r\n`;
    icsContent += "END:VEVENT\r\n";
  });
  icsContent += "END:VCALENDAR\r\n";
  zip.file("studio-day.ics", icsContent);

  // 6. schedule.svg
  // 1600x900 SVG with three bench lanes, 09:00 to 17:00 ruler fixed mapping x is 120 plus minute/480 times 1360
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" width="1600" height="900" aria-label="Lantern Workshop Schedule">`;
  svg += `<rect width="1600" height="900" fill="white"/>`;
  svg += `<text x="40" y="40" font-family="sans-serif" font-size="24" font-weight="bold">LANTERN-PRINT-DAY-01</text>`;

  // Render Benches
  state.benches.forEach((bench, i) => {
    const y = 100 + (i * 200);
    svg += `<text x="40" y="${y + 20}" font-family="sans-serif" font-size="16">${bench}</text>`;
    svg += `<line x1="120" y1="${y}" x2="1480" y2="${y}" stroke="#ddd" stroke-width="2"/>`;

    // Render bookings on bench
    const benchBookings = state.bookings.filter(b => b.benchId === bench);
    benchBookings.forEach(b => {
      if (b.status === 'canceled') return;
      const x = 120 + (b.serviceStartMinute / totalMinutes) * 1360;
      const w = ((b.serviceEndMinute - b.serviceStartMinute) / totalMinutes) * 1360;
      const setupW = (b.setupMinutes / totalMinutes) * 1360;
      const cleanW = (b.cleanupMinutes / totalMinutes) * 1360;

      const fill = b.status === 'held' ? '#fef3c7' : '#d1fae5';
      const stroke = b.status === 'held' ? '#fbbf24' : '#34d399';

      // Setup
      if (b.setupMinutes > 0) svg += `<rect x="${x - setupW}" y="${y - 40}" width="${setupW}" height="80" fill="#f3f4f6" stroke="#9ca3af" opacity="0.8"/>`;
      // Service
      svg += `<rect id="${b.id}" x="${x}" y="${y - 40}" width="${w}" height="80" fill="${fill}" stroke="${stroke}" rx="4"/>`;
      svg += `<text x="${x + 5}" y="${y}" font-family="sans-serif" font-size="14" fill="#374151">${b.id}</text>`;
      // Cleanup
      if (b.cleanupMinutes > 0) svg += `<rect x="${x + w}" y="${y - 40}" width="${cleanW}" height="80" fill="#f3f4f6" stroke="#9ca3af" opacity="0.8"/>`;
    });
  });

  // Ruler
  svg += `<line x1="120" y1="750" x2="1480" y2="750" stroke="#9ca3af" stroke-width="2"/>`;
  [0, 120, 240, 360, 480].forEach(m => {
    const rx = 120 + (m / totalMinutes) * 1360;
    const time = `${9 + Math.floor(m/60)}:00`;
    svg += `<text x="${rx - 15}" y="775" font-family="sans-serif" font-size="14" fill="#6b7280">${time}</text>`;
  });

  svg += `</svg>`;
  zip.file("schedule.svg", svg);

  // 7. events.ndjson
  const ndjson = state.events.map(e => JSON.stringify(e)).join('\n');
  zip.file("events.ndjson", ndjson);

  // 8. handoff.md
  let md = `# LANTERN-PRINT-DAY-01 Handoff\n`;
  md += `Fictional workshop. No real bookings.\n`;
  md += `Schedule ID: ${state.scheduleId}\n`;
  md += `Date: ${state.date} (${state.timezone})\n`;
  md += `Revision: ${state.revision}\n\n`;
  md += `## Metrics\n`;
  md += `- Utilization: ${Math.round(state.bookings.reduce((sum, b) => sum + (b.status !== 'canceled' ? (b.serviceEndMinute - b.serviceStartMinute) : 0), 0) / (totalMinutes * state.benches.length) * 100)}%\n`;

  zip.file("handoff.md", md);

  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, 'lantern-workshop-gap-weave.zip');
};

export const parseZipImport = async (file: File) => {
  const zip = new JSZip();
  await zip.loadAsync(file);
  const scheduleFile = zip.file("schedule.json");
  if (scheduleFile) {
    const data = await scheduleFile.async('string');
    const schedule = JSON.parse(data);
    useStore.getState().importSchedule(schedule);
  }
};

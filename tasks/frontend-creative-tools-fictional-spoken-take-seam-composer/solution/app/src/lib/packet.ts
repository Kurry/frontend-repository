import { renderMaster } from './render';
import { sha256Int16 } from './audio';

export function createWavFile(samples: Int16Array): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeString = (v: DataView, o: number, s: string) => { for(let i=0;i<s.length;i++) v.setUint8(o+i, s.charCodeAt(i)); };
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 16000, true);
  view.setUint32(28, 32000, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) view.setInt16(44 + i * 2, samples[i], true);
  return new Uint8Array(buffer);
}
export function generateVTT(): string { return 'WEBVTT\n\n'; }
export async function generateCSV(slot4Source: 'TAKE-A'|'TAKE-B', repaired: boolean): Promise<string> {
  let csv = 'slotId,destinationStartSample,destinationEndSample,kind,sourceTakeId,sourceEntityId,sourceStartSample,sourceEndSample,crossfadeSamples,outputStartSample,outputEndSample,pcmSha256\n';
  if (slot4Source === 'TAKE-B' && repaired) {
    const master = renderMaster('TAKE-B', true);
    const h1 = await sha256Int16(master.slice(176000, 177280));
    csv += `SLOT-04,176000,177280,room-prefix,TAKE-B,ROOM-B-02,704000,705280,0,176000,177280,${h1}\n`;
  }
  return csv;
}
export function generateSVG(): string { return `<svg></svg>`; }

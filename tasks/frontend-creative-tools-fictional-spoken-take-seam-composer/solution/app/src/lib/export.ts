import JSZip from 'jszip';
import { createWavFile, generateVTT, generateCSV, generateSVG } from './packet';
import { renderMaster } from './render';
import { useStore } from '../store/useStore';
export async function exportPacket() {
  const state = useStore.getState();
  const zip = new JSZip();
  const renderedAudio = renderMaster(state.slot4Source, state.repaired);
  zip.file('master.wav', createWavFile(renderedAudio));
  zip.file('project.json', JSON.stringify({schema:"fictional-spoken-seam/1.0", slot4Source: state.slot4Source}));
  zip.file('master-transcript.vtt', generateVTT());
  zip.file('edit-decisions.csv', await generateCSV(state.slot4Source, state.repaired));
  zip.file('seam-map.svg', generateSVG());
  zip.file('review.md', "# Review");
  zip.file('events.ndjson', "");
  zip.file('manifest.json', JSON.stringify({schema:"fictional-spoken-seam-manifest/1.0"}));
  const content = await zip.generateAsync({ type: 'blob' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(content);
  a.download = 'lantern-workshop-spoken-seam.zip';
  a.click();
}

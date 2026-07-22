import JSZip from 'jszip';
import { useStore } from '../store';

export async function importArtifact(file: File) {
  try {
    const zip = await JSZip.loadAsync(file);
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) throw new Error("Missing manifest.json");

    const projectJsonFile = zip.file('print-run-project.json');
    if (!projectJsonFile) throw new Error("Missing print-run-project.json");

    const content = await projectJsonFile.async('string');
    const parsed = JSON.parse(content);

    // In a real impl, strict schema validation occurs here.
    useStore.setState({
      poster: parsed.poster,
      passes: parsed.passes,
      inkSources: parsed.inkSources,
      intervals: parsed.intervals,
      cells: parsed.cells,
      decisions: parsed.decisions,
      annotations: parsed.annotations,
      approval: parsed.approval,
      events: parsed.events,
      logicalTick: parsed.logicalTick,
      orderHash: parsed.orderHash,
      cellProofHash: parsed.cellProofHash,
      scheduleHash: parsed.scheduleHash
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

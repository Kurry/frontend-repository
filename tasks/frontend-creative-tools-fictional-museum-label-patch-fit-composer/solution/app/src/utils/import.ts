import JSZip from 'jszip';
import { useStore } from '../store/index';
import { sha256 } from 'js-sha256';

export const importPacket = async (file: File) => {
  const isZip = file.name.endsWith('.zip');
  const isJson = file.name.endsWith('.json');

  if (!isZip && !isJson) {
    throw new Error("Invalid file type. Please upload a .zip or .json file.");
  }

  let projectData: any = null;

  if (isJson) {
    const text = await file.text();
    projectData = JSON.parse(text);
  } else if (isZip) {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Validate manifest and hashes
    const manifestFile = zip.file('manifest.json');
    if (!manifestFile) throw new Error("Missing manifest.json");

    const manifestStr = await manifestFile.async('string');
    const manifest = JSON.parse(manifestStr);

    for (const [filename, meta] of Object.entries(manifest.files) as any) {
      const entry = zip.file(filename);
      if (!entry) throw new Error(`Missing file referenced in manifest: ${filename}`);

      const data = await entry.async('uint8array');
      const hash = sha256(data);
      if (hash !== meta.hash) {
        throw new Error(`Hash mismatch for ${filename}. Expected ${meta.hash}, got ${hash}`);
      }
    }

    const projectFile = zip.file('label-project.json');
    if (!projectFile) throw new Error("Missing label-project.json");
    projectData = JSON.parse(await projectFile.async('string'));
  }

  // Atomic restore
  if (projectData && projectData.schema === 'fictional-museum-label-project-v1') {
    useStore.setState({
      logicalClock: projectData.logicalClock,
      revisions: projectData.revisions,
      patches: projectData.patches,
      comments: projectData.comments,
      sources: projectData.sources,
      glossary: projectData.glossary,
      events: projectData.events
      // Additional state restoration if needed (e.g. selection, filters)
    });
    console.log("Import successful!");
  } else {
    throw new Error("Invalid project data schema.");
  }
};

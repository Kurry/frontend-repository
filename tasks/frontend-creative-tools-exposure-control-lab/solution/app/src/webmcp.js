import { renderEditedPNG } from './canvas-render.js'
import {
  ExposurePresetSchema,
  apertureStops, shutterStops, isoStops, lookTags,
  nearestStop
} from './domain.js'

const CONTRACT_VERSION = 'zto-webmcp-v1'
const MODULES = [
  'command-session-v1',
  'structured-editor-v1',
  'entity-collection-v1',
  'artifact-transfer-v1'
]

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val))
}

function presetSummary(p) {
  return `${p.name} (f/${p.aperture}, 1/${p.shutter}, ISO ${p.iso}, ${p.lookTag}${p.favorite ? ', favorite' : ''})`
}

// Every handler below calls the same Pinia store logic the visible UI uses --
// a WebMCP invocation and the equivalent on-screen control produce identical
// state, so dials, presets, and the Export panel can never diverge.
export function registerWebMCP(store) {
  if (typeof window === 'undefined') return

  // ---- command-session-v1 --------------------------------------------------

  function sessionStart() {
    store.sessionRunning = true
    store.activeMode = 'Meter/Lab'
    store.toast('Session started')
    return { ok: true, summary: 'Session started: the lab is running in Meter/Lab mode and the stopped banner is hidden.' }
  }

  function sessionStop() {
    store.sessionRunning = false
    return { ok: true, summary: 'Session stopped: the "Session stopped" banner is now visible over the preview. Call session_start (or press Resume) to continue.' }
  }

  function sessionRestart() {
    store.resetToSeed()
    store.sessionRunning = true
    store.toast('Session restarted to seeded state')
    return { ok: true, summary: 'Session restarted: dials reset to f/16, 1/60, ISO 100, sliders to defaults, and the seeded presets/snapshots are restored.' }
  }

  function sessionAdvance() {
    store.activeMode = store.activeMode === 'Meter/Lab' ? 'Presets/Compare' : 'Meter/Lab'
    return { ok: true, summary: `Advanced to the ${store.activeMode} mode.` }
  }

  // ---- structured-editor-v1 ------------------------------------------------

  function editorSelect(args) {
    if (args.object_type !== 'exposure') {
      return { ok: false, error: `Unknown object type "${args.object_type}". The only editor object type is "exposure".` }
    }
    store.editorSelected = 'exposure'
    return {
      ok: true,
      summary: 'Exposure selected: the three dials now show a selection ring.',
      exposure: { aperture: store.aperture, shutter: store.shutter, iso: store.iso, ev: Number(store.ev.toFixed(2)) }
    }
  }

  function editorUpdateProperty(args) {
    if (args.object_type !== 'exposure') {
      return { ok: false, error: `Unknown object type "${args.object_type}". The only editor object type is "exposure".` }
    }
    const props = args.properties || {}
    const applied = []
    store.mutate('webmcp_editor_update_property', () => {
      for (const [key, val] of Object.entries(props)) {
        if (key === 'stop' && val && typeof val === 'object') {
          if (typeof val.aperture === 'number') { store.aperture = nearestStop(apertureStops, val.aperture); applied.push(`aperture=${store.aperture}`) }
          if (typeof val.shutter === 'number') { store.shutter = nearestStop(shutterStops, val.shutter); applied.push(`shutter=${store.shutter}`) }
          if (typeof val.iso === 'number') { store.iso = nearestStop(isoStops, val.iso); applied.push(`iso=${store.iso}`) }
        } else if (key === 'brightness' || key === 'exposure') {
          store.light.exposure = clamp(Math.round(Number(val)), -100, 100)
          applied.push(`light.exposure=${store.light.exposure}`)
        } else if (key in store.light) {
          store.light[key] = clamp(Math.round(Number(val)), -100, 100)
          applied.push(`light.${key}=${store.light[key]}`)
        } else if (key in store.effects) {
          const min = (key === 'vignette' || key === 'grain') ? 0 : -100
          store.effects[key] = clamp(Math.round(Number(val)), min, 100)
          applied.push(`effects.${key}=${store.effects[key]}`)
        } else if (key === 'look') {
          store.activeLook = (val === null || ['Punch', 'Matte', 'Golden', 'Mono'].includes(val)) ? val : store.activeLook
          applied.push(`look=${store.activeLook}`)
        } else if (key === 'aperture') {
          store.aperture = nearestStop(apertureStops, Number(val)); applied.push(`aperture=${store.aperture}`)
        } else if (key === 'shutter') {
          store.shutter = nearestStop(shutterStops, Number(val)); applied.push(`shutter=${store.shutter}`)
        } else if (key === 'iso') {
          store.iso = nearestStop(isoStops, Number(val)); applied.push(`iso=${store.iso}`)
        }
      }
    })
    store.editorSelected = 'exposure'
    return {
      ok: true,
      summary: `Exposure updated (${applied.join(', ') || 'no changes'}); dials, preview, meter, EV, histogram, and Export panel all reflect the new state.`,
      exposure: { aperture: store.aperture, shutter: store.shutter, iso: store.iso, ev: Number(store.ev.toFixed(2)) }
    }
  }

  function editorPreview() {
    return {
      ok: true,
      summary: 'Current exposure state read without changing anything.',
      exposure: {
        aperture: store.aperture,
        shutter: store.shutter,
        iso: store.iso,
        ev: Number(store.ev.toFixed(2)),
        light: { ...store.light },
        effects: { ...store.effects },
        look: store.activeLook
      }
    }
  }

  // ---- entity-collection-v1 ------------------------------------------------

  function findPreset(args) {
    const name = args.id ?? args.fields?.name
    if (typeof name !== 'string') return null
    return store.presets.find(p => p.name === name) || null
  }

  function entityCreate(args) {
    if (args.entity !== 'preset') {
      return { ok: false, error: `Unknown entity "${args.entity}". The only entity type is "preset".` }
    }
    const candidate = {
      name: typeof args.fields?.name === 'string' ? args.fields.name : '',
      aperture: args.fields?.aperture,
      shutter: args.fields?.shutter,
      iso: args.fields?.iso,
      lookTag: args.fields?.lookTag,
      favorite: args.fields?.favorite === true
    }
    const result = ExposurePresetSchema.safeParse(candidate)
    if (!result.success) {
      const details = result.error.issues.map(i => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')
      return { ok: false, error: `Preset not created. ${details}` }
    }
    if (store.presets.some(p => p.name === result.data.name)) {
      return { ok: false, error: `Preset not created. Name must be unique — "${result.data.name}" is already used by another preset.` }
    }
    store.mutate('webmcp_entity_create', () => {
      store.presets.push(result.data)
    })
    store.toast(`Preset "${result.data.name}" created`)
    return { ok: true, summary: `Preset created: ${presetSummary(result.data)}. It now appears in the Presets/Compare list and in the Export panel presets array.`, count: store.presets.length }
  }

  function entitySelect(args) {
    if (args.entity !== 'preset') {
      return { ok: false, error: `Unknown entity "${args.entity}". The only entity type is "preset".` }
    }
    const preset = findPreset(args)
    if (!preset) return { ok: false, error: `No preset named "${args.id ?? args.fields?.name}".` }
    // Same store mutation as the visible Apply button on the preset row.
    store.mutate('webmcp_entity_select', () => {
      store.aperture = preset.aperture
      store.shutter = preset.shutter
      store.iso = preset.iso
    })
    store.toast(`Applied preset "${preset.name}"`)
    return { ok: true, summary: `Preset "${preset.name}" applied: dials now read f/${store.aperture}, 1/${store.shutter}, ISO ${store.iso} and the preview, meter, EV, and histogram match.` }
  }

  function entityUpdate(args) {
    if (args.entity !== 'preset') {
      return { ok: false, error: `Unknown entity "${args.entity}". The only entity type is "preset".` }
    }
    const preset = findPreset(args)
    if (!preset) return { ok: false, error: `No preset named "${args.id ?? args.fields?.name}".` }
    const merged = { ...preset, ...(args.fields || {}) }
    const result = ExposurePresetSchema.safeParse(merged)
    if (!result.success) {
      const details = result.error.issues.map(i => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')
      return { ok: false, error: `Preset not updated. ${details}` }
    }
    if (store.presets.some(p => p.name === result.data.name && p.name !== preset.name)) {
      return { ok: false, error: `Preset not updated. Name must be unique — "${result.data.name}" is already used by another preset.` }
    }
    store.mutate('webmcp_entity_update', () => {
      Object.assign(preset, result.data)
    })
    store.toast(`Preset "${preset.name}" updated`)
    return { ok: true, summary: `Preset updated: ${presetSummary(preset)}. The list row and Export panel show the new values.`, count: store.presets.length }
  }

  function entityDelete(args) {
    if (args.entity !== 'preset') {
      return { ok: false, error: `Unknown entity "${args.entity}". The only entity type is "preset".` }
    }
    if (args.confirm !== true) {
      return { ok: false, error: 'Delete requires confirm=true. Re-invoke with confirm=true to delete the preset.' }
    }
    const name = args.id ?? args.fields?.name
    if (!store.presets.some(p => p.name === name)) {
      return { ok: false, error: `No preset named "${name}".` }
    }
    store.mutate('webmcp_entity_delete', () => {
      store.presets = store.presets.filter(p => p.name !== name)
    })
    store.toast(`Preset "${name}" deleted`)
    return { ok: true, summary: `Preset "${name}" deleted; the list and Export panel no longer include it.`, count: store.presets.length }
  }

  function entityToggle(args) {
    if (args.entity !== 'preset') {
      return { ok: false, error: `Unknown entity "${args.entity}". The only entity type is "preset".` }
    }
    const preset = findPreset(args)
    if (!preset) return { ok: false, error: `No preset named "${args.id ?? args.fields?.name}".` }
    store.mutate('webmcp_entity_toggle', () => {
      preset.favorite = !preset.favorite
    })
    return { ok: true, summary: `Preset "${preset.name}" is ${preset.favorite ? 'now a favorite (badge visible)' : 'no longer a favorite'}.`, favorite: preset.favorite }
  }

  // ---- artifact-transfer-v1 --------------------------------------------------

  async function artifactExport(args) {
    if (args.format === 'json') {
      // The lab-package is the settings payload (configuration, not artifact
      // media) -- returning it as text lets automation verify the session.
      return { ok: true, format: 'json', name: 'exposure-lab-package.json', package: store.labPackageJson }
    }
    if (args.format === 'png') {
      // artifact-transfer-v1 forbids base64/artifact contents in WebMCP
      // results, so the rendered PNG is downloaded here (same pipeline and
      // filename as the visible Download edited PNG control) rather than
      // returned to the caller.
      const dataUrl = await renderEditedPNG(store.currentLabState)
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = 'exposure-lab-edit.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return { ok: true, format: 'png', downloaded: 'exposure-lab-edit.png' }
    }
    return { ok: false, error: `Unknown export format "${args.format}". Supported formats: json, png.` }
  }

  function artifactImport(args) {
    if (args.mode !== 'lab-package') {
      return { ok: false, error: `Unknown import mode "${args.mode}". The only import mode is "lab-package".` }
    }
    try {
      const pkg = typeof args.payload === 'string' ? JSON.parse(args.payload) : args.payload
      store.loadLabPackage(pkg)
    } catch (err) {
      // A real error, not a fake success: the session state is untouched and
      // the caller sees exactly what to fix.
      return { ok: false, error: `Import failed. ${err.message} Fix the named fields and import again.` }
    }
    store.toast('Imported lab package')
    return { ok: true, summary: `Lab package imported: dials read f/${store.aperture}, 1/${store.shutter}, ISO ${store.iso}; ${store.presets.length} presets and ${store.snapshots.length} snapshots restored; Export panel shows the imported JSON.` }
  }

  async function artifactCopy() {
    // Same clipboard path as the visible Copy control in the Export panel.
    try {
      await navigator.clipboard.writeText(store.labPackageJson)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = store.labPackageJson
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    store.toast('Copied lab package')
    return { ok: true, summary: 'Lab package JSON copied to the clipboard (same text as the Export panel).' }
  }

  // ---- registry --------------------------------------------------------------

  const TOOLS = [
    { name: 'session_start', description: 'Start (or resume) the lab session: hides the stopped banner and shows the Meter/Lab mode.', handler: sessionStart },
    { name: 'session_stop', description: 'Stop the lab session: shows a visible "Session stopped" banner over the preview.', handler: sessionStop },
    { name: 'session_restart', description: 'Restart the session: resets dials to f/16, 1/60, ISO 100, sliders to defaults, and restores the seeded presets and snapshots.', handler: sessionRestart },
    { name: 'session_advance', description: 'Advance to the next interaction mode (toggles Meter/Lab and Presets/Compare).', handler: sessionAdvance },
    { name: 'editor_select', description: 'Select an editor object. args.object_type must be "exposure"; shows a selection ring on the dials.', handler: editorSelect },
    { name: 'editor_update_property', description: 'Update exposure properties via the same store mutation the UI uses. args.object_type="exposure"; args.properties may include stop {aperture, shutter, iso}, brightness/exposure, contrast, highlights, shadows, whites, blacks, texture, clarity, vignette, grain, look, aperture, shutter, iso.', handler: editorUpdateProperty },
    { name: 'editor_preview', description: 'Read the current exposure state (stops, EV, light, effects, look) without changing anything.', handler: editorPreview },
    { name: 'entity_create', description: 'Create a preset. args.entity="preset"; args.fields: name (unique, 1-40 chars), aperture, shutter, iso, lookTag (soft/crisp/grainy/night/daylight/cinematic), favorite (optional). Invalid fields return an error and create nothing.', handler: entityCreate },
    { name: 'entity_select', description: 'Apply a saved preset to the dials (same as the visible Apply button). args.entity="preset"; args.id is the preset name.', handler: entitySelect },
    { name: 'entity_update', description: 'Update an existing preset. args.entity="preset"; args.id is the current name; args.fields are the new field values (validated like create).', handler: entityUpdate },
    { name: 'entity_delete', description: 'Delete a preset. args.entity="preset"; args.id is the preset name; requires args.confirm=true.', handler: entityDelete },
    { name: 'entity_toggle', description: 'Toggle the favorite flag on a preset. args.entity="preset"; args.id is the preset name.', handler: entityToggle },
    { name: 'artifact_export', description: 'Export an artifact. args.format="json" returns the live lab-package JSON; args.format="png" downloads the edited image as exposure-lab-edit.png.', handler: artifactExport },
    { name: 'artifact_import', description: 'Import a lab package. args.mode="lab-package"; args.payload is the package JSON (string or object). Invalid payloads return an error and leave the session untouched.', handler: artifactImport },
    { name: 'artifact_copy', description: 'Copy the current lab-package JSON to the clipboard, same as the visible Copy control.', handler: artifactCopy }
  ]

  window.webmcp_session_info = () => ({
    contract_version: CONTRACT_VERSION,
    modules: [...MODULES],
    tools: TOOLS.map(t => t.name)
  })

  window.webmcp_list_tools = () => TOOLS.map(t => ({ name: t.name, description: t.description }))

  window.webmcp_invoke_tool = (name, args = {}) => {
    const tool = TOOLS.find(t => t.name === name)
    if (!tool) return { ok: false, error: `Unknown tool "${name}". Use webmcp_list_tools to see registered tools.` }
    try {
      return tool.handler(args || {})
    } catch (err) {
      return { ok: false, error: String(err) }
    }
  }
}

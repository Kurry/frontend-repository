import { useStore } from './store.js'

export function registerWebMCP(store) {
  if (typeof window === 'undefined') return

  // command-session-v1
  window.webmcp_session_start = () => { store.activeMode = 'Meter/Lab'; return true }
  window.webmcp_session_stop = () => { store.activeMode = 'Meter/Lab'; return true }
  window.webmcp_session_restart = () => { store.resetToSeed(); return true }
  window.webmcp_session_advance = () => { return true }

  // structured-editor-v1
  window.webmcp_editor_select = (args) => {
    if (args.object_type === 'exposure') return true
    return false
  }
  window.webmcp_editor_update_property = (args) => {
    if (args.object_type !== 'exposure') return false
    store.mutate('webmcp_editor_update_property', () => {
      for (const [key, val] of Object.entries(args.properties)) {
        if (key === 'stop' && args.properties.stop) {
           if (args.properties.stop.aperture) store.aperture = args.properties.stop.aperture
           if (args.properties.stop.shutter) store.shutter = args.properties.stop.shutter
           if (args.properties.stop.iso) store.iso = args.properties.stop.iso
        }
        else if (key in store.light) store.light[key] = val
        else if (key in store.effects) store.effects[key] = val
        else if (key === 'look') store.activeLook = val
        else if (key === 'aperture') store.aperture = val
        else if (key === 'shutter') store.shutter = val
        else if (key === 'iso') store.iso = val
      }
    })
    return true
  }
  window.webmcp_editor_preview = () => { return true }

  // entity-collection-v1
  window.webmcp_entity_create = (args) => {
    if (args.entity !== 'preset') return false
    store.mutate('webmcp_entity_create', () => {
      store.presets.push(args.fields)
    })
    return true
  }
  window.webmcp_entity_select = () => { return true }
  window.webmcp_entity_update = (args) => {
    if (args.entity !== 'preset') return false
    store.mutate('webmcp_entity_update', () => {
      const idx = store.presets.findIndex(p => p.name === args.id || p.name === args.fields?.name)
      if (idx !== -1 && args.fields) {
        Object.assign(store.presets[idx], args.fields)
      }
    })
    return true
  }
  window.webmcp_entity_delete = (args) => {
    if (args.entity !== 'preset' || !args.confirm) return false
    store.mutate('webmcp_entity_delete', () => {
      store.presets = store.presets.filter(p => p.name !== args.id)
    })
    return true
  }
  window.webmcp_entity_toggle = (args) => {
    if (args.entity !== 'preset') return false
    store.mutate('webmcp_entity_toggle', () => {
      const idx = store.presets.findIndex(p => p.name === args.id)
      if (idx !== -1) {
        store.presets[idx].favorite = !store.presets[idx].favorite
      }
    })
    return true
  }

  // artifact-transfer-v1
  window.webmcp_artifact_export = (args) => {
    if (args.format === 'json') return store.labPackageJson
    if (args.format === 'png') {
       const canvas = document.createElement('canvas')
       return canvas.toDataURL()
    }
    return false
  }
  window.webmcp_artifact_import = (args) => {
    if (args.mode === 'lab-package') {
      try {
        const pkg = typeof args.payload === 'string' ? JSON.parse(args.payload) : args.payload
        store.loadLabPackage(pkg)
        return true
      } catch(e) {
        return false
      }
    }
    return false
  }
  window.webmcp_artifact_copy = () => { return true }
}

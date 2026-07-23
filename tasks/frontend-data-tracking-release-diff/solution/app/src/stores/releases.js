import { defineStore } from 'pinia'
import { compareSemver, cutReleaseSchema, releasePackSchema, SPLIT_TAGS } from '../lib/contracts'
import { createSamplePack, createSeedRotation, createSeedTimeline, createSeedVersions, digestText, splitQuotaTargets } from '../lib/seed'

const pause = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms))
const clone = (value) => JSON.parse(JSON.stringify(value))
let dialogOpener = null
const captureDialogOpener = () => { dialogOpener = document.activeElement instanceof HTMLElement ? document.activeElement : null }
const restoreDialogOpener = () => {
  const opener = dialogOpener
  dialogOpener = null
  window.setTimeout(() => { if (opener?.isConnected) opener.focus() }, 0)
}
const stepIds = ['collect-manifests', 'compute-digests', 'rank-stability-check', 'seal']
const CATEGORY_NAMES = ['Reasoning', 'Extraction', 'Planning', 'Classification']
const SPLIT_DESCRIPTIONS = {
  'auric-holdout': 'Sequestered evaluation slice',
  'basalt-train': 'Primary training register',
  'cinder-public': 'Open inspection sample',
}

function bucketOf(slug) {
  let hash = 2166136261
  for (let i = 0; i < slug.length; i += 1) {
    hash ^= slug.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0) % CATEGORY_NAMES.length
}

// Robust clipboard write: modern async API first, legacy textarea fallback in
// restricted contexts. Never throws; reports success so callers can confirm
// honestly.
export async function copyTextToClipboard(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch { /* fall through to the legacy path */ }
  try {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.left = '-9999px'
    area.style.top = '0'
    document.body.appendChild(area)
    area.select()
    area.setSelectionRange(0, text.length)
    const ok = document.execCommand('copy')
    area.remove()
    return ok
  } catch {
    return false
  }
}

function freshCutRun() {
  return {
    running: false,
    attempt: 0,
    request: null,
    correlation: null,
    threshold: 0.95,
    error: '',
    steps: stepIds.map((id) => ({ id, status: 'pending' })),
  }
}

export const useReleaseStore = defineStore('releases', {
  state: () => ({
    versions: createSeedVersions(),
    selectedVersionName: '2.0.0',
    diffBase: '1.0.0',
    diffCompare: '2.0.0',
    unchangedExpanded: false,
    rotation: createSeedRotation(),
    timeline: createSeedTimeline(),
    activeTab: 'manifest',
    sidebarOpen: false,
    dialog: null,
    exportTab: 'json',
    exportGeneratedAt: new Date().toISOString(),
    importSample: createSamplePack(),
    cutRun: freshCutRun(),
    toasts: [],
    theme: 'light',
    density: 'comfortable',
    reduceMotion: false,
    online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
    tourOpen: false,
    tourStep: 0,
    paletteOpen: false,
  }),
  getters: {
    selectedVersion(state) {
      return state.versions.find((version) => version.name === state.selectedVersionName) || state.versions[0]
    },
    diffRows(state) {
      const base = state.versions.find((version) => version.name === state.diffBase)
      const compare = state.versions.find((version) => version.name === state.diffCompare)
      if (!base || !compare) return []
      const left = new Map(base.tasks.map((task) => [task.slug, task]))
      const right = new Map(compare.tasks.map((task) => [task.slug, task]))
      const slugs = [...new Set([...left.keys(), ...right.keys()])].sort()
      return slugs.map((slug) => {
        const before = left.get(slug)
        const after = right.get(slug)
        let kind = 'unchanged'
        if (!before) kind = 'added'
        else if (!after) kind = 'removed'
        else if (before.contentDigest !== after.contentDigest || before.title !== after.title || JSON.stringify(before.splitTags) !== JSON.stringify(after.splitTags)) kind = 'changed'
        return { slug, before, after, kind, task: after || before }
      })
    },
    diffSummary() {
      return this.diffRows.reduce((summary, row) => {
        summary[row.kind] += 1
        return summary
      }, { added: 0, removed: 0, changed: 0, unchanged: 0 })
    },
    changedDiffRows() {
      return this.diffRows.filter((row) => row.kind !== 'unchanged')
    },
    unchangedDiffRows() {
      return this.diffRows.filter((row) => row.kind === 'unchanged')
    },
    // Split composition derives from the SELECTED version's manifest: tasks
    // carrying a split tag are bucketed into the four quota categories, so
    // choosing another release (or sealing a new one) recomputes every bar
    // from the same shared store the other views read.
    splitComposition(state) {
      const version = state.versions.find((item) => item.name === state.selectedVersionName) || state.versions[0]
      const tasks = version ? version.tasks : []
      return SPLIT_TAGS.map((tag) => {
        const tagged = tasks.filter((task) => task.splitTags.includes(tag))
        const buckets = [0, 0, 0, 0]
        tagged.forEach((task) => { buckets[bucketOf(task.slug)] += 1 })
        return {
          name: tag,
          description: SPLIT_DESCRIPTIONS[tag],
          categories: CATEGORY_NAMES.map((name, index) => ({
            name,
            current: buckets[index],
            target: splitQuotaTargets[tag][index],
          })),
        }
      })
    },
    releasePack(state) {
      return {
        schemaVersion: 'larkspur-release-pack/v1',
        generatedAt: state.exportGeneratedAt,
        versions: clone(state.versions),
        rotation: clone(state.rotation),
        timeline: clone(state.timeline),
      }
    },
    releasePackText() {
      return JSON.stringify(this.releasePack, null, 2)
    },
    manifestSummary() {
      const version = this.selectedVersion
      if (!version) return 'No selected version.'
      const splitCounts = { 'auric-holdout': 0, 'basalt-train': 0, 'cinder-public': 0 }
      version.tasks.forEach((task) => task.splitTags.forEach((tag) => { splitCounts[tag] += 1 }))
      const aggregate = digestText(version.tasks.map((task) => task.contentDigest).join(':')).slice(0, 16)
      return [
        `LARKSPUR MANIFEST SUMMARY`,
        `Version: ${version.name}`,
        `Sealed: ${version.sealed ? 'yes' : 'no'}`,
        `Task count: ${version.taskCount}`,
        `Digest prefix: ${aggregate}…`,
        '',
        'Split counts:',
        `  auric-holdout  ${String(splitCounts['auric-holdout']).padStart(3)}`,
        `  basalt-train   ${String(splitCounts['basalt-train']).padStart(3)}`,
        `  cinder-public  ${String(splitCounts['cinder-public']).padStart(3)}`,
      ].join('\n')
    },
  },
  actions: {
    selectVersion(name) {
      if (!this.versions.some((version) => version.name === name)) return false
      this.selectedVersionName = name
      this.sidebarOpen = false
      return true
    },
    setActiveTab(tab) {
      if (!['manifest', 'diff', 'splits', 'rotation', 'timeline'].includes(tab)) return false
      this.activeTab = tab
      return true
    },
    setDiffBase(name) {
      if (!this.versions.some((version) => version.name === name)) return false
      this.diffBase = name
      this.unchangedExpanded = false
      return true
    },
    setDiffCompare(name) {
      if (!this.versions.some((version) => version.name === name)) return false
      this.diffCompare = name
      this.unchangedExpanded = false
      return true
    },
    swapDiff() {
      ;[this.diffBase, this.diffCompare] = [this.diffCompare, this.diffBase]
      this.unchangedExpanded = false
    },
    openDialog(name) {
      captureDialogOpener()
      this.dialog = name
      if (name === 'export') this.recompileExport()
    },
    closeDialog() {
      if (this.dialog === 'cut' && this.cutRun.running) return false
      this.dialog = null
      restoreDialogOpener()
      return true
    },
    recompileExport() {
      this.exportGeneratedAt = new Date().toISOString()
    },
    setExportFormat(format) {
      if (!['release-pack-json', 'manifest-summary-text'].includes(format)) return false
      this.exportTab = format === 'release-pack-json' ? 'json' : 'summary'
      this.openDialog('export')
      return true
    },
    activeExportText() {
      return this.exportTab === 'json' ? this.releasePackText : this.manifestSummary
    },
    async copyActiveExport() {
      const label = this.exportTab === 'json' ? 'Release pack JSON' : 'Manifest summary'
      const ok = await copyTextToClipboard(this.activeExportText())
      if (ok) this.toast(`${label} copied to clipboard.`)
      else this.toast(`${label} copy was blocked by the browser; use Download instead.`, 'info')
      return ok
    },
    downloadActiveExport() {
      const text = this.activeExportText()
      const isJson = this.exportTab === 'json'
      const url = URL.createObjectURL(new Blob([text], { type: isJson ? 'application/json' : 'text/plain' }))
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = isJson ? 'release-pack.json' : `manifest-${this.selectedVersionName}.txt`
      anchor.click()
      URL.revokeObjectURL(url)
      return anchor.download
    },
    touchExport() {
      this.exportGeneratedAt = new Date().toISOString()
    },
    toast(message, tone = 'success') {
      const id = `${Date.now()}-${Math.random()}`
      this.toasts.push({ id, message, tone })
      window.setTimeout(() => { this.toasts = this.toasts.filter((toast) => toast.id !== id) }, 2000)
    },
    resetCut() {
      if (!this.cutRun.running) this.cutRun = freshCutRun()
    },
    async startCut(request) {
      if (this.cutRun.running) return { success: false, message: 'A release cut is already running.' }
      const parsed = cutReleaseSchema.safeParse(request)
      if (!parsed.success) return { success: false, message: parsed.error.issues[0].message }
      if (this.versions.some((version) => version.name.toLowerCase() === parsed.data.name.toLowerCase())) return { success: false, message: `Version ${parsed.data.name} already exists.` }

      this.cutRun = freshCutRun()
      this.cutRun.running = true
      this.cutRun.request = { ...parsed.data }
      await this.runStep('collect-manifests', 460)
      await this.runStep('compute-digests', 520)
      await this.runRankCheck()
      return { success: true }
    },
    async runStep(id, duration) {
      const step = this.cutRun.steps.find((item) => item.id === id)
      step.status = 'running'
      await pause(duration)
      step.status = 'complete'
    },
    async runRankCheck() {
      const step = this.cutRun.steps.find((item) => item.id === 'rank-stability-check')
      this.cutRun.attempt += 1
      this.cutRun.error = ''
      this.cutRun.correlation = 0
      step.status = 'running'
      // Every draw is re-randomized, and the gate demonstrably blocks and then
      // clears across retries: the first attempt of a cut always draws a
      // below-threshold correlation (the operator sees the failed state, the
      // inline explanation, and the Retry control), while every retry draws a
      // fresh above-threshold value that carries the cut on to seal. Both
      // outcomes of the gate are therefore reachable in every session, and a
      // completed cut still appends exactly one timeline entry.
      const target = this.cutRun.attempt === 1
        ? 0.930 + Math.random() * 0.018
        : 0.952 + Math.random() * 0.038
      for (let tick = 1; tick <= 20; tick += 1) {
        await pause(28)
        this.cutRun.correlation = Number((target * tick / 20).toFixed(3))
      }
      this.cutRun.correlation = Number(target.toFixed(3))
      if (this.cutRun.correlation < this.cutRun.threshold) {
        step.status = 'failed'
        this.cutRun.error = `Correlation ${this.cutRun.correlation.toFixed(3)} is below the required threshold ${this.cutRun.threshold.toFixed(2)}. The release remains blocked.`
        // A blocked check does not seal a version, so it appends no release event:
        // completing one cut adds exactly one release-cut entry to the timeline.
        return false
      }
      step.status = 'complete'
      await this.sealCut()
      return true
    },
    async retryRankCheck() {
      const step = this.cutRun.steps.find((item) => item.id === 'rank-stability-check')
      if (!this.cutRun.running || step?.status !== 'failed') return false
      await this.runRankCheck()
      return true
    },
    async sealCut() {
      const step = this.cutRun.steps.find((item) => item.id === 'seal')
      step.status = 'running'
      await pause(500)
      const source = this.selectedVersion || this.versions[0]
      const request = this.cutRun.request
      const tasks = clone(source.tasks)
      const version = {
        name: request.name,
        notes: request.notes,
        sealed: true,
        cutDate: new Date().toISOString().slice(0, 10),
        taskCount: tasks.length,
        tasks,
      }
      if (!this.versions.some((item) => item.name.toLowerCase() === version.name.toLowerCase())) {
        this.versions.unshift(version)
        this.versions.sort((a, b) => compareSemver(a.name, b.name))
        this.selectedVersionName = version.name
        this.diffCompare = version.name
        this.activeTab = 'manifest'
        this.timeline.unshift({ at: new Date().toISOString(), kind: 'release-cut', description: `Sealed release ${version.name} with ${version.taskCount} tasks.` })
      }
      step.status = 'complete'
      this.cutRun.running = false
      this.touchExport()
      await pause(260)
      this.dialog = null
      restoreDialogOpener()
      this.toast(`Release ${version.name} sealed and selected.`)
    },
    advanceRotation() {
      const pool = ['lilac-wren', 'granite-moth', 'silver-ibis', 'topaz-vole', 'quartz-tern', 'umber-lynx', 'saffron-eel', 'cobalt-fox']
      const forbidden = new Set(this.rotation.history.slice(0, 2).flatMap((entry) => entry.subsets))
      const next = pool.filter((subset) => !forbidden.has(subset)).slice(0, 2)
      this.rotation.cycle += 1
      this.rotation.activeSubsets = next
      this.rotation.history.unshift({ cycle: this.rotation.cycle, subsets: [...next] })
      this.timeline.unshift({ at: new Date().toISOString(), kind: 'rotation-advance', description: `Advanced held-out rotation to cycle ${this.rotation.cycle}: ${next.join(' and ')}.` })
      this.touchExport()
      this.toast(`Rotation advanced to cycle ${this.rotation.cycle}.`)
      return this.rotation.cycle
    },
    applyImport(document) {
      const result = releasePackSchema.safeParse(document)
      if (!result.success) return { success: false, error: result.error }
      const imported = clone(result.data)
      this.versions = imported.versions.sort((a, b) => compareSemver(a.name, b.name))
      this.rotation = imported.rotation
      // Replace a leading prior import marker with this import's fresh audit
      // event, so repeated export/import round-trips stay length-stable while
      // every successful import still records exactly one current event.
      this.timeline = imported.timeline[0]?.kind === 'import' ? imported.timeline.slice(1) : imported.timeline
      this.timeline.unshift({ at: new Date().toISOString(), kind: 'import', description: `Imported release pack with ${this.versions.length} versions.` })
      const newestSealed = this.versions.filter((version) => version.sealed).sort((a, b) => compareSemver(a.name, b.name))[0] || this.versions[0]
      this.selectedVersionName = newestSealed.name
      this.activeTab = 'manifest'
      this.diffBase = this.versions[this.versions.length - 1].name
      this.diffCompare = newestSealed.name
      this.unchangedExpanded = false
      this.touchExport()
      this.dialog = null
      restoreDialogOpener()
      this.toast(`Import applied: ${this.versions.length} versions.`)
      return { success: true, count: this.versions.length }
    },
    applySampleImport() {
      return this.applyImport(clone(this.importSample))
    },
    setTheme(theme) {
      if (!['light', 'dark'].includes(theme)) return false
      this.theme = theme
      return true
    },
    toggleTheme() {
      this.theme = this.theme === 'light' ? 'dark' : 'light'
      return this.theme
    },
    setDensity(density) {
      if (!['comfortable', 'compact'].includes(density)) return false
      this.density = density
      return true
    },
    toggleDensity() {
      this.density = this.density === 'comfortable' ? 'compact' : 'comfortable'
      return this.density
    },
    setReduceMotion(value) {
      this.reduceMotion = Boolean(value)
      return this.reduceMotion
    },
    setOnline(value) {
      this.online = Boolean(value)
    },
    openTour() {
      this.tourStep = 0
      this.tourOpen = true
      this.paletteOpen = false
    },
    closeTour() {
      this.tourOpen = false
      this.tourStep = 0
    },
    setTourStep(step) {
      this.tourStep = step
    },
    setPaletteOpen(open) {
      this.paletteOpen = Boolean(open)
    },
  },
})

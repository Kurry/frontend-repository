<script setup>
import { computed } from 'vue'
import { NButton, NDatePicker, NProgress } from 'naive-ui'
import IconArrowLeft from '~icons/lucide/arrow-left'
import IconCheck from '~icons/lucide/check'
import IconCheckCircle from '~icons/lucide/circle-check-big'
import IconChevronDown from '~icons/lucide/chevron-down'
import IconClock from '~icons/lucide/clock-3'
import IconFlask from '~icons/lucide/flask-conical'
import IconGauge from '~icons/lucide/gauge'
import IconPlus from '~icons/lucide/plus'
import IconRotate from '~icons/lucide/rotate-cw'
import IconSend from '~icons/lucide/send'
import IconShield from '~icons/lucide/shield-check'
import IconShieldAlert from '~icons/lucide/shield-alert'
import IconShieldOff from '~icons/lucide/shield-off'
import IconTrash from '~icons/lucide/trash-2'
import IconUser from '~icons/lucide/user-round'
import { openFindingCounts, useQcStore } from '../store'
import StatusPill from './StatusPill.vue'
import ReviewDialogs from './ReviewDialogs.vue'

const store = useQcStore()
const submission = computed(() => store.activeSubmission)
const counts = computed(() => openFindingCounts(submission.value))
const gateFailed = computed(() => counts.value.blocker > 0)
const approveReason = computed(() => {
  if (submission.value.stage !== 'in-review') return `Approval unavailable: wrong stage (${submission.value.stage.replace('-', ' ')}).`
  if (gateFailed.value) return `Approval unavailable: ${counts.value.blocker} open blocker finding${counts.value.blocker === 1 ? '' : 's'}.`
  return ''
})
const dateRangeValue = computed(() => store.profileRange.map((d) => {
  const [y, m, day] = d.split('-').map(Number)
  return new Date(y, m - 1, day).getTime()
}))
const tierOptions = [{ label: 'Blocker', value: 'blocker' }, { label: 'Major', value: 'major' }, { label: 'Minor', value: 'minor' }]

function openOverride(id) { store.dialogs.overrideFindingId = id; store.dialogs.override = true }
function updateDateRange(value) {
  if (!value?.length || value.length !== 2) return
  store.setProfileRange(value.map((t) => {
    const date = new Date(t)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }))
}
function useRange(range) { store.setProfileRange(range) }
function beginReview() { store.updateSubmission(submission.value.id, 'stage', 'in-review'); store.notify('Submission moved to in-review') }
</script>

<template>
  <main v-if="submission" class="view-shell detail-view" aria-labelledby="detail-heading">
    <button class="back-link" @click="store.openView('queue')"><IconArrowLeft /> Back to queue</button>

    <section class="detail-hero">
      <div class="detail-heading">
        <div class="detail-id">{{ submission.id.toUpperCase() }}</div>
        <h1 id="detail-heading">{{ submission.title }}</h1>
        <div class="detail-meta">
          <button class="contributor-link avatar-link" @click="store.openContributor(submission.contributor_name)"><span class="mini-avatar"><IconUser /></span>{{ submission.contributor_name }}</button>
          <span class="meta-separator"></span><StatusPill :kind="submission.stage" /><StatusPill :kind="submission.payout_state" type="payout" />
        </div>
      </div>
      <div class="hero-actions">
        <NButton v-if="submission.stage === 'submitted'" type="primary" @click="beginReview"><IconGauge /> Move to in-review</NButton>
        <NButton v-if="submission.stage === 'needs-revision'" type="primary" @click="store.markRevised(submission.id)"><IconRotate /> Mark revised</NButton>
        <NButton @click="store.dialogs.add = true"><IconPlus /> Add finding</NButton>
        <NButton @click="store.dialogs.revision = true"><IconSend /> Request revision</NButton>
        <span class="approve-wrap">
          <NButton type="primary" :disabled="!!approveReason" @click="store.dialogs.approve = true"><IconCheckCircle /> Approve</NButton>
          <small v-if="approveReason" role="status">{{ approveReason }}</small>
        </span>
      </div>
    </section>

    <Transition name="gate-swap" mode="out-in">
      <section :key="gateFailed ? 'failed' : 'passed'" class="gate-banner" :class="gateFailed ? 'gate-failed' : 'gate-passed'" aria-live="polite">
        <div class="gate-icon"><IconShieldAlert v-if="gateFailed" /><IconShield v-else /></div>
        <div><span class="eyebrow">Automated release gate</span><h2>Gate {{ gateFailed ? 'failed' : 'passed' }}</h2><p v-if="gateFailed">{{ counts.blocker }} open blocker {{ counts.blocker === 1 ? 'finding stops' : 'findings stop' }} approval and payout release.</p><p v-else>No open blockers. This submission is eligible for approval when in-review.</p></div>
        <div class="gate-count"><strong>{{ counts.blocker }}</strong><span>open blockers</span></div>
      </section>
    </Transition>

    <div class="detail-grid">
      <section class="findings-panel panel" aria-labelledby="findings-heading">
        <div class="panel-heading">
          <div><p class="eyebrow">Review record</p><h2 id="findings-heading">Findings <span>{{ submission.findings.length }}</span></h2></div>
          <NButton size="small" @click="store.dialogs.add = true"><IconPlus /> Add finding</NButton>
        </div>

        <TransitionGroup v-if="submission.findings.length" name="finding-list" tag="div" class="findings-list">
          <article v-for="item in submission.findings" :key="item.id" class="finding-card" :class="{ overridden: item.status === 'overridden' }">
            <div class="finding-topline">
              <span class="tier-chip" :class="`tier-${item.tier}`"><span v-if="item.tier === 'blocker'" aria-hidden="true">!</span>{{ item.tier }}</span>
              <span class="finding-category">{{ item.category.replace('-', ' ') }}</span>
              <span v-if="item.status === 'overridden'" class="overridden-label"><IconShieldOff /> Overridden</span>
              <span class="finding-id">{{ item.id }}</span>
            </div>
            <p class="finding-description">{{ item.description }}</p>
            <div v-if="item.status === 'overridden'" class="override-note"><strong>Override justification</strong><span>{{ item.override_justification }}</span></div>
            <div v-else class="finding-actions-row">
              <label class="retier-control" :for="`retier-${item.id}`"><span>Tier</span><select :id="`retier-${item.id}`" class="filter-select retier-select" :value="item.tier" :aria-label="`Change tier for ${item.id}`" @change="store.retierFinding(submission.id, item.id, $event.target.value)"><option v-for="opt in tierOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select></label>
              <NButton size="tiny" quaternary @click="openOverride(item.id)"><IconShieldOff /> Override</NButton>
              <NButton size="tiny" quaternary class="remove-finding" @click="store.removeFinding(submission.id, item.id)"><IconTrash /> Remove</NButton>
            </div>
            <div class="evidence-block">
              <button class="evidence-toggle" type="button" :aria-expanded="!!store.disclosureState[item.id] ? 'true' : 'false'" :aria-controls="`evidence-${item.id}`" @click="store.toggleDisclosure(item.id)">
                <span>Evidence</span><span v-if="!item.evidence" class="no-evidence">None attached</span><IconChevronDown :class="{ rotated: !!store.disclosureState[item.id] }" />
              </button>
              <Transition name="disclosure">
                <div v-if="store.disclosureState[item.id]" :id="`evidence-${item.id}`" class="evidence-copy">{{ item.evidence || 'No evidence text was attached to this finding.' }}</div>
              </Transition>
            </div>
          </article>
        </TransitionGroup>
        <div v-else class="designed-empty findings-empty">
          <div class="empty-icon"><IconShield /></div><h3>No findings recorded</h3><p>Quality issues and supporting evidence belong here.</p><NButton type="primary" @click="store.dialogs.add = true"><IconPlus /> Add first finding</NButton>
        </div>
      </section>

      <aside class="side-stack">
        <section class="profile-panel panel" aria-labelledby="profile-heading">
          <div class="panel-heading profile-heading"><div><p class="eyebrow">Trial telemetry</p><h2 id="profile-heading">Failure profile</h2></div><span class="trial-badge">{{ store.profileData[0]?.trials || 0 }} trials</span></div>
          <p class="panel-description">Criterion failures below a score of 3, derived from seeded trial runs.</p>
          <div class="range-controls">
            <NDatePicker type="daterange" :value="dateRangeValue" :clearable="false" aria-label="Trial date range" @update:value="updateDateRange" />
            <div class="range-shortcuts" aria-label="Date range shortcuts">
              <button :class="{ active: store.profileRange[0] === '2026-07-11' && store.profileRange[1] === '2026-07-18' }" @click="useRange(['2026-07-11','2026-07-18'])">All</button>
              <button :class="{ active: store.profileRange[1] === '2026-07-13' }" @click="useRange(['2026-07-11','2026-07-13'])">Early</button>
              <button :class="{ active: store.profileRange[0] === '2026-07-16' }" @click="useRange(['2026-07-16','2026-07-18'])">Recent</button>
            </div>
          </div>
          <div class="profile-legend"><span><i class="legend-standard"></i> Standard</span><span><i class="legend-bearing"></i> Load-bearing · weight 3+</span></div>
          <div class="profile-bars">
            <div
              v-for="(criterion, index) in store.profileData"
              :key="criterion.id"
              class="profile-row"
              :class="{ bearing: criterion.weight >= 3, ranked: index === 0 }"
              :style="{ '--stagger': `${index * 45}ms` }"
              :title="`${criterion.name}: ${criterion.rate}% failure across ${criterion.trials} trials (mean ${criterion.mean})`"
            >
              <div class="profile-label"><span>{{ criterion.name }} <small>W{{ criterion.weight }}</small></span><strong>{{ criterion.rate }}%</strong></div>
              <div class="bar-track"><div class="bar-fill" :style="{ width: `${criterion.rate}%` }"></div></div>
              <div class="profile-meta"><span>Failure rate</span><span>Mean score <strong>{{ criterion.mean }}</strong> / 5</span><span v-if="index === 0" class="rank-callout">Highest failure</span></div>
            </div>
          </div>
        </section>

        <section class="recheck-panel panel" aria-labelledby="recheck-heading">
          <div class="panel-heading"><div><p class="eyebrow">Verification runner</p><h2 id="recheck-heading">Re-check run</h2></div><NButton size="small" :loading="store.recheck.running" @click="store.startRecheck(submission.id)"><IconFlask /> {{ store.recheck.running ? 'Running' : 'Run re-check' }}</NButton></div>
          <p v-if="!store.recheck.visible || store.recheck.submissionId !== submission.id" class="panel-description">Replay the task contract and seeded trials after review changes.</p>
          <div v-else class="recheck-content">
            <NProgress type="line" :percentage="store.recheck.progress" :show-indicator="true" :status="store.recheck.completed ? 'success' : 'default'" />
            <ol class="recheck-steps">
              <li v-for="step in store.recheck.steps" :key="step.name" :class="step.status"><span class="step-icon"><IconCheck v-if="step.status === 'complete'" /><IconClock v-else /></span><span>{{ step.name }}</span><small>{{ step.status }}</small></li>
            </ol>
            <Transition name="summary-fade"><p v-if="store.recheck.completed" class="run-summary"><IconCheckCircle /> Re-check complete — gate state confirmed.</p></Transition>
            <button v-if="store.recheck.completed" class="dismiss-run" @click="store.recheck.visible = false">Dismiss result</button>
          </div>
        </section>
      </aside>
    </div>
    <ReviewDialogs />
  </main>
</template>

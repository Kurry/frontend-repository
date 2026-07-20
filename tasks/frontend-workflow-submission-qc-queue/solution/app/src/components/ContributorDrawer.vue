<script setup>
import { computed } from 'vue'
import { NDrawer, NDrawerContent } from 'naive-ui'
import IconClock from '~icons/lucide/clock-3'
import IconFileText from '~icons/lucide/file-text'
import IconUser from '~icons/lucide/user-round'
import { contributors, useQcStore } from '../store'
import StatusPill from './StatusPill.vue'

const store = useQcStore()
const profile = computed(() => contributors.find((c) => c.name === store.drawerContributor))
const submissions = computed(() => store.drawerContributor ? store.contributorSubmissions(store.drawerContributor) : [])
const timeline = computed(() => store.drawerContributor ? store.contributorTimeline(store.drawerContributor) : [])
function openSubmission(id) { store.drawerContributor = null; store.openSubmission(id) }
</script>

<template>
  <NDrawer :show="!!store.drawerContributor" :width="520" placement="right" :block-scroll="true" :trap-focus="true" :auto-focus="true" @mask-click="store.drawerContributor = null" @update:show="!$event && (store.drawerContributor = null)">
    <NDrawerContent closable :native-scrollbar="false" class="contributor-drawer" @close="store.drawerContributor = null">
      <template #header><span class="drawer-kicker">Contributor record</span></template>
      <div v-if="profile" class="drawer-profile">
        <div class="profile-avatar">{{ profile.initials }}</div>
        <div><h2>{{ profile.name }}</h2><p>{{ profile.role }}</p></div>
      </div>
      <div class="drawer-summary">
        <div><strong>{{ submissions.length }}</strong><span>Submissions</span></div>
        <div><strong>{{ submissions.filter(s => s.stage === 'approved').length }}</strong><span>Approved</span></div>
        <div><strong>{{ timeline.length }}</strong><span>Events</span></div>
      </div>
      <section class="drawer-section" aria-labelledby="drawer-submissions">
        <div class="drawer-section-title"><IconFileText /><h3 id="drawer-submissions">Submissions</h3></div>
        <div class="drawer-submissions">
          <button v-for="item in submissions" :key="item.id" @click="openSubmission(item.id)"><span>{{ item.title }}<small>{{ item.id.toUpperCase() }}</small></span><StatusPill :kind="item.stage" /></button>
        </div>
      </section>
      <section class="drawer-section" aria-labelledby="drawer-timeline">
        <div class="drawer-section-title"><IconClock /><h3 id="drawer-timeline">Stage history</h3><span>Newest first</span></div>
        <ol class="timeline">
          <li v-for="(event, index) in timeline" :key="`${event.timestamp}-${index}`">
            <span class="timeline-mark"><IconUser /></span>
            <div><div class="timeline-top"><StatusPill :kind="event.type === 'revision-requested' ? 'needs-revision' : event.type" /><time :datetime="event.timestamp">{{ new Date(event.timestamp).toLocaleString('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) }}</time></div><p>{{ event.summary }}</p><small>{{ event.submission }}</small></div>
          </li>
        </ol>
      </section>
    </NDrawerContent>
  </NDrawer>
</template>

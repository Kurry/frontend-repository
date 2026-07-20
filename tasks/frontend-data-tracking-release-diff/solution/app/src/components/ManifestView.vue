<script setup>
import { computed } from 'vue'
import { PhLockKey as LockKeyIcon, PhShieldCheck as ShieldCheckIcon } from '@phosphor-icons/vue'
import { useReleaseStore } from '../stores/releases'

const store = useReleaseStore()
const version = computed(() => store.selectedVersion)
const digest = (value) => `${value.slice(0, 12)}…`
</script>

<template>
  <section v-if="version" class="view-panel" aria-labelledby="manifest-title">
    <div class="view-heading manifest-heading">
      <div>
        <div class="eyebrow">Selected release / sealed</div>
        <h1 id="manifest-title"><LockKeyIcon :size="26" weight="fill" /> {{ version.name }}</h1>
        <p>{{ version.notes || 'No release notes were supplied.' }}</p>
      </div>
      <div class="release-facts">
        <div><span>Cut date</span><strong>{{ version.cutDate }}</strong></div>
        <div><span>Tasks</span><strong>{{ version.taskCount }}</strong></div>
        <div class="sealed-fact"><ShieldCheckIcon :size="18" /><span>Immutable</span></div>
      </div>
    </div>

    <div class="section-title-row">
      <div><h2>Task manifest</h2><p>API-shaped records sealed into this version.</p></div>
      <span class="record-count">{{ version.tasks.length }} records</span>
    </div>
    <div v-if="version.tasks.length" class="table-scroll manifest-table-wrap" tabindex="0" aria-label="Scrollable task manifest">
      <table class="data-table manifest-table">
        <thead><tr><th scope="col">Task slug</th><th scope="col">Content digest</th><th scope="col">Title</th><th scope="col">Split tags</th></tr></thead>
        <tbody>
          <tr v-for="task in version.tasks" :key="task.slug">
            <td class="slug-cell">{{ task.slug }}</td>
            <td><code :title="task.contentDigest">{{ digest(task.contentDigest) }}</code></td>
            <td>{{ task.title }}</td>
            <td><div class="tag-list"><span v-for="tag in task.splitTags" :key="tag" class="split-tag" :class="tag.split('-')[0]">{{ tag }}</span></div></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="empty-state"><ShieldCheckIcon :size="32" /><h3>No manifest entries</h3><p>Tasks included in this sealed version would be listed here.</p></div>
  </section>
</template>

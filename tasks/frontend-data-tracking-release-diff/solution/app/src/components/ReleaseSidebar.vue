<script setup>
import { storeToRefs } from 'pinia'
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { PhInfo as InfoIcon, PhLockKey as LockKeyIcon, PhSealCheck as SealCheckIcon } from '@phosphor-icons/vue'
import { useReleaseStore } from '../stores/releases'

const store = useReleaseStore()
const { versions, selectedVersionName, sidebarOpen } = storeToRefs(store)
</script>

<template>
  <aside class="release-sidebar" :class="{ open: sidebarOpen }" aria-label="Releases sidebar">
    <div class="sidebar-heading">
      <div>
        <div class="eyebrow">Sealed register</div>
        <p class="sidebar-title">Releases</p>
      </div>
      <span class="count-chip">{{ versions.length }}</span>
    </div>
    <div class="release-list">
      <button
        v-for="version in versions"
        :key="version.name"
        type="button"
        class="release-entry"
        :class="{ selected: selectedVersionName === version.name }"
        @click="store.selectVersion(version.name); store.setActiveTab('manifest')"
      >
        <span class="entry-rail" />
        <span class="entry-top">
          <span class="version-label"><LockKeyIcon :size="15" weight="fill" /> v{{ version.name }}</span>
          <TooltipRoot>
            <TooltipTrigger as-child>
              <span class="info-affordance" tabindex="0" :aria-label="`About sealed release ${version.name}`" @click.stop><InfoIcon :size="15" /></span>
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent class="tooltip-content" side="right" :side-offset="8">
                Sealed releases are immutable and cannot be modified or deleted.
                <TooltipArrow class="tooltip-arrow" />
              </TooltipContent>
            </TooltipPortal>
          </TooltipRoot>
        </span>
        <span class="entry-meta">
          <span>{{ version.cutDate }}</span>
          <span>{{ version.taskCount }} tasks</span>
        </span>
      </button>
    </div>
    <div v-if="!versions.length" class="empty-state compact"><SealCheckIcon :size="24" /><p>Sealed releases will appear here.</p></div>
    <div class="sidebar-foot">
      <span class="live-dot" /> In-memory session
      <span>Reload restores the seeded register.</span>
    </div>
  </aside>
</template>

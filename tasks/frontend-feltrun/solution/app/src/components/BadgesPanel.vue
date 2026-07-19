<template>
  <section class="panel" :aria-labelledby="headingId">
    <h2 :id="headingId" class="h-section mb-1">Badges</h2>
    <p class="caption m-0 mb-3 num" style="font-size: 14px;">{{ earnedCount }} of {{ badges.length }} earned</p>

    <ul class="m-0 p-0 grid gap-2 sm:grid-cols-2" style="list-style: none;">
      <li
        v-for="badge in badges"
        :key="badge.id"
        class="rounded-[5px] px-3 py-2"
        :style="{
          backgroundColor: badge.unlocked ? '#1a3050' : '#0d1c30',
          border: badge.unlocked ? '1px solid var(--color-primary)' : '1px solid #3d4c63',
        }"
      >
        <div class="flex items-center justify-between gap-2">
          <span class="font-semibold" :style="{ fontSize: '14px', color: badge.unlocked ? 'var(--color-primary)' : '#b7c2d4' }">
            {{ badge.name }}
          </span>
          <span
            class="num"
            :style="{
              fontSize: '12px', fontWeight: 600, borderRadius: '5px', padding: '0 6px', lineHeight: '20px',
              color: badge.unlocked ? '#10141c' : '#b7c2d4',
              backgroundColor: badge.unlocked ? 'var(--color-primary)' : 'transparent',
              border: badge.unlocked ? 'none' : '1px solid #5c6879',
            }"
          >
            {{ badge.unlocked ? 'Earned' : 'Locked' }}
          </span>
        </div>
        <p class="caption m-0 mt-1" style="font-size: 13px;">{{ badge.description }}</p>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, useId } from 'vue'
import { storeToRefs } from 'pinia'
import { useGameStore } from '../stores/game'

const store = useGameStore()
const { badges } = storeToRefs(store)
const headingId = useId()

const earnedCount = computed(() => badges.value.filter(b => b.unlocked).length)
</script>

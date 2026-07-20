<script setup lang="ts">
import { computed } from 'vue'
import { useAppStore } from '../store'

const store = useAppStore()
const stream = computed(() => store.stream)

const statusBadge = computed(() => {
  switch (stream.value.status) {
    case 'active': return { label: 'Active', classes: 'bg-green-100 text-green-800 border-green-200' }
    case 'paused': return { label: 'Paused', classes: 'bg-amber-100 text-amber-800 border-amber-200' }
    case 'disconnected': return { label: 'Disconnected', classes: 'bg-red-100 text-red-800 border-red-200' }
    case 'replaying': return { label: 'Replaying', classes: 'bg-blue-100 text-blue-800 border-blue-200' }
    case 'caught-up': return { label: 'Caught up', classes: 'bg-gray-100 text-gray-800 border-gray-200' }
    default: return { label: 'Idle', classes: 'bg-gray-50 text-gray-500 border-gray-200' }
  }
})
</script>

<template>
  <div class="absolute bottom-4 left-4 bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden w-[320px] z-[45] flex flex-col max-h-[300px]">
    <div class="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0">
      <h3 class="font-semibold text-gray-900 text-sm m-0">Live Events</h3>
      <div class="px-2 py-0.5 rounded text-xs font-medium border" :class="statusBadge.classes">
        {{ statusBadge.label }}
      </div>
    </div>

    <div class="p-3 bg-white flex flex-col gap-2 shrink-0">
       <div class="flex flex-wrap gap-2">
         <button v-if="stream.status !== 'active' && stream.status !== 'caught-up'" class="btn-sm" @click="store.streamStart()">Start Stream</button>
         <button v-if="stream.status === 'active'" class="btn-sm text-amber-700 border-amber-300" @click="store.streamPause()">Pause</button>
         <button v-if="stream.status === 'active' || stream.status === 'paused'" class="btn-sm text-red-700 border-red-300" @click="store.streamDisconnect()">Disconnect</button>
         <button v-if="stream.status === 'disconnected'" class="btn-sm text-blue-700 border-blue-300" @click="store.streamReconnect()">Reconnect</button>
         <button class="btn-sm border-purple-300 text-purple-700" @click="store.streamDeliverOutOfOrder()">Simulate OOO</button>
       </div>
    </div>

    <div class="flex-1 overflow-y-auto bg-gray-50 p-3 flex flex-col gap-2 text-sm text-gray-600 border-t border-gray-200">
       <div class="text-xs text-gray-400 font-medium uppercase tracking-wider">Stream State</div>
       <div>Received: {{ stream.receivedIds.length }}</div>
       <div>Applied: {{ stream.appliedIds.length }}</div>
       <div>Missed: {{ stream.missedIds.length }}</div>
    </div>
  </div>
</template>

<style scoped>
@reference "../index.css";
.btn-sm {
  @apply bg-white hover:bg-gray-50 border border-gray-300 rounded px-2.5 py-1 text-xs font-medium;
}
</style>

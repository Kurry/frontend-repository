<script>
export default {
  name: 'AnimatedNumber',
  props: {
    value: { type: Number, required: true },
    decimals: { type: Number, default: 0 },
    duration: { type: Number, default: 520 },
  },
  data() {
    return { display: this.value, frame: null }
  },

  methods: {
    isRM() {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  },
  watch: {
    value(next, previous) {
      if (this.frame) cancelAnimationFrame(this.frame)
      if (next === previous || this.isRM()) {
        this.display = next
        return
      }
      const from = Number.isFinite(this.display) ? this.display : previous
      const start = performance.now()
      const step = (now) => {
        const progress = Math.min(1, (now - start) / this.duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        this.display = from + (next - from) * eased
        if (progress < 1) this.frame = requestAnimationFrame(step)
        else { this.display = next; this.frame = null }
      }
      this.frame = requestAnimationFrame(step)
    },
  },
  beforeUnmount() {
    if (this.frame) cancelAnimationFrame(this.frame)
  },
}
</script>

<template>
  <span class="animated-number">{{ display.toFixed(decimals) }}</span>
</template>

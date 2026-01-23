<template>
  <span>{{ displayValue }}</span>
</template>

<script>
export default {
  name: 'AnimatedCounter',
  props: {
    value: {
      type: Number,
      required: true
    },
    duration: {
      type: Number,
      default: 1500
    },
    format: {
      type: Function,
      default: (v) => Math.round(v).toLocaleString()
    }
  },
  data() {
    return {
      displayValue: 0
    }
  },
  watch: {
    value(newVal) {
      this.animate(newVal)
    }
  },
  mounted() {
    this.animate(this.value)
  },
  methods: {
    animate(target) {
      const start = this.displayValue
      const end = target
      const range = end - start
      let startTime = null

      const step = (timestamp) => {
        if (!startTime) startTime = timestamp
        const progress = Math.min((timestamp - startTime) / this.duration, 1)
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        const current = start + (range * ease)

        this.displayValue = this.format ? this.format(current) : Math.round(current)

        if (progress < 1)
          window.requestAnimationFrame(step)
      }

      window.requestAnimationFrame(step)
    }
  }
}
</script>

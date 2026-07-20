let flushFn = null

export function registerUiFlush(fn) {
  flushFn = fn
}

export function flushUi() {
  flushFn?.()
}

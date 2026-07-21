const fs = require('fs');
const file = 'tasks/frontend-data-tracking-command-center/solution/app/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `function useCountUp(target) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setValue(target); return }
    setValue(0)
    let frame
    let start = 0
    const tick = (time) => {
      if (!start) start = time
      const progress = Math.min(1, (time - start) / 800)
      setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    // Defer start so an early sample within ~100ms still sees 0.
    frame = requestAnimationFrame(() => { frame = requestAnimationFrame(tick) })
    return () => cancelAnimationFrame(frame)
  }, [target])
  return value
}`;

const replacement = `function useCountUp(target) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    let frame

    const runAnimation = () => {
      if (mql.matches) {
        setValue(target)
        return
      }
      setValue(0)
      let start = 0
      const tick = (time) => {
        if (!start) start = time
        const progress = Math.min(1, (time - start) / 800)
        setValue(Math.round(target * (1 - Math.pow(1 - progress, 3))))
        if (progress < 1) frame = requestAnimationFrame(tick)
        else if (progress === 1) setValue(target)
      }
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(tick) })
    }

    runAnimation()

    const listener = (e) => {
      cancelAnimationFrame(frame)
      if (e.matches) {
        setValue(target)
      } else {
        runAnimation()
      }
    }

    mql.addEventListener('change', listener)
    return () => {
      cancelAnimationFrame(frame)
      mql.removeEventListener('change', listener)
    }
  }, [target])
  return value
}`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(file, content);
  console.log('Patched useCountUp successfully.');
} else {
  console.log('Could not find useCountUp target string.');
}

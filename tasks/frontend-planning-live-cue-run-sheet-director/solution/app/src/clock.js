import { state, setState } from './store';
import { produce } from 'solid-js/store';

let rehearsalTimer = null;
let liveTimer = null;

export function startRehearsal() {
  setState('rehearsalState', produce(r => {
    r.active = true;
    if (r.clockTime === 0) r.clockTime = 0;
  }));
  if (rehearsalTimer) clearInterval(rehearsalTimer);
  rehearsalTimer = setInterval(() => {
    setState('rehearsalState', 'clockTime', t => t + 5);
    if (state.rehearsalState.clockTime > 4200) stopRehearsal();
  }, 100);
}
export function stopRehearsal() {
  if (rehearsalTimer) { clearInterval(rehearsalTimer); rehearsalTimer = null; }
  setState('rehearsalState', 'active', false);
}
export function resetRehearsal() {
  stopRehearsal();
  setState('rehearsalState', { active: false, clockTime: 0, events: [], ledger: [] });
}
export function injectRehearsalDelay(delaySeconds) {
  setState('rehearsalState', produce(r => { r.events.push({ type: 'delay', time: r.clockTime, amount: delaySeconds }); }));
}
export function startLiveShow() {
  setState('liveState', produce(l => {
    l.active = true;
    if (l.clockTime === 0) l.clockTime = 0;
  }));
  if (liveTimer) clearInterval(liveTimer);
  liveTimer = setInterval(() => {
    setState('liveState', 'clockTime', t => t + 5);
    if (state.liveState.clockTime > 4200) stopLiveShow();
  }, 1000);
}
export function stopLiveShow() {
  if (liveTimer) { clearInterval(liveTimer); liveTimer = null; }
  setState('liveState', 'active', false);
}
export function liveCallGo(cueId) {
  setState('liveState', produce(l => { l.events.push({ type: 'GO', cueId, time: l.clockTime }); }));
}
export function liveCallHold(cueId) {
  setState('liveState', produce(l => { l.events.push({ type: 'HOLD', cueId, time: l.clockTime }); }));
}
export function liveCallSkip(cueId) {
  setState('liveState', produce(l => { l.events.push({ type: 'SKIP', cueId, time: l.clockTime }); }));
}
export function liveCallComplete(cueId) {
  setState('liveState', produce(l => { l.events.push({ type: 'COMPLETE', cueId, time: l.clockTime }); }));
}

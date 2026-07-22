<script lang="ts">
  import type { NoteColor } from '../lib/types';

  interface Props {
    currentColor: NoteColor;
    onSelect: (color: NoteColor) => void;
  }

  let { currentColor, onSelect }: Props = $props();
</script>

<div class="flex items-center gap-1.5" role="radiogroup" aria-label="Color label">
  <!-- None -->
  <button
    class="w-5 h-5 rounded-full bg-slate-200 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ring-2 {currentColor === '' ? 'ring-slate-400 ring-offset-2' : 'ring-transparent'} hover:ring-slate-400 hover:ring-2"
    onclick={() => onSelect('')}
    aria-label="None"
    role="radio"
    aria-checked={currentColor === ''}
    title="None"
  ></button>
  <!-- Red -->
  <button
    class="w-5 h-5 rounded-full bg-red-400 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ring-2 {currentColor === 'red' ? 'ring-red-500 ring-offset-2' : 'ring-transparent'} hover:ring-red-500 hover:ring-2"
    onclick={() => onSelect('red')}
    aria-label="Red"
    role="radio"
    aria-checked={currentColor === ''}
    title="Red"
  ></button>
  <!-- Orange -->
  <button
    class="w-5 h-5 rounded-full bg-orange-400 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ring-2 {currentColor === 'orange' ? 'ring-orange-500 ring-offset-2' : 'ring-transparent'} hover:ring-orange-500 hover:ring-2"
    onclick={() => onSelect('orange')}
    aria-label="Orange"
    role="radio"
    aria-checked={currentColor === ''}
    title="Orange"
  ></button>
  <!-- Yellow -->
  <button
    class="w-5 h-5 rounded-full bg-yellow-400 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ring-2 {currentColor === 'yellow' ? 'ring-yellow-500 ring-offset-2' : 'ring-transparent'} hover:ring-yellow-500 hover:ring-2"
    onclick={() => onSelect('yellow')}
    aria-label="Yellow"
    role="radio"
    aria-checked={currentColor === ''}
    title="Yellow"
  ></button>
  <!-- Green -->
  <button
    class="w-5 h-5 rounded-full bg-green-400 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ring-2 {currentColor === 'green' ? 'ring-green-500 ring-offset-2' : 'ring-transparent'} hover:ring-green-500 hover:ring-2"
    onclick={() => onSelect('green')}
    aria-label="Green"
    role="radio"
    aria-checked={currentColor === ''}
    title="Green"
  ></button>
  <!-- Blue -->
  <button
    class="w-5 h-5 rounded-full bg-blue-400 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ring-2 {currentColor === 'blue' ? 'ring-blue-500 ring-offset-2' : 'ring-transparent'} hover:ring-blue-500 hover:ring-2"
    onclick={() => onSelect('blue')}
    aria-label="Blue"
    role="radio"
    aria-checked={currentColor === ''}
    title="Blue"
  ></button>
  <!-- Purple -->
  <button
    class="w-5 h-5 rounded-full bg-purple-400 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ring-2 {currentColor === 'purple' ? 'ring-purple-500 ring-offset-2' : 'ring-transparent'} hover:ring-purple-500 hover:ring-2"
    onclick={() => onSelect('purple')}
    aria-label="Purple"
    role="radio"
    aria-checked={currentColor === ''}
    title="Purple"
  ></button>
</div>

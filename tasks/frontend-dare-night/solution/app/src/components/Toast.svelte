<script lang="ts">
  interface Props {
    toast: { id: number; message: string; type: 'success' | 'error' | 'info' };
  }

  let { toast }: Props = $props();

  function getToastClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-600 text-white';
      case 'error': return 'bg-red-600 text-white';
      case 'info': return 'bg-gray-800 text-white';
      default: return 'bg-gray-800 text-white';
    }
  }
</script>

<div
  class="toast-enter px-6 py-3 rounded-full shadow-xl text-sm font-medium pointer-events-auto {getToastClass(toast.type)}"
  role={toast.type === 'error' ? 'alert' : 'status'}
  aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
>
  {toast.message}
</div>

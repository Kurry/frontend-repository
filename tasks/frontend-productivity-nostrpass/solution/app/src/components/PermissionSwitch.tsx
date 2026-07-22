import { Component, JSX } from 'solid-js';

export const PermissionSwitch: Component<{
  checked: boolean;
  label: string;
  testId?: string;
  size?: 'sm' | 'md';
  onChange: () => void;
}> = (props) => {
  const sizeClass = () =>
    props.size === 'sm'
      ? 'h-5 w-9 [&_.switch-thumb]:h-3.5 [&_.switch-thumb]:w-3.5 [&_.switch-thumb-on]:translate-x-[18px]'
      : 'h-7 w-12 [&_.switch-thumb]:h-5 [&_.switch-thumb]:w-5 [&_.switch-thumb-on]:translate-x-6';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={props.checked}
      aria-label={props.label}
      data-testid={props.testId}
      onClick={() => props.onChange()}
      class={`hover-wash relative inline-flex items-center rounded-full transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${sizeClass()}`}
      classList={{
        'bg-emerald-500': props.checked,
        'bg-slate-600': !props.checked,
      }}
    >
      <span
        class="switch-thumb inline-block transform rounded-full bg-white transition-transform translate-x-1"
        classList={{ 'switch-thumb-on': props.checked }}
      />
    </button>
  );
};

export function DecorativeIcon(props: { children: JSX.Element }) {
  return <span aria-hidden="true">{props.children}</span>;
}

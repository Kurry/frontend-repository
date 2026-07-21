import { Icon as IconifyIcon } from '@iconify/react';

export function Icon({ name, label, size = 18, className = '', decorative = false, ...rest }) {
  const aria = decorative || label ? { 'aria-hidden': 'true' } : {};
  const title = label && !decorative ? undefined : undefined;
  return (
    <IconifyIcon
      icon={name}
      width={size}
      height={size}
      class={className}
      role={label && !decorative ? 'img' : undefined}
      aria-label={label && !decorative ? label : undefined}
      {...aria}
      {...rest}
    />
  );
}

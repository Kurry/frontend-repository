import { defineConfig, presetUno } from 'unocss'

export default defineConfig({
  presets: [presetUno()],
  theme: {
    colors: {
      primary: '#4a5fc1',
      primarydeep: '#3f52ab',
      primarydeeper: '#374893',
      accent: '#e0708a',
      appbg: '#f5f6fb',
      surface: '#ffffff',
      success: '#359b6b',
      warning: '#d99a3d',
      error: '#c4534a',
      errordeep: '#a84139',
      ink: '#262a3d',
      inksoft: '#6b6f85',
      line: '#7c8197',
      linesoft: '#e2e4ef',
      hoverwash: '#eef0f8',
      presswash: '#e2e6f4',
    },
    fontFamily: {
      heading: '"Poppins","Segoe UI",Arial,sans-serif',
      body: '"Inter","Helvetica Neue",Arial,sans-serif',
      mono: '"JetBrains Mono","SFMono-Regular",monospace',
    },
  },
  shortcuts: {
    'focus-ring':
      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
    'btn-base':
      'inline-flex items-center justify-center gap-2 font-body font-medium rounded-md cursor-pointer select-none transition-colors active:translate-y-px disabled:opacity-45 disabled:pointer-events-none',
    'btn-primary':
      'btn-base bg-primary text-white border-0 shadow-sm hover:bg-primarydeep active:bg-primarydeeper min-h-12 px-5 text-[0.95rem] focus-ring',
    'btn-primary-sm':
      'btn-base bg-primary text-white border-0 shadow-sm hover:bg-primarydeep active:bg-primarydeeper min-h-9 px-4 text-[0.9rem] focus-ring',
    'btn-secondary':
      'btn-base bg-surface text-ink border border-line hover:bg-hoverwash active:bg-presswash min-h-9 px-3 text-[0.9rem] focus-ring',
    'btn-danger':
      'btn-base bg-error text-white border-0 shadow-sm hover:bg-errordeep active:bg-errordeep min-h-9 px-4 text-[0.9rem] focus:outline-none focus:ring-2 focus:ring-error focus:ring-offset-2',
    'btn-quiet':
      'btn-base bg-transparent text-inksoft border-0 hover:bg-hoverwash hover:text-ink active:bg-presswash min-h-8 px-2 text-[0.85rem] focus-ring',
    'input-field':
      'block w-full font-body text-[0.95rem] text-ink bg-surface border border-line rounded-md px-3 py-2 hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors',
    'field-label': 'block font-body text-[0.8rem] font-medium text-ink',
    'card': 'bg-surface rounded-xl border border-linesoft shadow-sm',
    'meta-mono': 'font-mono text-[0.72rem] text-inksoft',
    'section-title': 'font-heading text-[1rem] font-semibold text-ink',
  },
  preflights: [
    {
      getCSS: () => `
*,*::before,*::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e2e4ef}
html{font-size:16px}
body{margin:0;background-color:#f5f6fb;color:#262a3d;font-family:"Inter","Helvetica Neue",Arial,sans-serif;font-size:0.95rem;line-height:1.5;-webkit-font-smoothing:antialiased}
h1,h2,h3,h4,h5,h6,p,ul,ol,figure,fieldset{margin:0;padding:0}
ul,ol{list-style:none}
button,input,select,textarea{font:inherit;color:inherit;margin:0}
button{background:transparent;padding:0;cursor:pointer}
textarea{resize:vertical}
::placeholder{color:#6b6f85;opacity:1}
:focus{scroll-margin-block:120px}
mark{background-color:rgba(224,112,138,0.25);color:#262a3d;border-radius:2px;padding:0 2px}
`,
    },
  ],
})

import { outputBuffer, theme, mode, projects, skills, identity, cookieConsent } from './store.js';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function updateUrl(command) {
  // Only commands that processCommand actually implements get a title —
  // unknown commands must not change document.title.
  const ROUTE_MAP = {
    '/about': 'about',
    '/work': 'work',
    '/skills': 'skills',
    '/privacy': 'privacy',
  };
  const ROUTE_TITLES = {
    '': 'Your Name | Product Designer & Design Systems Lead',
    'about': 'About | Product Designer & Design Systems Lead',
    'work': 'Work | Selected Projects | Product Designer',
    'skills': 'Skills | Design Systems, UX, Product Design',
    'privacy': 'Privacy Policy',
  };

  const slug = ROUTE_MAP[command];
  if (slug !== undefined) {
    document.title = ROUTE_TITLES[slug] || ROUTE_TITLES[''];
  } else if (command === '/clear' || command === '/help') {
    document.title = ROUTE_TITLES[''];
  }
}

export function processCommand(cmd) {
  const parts = cmd.trim().split(' ');
  const base = parts[0].toLowerCase();

  let resolvedCommand = base;
  if (!base.startsWith('/')) {
     const intentMap = {
        'show my work': '/work',
        'projects': '/work',
        'email me': '/about',
        'who are you': '/about',
        'what can you do': '/skills'
     };
     resolvedCommand = intentMap[cmd.toLowerCase()] || base;
  }

  updateUrl(resolvedCommand);

  outputBuffer.value = [...outputBuffer.value, { text: `> ${cmd}`, type: 'dim' }];

  let res = [];

  switch (resolvedCommand) {
    case '/help':
      res = [
        { text: 'Available commands:', type: 'accent' },
        { text: '  /about    - About me' },
        { text: '  /work     - Featured projects' },
        { text: '  /skills   - Capabilities' },
        { text: '  /dark     - Dark theme' },
        { text: '  /light    - Light theme' },
        { text: '  /retro    - Retro theme' },
        { text: '  /glass    - Glass theme' },
        { text: '  /board    - Switch to Projects Board' },
        { text: '  /clear    - Clear terminal' },
        { text: '  /privacy  - View privacy/cookie policy' },
        { text: '  /konami   - Surprise' },
        { text: '  /matrix   - Digital rain' }
      ];
      break;
    case '/clear':
      outputBuffer.value = [];
      return;
    case '/dark':
    case '/light':
    case '/retro':
    case '/glass':
      theme.value = resolvedCommand.substring(1);
      res = [{ text: `Theme switched to ${theme.value}`, type: 'success' }];
      break;
    case '/about':
      res = [
        { text: 'About Me', type: 'accent font-bold' },
        { text: identity.value.about }
      ];
      break;
    case '/work':
      res = [
        { text: 'Featured Work', type: 'accent font-bold mb-2' }
      ];
      if (projects.value.length === 0) {
        res.push({ text: 'No projects found. Add some from the Board.', type: 'dim' });
      } else {
        projects.value.forEach(p => {
          res.push({
            html: `<div class="project-card mb-2">
              <div class="flex justify-between">
                <span class="font-bold">${escapeHtml(p.name)}</span>
                <span class="text-sm opacity-50">${escapeHtml(p.year)}</span>
              </div>
              <div class="text-sm italic mb-1">${escapeHtml(p.type)}</div>
              <div class="text-sm">${escapeHtml(p.summary)}</div>
              <div class="mt-2 flex gap-1 flex-wrap">
                ${p.tags.map(t => `<span class="badge badge-sm badge-outline">${escapeHtml(t)}</span>`).join('')}
              </div>
            </div>`
          });
        });
      }
      break;
    case '/skills':
      res = [
        { text: 'Skills & Capabilities', type: 'accent font-bold mb-2' }
      ];
      skills.value.forEach(s => {
        res.push({
          html: `<div class="flex items-center gap-2 mb-1">
            <span class="w-40 text-sm">${escapeHtml(s.name)}</span>
            <progress class="progress progress-primary w-56" value="${s.prof}" max="100"></progress>
            <span class="text-xs opacity-50">${s.prof}%</span>
          </div>`
        });
      });
      break;
    case '/board':
      mode.value = 'board';
      res = [{ text: 'Switched to Board view.', type: 'success' }];
      break;
    case '/privacy':
      res = [
        { text: 'Privacy & Cookie Policy', type: 'accent font-bold mb-2' },
        { text: `Current consent status: ${cookieConsent.value}` }
      ];
      break;
    case '/konami':
      res = [{ html: '<div class="text-center font-bold text-4xl mt-4 mb-4 text-primary animate-bounce">🎉 CONFETTI BURST 🎉</div>' }];
      break;
    case '/matrix':
       res = [{ html: '<div class="text-green-500 font-mono tracking-widest leading-none h-24 overflow-hidden opacity-80" style="writing-mode: vertical-rl; text-orientation: upright;">0101010010111001010101010101001010101010</div>' }];
       break;
    default:
      res = [{ text: `Command not found: ${base}. Try /help`, type: 'error' }];
  }

  outputBuffer.value = [...outputBuffer.value, ...res];
}

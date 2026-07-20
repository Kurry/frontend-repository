import { outputBuffer, theme, mode, projects, skills, identity, cookieConsent } from './store.js';

function updateUrl(command) {
  const ROUTE_MAP = {
    '/about': 'about',
    '/work': 'work',
    '/clients': 'clients',
    '/skills': 'skills',
    '/contact': 'contact',
    '/social': 'social',
    '/philosophy': 'philosophy',
    '/testimonials': 'testimonials',
    '/awards': 'awards',
    '/privacy': 'privacy',
    '/articles': 'articles',
  };
  const ROUTE_TITLES = {
    '': 'Your Name | Product Designer & Design Systems Lead',
    'about': 'About | Product Designer & Design Systems Lead',
    'work': 'Work | Selected Projects | Product Designer',
    'clients': 'Clients | Selected Companies | Product Designer',
    'skills': 'Skills | Design Systems, UX, Product Design',
    'contact': 'Contact | Product Designer & Design Systems Lead',
    'social': 'Social Profiles | Product Designer',
    'philosophy': 'Design Philosophy | Product Designer',
    'testimonials': 'Testimonials | What Clients & Peers Say',
    'awards': 'Awards & Recognition | Product Designer',
    'privacy': 'Privacy Policy',
    'articles': 'Articles on Design Systems, UX & Strategy',
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
                <span class="font-bold">${p.name}</span>
                <span class="text-sm opacity-50">${p.year}</span>
              </div>
              <div class="text-sm italic mb-1">${p.type}</div>
              <div class="text-sm">${p.desc}</div>
              <div class="mt-2 flex gap-1 flex-wrap">
                ${p.tags.map(t => `<span class="badge badge-sm badge-outline">${t}</span>`).join('')}
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
            <span class="w-40 text-sm">${s.name}</span>
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

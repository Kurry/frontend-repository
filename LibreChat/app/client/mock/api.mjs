const MOCK_USER = {
  id: 'mock-user-001',
  username: 'demo',
  email: 'demo@librechat.local',
  name: 'Demo User',
  avatar: '',
  role: 'USER',
  provider: 'local',
  emailVerified: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  plugins: [],
};

const MOCK_TOKEN = 'mock-jwt-token';

const MOCK_ROLE_USER = {
  name: 'USER',
  permissions: {
    PROMPTS: { USE: true, CREATE: true, SHARE: false, SHARE_PUBLIC: false },
    BOOKMARKS: { USE: true },
    MEMORIES: { USE: true, CREATE: true, UPDATE: true, READ: true, OPT_OUT: true },
    AGENTS: { USE: true, CREATE: true, SHARE: false, SHARE_PUBLIC: false },
    MULTI_CONVO: { USE: true },
    TEMPORARY_CHAT: { USE: true },
    RUN_CODE: { USE: true },
    WEB_SEARCH: { USE: true },
    PEOPLE_PICKER: { VIEW_USERS: false, VIEW_GROUPS: false, VIEW_ROLES: false },
    MARKETPLACE: { USE: false },
    FILE_SEARCH: { USE: true },
    FILE_CITATIONS: { USE: true },
    MCP_SERVERS: {
      USE: true,
      CREATE: false,
      SHARE: false,
      SHARE_PUBLIC: false,
      CONFIGURE_OBO: false,
    },
    REMOTE_AGENTS: { USE: false, CREATE: false, SHARE: false, SHARE_PUBLIC: false },
    SKILLS: { USE: true, CREATE: true, SHARE: false, SHARE_PUBLIC: false },
    SHARED_LINKS: { CREATE: true, SHARE: true, SHARE_PUBLIC: true },
  },
};

const MOCK_STARTUP_CONFIG = {
  appTitle: 'LibreChat',
  socialLogins: [],
  discordLoginEnabled: false,
  facebookLoginEnabled: false,
  githubLoginEnabled: false,
  googleLoginEnabled: false,
  openidLoginEnabled: false,
  appleLoginEnabled: false,
  samlLoginEnabled: false,
  openidLabel: 'Continue with OpenID',
  openidImageUrl: '',
  openidAutoRedirect: false,
  samlLabel: '',
  samlImageUrl: '',
  serverDomain: 'http://localhost:3090',
  emailLoginEnabled: true,
  registrationEnabled: false,
  socialLoginEnabled: false,
  passwordResetEnabled: false,
  emailEnabled: false,
  showBirthdayIcon: false,
  helpAndFaqURL: '/',
  customFooter: 'LibreChat (mock) - Every AI for Everyone.',
  sharedLinksEnabled: true,
  publicSharedLinksEnabled: false,
  allowAccountDeletion: false,
  interface: {
    modelSelect: true,
    parameters: true,
    presets: true,
    multiConvo: true,
    bookmarks: true,
    memories: true,
    temporaryChat: true,
    runCode: true,
    webSearch: true,
    fileSearch: true,
    fileCitations: true,
    prompts: { use: true, create: true, share: false, public: false },
    agents: { use: true, create: true, share: false, public: false },
    skills: { use: true, create: true, share: false, public: false },
    sharedLinks: { create: true, share: true, public: true },
    marketplace: { use: false },
    peoplePicker: { users: false, groups: false, roles: false },
  },
};

const MOCK_ENDPOINTS = {
  openAI: {
    type: 'openAI',
    userProvide: false,
    userProvideKey: false,
    modelDisplayLabel: 'OpenAI',
  },
  agents: {
    type: 'agents',
    userProvide: false,
    disableBuilder: false,
    capabilities: ['skills', 'tools', 'actions', 'file_search', 'execute_code', 'web_search'],
  },
};

const MOCK_MODELS = {
  openAI: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1'],
  agents: ['gpt-4o'],
};

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

function sendText(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'text/plain');
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        resolve(raw);
      }
    });
  });
}

function match(pathname, pattern) {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = pathname.split('/').filter(Boolean);
  if (patternParts.length !== pathParts.length) {
    return null;
  }
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
      continue;
    }
    if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

const streams = new Map();
const conversations = new Map();
const messagesByConvo = new Map();
const promptGroups = new Map();
const prompts = new Map();
const projects = new Map();
const skills = new Map();

function uuid() {
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function pingPongReply(userText) {
  const trimmed = String(userText ?? '').trim();
  if (!trimmed) {
    return 'pong';
  }
  if (/^ping$/i.test(trimmed)) {
    return 'pong';
  }
  return `pong: ${trimmed}`;
}

function writeSse(res, data) {
  res.write(`event: message\ndata: ${JSON.stringify(data)}\n\n`);
}

function streamPingPong(res, job) {
  const {
    streamId,
    conversationId,
    userMessageId,
    parentMessageId,
    userText,
    endpoint,
    model,
  } = job;
  const replyText = pingPongReply(userText);
  const responseMessageId = `${String(userMessageId).replace(/_+$/, '')}_`;
  const stepId = `step-${streamId}`;

  const requestMessage = {
    messageId: userMessageId,
    parentMessageId,
    conversationId,
    text: userText,
    sender: 'User',
    isCreatedByUser: true,
    endpoint,
    model,
  };

  const responseMessage = {
    messageId: responseMessageId,
    parentMessageId: userMessageId,
    conversationId,
    text: replyText,
    content: [{ type: 'text', text: replyText }],
    sender: 'GPT-4o',
    isCreatedByUser: false,
    endpoint,
    model,
    unfinished: false,
  };

  writeSse(res, {
    created: true,
    streamId,
    message: requestMessage,
  });

  writeSse(res, {
    event: 'on_run_step',
    data: {
      id: stepId,
      runId: 'USE_PRELIM_RESPONSE_MESSAGE_ID',
      index: 0,
      type: 'message_creation',
      stepDetails: {
        type: 'message_creation',
        message_creation: { message_id: responseMessageId },
      },
      usage: null,
    },
  });

  // Stream the reply in small chunks so the UI feels live.
  const chunks = replyText.match(/.{1,8}/g) ?? [replyText];
  let i = 0;

  function writeChunk() {
    if (i < chunks.length) {
      writeSse(res, {
        event: 'on_message_delta',
        data: {
          id: stepId,
          delta: {
            content: [{ type: 'text', text: chunks[i] }],
          },
        },
      });
      i += 1;
      setTimeout(writeChunk, 20);
      return;
    }

    writeSse(res, {
      final: true,
      requestMessage,
      responseMessage,
      conversation: {
        conversationId,
        title: userText?.slice(0, 40) || 'New Chat',
        endpoint,
        model,
      },
      title: userText?.slice(0, 40) || 'New Chat',
    });

    const existing = messagesByConvo.get(conversationId) ?? [];
    messagesByConvo.set(conversationId, [...existing, requestMessage, responseMessage]);
    conversations.set(conversationId, {
      conversationId,
      title: userText?.slice(0, 40) || 'New Chat',
      endpoint,
      model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    streams.delete(streamId);
    res.end();
  }

  setTimeout(writeChunk, 30);
}

export function createMockApiMiddleware() {
  return async function mockApiMiddleware(req, res, next) {
    const url = new URL(req.url || '/', 'http://localhost');
    const { pathname } = url;
    const method = (req.method || 'GET').toUpperCase();

    if (pathname === '/health') {
      return sendText(res, 200, 'OK');
    }

    if (!pathname.startsWith('/api')) {
      return next();
    }

    if (pathname.startsWith('/api/config')) {
      return sendJson(res, 200, MOCK_STARTUP_CONFIG);
    }

    if (pathname === '/api/auth/refresh' && method === 'POST') {
      return sendJson(res, 200, { token: MOCK_TOKEN, user: MOCK_USER });
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      return sendJson(res, 200, { token: MOCK_TOKEN, user: MOCK_USER });
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      return sendJson(res, 200, { message: 'Logout successful' });
    }

    if (pathname === '/api/user' && method === 'GET') {
      return sendJson(res, 200, MOCK_USER);
    }

    if (pathname === '/api/user/plugins') {
      return sendJson(res, 200, []);
    }

    if (pathname === '/api/user/terms') {
      return sendJson(res, 200, { termsAccepted: true });
    }

    if (pathname === '/api/user/settings/favorites') {
      return sendJson(res, 200, { favorites: [] });
    }

    if (pathname === '/api/user/settings/skills/active') {
      return sendJson(res, 200, {});
    }

    if (pathname === '/api/user/settings/favorites/tools') {
      return sendJson(res, 200, []);
    }

    if (pathname === '/api/balance') {
      return sendJson(res, 200, { tokenCredits: 999999 });
    }

    if (pathname === '/api/banner') {
      return sendJson(res, 200, null);
    }

    if (pathname === '/api/endpoints') {
      return sendJson(res, 200, MOCK_ENDPOINTS);
    }

    if (pathname === '/api/endpoints/token-config') {
      return sendJson(res, 200, {});
    }

    if (pathname === '/api/models') {
      return sendJson(res, 200, MOCK_MODELS);
    }

    if (pathname === '/api/search/enable') {
      return sendJson(res, 200, true);
    }

    if (pathname.startsWith('/api/search')) {
      return sendJson(res, 200, {
        conversations: Array.from(conversations.values()),
        messages: [],
        nextCursor: null,
      });
    }

    if (pathname === '/api/presets') {
      return sendJson(res, 200, []);
    }

    if (pathname === '/api/plugins') {
      return sendJson(res, 200, []);
    }

    if (pathname === '/api/tags' || pathname.startsWith('/api/tags/')) {
      return sendJson(res, 200, []);
    }

    if (pathname === '/api/files' || pathname.startsWith('/api/files/')) {
      if (pathname === '/api/files/config') {
        return sendJson(res, 200, {
          endpoints: {},
          serverFileSizeLimit: 512,
          avatarSizeLimit: 2,
          fileLimit: 10,
        });
      }
      if (pathname === '/api/files/usage') {
        return sendJson(res, 200, { totalBytes: 0 });
      }
      return sendJson(res, 200, []);
    }

    if (pathname === '/api/prompts' || pathname.startsWith('/api/prompts/')) {
      if (pathname === '/api/prompts/all' || pathname.endsWith('/prompts/all')) {
        return sendJson(res, 200, Array.from(promptGroups.values()));
      }
      if (pathname.includes('/groups') && method === 'GET' && !match(pathname, '/api/prompts/groups/:id')) {
        return sendJson(res, 200, {
          promptGroups: Array.from(promptGroups.values()),
          pageNumber: '1',
          pageSize: 10,
          pages: 1,
          has_more: false,
          after: null,
        });
      }
      const groupParams = match(pathname, '/api/prompts/groups/:id');
      if (groupParams && method === 'GET') {
        const group = promptGroups.get(groupParams.id);
        if (!group) {
          return sendJson(res, 404, { message: 'Prompt group not found' });
        }
        return sendJson(res, 200, group);
      }
      if (method === 'POST' && (pathname === '/api/prompts' || pathname === '/api/prompts/')) {
        const body = (await readBody(req)) ?? {};
        const groupId = uuid();
        const promptId = uuid();
        const group = {
          _id: groupId,
          name: body.name || body.prompt?.group?.name || 'Untitled prompt',
          category: body.category || '',
          oneliner: body.oneliner || '',
          command: body.command || '',
          author: MOCK_USER.id,
          authorName: MOCK_USER.name,
          productionId: promptId,
          projectIds: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        const prompt = {
          _id: promptId,
          groupId,
          prompt: body.prompt?.prompt ?? body.prompt ?? '',
          type: body.type || 'text',
          author: MOCK_USER.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        promptGroups.set(groupId, group);
        prompts.set(promptId, prompt);
        return sendJson(res, 200, { prompt, group });
      }
      if (method === 'GET' && pathname === '/api/prompts') {
        return sendJson(res, 200, Array.from(prompts.values()));
      }
      await readBody(req);
      return sendJson(res, 200, {
        promptGroups: Array.from(promptGroups.values()),
        pageNumber: '1',
        pageSize: 10,
        pages: 1,
        has_more: false,
        after: null,
      });
    }

    if (pathname === '/api/agents/chat/active') {
      return sendJson(res, 200, []);
    }

    if (pathname === '/api/agents/chat/abort' && method === 'POST') {
      await readBody(req);
      return sendJson(res, 200, { success: true });
    }

    const streamParams = match(pathname, '/api/agents/chat/stream/:streamId');
    if (streamParams && method === 'GET') {
      const job = streams.get(streamParams.streamId);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      if (!job) {
        writeSse(res, {
          final: true,
          earlyAbort: true,
          requestMessage: null,
          responseMessage: null,
          conversation: null,
        });
        return res.end();
      }
      streamPingPong(res, job);
      return;
    }

    // Resumable chat start: POST /api/agents/chat/:endpoint → { streamId }
    if (
      method === 'POST' &&
      pathname.startsWith('/api/agents/chat/') &&
      !pathname.includes('/stream/') &&
      pathname !== '/api/agents/chat/abort' &&
      pathname !== '/api/agents/chat/active' &&
      pathname !== '/api/agents/chat/resume'
    ) {
      const body = (await readBody(req)) ?? {};
      const streamId = uuid();
      const userMessageId = body.messageId || uuid();
      const parentMessageId =
        body.parentMessageId || '00000000-0000-0000-0000-000000000000';
      const conversationId =
        body.conversationId && body.conversationId !== 'new'
          ? body.conversationId
          : uuid();
      streams.set(streamId, {
        streamId,
        conversationId,
        userMessageId,
        parentMessageId,
        userText: body.text ?? '',
        endpoint: body.endpoint || 'openAI',
        model: body.model || 'gpt-4o',
      });
      return sendJson(res, 200, { streamId });
    }

    if (pathname === '/api/agents/categories') {
      return sendJson(res, 200, [
        { value: 'general', label: 'General' },
        { value: 'productivity', label: 'Productivity' },
      ]);
    }

    if (pathname === '/api/agents' || pathname.startsWith('/api/agents/')) {
      if (pathname.includes('/marketplace') || url.searchParams.has('requiredPermission')) {
        return sendJson(res, 200, { data: [], after: null, has_more: false });
      }
      if (match(pathname, '/api/agents/:agentId') && method === 'GET') {
        return sendJson(res, 404, { message: 'Agent not found' });
      }
      if (method === 'POST' && pathname === '/api/agents') {
        const body = (await readBody(req)) ?? {};
        const agent = {
          id: uuid(),
          name: body.name || 'New agent',
          description: body.description || '',
          instructions: body.instructions || '',
          provider: 'openAI',
          model: body.model || 'gpt-4o',
          tools: body.tools || [],
          category: body.category || 'general',
        };
        return sendJson(res, 200, agent);
      }
      return sendJson(res, 200, { data: [], objects: [], after: null, has_more: false });
    }

    if (pathname === '/api/assistants' || pathname.startsWith('/api/assistants/')) {
      return sendJson(res, 200, { data: [] });
    }

    if (pathname === '/api/skills' || pathname.startsWith('/api/skills/')) {
      if (method === 'GET' && pathname === '/api/skills') {
        return sendJson(res, 200, { skills: Array.from(skills.values()) });
      }
      if (method === 'POST' && pathname === '/api/skills') {
        const body = (await readBody(req)) ?? {};
        const skill = {
          _id: uuid(),
          name: body.name || 'New skill',
          description: body.description || '',
          author: MOCK_USER.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        skills.set(skill._id, skill);
        return sendJson(res, 200, skill);
      }
      const skillParams = match(pathname, '/api/skills/:skillId');
      if (skillParams && method === 'GET') {
        const skill = skills.get(skillParams.skillId);
        if (!skill) {
          return sendJson(res, 404, { message: 'Skill not found' });
        }
        return sendJson(res, 200, skill);
      }
      await readBody(req);
      return sendJson(res, 200, { skills: Array.from(skills.values()) });
    }

    if (pathname === '/api/projects' || pathname.startsWith('/api/projects/')) {
      if (method === 'GET' && pathname === '/api/projects') {
        return sendJson(res, 200, {
          projects: Array.from(projects.values()),
          nextCursor: null,
        });
      }
      if (method === 'POST' && pathname === '/api/projects') {
        const body = (await readBody(req)) ?? {};
        const project = {
          _id: uuid(),
          name: body.name || 'New project',
          description: body.description || '',
          conversationCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        projects.set(project._id, project);
        return sendJson(res, 200, project);
      }
      const projectParams = match(pathname, '/api/projects/:projectId');
      if (projectParams && method === 'GET') {
        const project = projects.get(projectParams.projectId);
        if (!project) {
          return sendJson(res, 404, { message: 'Project not found' });
        }
        return sendJson(res, 200, project);
      }
      await readBody(req);
      return sendJson(res, 200, { projects: Array.from(projects.values()), nextCursor: null });
    }

    if (pathname === '/api/memories' || pathname.startsWith('/api/memories/')) {
      return sendJson(res, 200, { memories: [], totalPages: 1, pageNumber: '1' });
    }

    if (pathname === '/api/keys' || pathname.startsWith('/api/keys')) {
      return sendJson(res, 200, { expiresAt: null });
    }

    if (pathname.includes('/gen_title')) {
      return sendJson(res, 200, { title: 'New Chat' });
    }

    if (pathname === '/api/categories') {
      return sendJson(res, 200, []);
    }

    if (pathname === '/api/mcp/tools') {
      return sendJson(res, 200, []);
    }

    if (pathname === '/api/mcp/servers' || pathname.startsWith('/api/mcp/')) {
      return sendJson(res, 200, {});
    }

    if (pathname === '/api/messages' || pathname.startsWith('/api/messages/')) {
      const convoMatch = match(pathname, '/api/messages/:conversationId');
      if (convoMatch && method === 'GET') {
        return sendJson(res, 200, messagesByConvo.get(convoMatch.conversationId) ?? []);
      }
      if (method === 'GET' && pathname === '/api/messages') {
        const search = url.searchParams.get('search');
        const allMessages = Array.from(messagesByConvo.values()).flat();
        const filtered =
          search && search.length > 0
            ? allMessages.filter((m) =>
                String(m.text ?? '')
                  .toLowerCase()
                  .includes(search.toLowerCase()),
              )
            : allMessages;
        return sendJson(res, 200, { messages: filtered, nextCursor: null });
      }
      await readBody(req);
      return sendJson(res, 200, { messages: [], nextCursor: null });
    }

    if (match(pathname, '/api/roles/:roleName')) {
      const params = match(pathname, '/api/roles/:roleName');
      if (params?.roleName?.toUpperCase() === 'ADMIN') {
        return sendJson(res, 200, { ...MOCK_ROLE_USER, name: 'ADMIN' });
      }
      return sendJson(res, 200, MOCK_ROLE_USER);
    }

    if (pathname === '/api/roles' || pathname.startsWith('/api/admin/')) {
      return sendJson(res, 200, { USER: MOCK_ROLE_USER });
    }

    if (pathname.startsWith('/api/permissions/')) {
      return sendJson(res, 200, { permissions: [] });
    }

    if (pathname === '/api/convos' || pathname.startsWith('/api/convos/')) {
      if (method === 'GET' && pathname === '/api/convos') {
        return sendJson(res, 200, {
          conversations: Array.from(conversations.values()),
          nextCursor: null,
          pageNumber: '1',
          pageSize: 25,
        });
      }
      if (method === 'GET' && match(pathname, '/api/convos/:id')) {
        const params = match(pathname, '/api/convos/:id');
        const convo = conversations.get(params.id);
        if (!convo) {
          return sendJson(res, 404, { message: 'Conversation not found' });
        }
        return sendJson(res, 200, convo);
      }
      await readBody(req);
      return sendJson(res, 200, { conversation: null, conversations: [] });
    }

    if (pathname.startsWith('/api/ask')) {
      const body = (await readBody(req)) ?? {};
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      const conversationId = body.conversationId && body.conversationId !== 'new'
        ? body.conversationId
        : uuid();
      const userMessageId = body.messageId || uuid();
      streamPingPong(res, {
        streamId: uuid(),
        conversationId,
        userMessageId,
        parentMessageId: body.parentMessageId || '00000000-0000-0000-0000-000000000000',
        userText: body.text ?? '',
        endpoint: body.endpoint || 'openAI',
        model: body.model || 'gpt-4o',
      });
      return;
    }

    console.log(`[mock-api] unhandled ${method} ${pathname}`);
    await readBody(req);
    return sendJson(res, 200, {});
  };
}

export { MOCK_USER, MOCK_TOKEN, MOCK_STARTUP_CONFIG };

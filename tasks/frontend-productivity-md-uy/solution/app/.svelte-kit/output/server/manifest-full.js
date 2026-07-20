export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.D122gS6l.js",app:"_app/immutable/entry/app.B_11_dVX.js",imports:["_app/immutable/entry/start.D122gS6l.js","_app/immutable/chunks/CqRk9ILx.js","_app/immutable/chunks/COuBTRMa.js","_app/immutable/chunks/CB6zC0U1.js","_app/immutable/entry/app.B_11_dVX.js","_app/immutable/chunks/CB6zC0U1.js","_app/immutable/chunks/COuBTRMa.js","_app/immutable/chunks/Bzak7iHL.js","_app/immutable/chunks/OS6-2jRK.js","_app/immutable/chunks/C_7YdnXx.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
		],
		remotes: {

		},
		routes: [
			{
				id: "/[...path]",
				pattern: /^(?:\/([^]*))?\/?$/,
				params: [{"name":"path","optional":false,"rest":true,"chained":true}],
				page: { layouts: [0,2,], errors: [1,,], leaf: 3 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {

			return {  };
		},
		server_assets: {}
	}
}
})();

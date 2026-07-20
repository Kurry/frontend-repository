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
		client: {start:"_app/immutable/entry/start.Csiynmh0.js",app:"_app/immutable/entry/app.CROZfH_u.js",imports:["_app/immutable/entry/start.Csiynmh0.js","_app/immutable/chunks/Cv8gQ_wm.js","_app/immutable/chunks/Deo_Z8-r.js","_app/immutable/chunks/HdULwBtU.js","_app/immutable/entry/app.CROZfH_u.js","_app/immutable/chunks/Deo_Z8-r.js","_app/immutable/chunks/BuAWWzQW.js","_app/immutable/chunks/D7Lp_2Q6.js","_app/immutable/chunks/HdULwBtU.js","_app/immutable/chunks/B4XxeEqL.js","_app/immutable/chunks/0Xs4_WcP.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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

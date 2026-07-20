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
		client: {start:"_app/immutable/entry/start.DexqvrhK.js",app:"_app/immutable/entry/app.pd_-KlGP.js",imports:["_app/immutable/entry/start.DexqvrhK.js","_app/immutable/chunks/UFhDSVNE.js","_app/immutable/chunks/cnHa7thY.js","_app/immutable/chunks/53uiX5hm.js","_app/immutable/entry/app.pd_-KlGP.js","_app/immutable/chunks/cnHa7thY.js","_app/immutable/chunks/BFYSJnDJ.js","_app/immutable/chunks/BjkWb9MB.js","_app/immutable/chunks/53uiX5hm.js","_app/immutable/chunks/5SnBu2G_.js","_app/immutable/chunks/CdiIMTNR.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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

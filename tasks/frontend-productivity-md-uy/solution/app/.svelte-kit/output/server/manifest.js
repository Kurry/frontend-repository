export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.png","manifest.webmanifest","mduy-favicon.png","sw.js"]),
	mimeTypes: {".png":"image/png",".webmanifest":"application/manifest+json",".js":"text/javascript"},
	_: {
		client: {start:"_app/immutable/entry/start.BjvKCbOO.js",app:"_app/immutable/entry/app.BMcMiHJC.js",imports:["_app/immutable/entry/start.BjvKCbOO.js","_app/immutable/chunks/9s4Rp8gK.js","_app/immutable/chunks/CkSsJmA2.js","_app/immutable/chunks/BWkQkWkD.js","_app/immutable/entry/app.BMcMiHJC.js","_app/immutable/chunks/CkSsJmA2.js","_app/immutable/chunks/BCL4Kcz2.js","_app/immutable/chunks/B38e2xaj.js","_app/immutable/chunks/BWkQkWkD.js","_app/immutable/chunks/CvgXLFqr.js","_app/immutable/chunks/Bok1hbxK.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
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

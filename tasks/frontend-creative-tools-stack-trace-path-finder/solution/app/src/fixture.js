export const fixtureGraph = {
  id: "fix-graph-01",
  nodes: [
    { id: "n1", basename: "main.py", symbol: "start_app", language: "python", lineRange: [10, 20] },
    { id: "n2", basename: "app.py", symbol: "run", language: "python", lineRange: [5, 15] },
    { id: "n3", basename: "router.py", symbol: "dispatch", language: "python", lineRange: [25, 40] },
    { id: "n4", basename: "router.py", symbol: "handle_req", language: "python", lineRange: [50, 70] },
    { id: "n5", basename: "handler.js", symbol: "processData", language: "javascript", lineRange: [100, 120] },
    { id: "n6", basename: "handler.js", symbol: "fetchRecord", language: "javascript", lineRange: [130, 150] },
    { id: "n7", basename: "db.js", symbol: "query", language: "javascript", lineRange: [10, 30] },
    { id: "n8", basename: "db.js", symbol: "execute", language: "javascript", lineRange: [40, 60] },
    { id: "n9", basename: "utils.py", symbol: "format", language: "python", lineRange: [5, 15] },
    { id: "n10", basename: "utils.py", symbol: "parse", language: "python", lineRange: [20, 30] },
    { id: "n11", basename: "auth.swift", symbol: "verify", language: "swift", lineRange: [50, 70] },
    { id: "n12", basename: "auth.swift", symbol: "checkToken", language: "swift", lineRange: [80, 100] },
    { id: "n13", basename: "core.swift", symbol: "init", language: "swift", lineRange: [10, 20] },
    { id: "n14", basename: "db.js", symbol: "connect", language: "javascript", lineRange: [5, 15] },
    { id: "n15", basename: "app.py", symbol: "setup", language: "python", lineRange: [20, 30] },
    { id: "n16", basename: "logger.py", symbol: "log", language: "python", lineRange: [5, 10] },
    { id: "n17", basename: "logger.js", symbol: "info", language: "javascript", lineRange: [5, 10] },
    { id: "n18", basename: "main.py", symbol: "init", language: "python", lineRange: [5, 10] },
    { id: "n19", basename: "router.py", symbol: "match", language: "python", lineRange: [15, 20] },
    { id: "n20", basename: "handler.js", symbol: "parseReq", language: "javascript", lineRange: [10, 20] },
    { id: "n21", basename: "db.js", symbol: "close", language: "javascript", lineRange: [70, 80] },
    { id: "n22", basename: "utils.py", symbol: "clean", language: "python", lineRange: [35, 45] },
    { id: "n23", basename: "auth.swift", symbol: "logout", language: "swift", lineRange: [110, 120] },
    { id: "n24", basename: "core.swift", symbol: "deinit", language: "swift", lineRange: [25, 30] },
    { id: "n25", basename: "logger.py", symbol: "error", language: "python", lineRange: [15, 20] },
    { id: "n26", basename: "logger.js", symbol: "error", language: "javascript", lineRange: [15, 20] }
  ],
  edges: [
    { source: "n1", target: "n2" }, { source: "n2", target: "n3" }, { source: "n3", target: "n4" },
    { source: "n4", target: "n5" }, { source: "n5", target: "n6" }, { source: "n6", target: "n7" },
    { source: "n7", target: "n8" }, { source: "n4", target: "n9" }, { source: "n9", target: "n10" },
    { source: "n3", target: "n11" }, { source: "n11", target: "n12" }, { source: "n1", target: "n15" },
    { source: "n15", target: "n16" }, { source: "n2", target: "n16" }, { source: "n5", target: "n17" },
    { source: "n7", target: "n17" }, { source: "n18", target: "n1" }, { source: "n3", target: "n19" },
    { source: "n19", target: "n4" }, { source: "n4", target: "n20" }, { source: "n20", target: "n5" },
    { source: "n8", target: "n21" }, { source: "n10", target: "n22" }, { source: "n12", target: "n23" },
    { source: "n13", target: "n24" }, { source: "n16", target: "n25" }, { source: "n17", target: "n26" },
    { source: "n2", target: "n15" }, { source: "n3", target: "n9" }, { source: "n6", target: "n20" },
    { source: "n4", target: "n11" }, { source: "n15", target: "n3" }, { source: "n8", target: "n17" },
    { source: "n12", target: "n11" }, { source: "n2", target: "n4" }, { source: "n5", target: "n8" },
    { source: "n1", target: "n18" }, { source: "n11", target: "n13" }
  ],
  excerpts: [
    { id: "e1", text: "def start_app():\n  run()\n  setup()", offset: 10, node: "n1" },
    { id: "e2", text: "def run():\n  dispatch()", offset: 5, node: "n2" },
    { id: "e3", text: "def dispatch():\n  handle_req()", offset: 25, node: "n3" },
    { id: "e4", text: "def handle_req():\n  processData()", offset: 50, node: "n4" },
    { id: "e5", text: "function processData() {\n  fetchRecord();\n}", offset: 100, node: "n5" },
    { id: "e6", text: "function fetchRecord() {\n  query();\n}", offset: 130, node: "n6" },
    { id: "e7", text: "function query() {\n  execute();\n}", offset: 10, node: "n7" },
    { id: "e8", text: "function execute() {\n  close();\n}", offset: 40, node: "n8" },
    { id: "e9", text: "def format():\n  parse()", offset: 5, node: "n9" },
    { id: "e10", text: "def parse():\n  clean()", offset: 20, node: "n10" },
    { id: "e11", text: "func verify() {\n  checkToken()\n}", offset: 50, node: "n11" },
    { id: "e12", text: "func checkToken() {\n  logout()\n}", offset: 80, node: "n12" },
    { id: "e13", text: "func init() {\n  deinit()\n}", offset: 10, node: "n13" },
    { id: "e14", text: "function connect() {\n  // ok\n}", offset: 5, node: "n14" }
  ]
};

export const RAW_TRACE_FIXTURE = `Traceback (most recent call last):
  File "main.py", line 12, in start_app
  File "router.py", line 28, in dispatch
  File "handler.js", line 105, in processData
  at fetchRecord (handler.js:135)
  at db.js:45 (execute)
  Unresolved frame missing logic
  File "utils.py", line 8, in format (wrapper)`;

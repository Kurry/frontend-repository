import json

with open("tsconfig.app.json", "r") as f:
    config = json.load(f)

if "erasableSyntaxOnly" in config["compilerOptions"]:
    del config["compilerOptions"]["erasableSyntaxOnly"]

with open("tsconfig.app.json", "w") as f:
    json.dump(config, f, indent=2)

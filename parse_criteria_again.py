import tomli
import glob
import os

criteria_dict = {}
for filepath in glob.glob("tasks/frontend-data-tracking-release-diff/tests/*/*.toml"):
    with open(filepath, "rb") as f:
        try:
            data = tomli.load(f)
            if "criterion" in data:
                for c in data["criterion"]:
                    _id = c.get("id")
                    if _id not in criteria_dict:
                        criteria_dict[_id] = c
        except Exception as e:
            pass

def sort_key(item):
    try:
        parts = item[0].split('.')
        return (float(parts[0]), float(parts[1]))
    except:
        return (999, 999)

out = []
for k, v in sorted(criteria_dict.items(), key=sort_key):
    out.append(f'{v.get("id")} {v.get("name")}')
with open("/tmp/all_criteria_list.txt", "w") as f:
    f.write("\n".join(out))

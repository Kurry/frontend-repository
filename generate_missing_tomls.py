import os

task_dir = "tasks/frontend-planning-fictional-pocket-notebook-page-budget-planner"

with open(f"{task_dir}/tests/user_flows/user_flows.toml", "rb") as f:
    lines = f.readlines()

# Find where the first criterion starts, which is empty line before [[criterion]]
header_lines = []
for line in lines:
    if line.startswith(b"[[criterion]]"):
        break
    header_lines.append(line)

def write_toml(dim, criteria):
    os.makedirs(f"{task_dir}/tests/{dim}", exist_ok=True)
    file_path = f"{task_dir}/tests/{dim}/{dim}.toml"
    with open(file_path, "wb") as f:
        for line in header_lines:
            f.write(line)
        for criterion in criteria:
            f.write(b"[[criterion]]\n")
            f.write(f"id = \"{criterion['id']}\"\n".encode())
            f.write(f"name = \"{criterion['name']}\"\n".encode())
            f.write(f"description = \"{criterion['description']}\"\n".encode())
            f.write(b"type = \"binary\"\n")
            f.write(f"weight = {criterion['weight']}\n\n".encode())

core_features = [
    {"id": "1.1", "name": "move_boundary_04_canonical_spread", "description": "Starting from the initial state, canonical movement of BOUNDARY-04 to afterPage 76 updates pages 69-76 transferring exactly from SEC-05 to SEC-04, allocations to 28/16, total overflow 0, total spare 0, issue ISSUE-04 resolved, while preserving 96 pages.", "weight": "1.0"},
    {"id": "1.2", "name": "repair_preview_overlapping", "description": "Pasting a deliberately invalid plan shows a preview of structural repair, and clicking Cancel discards the preview, mutating nothing.", "weight": "1.0"},
]
write_toml("core_features", core_features)

visual_design = [
    {"id": "2.1", "name": "desktop_book_layout_visible", "description": "At 1440x900, the notebook view renders 96 numbered fore-edge lines, six patterned section bands, five handles, and fixed Index cap.", "weight": "1.0"},
]
write_toml("visual_design", visual_design)

motion = [
    {"id": "3.1", "name": "drag_boundary_ghost_fan", "description": "Dragging a boundary shows origin ghost, target spread, transferring page fan, old/new section ranges, and exact snap distance before commit.", "weight": "1.0"},
    {"id": "3.2", "name": "invalid_return_refan", "description": "Invalid return visibly refans pages back to their original section.", "weight": "1.0"},
]
write_toml("motion", motion)

technical = [
    {"id": "4.1", "name": "no_console_errors", "description": "No console.error or unhandled promise rejections appear in the browser log during the verifier session.", "weight": "1.0"},
    {"id": "4.2", "name": "state_preservation", "description": "Canceled actions correctly restore previous allocation, selection, viewport, demand brush, filters, and focus without leaking state.", "weight": "1.0"},
]
write_toml("technical", technical)

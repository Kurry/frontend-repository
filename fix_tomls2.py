import os

criteria = [
    ("tests/core_features/core_features.toml", [
        ("AC-01-01", "Sources can be routed through filter, gain, and master."),
        ("AC-01-02", "Pucks control stereo pan and source gain via XY pad."),
        ("AC-01-03", "Filter invariant (low < high) is maintained."),
        ("AC-01-04", "Automation timeline supports up to 8 points per parameter/source."),
        ("AC-01-05", "Audition plays loopable 60-second preview."),
        ("AC-01-06", "Live analyser responds to the active audio graph."),
        ("AC-01-07", "Safety guard detects and warns about clipping."),
        ("AC-01-08", "Focus session clock suspends audio on pause."),
        ("AC-01-09", "Interruptions can be logged to focus sessions."),
        ("AC-01-10", "Two sound profiles can be compared."),
        ("AC-01-11", "JSON preset export produces valid matching state."),
        ("AC-01-12", "WAV preview renders 10s audio correctly."),
        ("AC-01-13", "Importing JSON reconstructs identical graph state.")
    ]),
    ("tests/visual_design/visual_design.toml", [
        ("AC-02-01", "Inactive vs selected vs automated visual states are legible."),
        ("AC-02-02", "The design aesthetic is information-dense with clear logical sections.")
    ]),
    ("tests/motion/motion.toml", [
        ("AC-03-01", "Visual sampling animation stops when audio is paused."),
        ("AC-03-02", "Reduced motion provides static spectrum summary and numerical RMS.")
    ]),
    ("tests/technical/technical.toml", [
        ("AC-04-01", "No localStorage is used for state persistence."),
        ("AC-04-02", "State changes correctly propagate to WebMCP.")
    ])
]

with open("tasks/frontend-productivity-focus-soundscape-automation-mixer/tests/accessibility/accessibility.toml", "r") as f:
    content = f.read()

header = content.split('\n[dimension]')[0] + '\n'

for toml_file, items in criteria:
    with open(f"tasks/frontend-productivity-focus-soundscape-automation-mixer/{toml_file}", "w") as f:
        f.write(header)
        f.write("[dimension]\n")
        for i, (id_str, desc) in enumerate(items):
            f.write(f"\n[[dimension.criteria]]\n")
            f.write(f'id = "{id_str}"\n')
            f.write(f'description = "{desc}"\n')
            f.write('type = "must-have"\n')

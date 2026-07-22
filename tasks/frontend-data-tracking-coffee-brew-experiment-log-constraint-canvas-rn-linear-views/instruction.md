# Coffee Brew Experiment Log — Constraint Canvas — Linear Filtered Views

<summary>
Create a domain-native browser application for managing brew experiments. The application uses Tailwind CSS 4.3.2 for styling. All assets must be loaded locally without CDNs.
</summary>

<core_features>
The user can manage a collection of brew experiments. They can create, edit, archive, and filter experiments.
The signature interaction is dragging a selected record across constraint lanes (e.g. Temperature, Grind Size, Brew Time) and resolving a conflict, which updates the linked representation.
The user can export and import the entire session state as a JSON artifact (brew-experiment-v1.json).
</core_features>

<visual_design>
The visual thesis is a distinctive workbench with clear state tokens and a calm focused canvas.
</visual_design>

<motion>
Motion connects the acted-on item to its new state, with a reduced-motion equivalent.
</motion>

<requirements>
- The state must be entirely in-memory. NO localStorage.
- Keyboard and touch-equivalent controls must produce the identical canonical mutation.
- The desktop surface must become a usable stack/drawer/stepper without horizontal overflow on mobile.
- Validating the JSON artifact upon import is required; malformed import must be a no-op.
- All assets must be loaded locally without CDNs.
</requirements>

<integrity>
- Work only from this instruction and `/app`; do not use `/solution`, `/tests`, or verifier artifacts.
</integrity>

<webmcp_action_contract>
# WebMCP action contract
The oracle application must implement the following actions over WebMCP.

- CRUD for brew experiments.
- Query active view / artifact state.
- Mutation: Drag selected record to a constraint lane.
- File import / export functions.
</webmcp_action_contract>

# Canonical instruction.md sections

The new-shape `instruction.md` is NOT markdown. `corpuscheck` parses it into
XML-like sections. Getting this wrong fails the `instruction` tier.

## Section order (canonical)

Emit sections in exactly this order (you may omit `<innovation>` and
`<reference_screenshots>` content is boilerplate):

```
<summary> … </summary>
<reference_screenshots> … </reference_screenshots>
<core_features> … </core_features>
<user_flows> … </user_flows>
<edge_cases> … </edge_cases>
<visual_design> … </visual_design>
<motion> … </motion>
<responsiveness> … </responsiveness>
<accessibility> … </accessibility>
<performance> … </performance>
<writing> … </writing>
<requirements> … </requirements>
<integrity> … </integrity>
<delivery> … </delivery>
<webmcp_action_contract> … </webmcp_action_contract>   ← rendered by `corpuscheck webmcp apply`; do not hand-write
```

`<integrity>`, `<delivery>`, `<webmcp_action_contract>` are PROTECTED.

## Rules (each is a validator check)

- **No markdown in non-PROTECTED sections.** No `**bold**`, no `#` headings, no
  `` `backticks` ``. Plain prose and `- ` bullet lines only. (PROTECTED sections
  may keep backticks — reuse them verbatim from a reference task.)
- **Tailwind version + no-CDN**: `<summary>` or `<requirements>` must literally
  contain the pinned Tailwind string (currently `Tailwind CSS 4.3.2`), and
  `<requirements>` must contain one of: `installed via npm`, `bundled locally`,
  or `cdn`. Confirm the version against the oracle app's package.json.
- **Behavioral sections must agree with the rubric.** `<core_features>`,
  `<visual_design>`, `<motion>`, `<user_flows>`, `<edge_cases>` describe the same
  behaviors the corresponding dimension tomls grade. Since you port both from the
  same source PRD, keep them consistent.

## How to author

1. Copy a same-genre valid task's instruction (e.g.
   `tasks/frontend-productivity-loopdaily/instruction.md`) as a structural template.
2. Reuse `<reference_screenshots>`, `<integrity>`, `<delivery>` verbatim.
3. Rewrite `<summary>` naming the app, its stack (framework + state lib +
   `Tailwind CSS 4.3.2`), and its persistence/recovery essence.
4. Turn the source PRD's Key Features into `<core_features>` `Feature:` lines and
   observable bullets; split flows into `<user_flows>`, edge behaviors into
   `<edge_cases>`, visual tokens into `<visual_design>`, etc.
5. `<requirements>`: the stack (name Tailwind 4.3.2), the no-CDN rule, the
   persistence/recovery contract, "no backend/auth/routes".
6. Leave `<webmcp_action_contract>` out — phase 4 (`corpuscheck webmcp apply`)
   renders it from the registered binding.

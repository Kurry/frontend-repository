# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 1.31 undo_covers_comment_and_import
- Location: e2e.spec.mjs:523:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: -1
Received: 0
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e7]
      - generic [ref=e15]:
        - generic [ref=e16]: AI prompt engineering workspace
        - heading "PromptOps Execution Board" [level=1] [ref=e17]
    - generic [ref=e18]:
      - generic [ref=e19]: 12 cards
      - text: Live session
  - main [ref=e21]:
    - region "Board toolbar" [ref=e22]:
      - generic [ref=e23]:
        - generic [ref=e25]:
          - generic [ref=e26]: Assignee
          - generic [ref=e27]:
            - combobox "Assignee" [ref=e28] [cursor=pointer]:
              - option "All assignees" [selected]
              - option "Maya Chen"
              - option "Omar Farouk"
              - option "Lin Park"
              - option "Inez Silva"
            - img
        - search "Search cards by title" [ref=e29]:
          - generic:
            - img
          - generic [ref=e30]: Search cards by title
          - searchbox "Search cards by title" [ref=e31]
        - button "Clear filters" [disabled] [ref=e32]
      - generic [ref=e33]:
        - generic [ref=e34]:
          - generic [ref=e35]:
            - button "Undo (Ctrl+Z)" [disabled]:
              - img
          - tooltip
        - generic [ref=e36]:
          - generic [ref=e37]:
            - button "Redo (Ctrl+Shift+Z)" [disabled]:
              - img
          - tooltip
        - button "Export" [ref=e38] [cursor=pointer]:
          - text: Export
          - img [ref=e39]
    - region "Board activity" [ref=e42]:
      - generic [ref=e43]:
        - strong [ref=e44]: 28%
        - text: of 47 task items complete
      - generic [ref=e45]:
        - strong [ref=e46]: "0"
        - text: runs completed this session
      - generic [ref=e47]: All columns within WIP limits
    - generic "Execution kanban board" [ref=e48]:
      - generic [ref=e49]:
        - region "Backlog" [ref=e50]:
          - generic [ref=e51]:
            - generic [ref=e53]:
              - heading "Backlog" [level=2] [ref=e54]
              - generic "4 visible cards" [ref=e55]: "4"
            - generic [ref=e57]:
              - button "Add Card to Backlog" [ref=e59] [cursor=pointer]:
                - img [ref=e60]
              - tooltip
          - generic [ref=e62]:
            - button "Open Calibrate customer support tone across escalation tiers" [ref=e63] [cursor=pointer]:
              - generic [ref=e64]:
                - generic [ref=e66]:
                  - checkbox "Select Calibrate customer support tone across escalation tiers" [ref=e67]
                  - generic [ref=e69]: Select Calibrate customer support tone across escalation tiers
                - generic:
                  - img
                - generic [ref=e72]: pending
                - generic [ref=e75]:
                  - button "Move Calibrate customer support tone across escalation tiers" [ref=e77]:
                    - img "Move Calibrate customer support tone across escalation tiers" [ref=e78]
                  - tooltip
              - heading "Calibrate customer support tone across escalation tiers" [level=3] [ref=e82]
              - paragraph [ref=e83]: Build a tone rubric and compare generated responses for standard, elevated, and critical support cases.
              - button "Calibrate customer tone" [ref=e84]:
                - img [ref=e85]
                - generic [ref=e93]: Calibrate customer tone
              - generic "Task item checklist" [ref=e94]:
                - generic [ref=e99]: Draft tone rubric
                - generic [ref=e104]: Assemble example tickets
                - generic [ref=e109]: Score baseline responses
                - generic [ref=e114]: Document acceptance range
              - generic "0 of 4 task items complete" [ref=e115]:
                - generic [ref=e116]:
                  - generic [ref=e117]: Progress
                  - strong [ref=e118]: 0 of 4
              - generic [ref=e120]:
                - generic "Maya Chen" [ref=e122]:
                  - generic [ref=e123]: MC
                - button "Run" [ref=e125]:
                  - text: Run
                  - img [ref=e126]
            - button "Open Expand adversarial safety evaluation suite" [ref=e128] [cursor=pointer]:
              - generic [ref=e129]:
                - generic [ref=e131]:
                  - checkbox "Select Expand adversarial safety evaluation suite" [ref=e132]
                  - generic [ref=e134]: Select Expand adversarial safety evaluation suite
                - generic:
                  - img
                - generic [ref=e137]: pending
                - generic [ref=e140]:
                  - button "Move Expand adversarial safety evaluation suite" [ref=e142]:
                    - img "Move Expand adversarial safety evaluation suite" [ref=e143]
                  - tooltip
              - heading "Expand adversarial safety evaluation suite" [level=3] [ref=e147]
              - paragraph [ref=e148]: Add refusal-boundary and prompt-injection cases to the evaluation harness.
              - button "Adversarial safety probe" [ref=e149]:
                - img [ref=e150]
                - generic [ref=e158]: Adversarial safety probe
              - generic "Task item checklist" [ref=e159]:
                - generic [ref=e164]: Map policy areas
                - generic [ref=e169]: Author attack prompts
                - generic [ref=e174]: Add expected outcomes
                - generic [ref=e179]: Run baseline model
                - generic [ref=e184]: Review false positives
              - generic "0 of 5 task items complete" [ref=e185]:
                - generic [ref=e186]:
                  - generic [ref=e187]: Progress
                  - strong [ref=e188]: 0 of 5
              - generic [ref=e190]:
                - generic "Omar Farouk" [ref=e192]:
                  - generic [ref=e193]: OF
                - button "Run" [ref=e195]:
                  - text: Run
                  - img [ref=e196]
            - button "Open Tune long-context synthesis prompt" [ref=e198] [cursor=pointer]:
              - generic [ref=e199]:
                - generic [ref=e201]:
                  - checkbox "Select Tune long-context synthesis prompt" [ref=e202]
                  - generic [ref=e204]: Select Tune long-context synthesis prompt
                - generic:
                  - img
                - generic [ref=e207]: pending
                - generic [ref=e210]:
                  - button "Move Tune long-context synthesis prompt" [ref=e212]:
                    - img "Move Tune long-context synthesis prompt" [ref=e213]
                  - tooltip
              - heading "Tune long-context synthesis prompt" [level=3] [ref=e217]
              - paragraph [ref=e218]: Improve factual traceability when source material exceeds 40k tokens.
              - button "Long-context synthesis" [ref=e219]:
                - img [ref=e220]
                - generic [ref=e228]: Long-context synthesis
              - generic "Task item checklist" [ref=e229]:
                - generic [ref=e234]: Select source corpus
                - generic [ref=e239]: Define citation format
                - generic [ref=e244]: Compare synthesis quality
              - generic "0 of 3 task items complete" [ref=e245]:
                - generic [ref=e246]:
                  - generic [ref=e247]: Progress
                  - strong [ref=e248]: 0 of 3
              - generic [ref=e250]:
                - generic "Lin Park" [ref=e252]:
                  - generic [ref=e253]: LP
                - button "Run" [ref=e255]:
                  - text: Run
                  - img [ref=e256]
            - button "Open Benchmark multilingual intent classifier" [ref=e258] [cursor=pointer]:
              - generic [ref=e259]:
                - generic [ref=e261]:
                  - checkbox "Select Benchmark multilingual intent classifier" [ref=e262]
                  - generic [ref=e264]: Select Benchmark multilingual intent classifier
                - generic:
                  - img
                - generic [ref=e267]: pending
                - generic [ref=e270]:
                  - button "Move Benchmark multilingual intent classifier" [ref=e272]:
                    - img "Move Benchmark multilingual intent classifier" [ref=e273]
                  - tooltip
              - heading "Benchmark multilingual intent classifier" [level=3] [ref=e277]
              - paragraph [ref=e278]: Measure intent accuracy for Spanish, French, German, and Japanese inputs.
              - generic "Task item checklist" [ref=e279]:
                - generic [ref=e284]: Prepare translated set
                - generic [ref=e289]: Run classification batch
                - generic [ref=e294]: Review low-confidence cases
                - generic [ref=e299]: Publish scorecard
              - generic "0 of 4 task items complete" [ref=e300]:
                - generic [ref=e301]:
                  - generic [ref=e302]: Progress
                  - strong [ref=e303]: 0 of 4
              - generic [ref=e305]:
                - generic "Inez Silva" [ref=e307]:
                  - generic [ref=e308]: IS
                - button "Run" [ref=e310]:
                  - text: Run
                  - img [ref=e311]
          - button "Add Card" [ref=e314] [cursor=pointer]:
            - text: Add Card
            - img [ref=e315]
        - region "In Progress" [ref=e317]:
          - generic [ref=e318]:
            - generic [ref=e319]:
              - generic [ref=e320]:
                - heading "In Progress" [level=2] [ref=e321]
                - generic "3 visible cards" [ref=e322]: "3"
              - generic [ref=e324]: WIP limit 3
            - generic [ref=e325]:
              - button "Add Card to In Progress" [ref=e327] [cursor=pointer]:
                - img [ref=e328]
              - tooltip
          - generic [ref=e330]:
            - button "Open Harden support triage agent against ambiguous requests" [ref=e331] [cursor=pointer]:
              - generic [ref=e332]:
                - generic [ref=e334]:
                  - checkbox "Select Harden support triage agent against ambiguous requests" [ref=e335]
                  - generic [ref=e337]: Select Harden support triage agent against ambiguous requests
                - generic:
                  - img
                - generic [ref=e340]: pending
                - generic [ref=e343]:
                  - button "Move Harden support triage agent against ambiguous requests" [ref=e345]:
                    - img "Move Harden support triage agent against ambiguous requests" [ref=e346]
                  - tooltip
              - heading "Harden support triage agent against ambiguous requests" [level=3] [ref=e350]
              - paragraph [ref=e351]: "Exercise routing behavior when product area and customer impact are unclear. The routing check is flaky by design: it fails on its first two attempts and recovers on the third."
              - button "Support issue triage" [ref=e352]:
                - img [ref=e353]
                - generic [ref=e361]: Support issue triage
              - generic "Task item checklist" [ref=e362]:
                - generic [ref=e367]: Normalize ticket samples
                - generic [ref=e372]: Infer product routing
                - generic [ref=e377]: Validate urgency labels
                - generic [ref=e382]: Check escalation notes
                - generic [ref=e387]: Compile findings
              - generic "0 of 5 task items complete" [ref=e388]:
                - generic [ref=e389]:
                  - generic [ref=e390]: Progress
                  - strong [ref=e391]: 0 of 5
              - generic [ref=e393]:
                - generic "Maya Chen" [ref=e395]:
                  - generic [ref=e396]: MC
                - button "Run" [ref=e398]:
                  - text: Run
                  - img [ref=e399]
            - button "Open Evaluate guarded SQL generation" [ref=e401] [cursor=pointer]:
              - generic [ref=e402]:
                - generic [ref=e404]:
                  - checkbox "Select Evaluate guarded SQL generation" [ref=e405]
                  - generic [ref=e407]: Select Evaluate guarded SQL generation
                - generic:
                  - img
                - generic [ref=e410]: pending
                - generic [ref=e413]:
                  - button "Move Evaluate guarded SQL generation" [ref=e415]:
                    - img "Move Evaluate guarded SQL generation" [ref=e416]
                  - tooltip
              - heading "Evaluate guarded SQL generation" [level=3] [ref=e420]
              - paragraph [ref=e421]: Validate schema adherence, read-only safety, and usefulness of generated queries.
              - button "Guarded SQL generation" [ref=e422]:
                - img [ref=e423]
                - generic [ref=e431]: Guarded SQL generation
              - generic "Task item checklist" [ref=e432]:
                - generic [ref=e437]: Load schema fixtures
                - generic [ref=e442]: Generate query batch
                - generic [ref=e447]: Check safety constraints
                - generic [ref=e452]: Summarize execution accuracy
              - generic "0 of 4 task items complete" [ref=e453]:
                - generic [ref=e454]:
                  - generic [ref=e455]: Progress
                  - strong [ref=e456]: 0 of 4
              - generic [ref=e458]:
                - generic "Inez Silva" [ref=e460]:
                  - generic [ref=e461]: IS
                - button "Run" [ref=e463]:
                  - text: Run
                  - img [ref=e464]
            - button "Open Measure retrieval grounding quality" [ref=e466] [cursor=pointer]:
              - generic [ref=e467]:
                - generic [ref=e469]:
                  - checkbox "Select Measure retrieval grounding quality" [ref=e470]
                  - generic [ref=e472]: Select Measure retrieval grounding quality
                - generic:
                  - img
                - generic [ref=e475]: pending
                - generic [ref=e478]:
                  - button "Move Measure retrieval grounding quality" [ref=e480]:
                    - img "Move Measure retrieval grounding quality" [ref=e481]
                  - tooltip
              - heading "Measure retrieval grounding quality" [level=3] [ref=e485]
              - paragraph [ref=e486]: Quantify citation accuracy and unsupported claims across retrieval conditions.
              - button "Long-context synthesis" [ref=e487]:
                - img [ref=e488]
                - generic [ref=e496]: Long-context synthesis
              - generic "Task item checklist" [ref=e497]:
                - generic [ref=e502]: Index evaluation corpus
                - generic [ref=e507]: Run retrieval matrix
                - generic [ref=e512]: Audit claim citations
              - generic "0 of 3 task items complete" [ref=e513]:
                - generic [ref=e514]:
                  - generic [ref=e515]: Progress
                  - strong [ref=e516]: 0 of 3
              - generic [ref=e518]:
                - generic "Omar Farouk" [ref=e520]:
                  - generic [ref=e521]: OF
                - button "Run" [ref=e523]:
                  - text: Run
                  - img [ref=e524]
          - button "Add Card" [ref=e527] [cursor=pointer]:
            - text: Add Card
            - img [ref=e528]
        - region "Review" [ref=e530]:
          - generic [ref=e531]:
            - generic [ref=e532]:
              - generic [ref=e533]:
                - heading "Review" [level=2] [ref=e534]
                - generic "3 visible cards" [ref=e535]: "3"
              - generic [ref=e537]: WIP limit 3
            - generic [ref=e538]:
              - button "Add Card to Review" [ref=e540] [cursor=pointer]:
                - img [ref=e541]
              - tooltip
          - generic [ref=e543]:
            - button "Open Review onboarding email sequence generator" [ref=e544] [cursor=pointer]:
              - generic [ref=e545]:
                - generic [ref=e547]:
                  - checkbox "Select Review onboarding email sequence generator" [ref=e548]
                  - generic [ref=e550]: Select Review onboarding email sequence generator
                - generic:
                  - img
                - generic [ref=e553]: pending
                - generic [ref=e556]:
                  - button "Move Review onboarding email sequence generator" [ref=e558]:
                    - img "Move Review onboarding email sequence generator" [ref=e559]
                  - tooltip
              - heading "Review onboarding email sequence generator" [level=3] [ref=e563]
              - paragraph [ref=e564]: Review sequence coherence and product-language compliance before release.
              - generic "Task item checklist" [ref=e565]:
                - generic [ref=e566]:
                  - img [ref=e568]
                  - generic [ref=e571]: Check narrative arc
                - generic [ref=e572]:
                  - img [ref=e574]
                  - generic [ref=e577]: Verify product claims
                - generic [ref=e582]: Review calls to action
                - generic [ref=e587]: Approve release notes
              - generic "2 of 4 task items complete" [ref=e588]:
                - generic [ref=e589]:
                  - generic [ref=e590]: Progress
                  - strong [ref=e591]: 2 of 4
              - generic [ref=e594]:
                - generic "Lin Park" [ref=e596]:
                  - generic [ref=e597]: LP
                - button "Run" [ref=e599]:
                  - text: Run
                  - img [ref=e600]
            - button "Open Validate policy extraction workflow" [ref=e602] [cursor=pointer]:
              - generic [ref=e603]:
                - generic [ref=e605]:
                  - checkbox "Select Validate policy extraction workflow" [ref=e606]
                  - generic [ref=e608]: Select Validate policy extraction workflow
                - generic:
                  - img
                - generic [ref=e611]: pending
                - generic [ref=e614]:
                  - button "Move Validate policy extraction workflow" [ref=e616]:
                    - img "Move Validate policy extraction workflow" [ref=e617]
                  - tooltip
              - heading "Validate policy extraction workflow" [level=3] [ref=e621]
              - paragraph [ref=e622]: Check structured policy fields against a manually annotated reference set.
              - button "Long-context synthesis" [ref=e623]:
                - img [ref=e624]
                - generic [ref=e632]: Long-context synthesis
              - generic "Task item checklist" [ref=e633]:
                - generic [ref=e634]:
                  - img [ref=e636]
                  - generic [ref=e639]: Sample policy documents
                - generic [ref=e644]: Compare extracted clauses
                - generic [ref=e649]: Resolve review notes
              - generic "1 of 3 task items complete" [ref=e650]:
                - generic [ref=e651]:
                  - generic [ref=e652]: Progress
                  - strong [ref=e653]: 1 of 3
              - generic [ref=e656]:
                - generic "Omar Farouk" [ref=e658]:
                  - generic [ref=e659]: OF
                - button "Run" [ref=e661]:
                  - text: Run
                  - img [ref=e662]
            - button "Open QA meeting action-item miner" [ref=e664] [cursor=pointer]:
              - generic [ref=e665]:
                - generic [ref=e667]:
                  - checkbox "Select QA meeting action-item miner" [ref=e668]
                  - generic [ref=e670]: Select QA meeting action-item miner
                - generic:
                  - img
                - generic [ref=e673]: pending
                - generic [ref=e676]:
                  - button "Move QA meeting action-item miner" [ref=e678]:
                    - img "Move QA meeting action-item miner" [ref=e679]
                  - tooltip
              - heading "QA meeting action-item miner" [level=3] [ref=e683]
              - paragraph [ref=e684]: Verify owner, due date, and dependency extraction across meeting styles.
              - generic "Task item checklist" [ref=e685]:
                - generic [ref=e686]:
                  - img [ref=e688]
                  - generic [ref=e691]: Collect transcripts
                - generic [ref=e692]:
                  - img [ref=e694]
                  - generic [ref=e697]: Run extraction set
                - generic [ref=e698]:
                  - img [ref=e700]
                  - generic [ref=e703]: Check owner attribution
                - generic [ref=e708]: Check date parsing
                - generic [ref=e713]: Triage misses
              - generic "3 of 5 task items complete" [ref=e714]:
                - generic [ref=e715]:
                  - generic [ref=e716]: Progress
                  - strong [ref=e717]: 3 of 5
              - generic [ref=e720]:
                - generic "Maya Chen" [ref=e722]:
                  - generic [ref=e723]: MC
                - button "Run" [ref=e725]:
                  - text: Run
                  - img [ref=e726]
          - button "Add Card" [ref=e729] [cursor=pointer]:
            - text: Add Card
            - img [ref=e730]
        - region "Done" [ref=e732]:
          - generic [ref=e733]:
            - generic [ref=e735]:
              - heading "Done" [level=2] [ref=e736]
              - generic "2 visible cards" [ref=e737]: "2"
            - generic [ref=e739]:
              - button "Add Card to Done" [ref=e741] [cursor=pointer]:
                - img [ref=e742]
              - tooltip
          - generic [ref=e744]:
            - button "Open Ship incident report formatter" [ref=e745] [cursor=pointer]:
              - generic [ref=e746]:
                - generic [ref=e748]:
                  - checkbox "Select Ship incident report formatter" [ref=e749]
                  - generic [ref=e751]: Select Ship incident report formatter
                - generic:
                  - img
                - generic [ref=e754]: complete
                - generic [ref=e757]:
                  - button "Move Ship incident report formatter" [ref=e759]:
                    - img "Move Ship incident report formatter" [ref=e760]
                  - tooltip
              - heading "Ship incident report formatter" [level=3] [ref=e764]
              - paragraph [ref=e765]: Released formatter for concise timelines, impact summaries, and follow-up actions.
              - generic "Task item checklist" [ref=e766]:
                - generic [ref=e767]:
                  - img [ref=e769]
                  - generic [ref=e772]: Define report schema
                - generic [ref=e773]:
                  - img [ref=e775]
                  - generic [ref=e778]: Build prompt
                - generic [ref=e779]:
                  - img [ref=e781]
                  - generic [ref=e784]: Test incident samples
                - generic [ref=e785]:
                  - img [ref=e787]
                  - generic [ref=e790]: Publish template
              - generic "4 of 4 task items complete" [ref=e791]:
                - generic [ref=e792]:
                  - generic [ref=e793]: Progress
                  - strong [ref=e794]: 4 of 4
              - generic [ref=e797]:
                - generic "Inez Silva" [ref=e799]:
                  - generic [ref=e800]: IS
                - button "Run again" [ref=e802]:
                  - text: Run again
                  - img [ref=e803]
            - button "Open Complete product taxonomy mapper" [ref=e805] [cursor=pointer]:
              - generic [ref=e806]:
                - generic [ref=e808]:
                  - checkbox "Select Complete product taxonomy mapper" [ref=e809]
                  - generic [ref=e811]: Select Complete product taxonomy mapper
                - generic:
                  - img
                - generic [ref=e814]: complete
                - generic [ref=e817]:
                  - button "Move Complete product taxonomy mapper" [ref=e819]:
                    - img "Move Complete product taxonomy mapper" [ref=e820]
                  - tooltip
              - heading "Complete product taxonomy mapper" [level=3] [ref=e824]
              - paragraph [ref=e825]: Mapped legacy labels to the current product taxonomy with confidence scores.
              - generic "Task item checklist" [ref=e826]:
                - generic [ref=e827]:
                  - img [ref=e829]
                  - generic [ref=e832]: Load label catalog
                - generic [ref=e833]:
                  - img [ref=e835]
                  - generic [ref=e838]: Generate mappings
                - generic [ref=e839]:
                  - img [ref=e841]
                  - generic [ref=e844]: Review confidence outliers
              - generic "3 of 3 task items complete" [ref=e845]:
                - generic [ref=e846]:
                  - generic [ref=e847]: Progress
                  - strong [ref=e848]: 3 of 3
              - generic [ref=e851]:
                - generic "Lin Park" [ref=e853]:
                  - generic [ref=e854]: LP
                - button "Run again" [ref=e856]:
                  - text: Run again
                  - img [ref=e857]
          - button "Add Card" [ref=e860] [cursor=pointer]:
            - text: Add Card
            - img [ref=e861]
    - status [ref=e863]
  - dialog "Backlog · 0 of 4 complete" [ref=e865]:
    - button "Focus sentinel" [ref=e866]
    - generic [ref=e867]:
      - generic [ref=e868]:
        - heading "Backlog · 0 of 4 complete" [level=2] [ref=e869]
        - heading "Calibrate customer support tone across escalation tiers" [level=2] [ref=e870]
        - generic [ref=e872]:
          - button "Close" [ref=e874] [cursor=pointer]:
            - img [ref=e875]
          - tooltip
      - region "Backlog · 0 of 4 complete" [ref=e877]:
        - generic [ref=e878]:
          - generic [ref=e880]: pending
          - generic "Maya Chen" [ref=e881]:
            - generic [ref=e882]: MC
            - generic [ref=e883]: Maya Chen
        - generic [ref=e884]:
          - generic [ref=e885]:
            - generic [ref=e886]:
              - generic [ref=e887]:
                - generic [ref=e889]: Title
                - generic [ref=e891]:
                  - textbox "Title" [active] [ref=e892]: Calibrate customer support tone across escalation tiers
                  - alert [ref=e893]
              - generic [ref=e894]:
                - generic [ref=e896]: Description
                - generic [ref=e897]:
                  - textbox "Description" [ref=e898]:
                    - /placeholder: ""
                    - text: Build a tone rubric and compare generated responses for standard, elevated, and critical support cases.
                  - alert [ref=e899]
              - generic [ref=e901]:
                - generic [ref=e902]: Assignee
                - generic [ref=e903]:
                  - combobox "Assignee" [ref=e904] [cursor=pointer]:
                    - option "Unassigned"
                    - option "Maya Chen" [selected]
                    - option "Omar Farouk"
                    - option "Lin Park"
                    - option "Inez Silva"
                  - img
            - generic [ref=e906]:
              - generic [ref=e907]:
                - heading "Task checklist" [level=3] [ref=e908]
                - generic [ref=e909]: 0 of 4
              - generic "Task item checklist" [ref=e910]:
                - generic [ref=e915]: Draft tone rubric
                - generic [ref=e920]: Assemble example tickets
                - generic [ref=e925]: Score baseline responses
                - generic [ref=e930]: Document acceptance range
          - complementary [ref=e931]:
            - generic [ref=e932]:
              - heading "Attached prompt" [level=3] [ref=e933]
              - button "Calibrate customer tone" [ref=e934] [cursor=pointer]:
                - img [ref=e935]
                - text: Calibrate customer tone
            - generic [ref=e943]:
              - generic [ref=e944]:
                - heading "Comments" [level=3] [ref=e945]
                - generic [ref=e946]: "0"
              - paragraph [ref=e948]: No comments yet. Add the first execution note.
              - generic [ref=e949]:
                - generic [ref=e950]:
                  - generic [ref=e952]: Add a comment
                  - generic [ref=e953]:
                    - textbox "Add a comment" [ref=e954]:
                      - /placeholder: ""
                    - alert [ref=e955]
                - button "Add comment" [ref=e956] [cursor=pointer]:
                  - text: Add comment
                  - img [ref=e957]
      - generic [ref=e961]:
        - button "Delete Card" [ref=e962] [cursor=pointer]
        - button "Run" [ref=e963] [cursor=pointer]:
          - text: Run
          - img [ref=e964]
        - button "Cancel" [ref=e966] [cursor=pointer]
        - button "Save" [ref=e967] [cursor=pointer]
    - button "Focus sentinel" [ref=e968]
  - status [ref=e969]: Board ready.
```

# Test source

```ts
  442 |   expect(parsed.columns[0]).toHaveProperty('name');
  443 | });
  444 |
  445 | test('1.25 export_recompiles_from_session_mutations', async ({ page }) => {
  446 |   await page.goto('/');
  447 |   await page.locator('.column-backlog .card-tile input[type="checkbox"]').first().click({ force: true });
  448 |   const bulkBar = page.locator('.bulk-bar');
  449 |   const btn = bulkBar.locator('button:has-text("Move to Done"), button:has-text("Done")').first();
  450 |   if(await btn.count() > 0) {
  451 |       await btn.click();
  452 |   } else {
  453 |       await bulkBar.locator('button.cds--overflow-menu').first().click();
  454 |       await page.locator('.cds--overflow-menu-options--open').getByText('Move to Done').click();
  455 |   }
  456 |   await expect(bulkBar).not.toBeVisible();
  457 |
  458 |   await page.locator('button').filter({ hasText: 'Export' }).click();
  459 |   const exportText = await page.locator('pre[aria-label="json export preview"]').first().textContent();
  460 |   const parsed = JSON.parse(exportText);
  461 |
  462 |   const doneColumn = parsed.columns.find(c => c.id === 'done');
  463 |   expect(doneColumn.card_ids.length).toBeGreaterThanOrEqual(3);
  464 | });
  465 |
  466 | test('1.26 copy_and_download_export', async ({ page, context }) => {
  467 |   await page.goto('/');
  468 |   await page.locator('button').filter({ hasText: 'Export' }).click();
  469 |   await page.waitForSelector('.export-drawer');
  470 |
  471 |   const downloadPromise = page.waitForEvent('download').catch(() => {});
  472 |   await page.locator('button[data-export-download="true"], button:has-text("Download JSON")').first().click();
  473 |   const download = await downloadPromise;
  474 |   if(download) {
  475 |       expect(download.suggestedFilename()).toContain('.json');
  476 |   }
  477 | });
  478 |
  479 | test('1.27 import_round_trip_board_json', async ({ page }) => {
  480 |   await page.goto('/');
  481 |   await page.locator('button').filter({ hasText: 'Export' }).click();
  482 |   const exportText = await page.locator('pre[aria-label="json export preview"]').first().textContent();
  483 |
  484 |   await page.keyboard.press('Escape');
  485 |
  486 |   const sourceCard = page.locator('.column-backlog .card-tile').first();
  487 |   const targetColumn = page.locator('.column-done .column-list');
  488 |
  489 |   const sourceBox = await sourceCard.boundingBox();
  490 |   const targetBox = await targetColumn.boundingBox();
  491 |
  492 |   await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  493 |   await page.mouse.down();
  494 |   await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 3, { steps: 5 });
  495 |   await page.mouse.up();
  496 |
  497 |   await page.waitForTimeout(500);
  498 |
  499 |   await page.locator('button').filter({ hasText: 'Export' }).click();
  500 |   await page.locator('textarea[name="import"], textarea.cds--text-area').first().fill(exportText);
  501 |   await page.locator('button[type="submit"]:has-text("Import")').first().click();
  502 |
  503 |   await page.keyboard.press('Escape');
  504 |
  505 |   await expect(page.locator('.column-backlog .count-badge')).toHaveText('4');
  506 | });
  507 |
  508 | test('1.30 seeded_libraries_populate_selects', async ({ page }) => {
  509 |   await page.goto('/');
  510 |   await page.locator('.column-backlog button:has-text("Add Card"), .column-backlog button:has-text("Add card to Backlog"), .column-backlog .empty-column button').first().click();
  511 |
  512 |   await page.locator('#create-prompt').click();
  513 |
  514 |   const promptOptions = page.locator('select#create-prompt option, .cds--list-box__menu-item');
  515 |   const optionCount = await promptOptions.count();
  516 |   expect(optionCount).toBeGreaterThanOrEqual(5);
  517 |
  518 |   const assigneeSelect = page.locator('select#create-assignee option, .cds--list-box__menu-item');
  519 |   const assigneeCount = await assigneeSelect.count();
  520 |   expect(assigneeCount).toBeGreaterThanOrEqual(4);
  521 | });
  522 |
  523 | test('1.31 undo_covers_comment_and_import', async ({ page }) => {
  524 |   await page.goto('/');
  525 |   await page.waitForSelector('text=PromptOps Execution Board');
  526 |
  527 |   await page.locator('.card-tile .card-title').first().click();
  528 |   const commentInput = page.locator('textarea, input[placeholder*="comment" i]').first();
  529 |   await commentInput.fill('A brand new test comment');
  530 |   await page.locator('.comment-form button[type="submit"], button:has-text("Comment")').first().click();
  531 |   await page.waitForTimeout(500);
  532 |
  533 |   const comments = page.locator('.comment');
  534 |   const commentCountAfter = await comments.count();
  535 |   await page.keyboard.press('Escape');
  536 |
  537 |   await page.keyboard.press('Control+Z');
  538 |   await page.waitForTimeout(500);
  539 |
  540 |   await page.locator('.card-tile .card-title').first().click();
  541 |   const commentCountUndo = await page.locator('.comment').count();
> 542 |   expect(commentCountUndo).toBe(commentCountAfter - 1);
      |                            ^ Error: expect(received).toBe(expected) // Object.is equality
  543 | });
  544 |
  545 | // Adding 14.1 - 4.11 and 6.1 - 6.11 implementations as well
  546 |
  547 | test('1.8 text_and_chips_have_contrast', async ({ page }) => {
  548 |   test.fixme(true, '// NOT-AUTOMATABLE: 1.8 - text_and_chips_have_contrast - Not implemented or subjective');
  549 | });
  550 |
  551 | test('14.1 reload_resets_in_memory_facets', async ({ page }) => {
  552 |   test.fixme(true, '// NOT-AUTOMATABLE: 14.1 - reload_resets_in_memory_facets - Not implemented or subjective');
  553 | });
  554 |
  555 | test('14.2 keyboard_reorder_proves_live_order', async ({ page }) => {
  556 |   test.fixme(true, '// NOT-AUTOMATABLE: 14.2 - keyboard_reorder_proves_live_order - Not implemented or subjective');
  557 | });
  558 |
  559 | test('14.3 export_tracks_board_mutations', async ({ page }) => {
  560 |   test.fixme(true, '// NOT-AUTOMATABLE: 14.3 - export_tracks_board_mutations - Not implemented or subjective');
  561 | });
  562 |
  563 | test('14.4 detail_board_export_echo', async ({ page }) => {
  564 |   test.fixme(true, '// NOT-AUTOMATABLE: 14.4 - detail_board_export_echo - Not implemented or subjective');
  565 | });
  566 |
  567 | test('14.5 column_count_delta_exact', async ({ page }) => {
  568 |   test.fixme(true, '// NOT-AUTOMATABLE: 14.5 - column_count_delta_exact - Not implemented or subjective');
  569 | });
  570 |
  571 | test('14.6 two_creates_differ_in_export', async ({ page }) => {
  572 |   test.fixme(true, '// NOT-AUTOMATABLE: 14.6 - two_creates_differ_in_export - Not implemented or subjective');
  573 | });
  574 |
  575 | test('14.7 interleaved_create_and_filter', async ({ page }) => {
  576 |   test.fixme(true, '// NOT-AUTOMATABLE: 14.7 - interleaved_create_and_filter - Not implemented or subjective');
  577 | });
  578 |
  579 | test('14.8 empty_column_then_repopulate', async ({ page }) => {
  580 |   test.fixme(true, '// NOT-AUTOMATABLE: 14.8 - empty_column_then_repopulate - Not implemented or subjective');
  581 | });
  582 |
  583 | test('14.9 import_export_full_pipeline', async ({ page }) => {
  584 |   test.fixme(true, '// NOT-AUTOMATABLE: 14.9 - import_export_full_pipeline - Not implemented or subjective');
  585 | });
  586 |
  587 | test('3.1 column_tiles_match_spec', async ({ page }) => {
  588 |   test.fixme(true, '// NOT-AUTOMATABLE: 3.1 - column_tiles_match_spec - Not implemented or subjective');
  589 | });
  590 |
  591 | test('3.2 typography_hierarchy_matches_spec', async ({ page }) => {
  592 |   test.fixme(true, '// NOT-AUTOMATABLE: 3.2 - typography_hierarchy_matches_spec - Not implemented or subjective');
  593 | });
  594 |
  595 | test('3.3 accent_borders_match_columns', async ({ page }) => {
  596 |   test.fixme(true, '// NOT-AUTOMATABLE: 3.3 - accent_borders_match_columns - Not implemented or subjective');
  597 | });
  598 |
  599 | test('3.4 specified_motions_present', async ({ page }) => {
  600 |   test.fixme(true, '// NOT-AUTOMATABLE: 3.4 - specified_motions_present - Not implemented or subjective');
  601 | });
  602 |
  603 | test('3.5 responsive_board_matches_spec', async ({ page }) => {
  604 |   test.fixme(true, '// NOT-AUTOMATABLE: 3.5 - responsive_board_matches_spec - Not implemented or subjective');
  605 | });
  606 |
  607 | test('3.6 controls_match_carbon_chrome', async ({ page }) => {
  608 |   test.fixme(true, '// NOT-AUTOMATABLE: 3.6 - controls_match_carbon_chrome - Not implemented or subjective');
  609 | });
  610 |
  611 | test('3.7 count_and_wip_badges_styled', async ({ page }) => {
  612 |   test.fixme(true, '// NOT-AUTOMATABLE: 3.7 - count_and_wip_badges_styled - Not implemented or subjective');
  613 | });
  614 |
  615 | test('3.8 component_states_match_spec', async ({ page }) => {
  616 |   test.fixme(true, '// NOT-AUTOMATABLE: 3.8 - component_states_match_spec - Not implemented or subjective');
  617 | });
  618 |
  619 | test('3.9 export_drawer_matches_spec', async ({ page }) => {
  620 |   test.fixme(true, '// NOT-AUTOMATABLE: 3.9 - export_drawer_matches_spec - Not implemented or subjective');
  621 | });
  622 |
  623 | test('3.10 drag_ghost_matches_spec', async ({ page }) => {
  624 |   test.fixme(true, '// NOT-AUTOMATABLE: 3.10 - drag_ghost_matches_spec - Not implemented or subjective');
  625 | });
  626 |
  627 | test('4.1 empty_column_state_designed', async ({ page }) => {
  628 |   test.fixme(true, '// NOT-AUTOMATABLE: 4.1 - empty_column_state_designed - Not implemented or subjective');
  629 | });
  630 |
  631 | test('4.2 create_and_import_validate_inline', async ({ page }) => {
  632 |   test.fixme(true, '// NOT-AUTOMATABLE: 4.2 - create_and_import_validate_inline - Not implemented or subjective');
  633 | });
  634 |
  635 | test('4.3 validation_errors_name_fields', async ({ page }) => {
  636 |   test.fixme(true, '// NOT-AUTOMATABLE: 4.3 - validation_errors_name_fields - Not implemented or subjective');
  637 | });
  638 |
  639 | test('4.4 copy_export_and_save_confirm', async ({ page }) => {
  640 |   test.fixme(true, '// NOT-AUTOMATABLE: 4.4 - copy_export_and_save_confirm - Not implemented or subjective');
  641 | });
  642 |
```
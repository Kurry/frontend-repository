# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e.spec.mjs >> 1.26 copy_and_download_export
- Location: e2e.spec.mjs:466:1

# Error details

```
Test timeout of 10000ms exceeded.
```

```
Error: locator.click: Test timeout of 10000ms exceeded.
Call log:
  - waiting for locator('button[data-export-download="true"], button:has-text("Download JSON")').first()

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
  - dialog "Export & import" [ref=e865]:
    - banner [ref=e866]:
      - generic [ref=e867]:
        - generic [ref=e868]: Live board artifact
        - heading "Export & import" [level=2] [ref=e869]
      - generic [ref=e870]:
        - button "Close Export drawer" [active] [ref=e872] [cursor=pointer]:
          - img [ref=e873]
        - tooltip "Close Export drawer":
          - generic [ref=e875]: Close Export drawer
    - generic [ref=e876]:
      - paragraph [ref=e877]: Previews regenerate from the current board whenever cards, tasks, or comments change.
      - tablist "Export formats" [ref=e879]:
        - tab "Board JSON" [selected] [ref=e880] [cursor=pointer]:
          - generic [ref=e882]: Board JSON
        - button [ref=e883]:
          - img [ref=e884]
        - tab "Markdown digest" [ref=e886] [cursor=pointer]:
          - generic [ref=e888]: Markdown digest
        - button [ref=e889]:
          - img [ref=e890]
      - tabpanel "Board JSON" [ref=e892]:
        - generic [ref=e893]:
          - generic [ref=e894]:
            - generic [ref=e895]: application/json
            - generic [ref=e896]:
              - button "Copy" [ref=e897] [cursor=pointer]:
                - text: Copy
                - img [ref=e898]
              - button "Download" [ref=e901] [cursor=pointer]:
                - text: Download
                - img [ref=e902]
          - generic "json export preview" [ref=e905]: "{ \"board\": { \"id\": \"board-promptops\", \"name\": \"PromptOps Execution Board\" }, \"columns\": [ { \"id\": \"backlog\", \"name\": \"Backlog\", \"wip_limit\": null, \"card_ids\": [ \"card-tone-calibration\", \"card-safety-suite\", \"card-long-context\", \"card-multilingual\" ] }, { \"id\": \"in-progress\", \"name\": \"In Progress\", \"wip_limit\": 3, \"card_ids\": [ \"card-support-triage\", \"card-sql-eval\", \"card-grounding\" ] }, { \"id\": \"review\", \"name\": \"Review\", \"wip_limit\": 3, \"card_ids\": [ \"card-onboarding\", \"card-policy-extraction\", \"card-meeting-miner\" ] }, { \"id\": \"done\", \"name\": \"Done\", \"wip_limit\": null, \"card_ids\": [ \"card-incident-report\", \"card-taxonomy\" ] } ], \"cards\": [ { \"id\": \"card-tone-calibration\", \"title\": \"Calibrate customer support tone across escalation tiers\", \"description\": \"Build a tone rubric and compare generated responses for standard, elevated, and critical support cases.\", \"column\": \"backlog\", \"position\": 0, \"assignee\": \"maya\", \"attached_prompt\": \"prompt-tone\", \"status\": \"pending\", \"tasks\": [ { \"id\": \"card-tone-calibration-task-1\", \"title\": \"Draft tone rubric\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-tone-calibration-task-2\", \"title\": \"Assemble example tickets\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-tone-calibration-task-3\", \"title\": \"Score baseline responses\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-tone-calibration-task-4\", \"title\": \"Document acceptance range\", \"status\": \"pending\", \"attempts\": 0 } ], \"comments\": [] }, { \"id\": \"card-safety-suite\", \"title\": \"Expand adversarial safety evaluation suite\", \"description\": \"Add refusal-boundary and prompt-injection cases to the evaluation harness.\", \"column\": \"backlog\", \"position\": 1, \"assignee\": \"omar\", \"attached_prompt\": \"prompt-red-team\", \"status\": \"pending\", \"tasks\": [ { \"id\": \"card-safety-suite-task-1\", \"title\": \"Map policy areas\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-safety-suite-task-2\", \"title\": \"Author attack prompts\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-safety-suite-task-3\", \"title\": \"Add expected outcomes\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-safety-suite-task-4\", \"title\": \"Run baseline model\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-safety-suite-task-5\", \"title\": \"Review false positives\", \"status\": \"pending\", \"attempts\": 0 } ], \"comments\": [] }, { \"id\": \"card-long-context\", \"title\": \"Tune long-context synthesis prompt\", \"description\": \"Improve factual traceability when source material exceeds 40k tokens.\", \"column\": \"backlog\", \"position\": 2, \"assignee\": \"lin\", \"attached_prompt\": \"prompt-summary\", \"status\": \"pending\", \"tasks\": [ { \"id\": \"card-long-context-task-1\", \"title\": \"Select source corpus\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-long-context-task-2\", \"title\": \"Define citation format\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-long-context-task-3\", \"title\": \"Compare synthesis quality\", \"status\": \"pending\", \"attempts\": 0 } ], \"comments\": [] }, { \"id\": \"card-multilingual\", \"title\": \"Benchmark multilingual intent classifier\", \"description\": \"Measure intent accuracy for Spanish, French, German, and Japanese inputs.\", \"column\": \"backlog\", \"position\": 3, \"assignee\": \"inez\", \"attached_prompt\": null, \"status\": \"pending\", \"tasks\": [ { \"id\": \"card-multilingual-task-1\", \"title\": \"Prepare translated set\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-multilingual-task-2\", \"title\": \"Run classification batch\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-multilingual-task-3\", \"title\": \"Review low-confidence cases\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-multilingual-task-4\", \"title\": \"Publish scorecard\", \"status\": \"pending\", \"attempts\": 0 } ], \"comments\": [] }, { \"id\": \"card-support-triage\", \"title\": \"Harden support triage agent against ambiguous requests\", \"description\": \"Exercise routing behavior when product area and customer impact are unclear. The routing check is flaky by design: it fails on its first two attempts and recovers on the third.\", \"column\": \"in-progress\", \"position\": 0, \"assignee\": \"maya\", \"attached_prompt\": \"prompt-triage\", \"status\": \"pending\", \"tasks\": [ { \"id\": \"card-support-triage-task-1\", \"title\": \"Normalize ticket samples\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-support-triage-task-2\", \"title\": \"Infer product routing\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-support-triage-task-3\", \"title\": \"Validate urgency labels\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-support-triage-task-4\", \"title\": \"Check escalation notes\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-support-triage-task-5\", \"title\": \"Compile findings\", \"status\": \"pending\", \"attempts\": 0 } ], \"comments\": [] }, { \"id\": \"card-sql-eval\", \"title\": \"Evaluate guarded SQL generation\", \"description\": \"Validate schema adherence, read-only safety, and usefulness of generated queries.\", \"column\": \"in-progress\", \"position\": 1, \"assignee\": \"inez\", \"attached_prompt\": \"prompt-sql\", \"status\": \"pending\", \"tasks\": [ { \"id\": \"card-sql-eval-task-1\", \"title\": \"Load schema fixtures\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-sql-eval-task-2\", \"title\": \"Generate query batch\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-sql-eval-task-3\", \"title\": \"Check safety constraints\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-sql-eval-task-4\", \"title\": \"Summarize execution accuracy\", \"status\": \"pending\", \"attempts\": 0 } ], \"comments\": [] }, { \"id\": \"card-grounding\", \"title\": \"Measure retrieval grounding quality\", \"description\": \"Quantify citation accuracy and unsupported claims across retrieval conditions.\", \"column\": \"in-progress\", \"position\": 2, \"assignee\": \"omar\", \"attached_prompt\": \"prompt-summary\", \"status\": \"pending\", \"tasks\": [ { \"id\": \"card-grounding-task-1\", \"title\": \"Index evaluation corpus\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-grounding-task-2\", \"title\": \"Run retrieval matrix\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-grounding-task-3\", \"title\": \"Audit claim citations\", \"status\": \"pending\", \"attempts\": 0 } ], \"comments\": [] }, { \"id\": \"card-onboarding\", \"title\": \"Review onboarding email sequence generator\", \"description\": \"Review sequence coherence and product-language compliance before release.\", \"column\": \"review\", \"position\": 0, \"assignee\": \"lin\", \"attached_prompt\": null, \"status\": \"pending\", \"tasks\": [ { \"id\": \"card-onboarding-task-1\", \"title\": \"Check narrative arc\", \"status\": \"complete\", \"attempts\": 1 }, { \"id\": \"card-onboarding-task-2\", \"title\": \"Verify product claims\", \"status\": \"complete\", \"attempts\": 1 }, { \"id\": \"card-onboarding-task-3\", \"title\": \"Review calls to action\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-onboarding-task-4\", \"title\": \"Approve release notes\", \"status\": \"pending\", \"attempts\": 0 } ], \"comments\": [] }, { \"id\": \"card-policy-extraction\", \"title\": \"Validate policy extraction workflow\", \"description\": \"Check structured policy fields against a manually annotated reference set.\", \"column\": \"review\", \"position\": 1, \"assignee\": \"omar\", \"attached_prompt\": \"prompt-summary\", \"status\": \"pending\", \"tasks\": [ { \"id\": \"card-policy-extraction-task-1\", \"title\": \"Sample policy documents\", \"status\": \"complete\", \"attempts\": 1 }, { \"id\": \"card-policy-extraction-task-2\", \"title\": \"Compare extracted clauses\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-policy-extraction-task-3\", \"title\": \"Resolve review notes\", \"status\": \"pending\", \"attempts\": 0 } ], \"comments\": [] }, { \"id\": \"card-meeting-miner\", \"title\": \"QA meeting action-item miner\", \"description\": \"Verify owner, due date, and dependency extraction across meeting styles.\", \"column\": \"review\", \"position\": 2, \"assignee\": \"maya\", \"attached_prompt\": null, \"status\": \"pending\", \"tasks\": [ { \"id\": \"card-meeting-miner-task-1\", \"title\": \"Collect transcripts\", \"status\": \"complete\", \"attempts\": 1 }, { \"id\": \"card-meeting-miner-task-2\", \"title\": \"Run extraction set\", \"status\": \"complete\", \"attempts\": 1 }, { \"id\": \"card-meeting-miner-task-3\", \"title\": \"Check owner attribution\", \"status\": \"complete\", \"attempts\": 1 }, { \"id\": \"card-meeting-miner-task-4\", \"title\": \"Check date parsing\", \"status\": \"pending\", \"attempts\": 0 }, { \"id\": \"card-meeting-miner-task-5\", \"title\": \"Triage misses\", \"status\": \"pending\", \"attempts\": 0 } ], \"comments\": [] }, { \"id\": \"card-incident-report\", \"title\": \"Ship incident report formatter\", \"description\": \"Released formatter for concise timelines, impact summaries, and follow-up actions.\", \"column\": \"done\", \"position\": 0, \"assignee\": \"inez\", \"attached_prompt\": null, \"status\": \"complete\", \"tasks\": [ { \"id\": \"card-incident-report-task-1\", \"title\": \"Define report schema\", \"status\": \"complete\", \"attempts\": 1 }, { \"id\": \"card-incident-report-task-2\", \"title\": \"Build prompt\", \"status\": \"complete\", \"attempts\": 1 }, { \"id\": \"card-incident-report-task-3\", \"title\": \"Test incident samples\", \"status\": \"complete\", \"attempts\": 1 }, { \"id\": \"card-incident-report-task-4\", \"title\": \"Publish template\", \"status\": \"complete\", \"attempts\": 1 } ], \"comments\": [] }, { \"id\": \"card-taxonomy\", \"title\": \"Complete product taxonomy mapper\", \"description\": \"Mapped legacy labels to the current product taxonomy with confidence scores.\", \"column\": \"done\", \"position\": 1, \"assignee\": \"lin\", \"attached_prompt\": null, \"status\": \"complete\", \"tasks\": [ { \"id\": \"card-taxonomy-task-1\", \"title\": \"Load label catalog\", \"status\": \"complete\", \"attempts\": 1 }, { \"id\": \"card-taxonomy-task-2\", \"title\": \"Generate mappings\", \"status\": \"complete\", \"attempts\": 1 }, { \"id\": \"card-taxonomy-task-3\", \"title\": \"Review confidence outliers\", \"status\": \"complete\", \"attempts\": 1 } ], \"comments\": [] } ], \"prompts\": [ { \"id\": \"prompt-tone\", \"title\": \"Calibrate customer tone\", \"text\": \"Rewrite the response in a calm, direct, and empathetic voice. Preserve all factual details, avoid filler, and end with one clear next step.\" }, { \"id\": \"prompt-red-team\", \"title\": \"Adversarial safety probe\", \"text\": \"Generate a diverse set of adversarial user requests, then assess the response against the supplied safety policy. Explain each failure mode without reproducing harmful instructions.\" }, { \"id\": \"prompt-summary\", \"title\": \"Long-context synthesis\", \"text\": \"Synthesize the supplied context into an executive summary. Separate confirmed facts, open questions, decisions, and risks. Cite the source section for every material claim.\" }, { \"id\": \"prompt-triage\", \"title\": \"Support issue triage\", \"text\": \"Classify the support request by urgency, product area, and customer impact. Return a concise diagnosis, the missing information, and the best routing destination.\" }, { \"id\": \"prompt-sql\", \"title\": \"Guarded SQL generation\", \"text\": \"Produce a read-only SQL query for the requested analysis. Use only the provided schema, qualify ambiguous columns, cap large result sets, and explain assumptions.\" } ], \"assignees\": [ { \"id\": \"maya\", \"name\": \"Maya Chen\", \"initials\": \"MC\", \"color\": \"#8a3ffc\" }, { \"id\": \"omar\", \"name\": \"Omar Farouk\", \"initials\": \"OF\", \"color\": \"#0f62fe\" }, { \"id\": \"lin\", \"name\": \"Lin Park\", \"initials\": \"LP\", \"color\": \"#007d79\" }, { \"id\": \"inez\", \"name\": \"Inez Silva\", \"initials\": \"IS\", \"color\": \"#b28600\" } ] }"
      - generic [ref=e907]:
        - generic [ref=e908]:
          - generic [ref=e909]:
            - heading "Import board JSON" [level=3] [ref=e910]
            - paragraph [ref=e911]: Paste a previously exported board payload.
          - img [ref=e912]
        - generic [ref=e915]:
          - generic [ref=e917]: Import
          - generic [ref=e918]:
            - textbox "Import" [ref=e919]:
              - /placeholder: Paste board JSON here
            - alert [ref=e920]
        - button "Import Board" [ref=e922] [cursor=pointer]:
          - text: Import Board
          - img [ref=e923]
  - status [ref=e927]: Board ready.
```

# Test source

```ts
  372 |   await backlogCards.nth(0).locator('input[type="checkbox"]').click({ force: true });
  373 |   await backlogCards.nth(1).locator('input[type="checkbox"]').click({ force: true });
  374 |
  375 |   const bulkBar = page.locator('.bulk-bar');
  376 |   await expect(bulkBar).toBeVisible();
  377 |
  378 |   const doneCountTextBefore = await page.locator('.column-done .count-badge').textContent();
  379 |   const doneCountBefore = parseInt(doneCountTextBefore, 10);
  380 |
  381 |   const btn = bulkBar.locator('button:has-text("Move to Done"), button:has-text("Done")').first();
  382 |   if(await btn.count() > 0) {
  383 |       await btn.click();
  384 |   } else {
  385 |       await bulkBar.locator('button.cds--overflow-menu').first().click();
  386 |       await page.locator('.cds--overflow-menu-options--open').getByText('Move to Done').click();
  387 |   }
  388 |
  389 |   await expect(bulkBar).not.toBeVisible();
  390 |
  391 |   const doneCountTextAfter = await page.locator('.column-done .count-badge').textContent();
  392 |   const doneCountAfter = parseInt(doneCountTextAfter, 10);
  393 |   expect(doneCountAfter).toBe(doneCountBefore + 2);
  394 | });
  395 |
  396 | test('1.23 undo_redo_restores_board_and_export', async ({ page }) => {
  397 |   await page.goto('/');
  398 |   await page.waitForSelector('.column-done .count-badge');
  399 |   const doneCountTextBefore = await page.locator('.column-done .count-badge').textContent();
  400 |   const doneCountBefore = parseInt(doneCountTextBefore, 10);
  401 |
  402 |   const sourceCard = page.locator('.column-backlog .card-tile').first();
  403 |   const targetColumn = page.locator('.column-done .column-list');
  404 |
  405 |   const sourceBox = await sourceCard.boundingBox();
  406 |   const targetBox = await targetColumn.boundingBox();
  407 |
  408 |   await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  409 |   await page.mouse.down();
  410 |   await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 3, { steps: 5 });
  411 |   await page.mouse.up();
  412 |
  413 |   await page.waitForTimeout(500);
  414 |   await expect(page.locator('.column-done .count-badge')).toHaveText(String(doneCountBefore + 1));
  415 |
  416 |   await page.keyboard.press('Control+Z');
  417 |   await page.waitForTimeout(500);
  418 |   await expect(page.locator('.column-done .count-badge')).toHaveText(String(doneCountBefore));
  419 |
  420 |   await page.keyboard.press('Control+Shift+Z');
  421 |   await page.waitForTimeout(500);
  422 |   await expect(page.locator('.column-done .count-badge')).toHaveText(String(doneCountBefore + 1));
  423 | });
  424 |
  425 | test('1.24 board_json_export_api_shaped', async ({ page }) => {
  426 |   await page.goto('/');
  427 |   await page.locator('button').filter({ hasText: 'Export' }).click();
  428 |
  429 |   const exportDrawer = page.locator('.export-drawer');
  430 |   await expect(exportDrawer).toBeVisible();
  431 |
  432 |   const exportText = await page.locator('pre[aria-label="json export preview"]').first().textContent();
  433 |   const parsed = JSON.parse(exportText);
  434 |
  435 |   expect(parsed).toHaveProperty('board');
  436 |   expect(parsed).toHaveProperty('columns');
  437 |   expect(parsed).toHaveProperty('cards');
  438 |   expect(parsed).toHaveProperty('prompts');
  439 |   expect(parsed).toHaveProperty('assignees');
  440 |
  441 |   expect(parsed.columns[0]).toHaveProperty('id');
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
> 472 |   await page.locator('button[data-export-download="true"], button:has-text("Download JSON")').first().click();
      |                                                                                                       ^ Error: locator.click: Test timeout of 10000ms exceeded.
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
  542 |   expect(commentCountUndo).toBe(commentCountAfter - 1);
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
```
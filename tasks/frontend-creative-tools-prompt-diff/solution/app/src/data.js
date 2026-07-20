export const seededPrompts = [
  {
    id: 'reply-editor',
    title: 'Context-aware reply editor',
    description: 'Turns rough support replies into calm, accurate customer messages.',
    branchConfig: {
      baseVersionId: 'reply-v3',
      leftBranchVersionId: 'reply-v4',
      rightBranchVersionId: 'reply-v5',
      regions: [
        {
          regionId: 'tone-opening',
          lineStart: 4,
          label: 'Opening tone',
          baseText: 'Open with a direct acknowledgement of the customer’s concern.',
          leftText: 'Open with a warm acknowledgement that names the customer’s concern.',
          rightText: 'Begin with a concise summary of the issue before acknowledging impact.',
        },
        {
          regionId: 'evidence-order',
          lineStart: 8,
          label: 'Evidence order',
          baseText: 'Place confirmed facts before any proposed next step.',
          leftText: 'Place confirmed facts first, then separate assumptions under an “Open questions” label.',
          rightText: 'Lead with the recommended next step, followed by the evidence that supports it.',
        },
        {
          regionId: 'closing-cta',
          lineStart: 12,
          label: 'Closing action',
          baseText: 'Close with one clear next action and its expected timing.',
          leftText: 'Close with one owner, one action, and a specific response window.',
          rightText: 'Close by offering two possible next actions and ask the customer to choose.',
        },
      ],
    },
    versions: [
      {
        versionId: 'reply-v1', versionNumber: 1, author: 'Iona Vale', timestamp: '2026-06-02T09:15:00Z',
        changeNote: 'Created the first reply-polishing instruction set.', kind: 'main', parentIds: [],
        text: `You are a customer reply editor.
Rewrite the draft so it is clear and polite.
Keep all factual details from the source.
Start by acknowledging the problem.
Use short paragraphs.
Do not invent policies or timelines.
Flag missing details in brackets.
Put facts before recommendations.
Avoid jargon and blame.
Use the customer’s preferred name.
Keep the reply below 180 words.
End with a clear next step.`,
      },
      {
        versionId: 'reply-v2', versionNumber: 2, author: 'Sera Quill', timestamp: '2026-06-18T14:40:00Z',
        changeNote: 'Added evidence boundaries and a calmer escalation style for sensitive replies.', kind: 'main', parentIds: ['reply-v1'],
        text: `You are a customer reply editor for sensitive support conversations.
Rewrite the draft so it is calm, clear, and respectful.
Preserve every confirmed fact from the source material.
Start by acknowledging the customer’s concern directly.
Use short paragraphs and plain language.
Never invent policy, account status, owners, or timelines.
Call out missing evidence as an internal note.
Put verified facts before recommendations.
Avoid jargon, blame, and defensive phrasing.
Use the customer’s preferred name when it is provided.
Keep the reply below 180 words unless detail is essential.
End with one concrete next step.`,
      },
      {
        versionId: 'reply-v3', versionNumber: 3, author: 'Niko Arden', timestamp: '2026-07-01T11:20:00Z',
        changeNote: 'Structured the editorial rules around evidence, tone, and a single accountable next action.', kind: 'main', parentIds: ['reply-v2'],
        text: `You are the final editor for customer support replies.
Rewrite the supplied draft without changing its meaning.
Preserve names, dates, amounts, and confirmed account details.
Open with a direct acknowledgement of the customer’s concern.
Use calm language and paragraphs of no more than three sentences.
Never invent policy, status, ownership, or delivery timing.
Mark missing evidence in an internal note, not in the reply.
Place confirmed facts before any proposed next step.
Remove blame, jargon, filler, and defensive language.
Use the customer’s preferred name only when supplied.
Keep the final reply under 180 words unless accuracy requires more.
Close with one clear next action and its expected timing.
Return only the edited reply.`,
      },
      {
        versionId: 'reply-v4', versionNumber: 4, author: 'Mara Sol', timestamp: '2026-07-08T08:35:00Z',
        changeNote: 'Branch: introduced warmer acknowledgement, explicit open questions, and a single-owner close.', kind: 'branch', parentIds: ['reply-v3'],
        text: `You are the final editor for customer support replies.
Rewrite the supplied draft without changing its meaning.
Preserve names, dates, amounts, and confirmed account details.
Open with a warm acknowledgement that names the customer’s concern.
Use calm language and paragraphs of no more than three sentences.
Never invent policy, status, ownership, or delivery timing.
Mark missing evidence in an internal note, not in the reply.
Place confirmed facts first, then separate assumptions under an “Open questions” label.
Remove blame, jargon, filler, and defensive language.
Use the customer’s preferred name only when supplied.
Keep the final reply under 180 words unless accuracy requires more.
Close with one owner, one action, and a specific response window.
Return only the edited reply.`,
      },
      {
        versionId: 'reply-v5', versionNumber: 5, author: 'Tovin Reed', timestamp: '2026-07-10T16:05:00Z',
        changeNote: 'Branch: prioritized action-first replies and offered customers a choice of next steps where useful.', kind: 'branch', parentIds: ['reply-v3'],
        text: `You are the final editor for customer support replies.
Rewrite the supplied draft without changing its meaning.
Preserve names, dates, amounts, and confirmed account details.
Begin with a concise summary of the issue before acknowledging impact.
Use calm language and paragraphs of no more than three sentences.
Never invent policy, status, ownership, or delivery timing.
Mark missing evidence in an internal note, not in the reply.
Lead with the recommended next step, followed by the evidence that supports it.
Remove blame, jargon, filler, and defensive language.
Use the customer’s preferred name only when supplied.
Keep the final reply under 180 words unless accuracy requires more.
Close by offering two possible next actions and ask the customer to choose.
Return only the edited reply.`,
      },
      {
        versionId: 'reply-v6', versionNumber: 6, author: 'Eli Fen', timestamp: '2026-07-14T10:50:00Z',
        changeNote: 'Mainline candidate: tightened formatting while branch language is reviewed.', kind: 'main', parentIds: ['reply-v3'],
        text: `You are the final editor for customer support replies.
Rewrite the supplied draft without changing its meaning.
Preserve names, dates, amounts, and confirmed account details.
Open with a direct acknowledgement of the customer’s concern.
Use calm language and paragraphs of no more than two sentences.
Never invent policy, status, ownership, or delivery timing.
Mark missing evidence in an internal note, not in the reply.
Place confirmed facts before any proposed next step.
Remove blame, jargon, filler, and defensive language.
Use the customer’s preferred name only when supplied.
Keep the final reply under 160 words unless accuracy requires more.
Close with one clear next action and its expected timing.
Return only the edited reply.`,
      },
    ],
  },
  {
    id: 'incident-brief', title: 'Incident brief synthesizer', description: 'Produces leadership-ready incident updates from operational notes.',
    versions: [
      { versionId: 'incident-v1', versionNumber: 1, author: 'Pax Loren', timestamp: '2026-05-07T12:00:00Z', changeNote: 'Established the incident summary structure.', kind: 'main', parentIds: [], text: `Summarize the incident notes for leadership.
State the current impact.
List confirmed causes.
Name the next checkpoint.
Do not speculate.` },
      { versionId: 'incident-v2', versionNumber: 2, author: 'Veda Cross', timestamp: '2026-05-21T15:30:00Z', changeNote: 'Separated observed symptoms from confirmed causes.', kind: 'main', parentIds: ['incident-v1'], text: `Summarize the incident notes for operational leadership.
State current customer and service impact in one sentence.
Separate observed symptoms from confirmed causes.
List mitigation work already completed.
Name the owner and time of the next checkpoint.
Do not speculate or assign blame.` },
      { versionId: 'incident-v3', versionNumber: 3, author: 'Oren Pike', timestamp: '2026-06-11T09:25:00Z', changeNote: 'Added confidence labels and explicit evidence citations.', kind: 'main', parentIds: ['incident-v2'], text: `Create a concise incident brief for operational leadership.
State current customer and service impact in one sentence.
Separate observed symptoms from confirmed causes.
Label each cause with high, medium, or low confidence.
Cite the source note for every confirmed detail.
List mitigation work already completed.
Name the owner and UTC time of the next checkpoint.
Do not speculate, minimize impact, or assign blame.` },
      { versionId: 'incident-v4', versionNumber: 4, author: 'Pax Loren', timestamp: '2026-07-02T13:10:00Z', changeNote: 'Made UTC formatting mandatory and added a decision-request section for leaders.', kind: 'main', parentIds: ['incident-v3'], text: `Create a concise incident brief for operational leadership.
State current customer and service impact in one sentence.
Separate observed symptoms from confirmed causes.
Label each cause with high, medium, or low confidence.
Cite the source note for every confirmed detail.
List mitigation work already completed and work still in progress.
Use UTC for every timestamp.
Name the owner and time of the next checkpoint.
End with any decision needed from leadership.
Do not speculate, minimize impact, or assign blame.` },
      { versionId: 'incident-v5', versionNumber: 5, author: 'Lumi Hart', timestamp: '2026-07-16T17:45:00Z', changeNote: 'Reduced the executive brief to a strict nine-line format while retaining evidence and ownership.', kind: 'main', parentIds: ['incident-v4'], text: `Create a nine-line incident brief for operational leadership.
State current customer and service impact in one sentence.
Separate observed symptoms from confirmed causes.
Label each cause with high, medium, or low confidence.
Cite the source note for every confirmed detail.
List completed mitigation and work still in progress.
Use UTC for every timestamp and name each owner.
State the next checkpoint and any leadership decision needed.
Do not speculate, minimize impact, or assign blame.` },
    ],
  },
  {
    id: 'research-scout', title: 'Research source scout', description: 'Finds and ranks credible sources for an analyst’s question.',
    versions: [
      { versionId: 'research-v1', versionNumber: 1, author: 'Kei Moss', timestamp: '2026-04-12T10:00:00Z', changeNote: 'Created a source-finding prompt focused on recency.', kind: 'main', parentIds: [], text: `Find five sources for the research question.
Prefer recent sources.
Summarize each source.
Include a link.` },
      { versionId: 'research-v2', versionNumber: 2, author: 'Ansel Grey', timestamp: '2026-05-03T09:18:00Z', changeNote: 'Editor migration changed casing and spacing only; wording intentionally remained unchanged.', kind: 'main', parentIds: ['research-v1'], text: `find five sources for the research question.
Prefer   recent sources.
Summarize each source.
Include a link.` },
      { versionId: 'research-v3', versionNumber: 3, author: 'Kei Moss', timestamp: '2026-05-29T18:22:00Z', changeNote: 'Required explicit uncertainty and contradictory evidence.', kind: 'main', parentIds: ['research-v2'], text: `Find five credible sources that directly address the research question.
Rank primary sources before commentary and prefer recent publications.
Explain why each source is authoritative.
Summarize the relevant finding in two sentences.
Note uncertainty, limitations, and contradictory evidence.
Include the publication date and canonical link.` },
      { versionId: 'research-v4', versionNumber: 4, author: 'Rhea North', timestamp: '2026-06-22T07:50:00Z', changeNote: 'Introduced a consistent evidence table and query expansion notes.', kind: 'main', parentIds: ['research-v3'], text: `Find five credible sources that directly address the research question.
Expand the query with two related terms and report them.
Rank primary sources before commentary and prefer recent publications.
For each source, report authority, date, finding, and link.
Note uncertainty, limitations, and contradictory evidence.
Use a compact evidence table.
End with the strongest supported conclusion.` },
      {
        versionId: 'research-v5', versionNumber: 5, author: 'Ansel Grey', timestamp: '2026-07-05T09:05:00Z',
        changeNote: 'Formatting sweep from the docs migration: adjusted indentation and spacing only, wording deliberately untouched for parity.',
        kind: 'main', parentIds: ['research-v4'],
        text: `Find five credible sources that directly address the research question.
  Expand the query with two related terms and report them.
Rank  primary  sources before commentary and prefer recent publications.
For each source, report authority, date, finding, and link.
   Note uncertainty, limitations, and contradictory evidence.
Use a compact evidence table.
End with the strongest supported conclusion.  `,
      },
      {
        versionId: 'research-v6', versionNumber: 6, author: 'Kei Moss', timestamp: '2026-07-18T15:40:00Z',
        changeNote: 'Header casing pass for the analyst handbook: capitalized key terms without rewording any instruction.',
        kind: 'main', parentIds: ['research-v5'],
        text: `Find five Credible Sources that directly address the Research Question.
  Expand the query with two related terms and report them.
Rank  Primary  Sources before commentary and prefer recent Publications.
For each source, report Authority, Date, Finding, and Link.
   Note Uncertainty, Limitations, and contradictory Evidence.
Use a compact Evidence Table.
End with the strongest supported Conclusion.  `,
      },
    ],
  },
  {
    id: 'release-notes', title: 'Release notes curator', description: 'Converts shipped work into useful, audience-aware release notes.',
    versions: [
      { versionId: 'release-v1', versionNumber: 1, author: 'Caro Wynn', timestamp: '2026-03-15T11:00:00Z', changeNote: 'Drafted the initial release-note transformation.', kind: 'main', parentIds: [], text: `Turn the change list into release notes.
Group changes by feature and fix.
Use clear language.
Avoid internal ticket numbers.` },
      { versionId: 'release-v2', versionNumber: 2, author: 'Bo Ellis', timestamp: '2026-04-06T16:34:00Z', changeNote: 'Added reader outcomes and upgrade warnings.', kind: 'main', parentIds: ['release-v1'], text: `Turn the shipped change list into customer release notes.
Group changes by new, improved, and fixed.
Lead each item with the reader outcome.
Call out any required upgrade action.
Avoid internal ticket numbers and team names.` },
      { versionId: 'release-v3', versionNumber: 3, author: 'Caro Wynn', timestamp: '2026-05-17T13:42:00Z', changeNote: 'Introduced audience segments and accessibility language.', kind: 'main', parentIds: ['release-v2'], text: `Turn the shipped change list into customer release notes.
Group changes by new, improved, and fixed.
Lead each item with the reader outcome.
Identify the affected audience when it is not universal.
Call out required upgrade or migration actions.
Describe accessibility changes in direct language.
Avoid internal ticket numbers, code names, and team names.` },
      { versionId: 'release-v4', versionNumber: 4, author: 'Juno Bell', timestamp: '2026-06-09T08:15:00Z', changeNote: 'Set a consistent voice and required links only when customer-accessible.', kind: 'main', parentIds: ['release-v3'], text: `Turn the shipped change list into concise customer release notes.
Group changes under New, Improved, and Fixed.
Lead each item with the reader outcome.
Identify the affected audience when it is not universal.
Call out required upgrade or migration actions.
Describe accessibility changes in direct, specific language.
Link only to customer-accessible guidance.
Avoid internal ticket numbers, code names, and team names.` },
      { versionId: 'release-v5', versionNumber: 5, author: 'Sumi Lane', timestamp: '2026-07-12T14:55:00Z', changeNote: 'Added a final claim-verification pass before publication.', kind: 'main', parentIds: ['release-v4'], text: `Turn the shipped change list into concise customer release notes.
Group changes under New, Improved, and Fixed.
Lead each item with the reader outcome.
Identify the affected audience when it is not universal.
Call out required upgrade or migration actions.
Describe accessibility changes in direct, specific language.
Link only to customer-accessible guidance.
Verify every claim against the shipped change list.
Remove internal ticket numbers, code names, and team names.
Return publication-ready copy only.` },
    ],
  },
];

export const seededAnnotations = {
  'reply-editor': [
    {
      annotationId: 'ann-evidence', bodyMarkdown: '**Evidence order** is the key trust boundary.\n\n- [x] Facts are explicit\n- [ ] Confirm how assumptions should appear',
      lineStart: 8, lineEnd: 8, author: 'Mara Sol', resolved: false, timestamp: '2026-07-09T10:30:00Z', replies: [],
    },
    {
      annotationId: 'ann-length', bodyMarkdown: 'Keep this limit aligned with the current support style guide.\n\n```text\nAccuracy wins when brevity conflicts.\n```',
      lineStart: 11, lineEnd: 11, author: 'Niko Arden', resolved: true, timestamp: '2026-07-11T13:05:00Z',
      replies: [{ bodyMarkdown: 'Confirmed with the editorial team.', author: 'Iona Vale' }],
    },
  ],
};

export const cloneSeedData = () => JSON.parse(JSON.stringify(seededPrompts));
export const cloneSeedAnnotations = () => JSON.parse(JSON.stringify(seededAnnotations));

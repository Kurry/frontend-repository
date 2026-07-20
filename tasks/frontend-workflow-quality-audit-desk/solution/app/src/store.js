import { defineStore } from 'pinia'
import { CHECKS, CRITERIA, REVIEWERS, FEEDBACK_VERDICTS, STAGES, REPOSITORIES, FeedbackEntrySchema, CriterionFailVerdictSchema, EscalationSchema, ResolutionSchema, AuditPackageSchema, firstZodError } from './contracts'

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))
const now = () => new Date().toISOString()
const title = s => s.replaceAll('-', ' ').replace(/\b\w/g, c => c.toUpperCase())
const violations = {
  'package-shape':'Package manifest omits the declared task entrypoint.',
  'task-config':'Task configuration references an unavailable fixture.',
  'rubric-wiring':'Rubric identifier is not wired to the scoring route.',
  'file-modes':'Executable harness file is missing its execute bit.',
  'harvest':'Harvest output contains a nondeterministic generated file.',
  'container-parity':'Container runtime version differs from the authoring lock.',
  'dependency-pinning':'A transitive dependency resolves from an open range.',
  'foils':'One foil passes without exercising the intended failure mode.',
  'scoring-contract':'Score weights do not sum to the declared maximum.'
}

function event(type, detail, at = now()) { return { id: `${Date.now()}-${Math.random()}`, type, detail, at } }

function seedRecords() {
  const records = []
  REPOSITORIES.forEach((repository, repoIndex) => {
    for (let item = 0; item < 6; item++) {
      const issue = 12 + repoIndex * 17 + item * 3
      const slug = `${repository.replace('/','-')}-issue-${issue}`
      const stageCycle = ['pending','checked','held','admitted','held','checked']
      const stage = stageCycle[item]
      const firstRunCompleted = stage !== 'pending'
      let seededFailures = []
      if (stage === 'held') seededFailures = [CHECKS[(repoIndex + item) % 9], ...(item === 4 ? [CHECKS[(repoIndex + 5) % 9]] : [])]
      const checkResults = Object.fromEntries(CHECKS.map(c => [c, firstRunCompleted ? { status: seededFailures.includes(c) ? 'fail' : 'pass', violation: seededFailures.includes(c) ? violations[c] : null } : { status:'not-run', violation:null }]))
      const criteria = Object.fromEntries(CRITERIA.map((c, ci) => {
        if (!firstRunCompleted) return [c, { verdict:null, rationale:null }]
        if (stage === 'held' && ci === (repoIndex + item) % 10) return [c, { verdict:'fail', rationale:`Evidence for ${c} remains inconsistent with the executable task.` }]
        const passed = stage === 'admitted' || ci < (5 + ((repoIndex + item) % 5))
        return [c, { verdict:passed ? 'pass' : null, rationale:null }]
      }))
      const created = new Date(Date.UTC(2026, 6, 1 + repoIndex, 9 + item, repoIndex * 3)).toISOString()
      const stageHistory = [{ stage:'pending', at:created }]
      if (stage !== 'pending') stageHistory.push({ stage:'checked', at:new Date(Date.parse(created)+5400000).toISOString() })
      if (['held','admitted'].includes(stage)) stageHistory.push({ stage, at:new Date(Date.parse(created)+7200000).toISOString() })
      const feedback = []
      if ((repoIndex + item) % 2 === 0) {
        const reviewer = REVIEWERS[(repoIndex + item) % REVIEWERS.length]
        feedback.push({ reviewer, verdict: FEEDBACK_VERDICTS[(repoIndex + item) % 4], findings:`Reviewed the task evidence and recorded a specific authoring recommendation for issue ${issue}.`, at:new Date(Date.parse(created)+9000000).toISOString() })
      }
      const timeline = [event('record-created','Task entered the audit queue.',created)]
      if (firstRunCompleted) timeline.push(event('run-completed',`Seed audit completed: ${9-seededFailures.length} passed, ${seededFailures.length} failed.`,stageHistory[1].at))
      feedback.forEach(f => timeline.push(event('feedback-entry',`${f.reviewer} added ${f.verdict} feedback.`,f.at)))
      records.push({
        slug, repository, issue, stage, seededFailures, checkResults, criteria, feedback,
        firstRunCompleted, fixesApplied:false, escalation:null, resolution:null, touched:false,
        lastActivity: timeline.at(-1).at, stageHistory, timeline, seed:repoIndex*6+item
      })
    }
  })
  return records
}

function defaultFilters(){ return { check:null, checkOutcome:'fail', criterion:null, criterionOutcome:'fail', stage:null, reviewer:null, repository:null } }

export const useAuditStore = defineStore('audit', {
  state: () => ({
    records: seedRecords(), activeView:'queue', selectedSlug:null, selectedReviewer:null,
    search:'', filters:defaultFilters(), sort:{ key:'lastActivity', direction:'desc' },
    disclosure:{}, runs:{}, batch:{ active:false, paused:false, slugs:[], index:0 },
    exportHistory:[], exportFormat:'json', packageTimestamp:now(), importOpen:false, importError:'',
    mobileNav:false, toast:null, liveMessage:'', rollupPulse:0, highlightedCheck:null
  }),
  getters: {
    selectedTask(state){ return state.records.find(r => r.slug === state.selectedSlug) || null },
    visibleRecords(state){
      const q = state.search.trim().toLowerCase()
      const f = state.filters
      const rows = state.records.filter(r => {
        if (q && !r.slug.toLowerCase().includes(q) && !r.repository.toLowerCase().includes(q)) return false
        if (f.repository && r.repository !== f.repository) return false
        if (f.stage && r.stage !== f.stage) return false
        if (f.reviewer && !r.feedback.some(x => x.reviewer === f.reviewer)) return false
        if (f.check && r.checkResults[f.check]?.status !== f.checkOutcome) return false
        if (f.criterion && r.criteria[f.criterion]?.verdict !== f.criterionOutcome) return false
        return true
      })
      const dir = state.sort.direction === 'asc' ? 1 : -1
      return [...rows].sort((a,b) => {
        let av, bv
        if (state.sort.key === 'checks') { av = CHECKS.filter(c => a.checkResults[c].status === 'pass').length; bv = CHECKS.filter(c => b.checkResults[c].status === 'pass').length }
        else if (state.sort.key === 'criteria') { av = CRITERIA.filter(c => a.criteria[c].verdict === 'pass').length; bv = CRITERIA.filter(c => b.criteria[c].verdict === 'pass').length }
        else if (state.sort.key === 'feedback') { av=a.feedback.length; bv=b.feedback.length }
        else { av=a[state.sort.key] ?? ''; bv=b[state.sort.key] ?? '' }
        return (av < bv ? -1 : av > bv ? 1 : a.slug.localeCompare(b.slug)) * dir
      })
    },
    checkRates(state){ return CHECKS.map(check => { const run=state.records.filter(r=>r.checkResults[check].status!=='not-run'); const passes=run.filter(r=>r.checkResults[check].status==='pass').length; return {check,passes,fails:run.length-passes,passRate:run.length?Math.round(passes/run.length*1000)/10:0} }) },
    criterionRanking(state){ return CRITERIA.map(criterion=>({criterion,failures:state.records.filter(r=>r.criteria[criterion].verdict==='fail').length})).sort((a,b)=>b.failures-a.failures || CRITERIA.indexOf(a.criterion)-CRITERIA.indexOf(b.criterion)) },
    reviewerActivity(state){ return REVIEWERS.map(reviewer=>{const entries=state.records.flatMap(r=>r.feedback).filter(f=>f.reviewer===reviewer); return {reviewer,entryCount:entries.length,verdictMix:Object.fromEntries(FEEDBACK_VERDICTS.map(v=>[v,entries.filter(e=>e.verdict===v).length]))} }) },
    datasetSummary(state){ return { admitted:state.records.filter(r=>r.stage==='admitted').length, held:state.records.filter(r=>r.stage==='held').length, escalated:state.records.filter(r=>r.stage==='escalated').length, resolved:state.records.filter(r=>r.stage==='resolved').length, total:state.records.length } },
    activeFilterChips(state){ const f=state.filters; const a=[]; if(f.repository)a.push({key:'repository',label:`Repository: ${f.repository}`}); if(f.check)a.push({key:'check',label:`${f.check}: ${f.checkOutcome}`}); if(f.criterion)a.push({key:'criterion',label:`${f.criterion}: ${f.criterionOutcome}`}); if(f.stage)a.push({key:'stage',label:`Stage: ${f.stage}`}); if(f.reviewer)a.push({key:'reviewer',label:`Reviewer: ${f.reviewer}`}); return a },
    touchedRecords(state){ return state.records.filter(r=>r.touched) }
  },
  actions: {
    notify(message){ this.toast=message; this.liveMessage=message; setTimeout(()=>{ if(this.toast===message)this.toast=null },3200) },
    markMutation(record, type, detail){ record.touched=true; record.lastActivity=now(); record.timeline.push(event(type,detail,record.lastActivity)); this.packageTimestamp=record.lastActivity; this.rollupPulse++ },
    setView(view){ this.activeView=view; if(view!=='task-detail')this.selectedSlug=null; if(view!=='reviewer-detail')this.selectedReviewer=null; this.mobileNav=false },
    openTask(slug){ this.selectedSlug=slug; this.activeView='task-detail'; this.mobileNav=false },
    openReviewer(reviewer){ this.selectedReviewer=reviewer; this.activeView='reviewer-detail' },
    sortBy(key){ if(this.sort.key===key)this.sort.direction=this.sort.direction==='asc'?'desc':'asc'; else this.sort={key,direction:'asc'} },
    clearFilters(){ this.filters=defaultFilters(); this.search='' },
    removeFilter(key){ if(key==='check'){this.filters.check=null;this.filters.checkOutcome='fail'} else if(key==='criterion'){this.filters.criterion=null;this.filters.criterionOutcome='fail'} else this.filters[key]=null },
    applyFilter(type,value,outcome='fail'){ if(type==='check'){this.filters.check=value;this.filters.checkOutcome=outcome} else if(type==='criterion'){this.filters.criterion=value;this.filters.criterionOutcome=outcome} else this.filters[type]=value; this.activeView='queue' },
    runFor(slug){ return this.runs[slug] },
    async waitIfPaused(slug){ while(this.runs[slug]?.paused || this.batch.paused) await delay(80) },
    pauseRun(slug){ if(this.runs[slug]){this.runs[slug].paused=true;this.runs[slug].status='paused'} },
    resumeRun(slug){ if(this.runs[slug]){this.runs[slug].paused=false;this.runs[slug].status='running'} },
    async runChecks(slug, fromBatch=false){
      const record=this.records.find(r=>r.slug===slug); if(!record)return false
      const current=this.runs[slug]; if(current && ['running','paused'].includes(current.status))return current.promise || false
      const initialSteps=CHECKS.map(check=>({check,status:'pending',attempt:0,startedAt:null,completedAt:null,violation:null}))
      this.runs[slug]={status:'running',paused:false,steps:initialSteps,evidence:[],startedAt:now(),completedAt:null,highlighted:null,elapsed:0}
      const run=this.runs[slug]
      const steps=run.steps
      this.markMutation(record,'run-started','Deterministic nine-step audit started.')
      this.liveMessage=`${record.slug} audit run started`
      const start=Date.now()
      const work=(async()=>{
        for(let i=0;i<steps.length;i++){
          await this.waitIfPaused(slug)
          const step=steps[i]; step.status='running'; step.attempt=1; step.startedAt=now(); run.highlighted=step.check
          run.evidence.push(event('running',`${step.check} started (attempt 1).`,step.startedAt))
          record.timeline.push(event('step-transition',`${step.check} entered running.`,step.startedAt))
          await delay(170); await this.waitIfPaused(slug)
          const transient=((record.seed+i)%23===0 && !record.fixesApplied)
          if(transient){
            step.status='retrying'; step.backoff=2; run.evidence.push(event('retrying',`${step.check} waiting before retry 2 of 3.`))
            record.timeline.push(event('step-transition',`${step.check} entered retrying before attempt 2.`))
            for(let tick=2;tick>0;tick--){step.backoff=tick;await delay(180);await this.waitIfPaused(slug)}
            step.attempt=2; step.status='running'; run.evidence.push(event('running',`${step.check} retry 2 started.`)); record.timeline.push(event('step-transition',`${step.check} retry 2 entered running.`)); await delay(150)
          }
          const fails=!record.fixesApplied && record.seededFailures.includes(step.check)
          step.status=fails?'failed':'complete'; step.violation=fails?violations[step.check]:null; step.completedAt=now()
          run.evidence.push(event(step.status,fails?`${step.check} failed: ${step.violation}`:`${step.check} completed successfully.`,step.completedAt))
          record.timeline.push(event('step-transition',fails?`${step.check} failed: ${step.violation}`:`${step.check} completed.`,step.completedAt))
          if(fails)this.liveMessage=`${step.check} entered the failed state`
          run.elapsed=Date.now()-start
          await delay(80)
        }
        run.status='complete'; run.completedAt=now(); run.elapsed=Date.now()-start
        record.checkResults=Object.fromEntries(steps.map(s=>[s.check,{status:s.status==='failed'?'fail':'pass',violation:s.violation}]))
        record.firstRunCompleted=true
        const failed=steps.filter(s=>s.status==='failed').length
        let nextStage
        if(record.fixesApplied) nextStage='re-audited'
        else if(failed) nextStage='held'
        else nextStage=CRITERIA.every(c=>record.criteria[c].verdict==='pass')?'admitted':'checked'
        this.changeStage(record,nextStage)
        this.markMutation(record,'run-completed',`Audit completed: ${9-failed} passed, ${failed} failed.`)
        this.notify(`${record.slug} checks completed`)
        return true
      })()
      run.promise=work
      return work
    },
    changeStage(record,stage){ if(record.stage===stage)return; record.stage=stage; const at=now(); record.stageHistory.push({stage,at}); record.lastActivity=at; record.timeline.push(event('stage-changed',`Lifecycle stage changed to ${stage}.`,at)); record.touched=true; this.liveMessage=`${record.slug} changed stage to ${stage}` },
    async startBatch(){
      if(this.batch.active)return
      const slugs=this.visibleRecords.map(r=>r.slug); if(!slugs.length)return
      this.batch={active:true,paused:false,slugs,index:0}
      for(let i=0;i<slugs.length;i++){this.batch.index=i;await this.runChecks(slugs[i],true)}
      this.batch.active=false; this.notify(`Batch run completed for ${slugs.length} tasks`)
    },
    pauseBatch(){this.batch.paused=true;const slug=this.batch.slugs[this.batch.index];if(slug)this.pauseRun(slug)},
    resumeBatch(){this.batch.paused=false;const slug=this.batch.slugs[this.batch.index];if(slug)this.resumeRun(slug)},
    saveCriterion(slug,criterion,verdict,rationale=''){
      const record=this.records.find(r=>r.slug===slug); if(!record?.firstRunCompleted)return {ok:false,error:'criterion-verdict: checks must run first'}
      if(verdict==='fail'){
        const parsed=CriterionFailVerdictSchema.safeParse({criterion,verdict:'fail',rationale})
        if(!parsed.success)return {ok:false,error:firstZodError(parsed.error)}
        record.criteria[criterion]={verdict:'fail',rationale:parsed.data.rationale}
      } else if(verdict==='pass') record.criteria[criterion]={verdict:'pass',rationale:null}
      else return {ok:false,error:'criterion-verdict: choose pass or fail'}
      const anyFail=CRITERIA.some(c=>record.criteria[c].verdict==='fail'); const allPass=CRITERIA.every(c=>record.criteria[c].verdict==='pass'); const checksPass=CHECKS.every(c=>record.checkResults[c].status==='pass')
      if(anyFail && !['escalated','resolved','re-audited'].includes(record.stage))this.changeStage(record,'held')
      else if(allPass && checksPass){if(record.stage==='re-audited'||record.fixesApplied)this.changeStage(record,'resolved');else this.changeStage(record,'admitted')}
      else if(checksPass && !['escalated','resolved','re-audited'].includes(record.stage))this.changeStage(record,'checked')
      this.markMutation(record,'verdict-change',`${criterion} set to ${verdict}.`)
      return {ok:true}
    },
    addFeedback(slug,payload){
      const parsed=FeedbackEntrySchema.safeParse(payload); if(!parsed.success)return {ok:false,error:firstZodError(parsed.error),issues:parsed.error.issues}
      const record=this.records.find(r=>r.slug===slug); if(!record)return {ok:false,error:'task not found'}
      const entry={...parsed.data,at:now()}; record.feedback.push(entry); this.markMutation(record,'feedback-entry',`${entry.reviewer} added ${entry.verdict} feedback.`); this.notify('Feedback entry added'); return {ok:true,entry:parsed.data}
    },
    escalate(slug,payload){
      const parsed=EscalationSchema.safeParse(payload); if(!parsed.success)return {ok:false,error:firstZodError(parsed.error),issues:parsed.error.issues}
      const record=this.records.find(r=>r.slug===slug); if(record?.stage!=='held')return {ok:false,error:'stage: only held tasks can be escalated'}
      record.escalation=parsed.data; this.changeStage(record,'escalated'); this.markMutation(record,'escalation',`${parsed.data.category}: ${parsed.data.summary}`); this.notify('Task escalated'); return {ok:true,escalation:parsed.data}
    },
    applyFixes(slug){const record=this.records.find(r=>r.slug===slug);if(record?.stage!=='held')return false;record.fixesApplied=true;this.markMutation(record,'fixes-applied','Simulated fixes applied; failed checks are ready for re-audit.');this.notify('Simulated fixes applied');return true},
    resolve(slug,payload){
      const parsed=ResolutionSchema.safeParse(payload);if(!parsed.success)return {ok:false,error:firstZodError(parsed.error),issues:parsed.error.issues}
      const record=this.records.find(r=>r.slug===slug);const eligible=record?.stage==='escalated'||(record?.stage==='re-audited'&&CHECKS.every(c=>record.checkResults[c].status==='pass')&&CRITERIA.every(c=>record.criteria[c].verdict==='pass'))
      if(!eligible)return {ok:false,error:'stage: task is not eligible for resolution'}
      record.resolution=parsed.data;this.changeStage(record,'resolved');this.markMutation(record,'resolution',parsed.data.note);this.notify('Task resolved');return {ok:true,resolution:parsed.data}
    },
    buildPackage(){
      return {
        schemaVersion:'quality-audit-package-v1',exportedAt:this.packageTimestamp,
        datasetSummary:this.datasetSummary,
        checkPassRates:this.checkRates,
        criterionFailureRanking:this.criterionRanking,
        reviewerActivity:this.reviewerActivity,
        tasks:this.touchedRecords.map(r=>({slug:r.slug,stage:r.stage,checks:CHECKS.map(check=>({check,status:r.checkResults[check].status})),failedCriteria:CRITERIA.filter(c=>r.criteria[c].verdict==='fail').map(criterion=>({criterion,verdict:'fail',rationale:r.criteria[criterion].rationale})),feedback:r.feedback.map(({reviewer,verdict,findings})=>({reviewer,verdict,findings})),escalation:r.escalation,resolution:r.resolution})),
        exportHistory:this.exportHistory.map(x=>({...x}))
      }
    },
    markdown(){
      const p=this.buildPackage(); const lines=['# Audit Report','',`Exported: ${p.exportedAt}`,'','## Dataset summary','',`| Admitted | Held | Escalated | Resolved | Total |`,`| ---: | ---: | ---: | ---: | ---: |`,`| ${p.datasetSummary.admitted} | ${p.datasetSummary.held} | ${p.datasetSummary.escalated} | ${p.datasetSummary.resolved} | ${p.datasetSummary.total} |`,'','## Check pass rates','','| Check | Passes | Fails | Pass rate |','| --- | ---: | ---: | ---: |',...p.checkPassRates.map(x=>`| ${x.check} | ${x.passes} | ${x.fails} | ${x.passRate}% |`),'','## Criterion failure ranking','','| Criterion | Failures |','| --- | ---: |',...p.criterionFailureRanking.map(x=>`| ${x.criterion} | ${x.failures} |`),'','## Reviewer activity','','| Reviewer | Entries | Approve | Approve with caveats | Needs edit | Reject |','| --- | ---: | ---: | ---: | ---: | ---: |',...p.reviewerActivity.map(x=>`| ${x.reviewer} | ${x.entryCount} | ${x.verdictMix.Approve} | ${x.verdictMix['Approve with caveats']} | ${x.verdictMix['Needs edit']} | ${x.verdictMix.Reject} |`),'','## Task appendix','']
      if(!p.tasks.length)lines.push('_Audited records will appear here after a run, verdict, feedback entry, fix, escalation, or resolution._')
      p.tasks.forEach(t=>{lines.push(`### ${t.slug}`,'',`- Stage: ${t.stage}`,`- Checks: ${t.checks.map(c=>`${c.check}=${c.status}`).join(', ')}`);if(t.failedCriteria.length){lines.push('- Failed criteria:');t.failedCriteria.forEach(c=>lines.push(`  - ${c.criterion}: ${c.rationale}`))}else lines.push('- Failed criteria: none');if(t.feedback.length){lines.push('- Feedback:');t.feedback.forEach(f=>lines.push(`  - ${f.reviewer} — ${f.verdict}: ${f.findings}`))}else lines.push('- Feedback: none');if(t.escalation)lines.push(`- Escalation: ${t.escalation.category} — ${t.escalation.summary}`);if(t.resolution)lines.push(`- Resolution: ${t.resolution.note}`);lines.push('')})
      return lines.join('\n')
    },
    preview(format=this.exportFormat){return format==='json'?JSON.stringify(this.buildPackage(),null,2):this.markdown()},
    recordExport(format=this.exportFormat){const text=this.preview(format);const at=now();this.exportHistory.push({exportedAt:at,format});this.touchedRecords.forEach(r=>{r.timeline.push(event('report-export',`${format==='json'?'Audit Package JSON':'Audit Report Markdown'} exported.`,at));r.lastActivity=at});this.packageTimestamp=at;this.notify(`${format==='json'?'JSON':'Markdown'} export ready`);return text},
    importPackage(raw){
      let json;try{json=JSON.parse(raw)}catch{return {ok:false,error:'Audit Package JSON: malformed JSON'}}
      const parsed=AuditPackageSchema.safeParse(json);if(!parsed.success)return {ok:false,error:firstZodError(parsed.error)}
      const p=parsed.data; const next=seedRecords()
      for(const imported of p.tasks){
        let record=next.find(r=>r.slug===imported.slug)
        if(!record){const repo=REPOSITORIES.find(x=>imported.slug.startsWith(x.replace('/','-')))||REPOSITORIES[0];record=seedRecords()[0];record={...record,slug:imported.slug,repository:repo};next.push(record)}
        record.stage=imported.stage;record.checkResults=Object.fromEntries(imported.checks.map(x=>[x.check,{status:x.status,violation:x.status==='fail'?violations[x.check]:null}]));record.firstRunCompleted=imported.checks.some(x=>x.status!=='not-run');record.criteria=Object.fromEntries(CRITERIA.map(c=>{const fail=imported.failedCriteria.find(x=>x.criterion===c);return [c,fail?{verdict:'fail',rationale:fail.rationale}:{verdict:record.firstRunCompleted?'pass':null,rationale:null}]}));record.feedback=imported.feedback.map(x=>({...x,at:p.exportedAt}));record.escalation=imported.escalation||null;record.resolution=imported.resolution||null;record.touched=true;record.lastActivity=p.exportedAt;record.stageHistory=[{stage:imported.stage,at:p.exportedAt}];record.timeline=[event('package-imported','Task reconstructed from Audit Package JSON.',p.exportedAt)]
      }
      this.records=next;this.exportHistory=p.exportHistory;this.packageTimestamp=p.exportedAt;this.importError='';this.importOpen=false;this.notify('Audit package imported');return {ok:true}
    }
  }
})

export { title }

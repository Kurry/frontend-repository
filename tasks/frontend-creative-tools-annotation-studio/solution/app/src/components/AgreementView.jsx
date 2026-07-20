import { useMemo, useState } from 'react';
import { Button, Select, SelectItem, Tag } from '@carbon/react';
import { WarningAlt, Flag } from '@carbon/icons-react';
import { isAgreementFlagged, useStudioStore } from '../store';
import { StateChip } from './Sidebar';

export default function AgreementView() {
  const suites = useStudioStore((s) => s.suites);
  const agreement = useStudioStore((s) => s.agreement);
  const items = useStudioStore((s) => s.items);
  const setState = useStudioStore((s) => s.setReviewState);
  const [suiteId, setSuiteId] = useState(suites[0].id);
  const rows = useMemo(() => agreement.filter((row) => row.suiteId === suiteId), [agreement, suiteId]);
  const flagged = rows.filter(isAgreementFlagged).length;
  const percent = rows.length ? Math.round(((rows.length - flagged) / rows.length) * 100) : 0;
  return <div className="view-shell agreement-view"><header className="view-heading"><div><p className="eyebrow">Kestrel × Juniper</p><h1>Inter-annotator agreement</h1><p>Rows are flagged when ratings differ or a rubric score differs by two or more.</p></div><Select id="agreement-suite" labelText="Evaluation suite" value={suiteId} onChange={(e) => setSuiteId(e.target.value)}>{suites.map((suite) => <SelectItem key={suite.id} value={suite.id} text={suite.name} />)}</Select></header>
    <section className="agreement-summary"><div><span>Agreement</span><strong>{percent}%</strong><small>{rows.length - flagged} of {rows.length} aligned</small></div><div><span>Flagged rows</span><strong>{flagged}</strong><small>Ready for dispute review</small></div><div className="annotator-key"><span><i className="kestrel" />Annotator A — Kestrel</span><span><i className="juniper" />Annotator B — Juniper</span></div></section>
    <div className="table-scroll"><table className="agreement-table"><thead><tr><th>Item</th><th>Binary rating</th><th>Accuracy</th><th>Clarity</th><th>Relevance</th><th>Agreement</th><th>Review state</th><th>Action</th></tr></thead><tbody>{rows.map((row) => {
      const warning = isAgreementFlagged(row); const item = items[row.itemId];
      return <tr key={row.itemId} className={warning ? 'disagreement' : ''}><td><strong>{item.title}</strong><small>{item.id}</small></td><td><span className="score-pair"><b>{row.annotatorA.rating === 'up' ? '↑ Up' : '↓ Down'}</b><b>{row.annotatorB.rating === 'up' ? '↑ Up' : '↓ Down'}</b></span></td>{['Accuracy', 'Clarity', 'Relevance'].map((key) => <td key={key}><span className="score-pair"><b>{row.annotatorA.scores[key]}</b><b>{row.annotatorB.scores[key]}</b></span></td>)}<td>{warning ? <Tag type="warm-gray" renderIcon={WarningAlt}>Disagreement</Tag> : <Tag type="green">Aligned</Tag>}</td><td><StateChip state={item.review_state} /></td><td>{warning && <Button size="sm" kind="ghost" renderIcon={Flag} disabled={item.review_state === 'disputed'} onClick={() => setState(item.id, 'disputed', { disputeReason: 'Flagged from agreement review' })}>{item.review_state === 'disputed' ? 'Flagged' : 'Flag for dispute'}</Button>}</td></tr>;
    })}</tbody></table></div>
  </div>;
}

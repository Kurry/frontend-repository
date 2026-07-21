import { Tag, Tile } from '@carbon/react';
import { useStudioStore } from '../store';
import { ClassIcon } from '../icons';
import { StateChip } from './Sidebar';

export default function HistoryView() {
  const itemId = useStudioStore((s) => s.historyItemId);
  const item = useStudioStore((s) => s.items[itemId]);
  const taxonomy = useStudioStore((s) => s.taxonomy);
  if (!item?.annotation) return <div className="empty-state"><h2>No saved annotation selected</h2><p>Choose a submitted annotation from the History tab.</p></div>;
  const annotation = item.annotation;
  return <div className="view-shell history-detail"><header className="view-heading"><div><p className="eyebrow">Read-only annotation · {new Date(item.submittedAt).toLocaleString()}</p><h1>{item.title}</h1><p>{item.response}</p></div><StateChip state={item.review_state} /></header>
    <div className="history-summary"><Tile><span>Rating</span><strong className={`history-rating ${annotation.rating}`}>{annotation.rating === 'up' ? '↑ Up' : '↓ Down'}</strong></Tile>{Object.entries(annotation.scores).map(([key, value]) => <Tile key={key}><span>{key}</span><strong>{value} / 5</strong></Tile>)}</div>
    <section className="history-section"><h2>Comments</h2><p>{annotation.comment || 'No annotator comments were provided.'}</p></section>
    {item.disputeReason && <section className="history-section"><h2>Dispute reason</h2><p>{item.disputeReason}</p></section>}
    <section className="history-section"><h2>Metadata</h2><div className="metadata-readonly">{Object.entries(annotation.metadata).map(([key, value]) => <div key={key}><span>{key}</span><strong>{typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}</strong></div>)}</div></section>
    <section className="history-section"><h2>Regions <Tag type="gray">{annotation.regions.length}</Tag></h2>{item.image && <div className="history-image"><img src={item.image} alt="Annotated evaluation scene" />{annotation.regions.map((region, index) => { const cls = taxonomy.find((c) => c.id === region.classId); return <div key={index} className="region-box readonly" style={{ left: `${region.x / 6.4}%`, top: `${region.y / 3.6}%`, width: `${region.w / 6.4}%`, height: `${region.h / 3.6}%`, borderColor: cls?.color }}><span style={{ background: cls?.color }}><ClassIcon name={cls?.icon} /> {cls?.name || 'Unclassified'}</span></div>; })}</div>}
      <div className="history-regions">{annotation.regions.map((region, index) => { const cls = taxonomy.find((c) => c.id === region.classId); return <div key={index} style={{ '--class-color': cls?.color }}><ClassIcon name={cls?.icon} /><span><strong>{cls?.name || 'Unclassified'}</strong><small>x {region.x}, y {region.y}, w {region.w}, h {region.h}</small></span></div>; })}{!annotation.regions.length && <p className="empty-mini">This annotation has no saved regions.</p>}</div>
    </section>
  </div>;
}

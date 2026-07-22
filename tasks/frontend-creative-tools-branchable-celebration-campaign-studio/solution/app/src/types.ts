export type LayerType = 'text' | 'image' | 'shape' | 'rsvp-code';

export interface CanvasLayer {
  id: string;
  type: LayerType;
  position: { x: number; y: number };
  rotation: number;
  dimensions: { width: number; height: number };
  content: string;
  locked: boolean;
  hidden: boolean;
  zIndex: number;
  altText?: string;
  src?: string; // For images
}

export type VariantNodeStatus = 'active' | 'accepted' | 'rejected' | 'superseded';

export interface BranchNode {
  id: string;
  parentId: string | null;
  status: VariantNodeStatus;
  changes: Partial<CanvasLayer>[];
  name: string;
  lineage: number;
}

export type RsvpState = 'pending' | 'viewed' | 'accepted' | 'declined' | 'needs-follow-up';

export interface Recipient {
  id: string;
  name: string;
  household: string;
  salutation: string;
  channel: 'email' | 'sms' | 'print';
  consent: boolean;
  rsvp_state: RsvpState;
  variant_id?: string;
  dietary?: string;
  accessibility?: string;
}

export type WorkflowStep = 'brief' | 'source_review' | 'copy_variants' | 'artwork_variants' | 'accessibility_review' | 'host_approval' | 'personalization' | 'delivery_rehearsal' | 'rsvp_tracking' | 'package';
export type AttemptStatus = 'queued' | 'running' | 'failed' | 'complete';

export interface QueueItem {
  id: string;
  recipientId: string;
  status: AttemptStatus;
  logs: string[];
}

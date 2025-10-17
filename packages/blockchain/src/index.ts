export interface TraceEvent {
  id: string;
  timestamp: Date;
  subjectType: 'ANIMAL' | 'PRODUCT' | 'BATCH';
  subjectId: string;
  action: string;
  metadata?: Record<string, unknown>;
}

export interface TraceabilityLedger {
  append(event: TraceEvent): Promise<void>;
  get(subjectId: string): Promise<TraceEvent[]>;
}

class InMemoryLedger implements TraceabilityLedger {
  private events: TraceEvent[] = [];
  async append(event: TraceEvent): Promise<void> {
    this.events.push(event);
  }
  async get(subjectId: string): Promise<TraceEvent[]> {
    return this.events.filter((e) => e.subjectId === subjectId);
  }
}

export const ledger: TraceabilityLedger = new InMemoryLedger();

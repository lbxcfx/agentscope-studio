export interface SpanEvent {
    name: string;
    timestamp: string;
    attributes?: Record<string, unknown>;
}

export enum TraceStatus {
    OK = 'OK',
    ERROR = 'ERROR',
    UNSET = 'UNSET',
}

export enum SpanKind {
    AGENT = 'AGENT',
    TOOL = 'TOOL',
    LLM = 'LLM',
    EMBEDDING = 'EMBEDDING',
    FORMATTER = 'FORMATTER',
    COMMON = 'COMMON',
}

export const enum SpanAttributes {
    SPAN_KIND = 'span.kind',
    INPUT = 'input',
    OUTPUT = 'output',
    METADATA = 'metadata',
    PROJECT_RUN_ID = 'project.run_id',
}

export interface SpanData {
    id: string;
    traceId: string;
    runId: string;
    parentSpanId?: string;
    name: string;
    spanKind: string;
    attributes: Record<string, unknown>;
    startTime: string;
    endTime: string;
    latencyMs: number;
    status: TraceStatus;
    statusMessage: string;
    events: SpanEvent[];
}

// Trace 数据结构
export interface TraceData {
    runId: string;
    startTime: string;
    endTime: string;
    latencyMs: number;
    status: TraceStatus;
}

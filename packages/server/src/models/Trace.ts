import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from 'typeorm';
import { RunTable } from './Run';

@Entity()
export class SpanTable extends BaseEntity {
    @PrimaryColumn({ nullable: false })
    id: string;

    @Column({ nullable: true })
    traceId: string;

    @Column({ nullable: true })
    parentSpanId: string;

    @ManyToOne(() => RunTable, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'run_id' })
    runId: string;

    @Column()
    name: string;

    @Column()
    spanKind: string;

    @Column('json')
    attributes: Record<string, unknown>;

    @Column()
    startTime: string;

    @Column()
    endTime: string;

    @Column('float')
    latencyMs: number;

    @Column()
    status: string;

    @Column()
    statusMessage: string;

    @Column('json')
    events: {
        name: string;
        timestamp: string;
        attributes: Record<string, unknown>;
    }[];
}

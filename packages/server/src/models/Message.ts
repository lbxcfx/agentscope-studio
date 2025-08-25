import {
    BaseEntity,
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from 'typeorm';
import { RunTable } from './Run';
import { ContentType } from '../../../shared/src/types/messageForm';

@Entity()
export class MessageTable extends BaseEntity {
    @PrimaryColumn({ nullable: false })
    id: string;

    @ManyToOne(() => RunTable, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'run_id' })
    runId: string;

    @Column({ type: 'varchar', nullable: true })
    replyId: string | null;

    @Column('json')
    msg: {
        name: string;
        role: string;
        content: ContentType;
        metadata: object;
        timestamp: string;
    };
}

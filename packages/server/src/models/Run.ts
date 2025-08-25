import { Entity, Column, BaseEntity, OneToMany, PrimaryColumn } from 'typeorm';
import { Status } from '../../../shared/src/types/messageForm';
import { MessageTable } from './Message';
import { SpanTable } from './Trace';
import { InputRequestTable } from '../models/InputRequest';

@Entity()
export class RunTable extends BaseEntity {
    @PrimaryColumn()
    id: string;

    @Column()
    project: string;

    @Column()
    name: string;

    @Column()
    timestamp: string;

    @Column()
    run_dir: string;

    @Column()
    pid: number;

    @Column({ type: 'varchar', enum: Status, default: Status.DONE })
    status: Status;

    @OneToMany(() => MessageTable, (message) => message.runId, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    messages: MessageTable[];

    @OneToMany(() => SpanTable, (span) => span.runId, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    spans: SpanTable[];

    @OneToMany(() => InputRequestTable, (inputRequest) => inputRequest.runId, {
        cascade: true,
        onDelete: 'CASCADE',
    })
    inputRequests: InputRequestTable[];
}

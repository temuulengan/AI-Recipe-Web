import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('app_error_log')
export class AppErrorLog {
    @PrimaryGeneratedColumn('increment')
    id!: number;

    @Column()
    level!: string; // 'error' 등

    @Column()
    source!: string; // 'nest-api'

    @Column('text')
    message!: string;

    @Column('text', { nullable: true })
    stack?: string;

    @Column({ nullable: true })
    method?: string;

    @Column({ nullable: true })
    path?: string;

    @Column({ name: 'user_id', nullable: true })
    userId?: string;

    @Column({ type: 'jsonb', nullable: true })
    context?: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;
}

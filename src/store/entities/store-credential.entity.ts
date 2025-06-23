import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne,
    CreateDateColumn, UpdateDateColumn, Unique
} from 'typeorm';
import { EmployeeRole } from './employee-role.enum';
import { Store } from './store.entity';

@Entity()
@Unique(['store', 'employee_role'])
export class StoreCredential {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @ManyToOne(() => Store, (store) => store.credentials, { onDelete: 'CASCADE' })
    store: Store;

    @Column({
        type: 'enum',
        enum: EmployeeRole,
    })
    employee_role: EmployeeRole;

    @Column({ nullable: true })
    credentials?: string;

    @Column()
    hash_credentials: string;

    @CreateDateColumn()
    created_at: Date;

    @Column({ type: 'timestamp', nullable: true })
    last_login?: Date;

    @UpdateDateColumn({ nullable: true })
    updated_at?: Date;
}

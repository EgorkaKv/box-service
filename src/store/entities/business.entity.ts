import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
    UpdateDateColumn, OneToMany
} from 'typeorm';
import { BusinessType } from './business-type.enum';
import { Store } from './store.entity';

@Entity()
export class Business {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @Column()
    business_name: string;

    @Column({
        type: 'enum',
        enum: BusinessType,
    })
    business_type: BusinessType;

    @Column({ nullable: true })
    description?: string;

    @Column({ nullable: true })
    website_url?: string;

    @Column({ nullable: true })
    logo_url?: string;

    @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    registration_date: Date;

    @Column({ type: 'timestamp', nullable: true })
    last_login?: Date;

    @Column({ nullable: true })
    registration_number?: string;

    @Column({ nullable: true })
    legal_address?: string;

    @UpdateDateColumn({ type: 'timestamp', nullable: true })
    updated_at?: Date;

    @OneToMany(() => Store, (store) => store.business)
    stores: Store[];
}

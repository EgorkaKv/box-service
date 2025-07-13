import {
    Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany,
    CreateDateColumn, UpdateDateColumn, Index, JoinColumn
} from 'typeorm';
import { Business } from './business.entity';
import { StoreCredential } from '@auth/entities/store-credential.entity';
import { Order } from '@order/entities/order.entity';
import { SurpriseBox } from '@surprise-box/entities/surprise-box.entity';
import { BoxTemplate } from '@box-template/entities/box-template.entity';
import { CustomerReport } from '@customer-report/entities/customer-report.entity';

@Entity()
@Index("idx_store_business_id", ["business"])
@Index("idx_store_city", ["city"])
@Index("idx_store_location", { synchronize: false }) // Индекс создается в БД с использованием GIST
export class Store {
    @PrimaryGeneratedColumn('increment')
    id: number;

    @ManyToOne(() => Business, (business) => business.stores, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'business_id' })
    business: Business;

    @Column()
    address: string;

    @Column()
    city: string;

    @Column({
        type: 'geometry',
        spatialFeatureType: 'Point',
        srid: 4326,
    })
    location: object;

    @Column({ nullable: true })
    description?: string;

    @Column({ name: 'store_image_url', nullable: true })
    storeImageUrl?: string;

    @Column({ name: 'box_image_url', nullable: true })
    boxImageUrl?: string;

    @Column({ name:'opening_hours', type: 'jsonb', nullable: true })
    openingHours?: Record<string, unknown>;

    @Column({ name: 'is_active', default: true })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
    updatedAt: Date;

    @OneToMany(() => StoreCredential, (cred) => cred.store)
    credentials: StoreCredential[];

    @OneToMany(() => Order, (order) => order.store)
    orders: Order[];

    @OneToMany(() => SurpriseBox, (surpriseBox: SurpriseBox) => surpriseBox.store)
    surpriseBoxes: SurpriseBox[];

    @OneToMany(() => BoxTemplate, (boxTemplate) => boxTemplate.store)
    boxTemplates: BoxTemplate[];

    @OneToMany(() => CustomerReport, (report) => report.store)
    customerReports: CustomerReport[];
}

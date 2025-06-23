import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Index } from 'typeorm';
import { Customer } from '../customer/customer.entity';
import { Store } from '../store/entities/store.entity';
import { Order } from '../order/entities/order.entity';

export enum ReportStatus {
  PENDING = 'pending',
  IN_REVIEW = 'in_review',
  RESOLVED = 'resolved',
  REJECTED = 'rejected',
}

export enum ReportPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ReportType {
  SERVICE_QUALITY = 'service_quality',
  FOOD_QUALITY = 'food_quality',
  PICKUP_ISSUE = 'pickup_issue',
  DELIVERY_ISSUE = 'delivery_issue',
  APP_BUG = 'app_bug',
  OTHER = 'other',
}

@Entity('customer_report')
@Index("idx_customer_report_customer_id", ["customerId"])
@Index("idx_customer_report_order_id", ["orderId"])
@Index("idx_customer_report_store_id", ["storeId"])
@Index("idx_customer_report_status", ["status"])
export class CustomerReport {
  @PrimaryGeneratedColumn({type:'bigint'})
  id: number;

  @Column({ name: 'customer_id', type: 'bigint' })
  customerId: number;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column({ name: 'store_id', type: 'bigint' })
  storeId: number;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'order_id', type: 'bigint', nullable: true })
  orderId: number | null;

  @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_id' })
  order: Order | null;

  @Column({
    name: 'report_type',
    type: 'enum',
    enum: ReportType,
  })
  reportType: ReportType;

  @Column({ type: 'text' })
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({
    type: 'enum',
    enum: ReportPriority,
    default: ReportPriority.MEDIUM,
  })
  priority: ReportPriority;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'admin_response', type: 'text', nullable: true })
  adminResponse: string | null;
}

import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Customer } from '@customer/entities/customer.entity';
import { SurpriseBox } from '@surprise-box/entities/surprise-box.entity';
import { Store } from '@store/entities/store.entity';
import { Review } from '@review/entities/review.entity';
import { CustomerReport } from '@customer-report/entities/customer-report.entity';

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  READY_FOR_PICKUP = 'ready_for_pickup',
  IN_DELIVERY = 'in_delivery',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded'
}

export enum FulfillmentType {
  PICKUP = 'pickup',
  DELIVERY = 'delivery'
}

export enum CancellerType {
  CUSTOMER = 'customer',
  STORE = 'store'
}

export enum PaymentType {
  APP = 'app',
  CASH = 'cash'
}

@Entity('orders')
@Index("idx_order_customer_id", ["customerId"])
@Index("idx_order_store_id", ["storeId"])
@Index("idx_order_status", ["status"])
@Index("idx_order_date", ["orderDate"])
export class Order {
  @PrimaryGeneratedColumn({type:'bigint'})
  id: number;

  @Column('bigint', { name: 'customer_id' })
  customerId: number;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column('bigint', { name: 'surprise_box_id' })
  surpriseBoxId: number;

  @ManyToOne(() => SurpriseBox, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'surprise_box_id' })
  surpriseBox: SurpriseBox;

  @Column('bigint', { name: 'store_id' })
  storeId: number;

  @ManyToOne(() => Store, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'status', type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column({ name: 'payment_type', type: 'enum', enum: PaymentType })
  paymentType: PaymentType;

  @Column({ name: 'fulfillment_type', type: 'enum', enum: FulfillmentType })
  fulfillmentType: FulfillmentType;

  @Column({ name: 'pickup_code', type: 'text', unique: true })
  pickupCode: string;

  @Column({ name: 'order_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  orderDate: Date;

  @Column({ name: 'pickuped_at', type: 'timestamp', nullable: true })
  pickupedAt: Date;

  @Column({ name: 'cancelled_by', type: 'enum', enum: CancellerType, nullable: true })
  cancelledBy: CancellerType;

  @Column({ name: 'cancelled_at', type: 'timestamp', nullable: true })
  cancelledAt: Date;

  @Column({ name: 'refund_amount', type: 'int', default: 0 })
  refundAmount: number;

  @OneToMany(() => Review, (review) => review.order)
  reviews: Review[];

  @OneToMany(() => CustomerReport, (report) => report.order)
  reports: CustomerReport[];
}

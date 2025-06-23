import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany, Index } from 'typeorm';
import { Customer } from '../../customer/customer.entity';
import { SurpriseBox } from '../../surprise-box/surprise_box.entity';
import { Store } from '../../store/entities/store.entity';
import { Review } from '../../review/review.entity';
import { CustomerReport } from '../../customer-report/customer-report.entity';

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
@Index("idx_order_customer_id", ["customer_id"])
@Index("idx_order_store_id", ["store_id"])
@Index("idx_order_status", ["status"])
@Index("idx_order_date", ["order_date"])
export class Order {
  @PrimaryGeneratedColumn({type:'bigint'})
  id: number;

  @Column('bigint')
  customer_id: number;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @Column('bigint')
  surprise_box_id: number;

  @ManyToOne(() => SurpriseBox, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'surprise_box_id' })
  surpriseBox: SurpriseBox;

  @Column('bigint')
  store_id: number;

  @ManyToOne(() => Store, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: PaymentType
  })
  payment_type: PaymentType;

  @Column({
    type: 'enum',
    enum: FulfillmentType
  })
  fulfillment_type: FulfillmentType;

  @Column()
  pickup_code: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  order_date: Date;

  @Column({
    type: 'timestamp',
    nullable: true
  })
  pickuped_at: Date | null;

  @Column({
    type: 'enum',
    enum: CancellerType,
    nullable: true
  })
  cancelled_by: CancellerType | null;

  @Column({
    type: 'timestamp',
    nullable: true
  })
  cancelled_at: Date | null;

  @Column({
    default: 0
  })
  refund_amount: number;

  @OneToMany(() => Review, (review) => review.order)
  reviews: Review[];

  @OneToMany(() => CustomerReport, (report) => report.order)
  reports: CustomerReport[];
}


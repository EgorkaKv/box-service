import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Order } from './order.entity';

// Enum для статуса платежа
export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded'
}

// Enum для метода оплаты
export enum PaymentMethod {
  CARD = 'card',
  DIGITAL_WALLET = 'digital_wallet',
  CASH = 'cash',
  APP = 'app'
}

@Entity('payment')
export class Payment {
  @PrimaryGeneratedColumn('bigint')
  id: number;

  @Column({ name: 'order_id', type: 'bigint' })
  orderId: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({
    name: 'payment_method',
    type: 'enum',
    enum: PaymentMethod
  })
  paymentMethod: PaymentMethod;

  @Column({ type: 'int' })
  amount: number;

  @Column({ default: 'UAH' })
  currency: string;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  paymentStatus: PaymentStatus;

  @Column({ name: 'transaction_id', nullable: true })
  transactionId: string;

  @Column({ name: 'payment_gateway', nullable: true })
  paymentGateway: string;

  @Column({ name: 'payment_date', type: 'timestamp' })
  paymentDate: Date;

  @Column({ name: 'refund_date', type: 'timestamp', nullable: true })
  refundDate: Date;

  @Column({ name: 'refund_amount', type: 'int', default: 0 })
  refundAmount: number;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;
}

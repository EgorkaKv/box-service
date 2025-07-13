import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Order } from './order.entity';

export enum DeliveryStatus {
  PENDING_ASSIGNMENT = 'pending_assignment',
  ASSIGNED = 'assigned',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  RETURNED = 'returned'
}

@Entity('delivery')
export class Delivery {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column('bigint', { name: 'order_id', unique: true })
  orderId: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({
    name: 'status',
    type: 'text',
    default: DeliveryStatus.PENDING_ASSIGNMENT
  })
  status: DeliveryStatus;

  @Column({ name: 'delivery_service', type: 'text' })
  deliveryService: string;

  @Column({ name: 'delivery_address', type: 'text' })
  deliveryAddress: string;

  @Column({ name: 'estimated_delivery_at', type: 'timestamp', nullable: true })
  estimatedDeliveryAt: Date;

  @Column({ name: 'delivered_at', type: 'timestamp', nullable: true })
  deliveredAt: Date;

  @Column({ name: 'courier_name', type: 'text', nullable: true })
  courierName: string;

  @Column({ name: 'courier_phone', type: 'text', nullable: true })
  courierPhone: string;

  @Column({ name: 'tracking_code', type: 'text', nullable: true })
  trackingCode: string;

  @Column({ name: 'delivery_fee', type: 'int', default: 0 })
  deliveryFee: number;

  @Column({ name: 'delivery_notes', type: 'text', nullable: true })
  deliveryNotes: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}

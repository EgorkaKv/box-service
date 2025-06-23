import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Order } from '../order/entities/order.entity';

@Entity('review')
@Index("idx_review_order_id", ["orderId"])
@Index("idx_review_rating", ["rating"])
export class Review {
  @PrimaryGeneratedColumn({type:'bigint'})
  id: number;

  @Column('bigint', { name: 'order_id' })
  orderId: number;

  @ManyToOne(() => Order, (order) => order.reviews, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({type:'smallint',
    check: 'rating >= 1 AND rating <= 5' 
  })
  rating: number;

  @Column({ name: 'review_comment', type: 'text', nullable: true })
  reviewComment: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column('boolean', { name: 'is_approved', default: true })
  isApproved: boolean;
}

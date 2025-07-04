import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Store } from '@store/entities/store.entity';
import { Category } from '@category/entities/category.entity';

@Entity('box_template')
@Index("idx_box_template_store_active", ["storeId", "isActive"], { where: "is_active = TRUE" })
export class BoxTemplate {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: number;

  @Column({ name: 'store_id', type: 'bigint' })
  storeId: number;

  @Column({ name: 'category_id', type: 'bigint' })
  categoryId: number;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ name: 'template_name', type: 'text' })
  templateName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'original_price', type: 'int' })
  originalPrice: number;

  @Column({ name: 'discounted_price', type: 'int' })
  discountedPrice: number;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string;

  @Column({ name: 'pickup_start_time', type: 'timestamp' })
  pickupStartTime: Date;

  @Column({ name: 'pickup_end_time', type: 'timestamp' })
  pickupEndTime: Date;

  @Column({ name: 'sale_start_time', type: 'timestamp' })
  saleStartTime: Date;

  @Column({ name: 'sale_end_time', type: 'timestamp' })
  saleEndTime: Date;

  @Column({ name: 'usage_count', type: 'integer', default: 0 })
  usageCount: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

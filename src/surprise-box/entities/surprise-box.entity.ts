import { Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, Index, OneToMany } from 'typeorm';
import { BoxTemplate } from '@box-template/entities/box-template.entity';
import { Store } from '@store/entities/store.entity';
import { Category } from '@category/entities/category.entity';
import { Customer } from '@customer/entities/customer.entity';
import { Order } from '@order/entities/order.entity';

export enum BoxStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  RESERVED = 'reserved',
  SOLD = 'sold',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled'
}

@Entity('surprise_box')
@Index("idx_surprise_box_geo_active", ["storeLocation"], {
  where: "status IN ('active')",
  spatial: true // Для геопространственных индексов
})
@Index("idx_surprise_box_city_status", ["storeCity", "status"], { where: "status IN ('active')" })
@Index("idx_surprise_box_store_id", ["storeId", "status"])
@Index("idx_surprise_box_reserved_by", ["id", "reservedBy"], { unique: true, where: "status = 'reserved' AND reserved_by IS NOT NULL" })
export class SurpriseBox {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  // Связи с другими таблицами
  @Column({ name: 'box_template_id', type: 'bigint' })
  boxTemplateId: number;

  @ManyToOne(() => BoxTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'box_template_id' })
  boxTemplate: BoxTemplate;

  @Column({ name: 'store_id', type: 'bigint' })
  storeId: number;

  @ManyToOne(() => Store, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({ name: 'category_id', type: 'bigint' })
  categoryId: number;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  // Денормализованные данные магазина
  @Column({ name: 'business_name', type: 'text' })
  businessName: string;

  @Column({ name: 'store_address', type: 'text' })
  storeAddress: string;

  @Column({ name: 'store_city', type: 'text' })
  storeCity: string;

  @Column({ name: 'store_location', type: 'geometry', spatialFeatureType: 'Point', srid: 4326 })
  storeLocation: object;

  // Данные из шаблона
  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'category_name', type: 'text', nullable: true })
  categoryName: string;

  @Column({ name: 'original_price', type: 'int' })
  originalPrice: number;

  @Column({ name: 'discounted_price', type: 'int' })
  discountedPrice: number;

  @Column({ name: 'image_url', type: 'text', nullable: true })
  imageUrl: string;

  // Временные ограничения
  @Column({ name: 'pickup_start_time', type: 'timestamp' })
  pickupStartTime: Date;

  @Column({ name: 'pickup_end_time', type: 'timestamp' })
  pickupEndTime: Date;

  @Column({ name: 'sale_start_time', type: 'timestamp' })
  saleStartTime: Date;

  @Column({ name: 'sale_end_time', type: 'timestamp' })
  saleEndTime: Date;

  @Column({ name: 'status', type: 'enum', enum: BoxStatus, default: BoxStatus.DRAFT })
  status: BoxStatus;

  @Column({ name: 'reserved_by', type: 'bigint', nullable: true })
  reservedBy: number;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'reserved_by' })
  reservedByCustomer: Customer;

  @Column({ name: 'reserved_at', type: 'timestamp', nullable: true })
  reservedAt: Date;

  @Column({ name: 'reservation_expires_at', type: 'timestamp', nullable: true })
  reservationExpiresAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => Order, (order) => order.surpriseBox)
  orders: Order[];
}

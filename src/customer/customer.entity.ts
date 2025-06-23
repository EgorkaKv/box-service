import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// Определяем enum для гендера
export enum CustomerGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other'
}

@Entity('customer')
export class Customer {
  @PrimaryGeneratedColumn({type:"bigint"})
  id: number;

  @Column({ name: 'firebase_uid', type: 'text', unique: true, nullable: true })
  firebaseUid: string;

  @Column({ type: 'text', unique: true, nullable: true })
  email: string;

  @Column({ name: 'customer_name', type: 'text' })
  customerName: string;

  @Column({ type: 'text', unique: true, nullable: true })
  phone: string;

  @Column({
    type: 'enum',
    enum: CustomerGender,
    enumName: 'customer_gender',
    nullable: true
  })
  gender: CustomerGender;

  @Column({ name: 'profile_image_url', type: 'text', nullable: true })
  profileImageUrl: string;

  @CreateDateColumn({ name: 'registration_date', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  registrationDate: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin: Date;

  @Column({ name: 'push_notifications_enabled', type: 'boolean', default: true })
  pushNotificationsEnabled: boolean;

  @Column({ name: 'email_notifications_enabled', type: 'boolean', default: true })
  emailNotificationsEnabled: boolean;
}

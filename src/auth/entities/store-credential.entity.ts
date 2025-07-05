import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne,
  CreateDateColumn, UpdateDateColumn, Unique, JoinColumn
} from 'typeorm';
import { Store } from '@store/entities/store.entity';

export enum EmployeeRole {
  STAFF = 'staff',
  MANAGER = 'manager',
}

@Entity()
@Unique(['store', 'employeeRole'])
export class StoreCredential {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Store, (store) => store.credentials, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'store_id' })
  store: Store;

  @Column({
    name: 'employee_role',
    type: 'enum',
    enum: EmployeeRole,
  })
  employeeRole: EmployeeRole;

  @Column({ name: 'login', type: 'text', unique: true })
  login: string;

  @Column({ name: 'password_hash', type: 'text' })
  passwordHash: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'last_login', type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @Column({ name: 'login_attempts', type: 'integer', default: 0 })
  loginAttempts: number;

  @Column({ name: 'last_failed_login', type: 'timestamp', nullable: true })
  lastFailedLogin?: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt?: Date;
}

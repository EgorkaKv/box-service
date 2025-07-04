import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { BoxTemplate } from '@box-template/entities/box-template.entity';
import { SurpriseBox } from '@surprise-box/entities/surprise-box.entity'

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'icon_url', type: 'text', nullable: true })
  iconUrl: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder: number;

  @OneToMany(() => BoxTemplate, (boxTemplate) => boxTemplate.category)
  boxTemplates: BoxTemplate[];

  @OneToMany(() => SurpriseBox, (surpriseBox) => surpriseBox.category)
  surpriseBoxes: SurpriseBox[];
}

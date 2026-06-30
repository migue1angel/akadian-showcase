import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Unit } from './unit.entity';

@Entity({ name: 'unit_classes' })
export class UnitClass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'unit_id', type: 'uuid', nullable: false })
  unitId: string;

  @ManyToOne(() => Unit, (unit) => unit.unitClasses, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'unit_id' })
  unit: Unit;

  @Column({ name: 'class_number', type: 'integer', nullable: false })
  classNumber: number;

  @Column({ name: 'name', type: 'text', nullable: false })
  name: string;

  @Column({ name: 'type', type: 'text', nullable: false })
  type: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}

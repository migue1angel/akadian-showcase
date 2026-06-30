import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Program } from './program.entity';
import { UnitClass } from './unit-class.entity';

@Entity({ name: 'units' })
export class Unit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'program_id', type: 'uuid', nullable: false })
  programId: string;

  @ManyToOne(() => Program, (program) => program.units, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'program_id' })
  program: Program;

  @Column({ name: 'unit_number', type: 'integer', nullable: false })
  unitNumber: number;

  @Column({ name: 'name', type: 'text', nullable: false })
  name: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @OneToMany(() => UnitClass, (unitClass) => unitClass.unit)
  unitClasses: UnitClass[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;
}

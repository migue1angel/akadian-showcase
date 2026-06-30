import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';
import { UserError } from '../errors/user.errors';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'email', type: 'text', unique: true, nullable: false })
  email: string;

  @Column({ name: 'password_hash', type: 'text', nullable: false })
  passwordHash: string;

  @Column({ name: 'first_name', type: 'text', nullable: false })
  firstName: string;

  @Column({ name: 'last_name', type: 'text', nullable: false })
  lastName: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'email_verified', type: 'boolean', default: true })
  emailVerified: boolean;

  @ManyToMany(() => Role, (role) => role.users, { cascade: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt: Date;

  verifyIsActive(): void {
    if (!this.isActive) throw UserError.Inactive();
    if (this.deletedAt) throw UserError.Deleted();
  }
}

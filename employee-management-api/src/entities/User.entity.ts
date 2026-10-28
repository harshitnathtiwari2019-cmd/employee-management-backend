import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";

import { Role } from "./Role.entity.js";

@Entity({ name: "users" })
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ name: "password_hash", type: "varchar", length: 255 })
  passwordHash!: string;

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean;

  @ManyToOne(() => Role, { nullable: false })
  @JoinColumn({ name: "role_id" })
  role!: Role;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from "typeorm";

import { Department } from "./Department.entity.js";
import { User } from "./User.entity.js";

@Entity({ name: "employees" })
export class Employee {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  firstName!: string;

  @Column({ type: "varchar", length: 100 })
  lastName!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "varchar", length: 100 })
  jobTitle!: string;

  @Column({ type: "date" })
  joiningDate!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  profilePhoto!: string | null;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "varchar", length: 20, nullable: true })
  mobile!: string | null;

  @ManyToOne(() => Department, { nullable: false })
  @JoinColumn({ name: "department_id" })
  department!: Department;

  @OneToOne(() => User, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

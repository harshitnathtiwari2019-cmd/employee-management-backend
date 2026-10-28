import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";

import { User } from "./User.entity.js";

@Entity({ name: "audit_logs" })
@Index("IDX_audit_logs_user_id", ["user"])
@Index("IDX_audit_logs_created_at", ["createdAt"])
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, {
    nullable: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "user_id" })
  user!: User | null;

  @Column({ type: "varchar", length: 100 })
  action!: string;

  @Column({ name: "resource_type", type: "varchar", length: 100 })
  resourceType!: string;

  @Column({ name: "resource_id", type: "uuid", nullable: true })
  resourceId!: string | null;

  @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  CreateDateColumn,
} from "typeorm";

import { Role } from "./Role.entity.js";
import { Permission } from "./Permission.entity.js";

@Entity({ name: "role_permissions" })
@Unique("UQ_role_permission", ["role", "permission"])
export class RolePermission {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => Role, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "role_id" })
  role!: Role;

  @ManyToOne(() => Permission, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "permission_id" })
  permission!: Permission;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}

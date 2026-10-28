import type { EntityManager } from "typeorm";
import { AppDataSource } from "../config/database.js";
import { AuditLog } from "../entities/AuditLog.entity.js";
import { User } from "../entities/User.entity.js";

export interface CreateAuditLogInput {
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  metadata?: Record<string, unknown> | null;
}

export class AuditLogService {
  public async record(
    input: CreateAuditLogInput,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(AuditLog)
      : AppDataSource.getRepository(AuditLog);

    const auditLog = new AuditLog();

    if (input.userId) {
      auditLog.user = { id: input.userId } as User;
    } else {
      auditLog.user = null;
    }

    auditLog.action = input.action;
    auditLog.resourceType = input.resourceType;
    auditLog.resourceId = input.resourceId ?? null;
    auditLog.ipAddress = input.ipAddress ?? null;
    auditLog.metadata = input.metadata ?? null;

    await repository.save(auditLog);
  }
}

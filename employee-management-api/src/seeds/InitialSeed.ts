import { DataSource } from "typeorm";

import { Role } from "../entities/Role.entity.js";
import { Permission } from "../entities/Permission.entity.js";
import { RolePermission } from "../entities/RolePermission.entity.js";

export class InitialSeed {
  public async run(dataSource: DataSource): Promise<void> {
    await dataSource.transaction(async (manager) => {
      const roleRepository = manager.getRepository(Role);
      const permissionRepository = manager.getRepository(Permission);
      const rolePermissionRepository = manager.getRepository(RolePermission);

      const roleDefinitions = [
        { name: "Admin", description: "System administrator" },
        { name: "HR", description: "Human resources operations" },
        { name: "Manager", description: "Manages permitted employees" },
        { name: "Employee", description: "Standard employee access" },
      ];

      const permissionDefinitions = [
        "employee:create",
        "employee:read",
        "employee:update",
        "employee:delete",
        "department:create",
        "department:read",
        "department:update",
        "department:delete",
      ];

      const roles = new Map<string, Role>();
      const permissions = new Map<string, Permission>();

      for (const definition of roleDefinitions) {
        let role = await roleRepository.findOneBy({
          name: definition.name,
        });

        if (!role) {
          role = roleRepository.create(definition);
          role = await roleRepository.save(role);
        }

        roles.set(role.name, role);
      }

      for (const name of permissionDefinitions) {
        let permission = await permissionRepository.findOneBy({ name });

        if (!permission) {
          permission = permissionRepository.create({ name });
          permission = await permissionRepository.save(permission);
        }

        permissions.set(permission.name, permission);
      }

      const rolePermissions: Record<string, string[]> = {
        Admin: permissionDefinitions,
        HR: [
          "employee:create",
          "employee:read",
          "employee:update",
          "department:read",
        ],
        Manager: ["employee:read", "department:read"],
        Employee: ["employee:read"],
      };

      for (const [roleName, permissionNames] of Object.entries(
        rolePermissions,
      )) {
        const role = roles.get(roleName);

        if (!role) {
          throw new Error(`Role not found: ${roleName}`);
        }

        for (const permissionName of permissionNames) {
          const permission = permissions.get(permissionName);

          if (!permission) {
            throw new Error(`Permission not found: ${permissionName}`);
          }

          const existingMapping = await rolePermissionRepository.findOne({
            where: {
              role: { id: role.id },
              permission: { id: permission.id },
            },
          });

          if (!existingMapping) {
            await rolePermissionRepository.save(
              rolePermissionRepository.create({ role, permission }),
            );
          }
        }
      }
    });
  }
}

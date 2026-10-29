import type { Employee } from "../entities/Employee.entity.js";

export function toEmployeeResponse(employee: Employee) {
  return {
    id: employee.id,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    jobTitle: employee.jobTitle,
    joiningDate: employee.joiningDate,
    isActive: employee.isActive,
    profilePhoto: employee.profilePhoto,
    department: employee.department
      ? {
          id: employee.department.id,
          name: employee.department.name,
        }
      : null,
    createdAt: employee.createdAt,
    updatedAt: employee.updatedAt,
  };
}

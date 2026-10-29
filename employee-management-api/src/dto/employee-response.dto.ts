import type { Employee } from "../entities/Employee.entity.js";

export class EmployeeResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobTitle: string;
  joiningDate: string;
  isActive: boolean;
  profilePhoto: string | null;

  department: {
    id: string;
    name: string;
  } | null;

  createdAt: Date;
  updatedAt: Date;

  constructor(employee: Employee) {
    this.id = employee.id;
    this.firstName = employee.firstName;
    this.lastName = employee.lastName;
    this.email = employee.email;
    this.jobTitle = employee.jobTitle;
    this.joiningDate = String(employee.joiningDate);
    this.isActive = employee.isActive;
    this.profilePhoto = employee.profilePhoto;

    this.department = employee.department
      ? {
          id: employee.department.id,
          name: employee.department.name,
        }
      : null;

    this.createdAt = employee.createdAt;
    this.updatedAt = employee.updatedAt;
  }
}

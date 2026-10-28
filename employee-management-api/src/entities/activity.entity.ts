import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "activity" })
export class Activity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "employee_id", type: "uuid" })
  employeeId!: string;

  @Column({ type: "text" })
  description!: string;
}

import bcrypt from "bcrypt";

export class PasswordService {
  private readonly saltRounds = 12;

  public async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  public async comparePassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, passwordHash);
  }
}

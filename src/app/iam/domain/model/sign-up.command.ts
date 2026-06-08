/**
 * Domain command for IAM user registration.
 */
export class SignUpCommand {
  constructor(
    public readonly username: string,
    public readonly password: string,
    public readonly roles: string[],
  ) {}
}

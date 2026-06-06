/**
 * Domain command carrying credentials for IAM authentication.
 */
export class SignInCommand {
  private _username: string;
  private _password: string;

  get username(): string {
    return this._username;
  }

  set username(value: string) {
    this._username = value;
  }

  get password(): string {
    return this._password;
  }

  set password(value: string) {
    this._password = value;
  }

  constructor(props: { username: string; password: string }) {
    this._username = props.username;
    this._password = props.password;
  }
}

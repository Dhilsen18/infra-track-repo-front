import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type UserRole = 'admin' | 'owner' | 'technician';

/**
 * Domain entity representing an account in the IAM bounded context.
 */
export class User implements BaseEntity {
  private _id: number;
  private _username: string;
  private _role: UserRole;

  get id(): number {
    return this._id;
  }

  set id(value: number) {
    this._id = value;
  }

  get username(): string {
    return this._username;
  }

  set username(value: string) {
    this._username = value;
  }

  get role(): UserRole {
    return this._role;
  }

  set role(value: UserRole) {
    this._role = value;
  }

  constructor(props: { id: number; username: string; role?: UserRole }) {
    this._id = props.id;
    this._username = props.username;
    this._role = props.role ?? 'admin';
  }
}

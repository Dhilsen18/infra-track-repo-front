import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignUpCommand } from '../domain/model/sign-up.command';
import { SignInApiEndpoint } from './sign-in-api-endpoint';
import { SignInAssembler } from './sign-in-assembler';
import { SignInResource } from './sign-in-response';
import { SignUpApiEndpoint } from './sign-up-api-endpoint';
import { SignUpAssembler } from './sign-up-assembler';
import { SignUpResource } from './sign-up-response';

/**
 * Infrastructure facade that exposes IAM endpoint operations.
 */
@Injectable({ providedIn: 'root' })
export class IamApi extends BaseApi {
  private readonly signInEndpoint: SignInApiEndpoint;
  private readonly signUpEndpoint: SignUpApiEndpoint;

  constructor(http: HttpClient) {
    super();
    const signInAssembler = new SignInAssembler();
    const signUpAssembler = new SignUpAssembler();
    this.signInEndpoint = new SignInApiEndpoint(http, signInAssembler);
    this.signUpEndpoint = new SignUpApiEndpoint(http, signUpAssembler);
  }

  signIn(signInCommand: SignInCommand): Observable<SignInResource> {
    return this.signInEndpoint.signIn(signInCommand);
  }

  signUp(signUpCommand: SignUpCommand): Observable<SignUpResource> {
    return this.signUpEndpoint.signUp(signUpCommand);
  }
}

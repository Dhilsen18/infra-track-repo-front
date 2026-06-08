import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';

import { UserRole } from '../domain/model/user.entity';
import { SignInCommand } from '../domain/model/sign-in.command';
import { SignUpCommand } from '../domain/model/sign-up.command';
import { IamApi } from '../infrastructure/iam-api';
import { SignInResource } from '../infrastructure/sign-in-response';

const SESSION_KEY = 'infratrack_session';
const PREVIEW_KEY = 'infratrack_preview_user_id';
const TOKEN_KEY = 'token';

export interface IamSession {
  username: string;
  userId: number;
  loggedInAt: number;
  role: 'owner' | 'admin';
}

export function assignRandomPreviewUserId(): void {
  try {
    const id = Math.floor(Math.random() * 7) + 1;
    localStorage.setItem(PREVIEW_KEY, String(id));
  } catch {
    /* ignore */
  }
}

export function seedPreviewProfileUserId(): void {
  try {
    if (!sessionStorage.getItem(SESSION_KEY) && localStorage.getItem(PREVIEW_KEY) == null) {
      assignRandomPreviewUserId();
    }
  } catch {
    /* ignore */
  }
}

@Injectable({ providedIn: 'root' })
export class IamStore {
  private readonly session = signal<IamSession | null>(this.readSession());
  private readonly authBusySignal = signal(false);

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly isSignedIn = this.isAuthenticated;
  readonly authBusy = this.authBusySignal.asReadonly();
  readonly username = computed(() => this.session()?.username ?? null);
  readonly role = computed(() => this.session()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'admin');
  readonly isOwner = computed(() => this.role() === 'owner');
  readonly sessionData = computed(() => this.session());
  readonly currentToken = computed(() =>
    this.isSignedIn() ? localStorage.getItem(TOKEN_KEY) : null,
  );

  constructor(private readonly iamApi: IamApi) {}

  signIn(
    signInCommand: SignInCommand,
    router: Router,
    options?: { expectedRole?: 'owner' | 'admin'; onError?: (reason?: 'auth' | 'wrongEntity') => void },
  ): void {
    this.authBusySignal.set(true);
    this.iamApi.signIn(signInCommand).subscribe({
      next: (resource) => {
        this.authBusySignal.set(false);
        const role = this.resolveRole(resource.role);
        if (options?.expectedRole && role !== options.expectedRole) {
          this.clearSession(false);
          options.onError?.('wrongEntity');
          return;
        }
        this.applySignIn(resource, role);
        void router.navigateByUrl(this.homeUrlForRole(role));
      },
      error: () => {
        this.authBusySignal.set(false);
        this.clearSession(false);
        options?.onError?.('auth');
      },
    });
  }

  signUpThenSignIn(
    username: string,
    password: string,
    roles: string[],
    router: Router,
    options?: {
      expectedRole?: 'owner' | 'admin';
      afterAuth?: (resource: SignInResource) => Observable<void>;
    },
  ): Observable<boolean> {
    const trimmed = username.trim();
    this.authBusySignal.set(true);
    return this.iamApi.signUp(new SignUpCommand(trimmed, password, roles)).pipe(
      catchError(() => of(null)),
      switchMap(() => this.iamApi.signIn(new SignInCommand({ username: trimmed, password }))),
      switchMap((resource) => {
        const role = this.resolveRole(resource.role);
        if (options?.expectedRole && role !== options.expectedRole) {
          this.authBusySignal.set(false);
          this.clearSession(false);
          return of(false);
        }
        // Token must exist before afterAuth (e.g. POST /operators, POST /worksites/staff).
        this.applySignIn(resource, role);
        const provision = options?.afterAuth
          ? options.afterAuth(resource).pipe(
              map(() => true),
              catchError(() => of(false)),
            )
          : of(true);
        return provision.pipe(
          tap((ok) => {
            this.authBusySignal.set(false);
            if (!ok) {
              this.clearSession(true);
              return;
            }
            void router.navigateByUrl(this.homeUrlForRole(role));
          }),
        );
      }),
      catchError(() => {
        this.authBusySignal.set(false);
        this.clearSession(false);
        return of(false);
      }),
    );
  }

  signOut(router: Router): void {
    this.clearSession(true);
    assignRandomPreviewUserId();
    void router.navigateByUrl('/iam/sign-in');
  }

  logout(): void {
    this.clearSession(true);
    assignRandomPreviewUserId();
  }

  private applySignIn(resource: SignInResource, role: 'owner' | 'admin'): void {
    localStorage.setItem(TOKEN_KEY, resource.token);
    this.persistSession(resource.username, resource.id, role);
  }

  private homeUrlForRole(role: 'owner' | 'admin'): string {
    return role === 'owner' ? '/control-panel' : '/operacion';
  }

  private persistSession(username: string, userId: number, role: 'owner' | 'admin'): void {
    const payload: IamSession = { username, userId, loggedInAt: Date.now(), role };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
    this.session.set(payload);
    localStorage.removeItem(PREVIEW_KEY);
  }

  private clearSession(removeToken: boolean): void {
    sessionStorage.removeItem(SESSION_KEY);
    this.session.set(null);
    if (removeToken) {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  private resolveRole(raw?: string): 'owner' | 'admin' {
    if (raw === 'owner' || raw === 'admin') {
      return raw;
    }
    if (raw === 'ROLE_OWNER') {
      return 'owner';
    }
    if (raw === 'ROLE_ADMIN') {
      return 'admin';
    }
    return 'admin';
  }

  private readSession(): IamSession | null {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as Partial<IamSession> & { username?: string; role?: string };
      if (!parsed.username) {
        return null;
      }
      const userId =
        typeof parsed.userId === 'number' && Number.isFinite(parsed.userId) ? parsed.userId : 1;
      const role = parsed.role === 'owner' || parsed.role === 'admin' ? parsed.role : 'admin';
      return {
        username: parsed.username,
        userId,
        loggedInAt: typeof parsed.loggedInAt === 'number' ? parsed.loggedInAt : Date.now(),
        role: role as 'owner' | 'admin',
      };
    } catch {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
  }
}

/** @deprecated Use {@link UserRole} from the domain entity. */
export type { UserRole };

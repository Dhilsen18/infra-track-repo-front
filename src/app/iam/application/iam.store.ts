import { computed, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { UserRole } from '../domain/model/user.entity';
import { SignInCommand } from '../domain/model/sign-in.command';
import { IamApi } from '../infrastructure/iam-api';

const SESSION_KEY = 'infratrack_session';
const PREVIEW_KEY = 'infratrack_preview_user_id';
const TOKEN_KEY = 'token';

export interface IamSession {
  username: string;
  userId: number;
  loggedInAt: number;
  role: 'owner' | 'admin';
}

/** Random MockAPI user id (1–7) for toolbar preview when there is no IAM session. */
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

/**
 * Application-layer store that orchestrates IAM authentication use cases.
 */
@Injectable({ providedIn: 'root' })
export class IamStore {
  private readonly session = signal<IamSession | null>(this.readSession());

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly isSignedIn = this.isAuthenticated;
  readonly username = computed(() => this.session()?.username ?? null);
  readonly role = computed(() => this.session()?.role ?? null);
  readonly isAdmin = computed(() => this.role() === 'admin');
  readonly isOwner = computed(() => this.role() === 'owner');
  readonly sessionData = computed(() => this.session());
  readonly currentToken = computed(() =>
    this.isSignedIn() ? localStorage.getItem(TOKEN_KEY) : null,
  );

  constructor(private readonly iamApi: IamApi) {}

  /**
   * Executes sign-in through the IAM API and updates authentication state.
   */
  signIn(signInCommand: SignInCommand, router: Router): void {
    this.iamApi.signIn(signInCommand).subscribe({
      next: (signInResource) => {
        localStorage.setItem(TOKEN_KEY, signInResource.token);
        const role = this.resolveRole(signInResource.role);
        this.persistSession(signInResource.username, signInResource.id, role);
        void router.navigateByUrl('/control-panel');
      },
      error: () => {
        this.clearSession(false);
        void router.navigateByUrl('/iam/sign-in');
      },
    });
  }

  /** Demo login used while MockAPI IAM endpoints are not fully wired. */
  simulateLogin(
    username: string,
    _password: string,
    userId = 1,
    role: 'owner' | 'admin' = 'admin',
  ): boolean {
    const trimmed = username.trim();
    if (!trimmed) {
      return false;
    }
    this.persistSession(trimmed, userId, role);
    return true;
  }

  login(username: string, password: string, userId = 1, role: 'owner' | 'admin' = 'admin'): boolean {
    return this.simulateLogin(username, password, userId, role);
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

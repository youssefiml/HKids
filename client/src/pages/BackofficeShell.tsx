import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  getBackofficeMe,
  loginBackoffice,
  logoutBackoffice,
} from "../api/backofficeApi";
import type { AuthUser } from "../api/backofficeApi";
import PlatformLogo from "../components/PlatformLogo";
import AdminStoryBackoffice from "./AdminStoryBackoffice";

import "../styles/pages/BackofficeShell.css";

const TOKEN_STORAGE_KEY = "hkids_backoffice_token";

function BackofficeShell() {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "admin@hkids.com", password: "admin123" });

  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // ignore localStorage issues
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    const loadMe = async () => {
      if (!token) {
        setUser(null);
        return;
      }

      setAuthLoading(true);
      setAuthError(null);
      try {
        const me = await getBackofficeMe(token);
        if (!cancelled) {
          setUser(me);
        }
      } catch (error) {
        if (!cancelled) {
          setUser(null);
          setToken(null);
          setAuthError(error instanceof Error ? error.message : "Session expired.");
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    void loadMe();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const result = await loginBackoffice(loginForm.email, loginForm.password);
      setToken(result.token);
      setUser(result.user);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (token) {
        await logoutBackoffice(token);
      }
    } catch {
      // no-op for POC
    } finally {
      setToken(null);
      setUser(null);
    }
  };

  const isLoggedIn = Boolean(token && user);
  const isRestoringSession = Boolean(token) && authLoading && !user;

  return (
    <main className={isLoggedIn ? "backoffice-app" : "admin-auth-page"}>
      {isLoggedIn ? (
        <>
          <header className="backoffice-header">
            <div>
              <div className="admin-brand-row">
                <PlatformLogo className="admin-brand-logo" />
                <p className="hero-label">HKids Backoffice</p>
              </div>
              <h1>Admin Story Management</h1>
            </div>
            <div className="session-chip">
              <span>{user?.name}</span>
              <small>{user?.role}</small>
              <button type="button" className="ghost-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </header>

          {user?.role === "admin" ? (
            <AdminStoryBackoffice token={token!} />
          ) : (
            <section className="state-card error">
              This area is restricted. Only admins can create, edit, reorder, or publish stories.
            </section>
          )}
        </>
      ) : (
        <section className="admin-auth-layout">
          <article className="admin-auth-card">
            <div className="admin-auth-content">
              <h1>Sign in</h1>
              <p>Manage stories, pages, and publishing from one secure place.</p>
              <form className="admin-auth-form" onSubmit={handleLogin}>
                <label htmlFor="admin-email">Email</label>
                <input
                  id="admin-email"
                  type="email"
                  value={loginForm.email}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, email: event.target.value }))
                  }
                  placeholder="admin@hkids.com"
                  autoComplete="email"
                  required
                />

                <label htmlFor="admin-password">Password</label>
                <input
                  id="admin-password"
                  type="password"
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({ ...current, password: event.target.value }))
                  }
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                />

                <button type="submit" className="admin-auth-submit" disabled={authLoading}>
                  {authLoading ? "Signing in..." : "Log in"}
                </button>
              </form>

              {authError && <p className="admin-auth-error">{authError}</p>}
              {!authError && isRestoringSession && (
                <p className="admin-auth-note">Restoring your session...</p>
              )}
            </div>
          </article>

          <aside className="admin-auth-brand" aria-label="HKids branding panel">
            <div>
              <PlatformLogo className="admin-auth-logo" />
              <p className="brand-kicker">HKids</p>
              <h2>Admin Portal</h2>
              <p>Single entrypoint at /admin for the full backoffice flow.</p>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}

export default BackofficeShell;

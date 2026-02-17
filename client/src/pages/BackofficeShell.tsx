import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import {
  getBackofficeMe,
  loginBackoffice,
  logoutBackoffice,
} from "../api/backofficeApi";
import type { AuthUser } from "../api/backofficeApi";
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

  return (
    <main className="backoffice-app">
      <header className="backoffice-header">
        <div>
          <p className="hero-label">HKids Backoffice</p>
          <h1>Admin Story Management</h1>
        </div>
        {user && (
          <div className="session-chip">
            <span>{user.name}</span>
            <small>{user.role}</small>
            <button type="button" className="ghost-button" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </header>

      {!token || !user ? (
        <section className="auth-card">
          <h2>Login</h2>
          <p>Sign in with your admin account to manage stories and pages.</p>
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, email: event.target.value }))
                }
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((current) => ({ ...current, password: event.target.value }))
                }
                required
              />
            </label>
            <button type="submit" className="read-button" disabled={authLoading}>
              {authLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          {authError && <p className="error-text">{authError}</p>}
        </section>
      ) : user.role === "admin" ? (
        <AdminStoryBackoffice token={token} />
      ) : (
        <section className="state-card error">
          This area is restricted. Only admins can create, edit, reorder, or publish stories.
        </section>
      )}
    </main>
  );
}

export default BackofficeShell;
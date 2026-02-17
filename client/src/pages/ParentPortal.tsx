import "../styles/pages/ParentPortal.css";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  getParentMe,
  getParentWeeklyDigest,
  listParentChildren,
  loginParent,
} from "../api/parentApi";
import type {
  ParentAccount,
  ParentChildProfile,
  ParentWeeklyDigest,
  ParentWeeklyDigestChild,
} from "../api/parentApi";

const PARENT_TOKEN_STORAGE_KEY = "hkids_parent_token";

const trendLabelMap: Record<ParentWeeklyDigestChild["trend"], string> = {
  up: "Trending Up",
  down: "Needs Support",
  steady: "Steady",
};

const trendClassMap: Record<ParentWeeklyDigestChild["trend"], string> = {
  up: "up",
  down: "down",
  steady: "steady",
};

function ParentPortal() {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(PARENT_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [parent, setParent] = useState<ParentAccount | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "parent1@hkids.com", password: "Parent1234" });

  const [children, setChildren] = useState<ParentChildProfile[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [childrenError, setChildrenError] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");

  const [digest, setDigest] = useState<ParentWeeklyDigest | null>(null);
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestError, setDigestError] = useState<string | null>(null);
  const [reloadSignal, setReloadSignal] = useState(0);

  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem(PARENT_TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(PARENT_TOKEN_STORAGE_KEY);
      }
    } catch {
      // ignore localStorage errors in non-browser contexts
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (!token) {
        setParent(null);
        return;
      }

      setAuthLoading(true);
      setAuthError(null);
      try {
        const me = await getParentMe(token);
        if (!cancelled) {
          setParent(me);
        }
      } catch (error) {
        if (!cancelled) {
          setParent(null);
          setToken(null);
          setAuthError(error instanceof Error ? error.message : "Parent session expired.");
        }
      } finally {
        if (!cancelled) {
          setAuthLoading(false);
        }
      }
    };

    void loadSession();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const loadChildren = useCallback(async () => {
    if (!token || !parent) {
      setChildren([]);
      return;
    }

    setChildrenLoading(true);
    setChildrenError(null);
    try {
      const result = await listParentChildren(token);
      setChildren(result);
    } catch (error) {
      setChildren([]);
      setChildrenError(error instanceof Error ? error.message : "Could not load children.");
    } finally {
      setChildrenLoading(false);
    }
  }, [token, parent]);

  const loadDigest = useCallback(async () => {
    if (!token || !parent) {
      setDigest(null);
      return;
    }

    setDigestLoading(true);
    setDigestError(null);
    try {
      const result = await getParentWeeklyDigest(
        token,
        selectedChildId === "all" ? undefined : selectedChildId
      );
      setDigest(result);
    } catch (error) {
      setDigest(null);
      setDigestError(error instanceof Error ? error.message : "Could not load weekly digest.");
    } finally {
      setDigestLoading(false);
    }
  }, [token, parent, selectedChildId]);

  useEffect(() => {
    if (!token || !parent) {
      return;
    }
    void loadChildren();
  }, [token, parent, loadChildren]);

  useEffect(() => {
    if (!token || !parent) {
      return;
    }
    void loadDigest();
  }, [token, parent, selectedChildId, reloadSignal, loadDigest]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const result = await loginParent(loginForm.email, loginForm.password);
      setToken(result.token);
      setParent(result.parent);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Login failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    setParent(null);
    setChildren([]);
    setDigest(null);
    setSelectedChildId("all");
  };

  const generatedAtLabel = useMemo(() => {
    if (!digest?.generatedAt) {
      return null;
    }
    const date = new Date(digest.generatedAt);
    return Number.isNaN(date.getTime()) ? null : date.toLocaleString();
  }, [digest]);

  if (!token || !parent) {
    return (
      <main className="parent-portal">
        <section className="auth-card">
          <h2>Parent Login</h2>
          <p>Get your weekly digest and next-step recommendation in under a minute.</p>
          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) => setLoginForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) => setLoginForm((current) => ({ ...current, password: event.target.value }))}
                required
              />
            </label>
            <button type="submit" className="read-button" disabled={authLoading}>
              {authLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          {authError && <p className="error-text">{authError}</p>}
        </section>
      </main>
    );
  }

  return (
    <main className="parent-portal">
      <header className="backoffice-header">
        <div>
          <p className="hero-label">HKids Parent Hub</p>
          <h1>Weekly Reading Digest</h1>
          <p className="parent-caption">
            Fast, actionable summary to keep routines healthy and screen time intentional.
          </p>
        </div>
        <div className="session-chip">
          <span>{parent.email}</span>
          <small>parent</small>
          <button type="button" className="ghost-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      <section className="parent-controls">
        <label>
          <span>Child View</span>
          <select
            value={selectedChildId}
            onChange={(event) => setSelectedChildId(event.target.value)}
            disabled={childrenLoading}
          >
            <option value="all">All Children</option>
            {children.map((child) => (
              <option key={child._id} value={child._id}>
                {child.name} (Age {child.age})
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="ghost-button" onClick={() => setReloadSignal((value) => value + 1)}>
          Refresh Digest
        </button>
      </section>

      {childrenError && <p className="error-text">{childrenError}</p>}

      {digestLoading && <div className="state-card">Loading weekly digest...</div>}

      {!digestLoading && digestError && (
        <div className="state-card error">
          <p>{digestError}</p>
          <button type="button" className="retry-button" onClick={() => setReloadSignal((value) => value + 1)}>
            Try again
          </button>
        </div>
      )}

      {!digestLoading && !digestError && digest && (
        <>
          <section className="parent-summary-grid">
            <article>
              <p>Total Minutes (7d)</p>
              <strong>{digest.summary.totalMinutes}</strong>
            </article>
            <article>
              <p>Reading Days</p>
              <strong>{digest.summary.readingDays}</strong>
            </article>
            <article>
              <p>Children in View</p>
              <strong>{digest.summary.childrenCount}</strong>
            </article>
          </section>

          <section className="parent-next-step">
            <h2>Next Step</h2>
            <p>{digest.summary.nextStep}</p>
            {generatedAtLabel && <small>Updated: {generatedAtLabel}</small>}
          </section>

          <section className="parent-digest-list">
            {digest.children.length === 0 && <div className="state-card">No reading data yet for this period.</div>}
            {digest.children.map((childDigest) => {
              const chartMax = Math.max(childDigest.dailyLimitMinutes, ...childDigest.dailyBreakdown.map((d) => d.minutes), 1);
              return (
                <article key={childDigest.childProfileId} className="parent-digest-card">
                  <header>
                    <div>
                      <p className="story-language">Age {childDigest.age}</p>
                      <h3>{childDigest.childName}</h3>
                    </div>
                    <span className={`trend-pill ${trendClassMap[childDigest.trend]}`}>
                      {trendLabelMap[childDigest.trend]}
                    </span>
                  </header>

                  <div className="parent-kpis">
                    <p>
                      <strong>{childDigest.totalMinutes}</strong> total minutes
                    </p>
                    <p>
                      <strong>{childDigest.activeDays}</strong> active days
                    </p>
                    <p>
                      <strong>{childDigest.consistencyScore}%</strong> consistency
                    </p>
                  </div>

                  <div className="digest-bars" aria-label={`Weekly progress for ${childDigest.childName}`}>
                    {childDigest.dailyBreakdown.map((day) => (
                      <span
                        key={`${childDigest.childProfileId}-${day.date}`}
                        title={`${day.date}: ${day.minutes} min`}
                        style={{ height: `${Math.max((day.minutes / chartMax) * 100, 10)}%` }}
                      />
                    ))}
                  </div>

                  <p className="story-meta">{childDigest.recommendation}</p>
                </article>
              );
            })}
          </section>
        </>
      )}
    </main>
  );
}

export default ParentPortal;

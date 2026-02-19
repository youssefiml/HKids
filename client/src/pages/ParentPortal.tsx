import "../styles/pages/ParentPortal.css";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  createParentChild,
  createParentPairingCode,
  deleteParentChild,
  getParentMe,
  getParentWeeklyDigest,
  listParentChildren,
  loginParent,
  registerParent,
  updateParentMe,
  updateParentPassword,
  uploadParentChildAvatar,
  updateParentChild,
} from "../api/parentApi";
import type {
  ParentAccount,
  ParentChildProfile,
  ParentWeeklyDigest,
  ParentWeeklyDigestChild,
} from "../api/parentApi";
import PlatformLogo from "../components/PlatformLogo";

const PARENT_TOKEN_STORAGE_KEY = "hkids_parent_token";

type AuthMode = "login" | "register";

type PairingUiState = {
  loading: boolean;
  error: string | null;
  code: string | null;
  expiresAt: string | null;
};

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

const PARENT_REGISTER_PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

function ParentPortal() {
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(PARENT_TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  });
  const [parent, setParent] = useState<ParentAccount | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ email: "parent1@hkids.com", password: "Parent1234" });
  const [registerForm, setRegisterForm] = useState({ email: "", password: "" });
  const [parentProfileForm, setParentProfileForm] = useState({ fullName: "", email: "" });
  const [parentProfileSaving, setParentProfileSaving] = useState(false);
  const [parentProfileError, setParentProfileError] = useState<string | null>(null);
  const [parentProfileSuccess, setParentProfileSuccess] = useState<string | null>(null);
  const [parentPasswordForm, setParentPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [parentPasswordSaving, setParentPasswordSaving] = useState(false);
  const [parentPasswordError, setParentPasswordError] = useState<string | null>(null);
  const [parentPasswordSuccess, setParentPasswordSuccess] = useState<string | null>(null);
  const [isParentProfileModalOpen, setIsParentProfileModalOpen] = useState(false);

  const [children, setChildren] = useState<ParentChildProfile[]>([]);
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [childrenError, setChildrenError] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>("all");
  const [childForm, setChildForm] = useState({
    name: "",
    age: 7,
    dailyReadingLimitMinutes: 30,
  });
  const [childFormLoading, setChildFormLoading] = useState(false);
  const [childFormError, setChildFormError] = useState<string | null>(null);
  const [pairingStateByChildId, setPairingStateByChildId] = useState<Record<string, PairingUiState>>({});
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [editChildForm, setEditChildForm] = useState({
    name: "",
    age: 7,
    dailyReadingLimitMinutes: 30,
  });
  const [confirmDeleteChildId, setConfirmDeleteChildId] = useState<string | null>(null);
  const [updatingChildId, setUpdatingChildId] = useState<string | null>(null);
  const [deletingChildId, setDeletingChildId] = useState<string | null>(null);
  const [uploadingChildAvatarId, setUploadingChildAvatarId] = useState<string | null>(null);
  const [childActionErrorById, setChildActionErrorById] = useState<Record<string, string | null>>({});

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

  useEffect(() => {
    if (!parent) {
      setParentProfileForm({ fullName: "", email: "" });
      return;
    }

    setParentProfileForm({
      fullName: parent.fullName ?? "",
      email: parent.email,
    });
  }, [parent]);

  useEffect(() => {
    if (!isParentProfileModalOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsParentProfileModalOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isParentProfileModalOpen]);

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
      setSelectedChildId((current) =>
        current === "all" || result.some((child) => child._id === current) ? current : "all"
      );
      setEditingChildId((current) =>
        current && result.some((child) => child._id === current) ? current : null
      );
      setConfirmDeleteChildId((current) =>
        current && result.some((child) => child._id === current) ? current : null
      );
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

  const handleAuthSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      if (authMode === "register" && !PARENT_REGISTER_PASSWORD_PATTERN.test(registerForm.password)) {
        throw new Error("Password must be 8-128 characters and include at least one letter and one number.");
      }

      const result =
        authMode === "login"
          ? await loginParent(loginForm.email, loginForm.password)
          : await registerParent(registerForm.email, registerForm.password);

      setToken(result.token);
      setParent(result.parent);
      if (authMode === "register") {
        setRegisterForm({ email: "", password: "" });
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed.");
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
    setPairingStateByChildId({});
    setEditingChildId(null);
    setConfirmDeleteChildId(null);
    setChildActionErrorById({});
    setUploadingChildAvatarId(null);
    setParentProfileSaving(false);
    setParentProfileError(null);
    setParentProfileSuccess(null);
    setParentPasswordSaving(false);
    setParentPasswordError(null);
    setParentPasswordSuccess(null);
    setParentPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setIsParentProfileModalOpen(false);
  };

  const handleOpenParentProfileModal = () => {
    setParentProfileError(null);
    setParentProfileSuccess(null);
    setParentPasswordError(null);
    setParentPasswordSuccess(null);
    setIsParentProfileModalOpen(true);
  };

  const handleCloseParentProfileModal = () => {
    setIsParentProfileModalOpen(false);
  };

  const handleParentProfileSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !parent) {
      return;
    }

    const payload = {
      fullName: parentProfileForm.fullName.trim(),
      email: parentProfileForm.email.trim().toLowerCase(),
    };

    if (!payload.fullName) {
      setParentProfileError("Parent full name is required.");
      setParentProfileSuccess(null);
      return;
    }

    setParentProfileSaving(true);
    setParentProfileError(null);
    setParentProfileSuccess(null);

    try {
      const updatedParent = await updateParentMe(token, payload);
      setParent(updatedParent);
      setParentProfileSuccess("Profile updated.");
    } catch (error) {
      setParentProfileError(error instanceof Error ? error.message : "Could not update parent profile.");
    } finally {
      setParentProfileSaving(false);
    }
  };

  const handleParentPasswordSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !parent) {
      return;
    }

    if (!PARENT_REGISTER_PASSWORD_PATTERN.test(parentPasswordForm.newPassword)) {
      setParentPasswordError("New password must be 8-128 chars and include at least one letter and one number.");
      setParentPasswordSuccess(null);
      return;
    }

    if (parentPasswordForm.newPassword !== parentPasswordForm.confirmPassword) {
      setParentPasswordError("New password and confirm password do not match.");
      setParentPasswordSuccess(null);
      return;
    }

    setParentPasswordSaving(true);
    setParentPasswordError(null);
    setParentPasswordSuccess(null);

    try {
      await updateParentPassword(token, {
        currentPassword: parentPasswordForm.currentPassword,
        newPassword: parentPasswordForm.newPassword,
      });
      setParentPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setParentPasswordSuccess("Password updated.");
    } catch (error) {
      setParentPasswordError(error instanceof Error ? error.message : "Could not update password.");
    } finally {
      setParentPasswordSaving(false);
    }
  };

  const handleChildAvatarUpload = async (childProfileId: string, file: File | null) => {
    if (!file || !token || !parent) {
      return;
    }

    setUploadingChildAvatarId(childProfileId);
    setChildActionErrorById((current) => ({ ...current, [childProfileId]: null }));

    try {
      const updatedChild = await uploadParentChildAvatar(token, childProfileId, file);
      setChildren((current) =>
        current.map((child) => (child._id === childProfileId ? { ...child, ...updatedChild } : child))
      );
      setReloadSignal((value) => value + 1);
    } catch (error) {
      setChildActionErrorById((current) => ({
        ...current,
        [childProfileId]: error instanceof Error ? error.message : "Could not upload child picture.",
      }));
    } finally {
      setUploadingChildAvatarId(null);
    }
  };

  const handleCreateChild = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !parent) {
      return;
    }

    setChildFormLoading(true);
    setChildFormError(null);
    try {
      await createParentChild(token, {
        name: childForm.name,
        age: childForm.age,
        dailyReadingLimitMinutes: childForm.dailyReadingLimitMinutes,
      });
      setChildForm({ name: "", age: 7, dailyReadingLimitMinutes: 30 });
      await loadChildren();
      setReloadSignal((value) => value + 1);
    } catch (error) {
      setChildFormError(error instanceof Error ? error.message : "Could not create child account.");
    } finally {
      setChildFormLoading(false);
    }
  };

  const handleGeneratePairingCode = async (childProfileId: string) => {
    if (!token || !parent) {
      return;
    }

    setPairingStateByChildId((current) => ({
      ...current,
      [childProfileId]: {
        loading: true,
        error: null,
        code: current[childProfileId]?.code ?? null,
        expiresAt: current[childProfileId]?.expiresAt ?? null,
      },
    }));

    try {
      const pairing = await createParentPairingCode(token, childProfileId, 15);
      setPairingStateByChildId((current) => ({
        ...current,
        [childProfileId]: {
          loading: false,
          error: null,
          code: pairing.code,
          expiresAt: pairing.expiresAt,
        },
      }));
    } catch (error) {
      setPairingStateByChildId((current) => ({
        ...current,
        [childProfileId]: {
          loading: false,
          error: error instanceof Error ? error.message : "Could not generate code.",
          code: null,
          expiresAt: null,
        },
      }));
    }
  };

  const handleEditChildStart = (child: ParentChildProfile) => {
    setEditingChildId(child._id);
    setConfirmDeleteChildId((current) => (current === child._id ? null : current));
    setEditChildForm({
      name: child.name,
      age: child.age,
      dailyReadingLimitMinutes: child.dailyReadingLimitMinutes,
    });
    setChildActionErrorById((current) => ({ ...current, [child._id]: null }));
  };

  const handleEditChildCancel = () => {
    setEditingChildId(null);
  };

  const handleDeleteChildRequest = (childProfileId: string) => {
    setConfirmDeleteChildId(childProfileId);
    setChildActionErrorById((current) => ({ ...current, [childProfileId]: null }));
  };

  const handleDeleteChildCancel = () => {
    setConfirmDeleteChildId(null);
  };

  const handleUpdateChild = async (event: FormEvent, childProfileId: string) => {
    event.preventDefault();
    if (!token || !parent) {
      return;
    }

    const payload = {
      name: editChildForm.name.trim(),
      age: editChildForm.age,
      dailyReadingLimitMinutes: editChildForm.dailyReadingLimitMinutes,
    };

    if (!payload.name) {
      setChildActionErrorById((current) => ({ ...current, [childProfileId]: "Child name is required." }));
      return;
    }

    setUpdatingChildId(childProfileId);
    setChildActionErrorById((current) => ({ ...current, [childProfileId]: null }));

    try {
      await updateParentChild(token, childProfileId, payload);
      setEditingChildId(null);
      await loadChildren();
      setReloadSignal((value) => value + 1);
    } catch (error) {
      setChildActionErrorById((current) => ({
        ...current,
        [childProfileId]: error instanceof Error ? error.message : "Could not update child profile.",
      }));
    } finally {
      setUpdatingChildId(null);
    }
  };

  const handleDeleteChildConfirm = async (child: ParentChildProfile) => {
    if (!token || !parent) {
      return;
    }

    setDeletingChildId(child._id);
    setChildActionErrorById((current) => ({ ...current, [child._id]: null }));

    try {
      await deleteParentChild(token, child._id);
      setPairingStateByChildId((current) => {
        const next = { ...current };
        delete next[child._id];
        return next;
      });
      if (editingChildId === child._id) {
        setEditingChildId(null);
      }
      setConfirmDeleteChildId(null);
      await loadChildren();
      setReloadSignal((value) => value + 1);
    } catch (error) {
      setChildActionErrorById((current) => ({
        ...current,
        [child._id]: error instanceof Error ? error.message : "Could not delete child profile.",
      }));
    } finally {
      setDeletingChildId(null);
    }
  };

  if (!token || !parent) {
    return (
      <main className="parent-portal parent-auth-shell">
        <section className="parent-auth-layout">
          <article className="auth-card parent-auth-card">
            <div className="parent-auth-tabs" role="tablist" aria-label="Parent authentication mode">
              <button
                type="button"
                role="tab"
                aria-selected={authMode === "login"}
                className={authMode === "login" ? "parent-auth-tab active" : "parent-auth-tab"}
                onClick={() => {
                  setAuthError(null);
                  setAuthMode("login");
                }}
              >
                Login
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authMode === "register"}
                className={authMode === "register" ? "parent-auth-tab active" : "parent-auth-tab"}
                onClick={() => {
                  setAuthError(null);
                  setAuthMode("register");
                }}
              >
                Register
              </button>
            </div>

            <div className="parent-auth-content">
              <h2>{authMode === "login" ? "Parent Login" : "Create Parent Account"}</h2>
              <p>
                Parent owns the account. Parent creates child accounts and gives pairing codes for child reading
                access.
              </p>
              <form className="auth-form parent-auth-form" onSubmit={handleAuthSubmit}>
                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    value={authMode === "login" ? loginForm.email : registerForm.email}
                    onChange={(event) =>
                      authMode === "login"
                        ? setLoginForm((current) => ({ ...current, email: event.target.value }))
                        : setRegisterForm((current) => ({ ...current, email: event.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  <span>Password</span>
                  <input
                    type="password"
                    value={authMode === "login" ? loginForm.password : registerForm.password}
                    onChange={(event) =>
                      authMode === "login"
                        ? setLoginForm((current) => ({ ...current, password: event.target.value }))
                        : setRegisterForm((current) => ({ ...current, password: event.target.value }))
                    }
                    required
                    minLength={8}
                    maxLength={128}
                    pattern={authMode === "register" ? "(?=.*[A-Za-z])(?=.*\\d).{8,128}" : undefined}
                    title={
                      authMode === "register"
                        ? "Password must be 8-128 characters and include at least one letter and one number."
                        : undefined
                    }
                  />
                </label>
                {authMode === "register" && (
                  <p className="form-hint">Use 8+ characters with at least one letter and one number.</p>
                )}
                <button type="submit" className="read-button parent-auth-submit" disabled={authLoading}>
                  {authLoading
                    ? authMode === "login"
                      ? "Signing in..."
                      : "Creating account..."
                    : authMode === "login"
                      ? "Sign In"
                      : "Create Parent Account"}
                </button>
              </form>
              {authError && <p className="error-text">{authError}</p>}
            </div>
          </article>

          <aside className="parent-auth-brand">
            <div>
              <div className="parent-brand-row">
                <PlatformLogo className="parent-brand-logo" />
                <p className="hero-label">Parent Hub</p>
              </div>
              <h3>Family Access</h3>
              <p>Parents manage child profiles and create 4-digit reader pairing codes.</p>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  return (
    <main className="parent-portal">
      <header className="backoffice-header">
        <div>
          <div className="parent-brand-row">
            <PlatformLogo className="parent-brand-logo" />
            <p className="hero-label">Parent Hub</p>
          </div>
          <h1>Parent-Owned Family Access</h1>
          <p className="parent-caption">
            Parent account controls child accounts, pairing access, and weekly reading digest.
          </p>
        </div>
        <div className="session-chip">
          <span>{parent.fullName || parent.email}</span>
          <small>parent</small>
          <button type="button" className="ghost-button" onClick={handleOpenParentProfileModal}>
            Profile
          </button>
          <button type="button" className="ghost-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>

      {isParentProfileModalOpen && (
        <div
          className="parent-profile-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Parent profile settings"
          onClick={handleCloseParentProfileModal}
        >
          <section className="parent-profile-modal" onClick={(event) => event.stopPropagation()}>
            <div className="parent-profile-modal-head">
              <div>
                <h2>Parent Profile</h2>
                <p>Update your account information and password.</p>
              </div>
              <button type="button" className="parent-profile-modal-close" onClick={handleCloseParentProfileModal}>
                Close
              </button>
            </div>

            <form className="parent-profile-form" onSubmit={handleParentProfileSave}>
              <label>
                <span>Full Name</span>
                <input
                  type="text"
                  value={parentProfileForm.fullName}
                  onChange={(event) => {
                    setParentProfileForm((current) => ({ ...current, fullName: event.target.value }));
                    setParentProfileError(null);
                    setParentProfileSuccess(null);
                  }}
                  maxLength={100}
                  required
                />
              </label>
              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={parentProfileForm.email}
                  onChange={(event) => {
                    setParentProfileForm((current) => ({ ...current, email: event.target.value }));
                    setParentProfileError(null);
                    setParentProfileSuccess(null);
                  }}
                  required
                />
              </label>
              <button type="submit" className="read-button" disabled={parentProfileSaving}>
                {parentProfileSaving ? "Saving..." : "Save Profile"}
              </button>
            </form>

            {parentProfileError && <p className="error-text parent-profile-error">{parentProfileError}</p>}
            {parentProfileSuccess && <p className="parent-profile-success">{parentProfileSuccess}</p>}

            <div className="parent-profile-divider" />

            <form className="parent-password-form" onSubmit={handleParentPasswordSave}>
              <label>
                <span>Current Password</span>
                <input
                  type="password"
                  value={parentPasswordForm.currentPassword}
                  onChange={(event) => {
                    setParentPasswordForm((current) => ({ ...current, currentPassword: event.target.value }));
                    setParentPasswordError(null);
                    setParentPasswordSuccess(null);
                  }}
                  minLength={8}
                  maxLength={128}
                  required
                />
              </label>
              <label>
                <span>New Password</span>
                <input
                  type="password"
                  value={parentPasswordForm.newPassword}
                  onChange={(event) => {
                    setParentPasswordForm((current) => ({ ...current, newPassword: event.target.value }));
                    setParentPasswordError(null);
                    setParentPasswordSuccess(null);
                  }}
                  minLength={8}
                  maxLength={128}
                  required
                />
              </label>
              <label>
                <span>Confirm New Password</span>
                <input
                  type="password"
                  value={parentPasswordForm.confirmPassword}
                  onChange={(event) => {
                    setParentPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }));
                    setParentPasswordError(null);
                    setParentPasswordSuccess(null);
                  }}
                  minLength={8}
                  maxLength={128}
                  required
                />
              </label>
              <button type="submit" className="ghost-button" disabled={parentPasswordSaving}>
                {parentPasswordSaving ? "Updating..." : "Update Password"}
              </button>
            </form>

            {parentPasswordError && <p className="error-text parent-profile-error">{parentPasswordError}</p>}
            {parentPasswordSuccess && <p className="parent-profile-success">{parentPasswordSuccess}</p>}
          </section>
        </div>
      )}

      <section className="parent-child-management">
        <div className="parent-child-management-header">
          <h2>Child Accounts</h2>
          <p>Create child profiles and generate 4-digit pairing codes to grant child reader access.</p>
        </div>

        <form className="parent-child-form" onSubmit={handleCreateChild}>
          <label>
            <span>Child Name</span>
            <input
              type="text"
              value={childForm.name}
              onChange={(event) => setChildForm((current) => ({ ...current, name: event.target.value }))}
              maxLength={80}
              required
            />
          </label>
          <label>
            <span>Age</span>
            <input
              type="number"
              min={0}
              max={18}
              value={childForm.age}
              onChange={(event) =>
                setChildForm((current) => ({ ...current, age: Math.max(0, Math.min(18, Number(event.target.value) || 0)) }))
              }
              required
            />
          </label>
          <label>
            <span>Daily Limit (minutes)</span>
            <input
              type="number"
              min={1}
              max={1440}
              value={childForm.dailyReadingLimitMinutes}
              onChange={(event) =>
                setChildForm((current) => ({
                  ...current,
                  dailyReadingLimitMinutes: Math.max(1, Math.min(1440, Number(event.target.value) || 1)),
                }))
              }
              required
            />
          </label>
          <button type="submit" className="read-button" disabled={childFormLoading}>
            {childFormLoading ? "Creating..." : "Create Child Account"}
          </button>
        </form>

        {childFormError && <p className="error-text">{childFormError}</p>}
        {childrenError && <p className="error-text">{childrenError}</p>}

        {childrenLoading && <div className="state-card">Loading child accounts...</div>}

        {!childrenLoading && children.length === 0 && (
          <div className="state-card">No child account yet. Create one to start reader access setup.</div>
        )}

        {!childrenLoading && children.length > 0 && (
          <div className="parent-child-list">
            {children.map((child) => {
              const pairingState = pairingStateByChildId[child._id];
              const expiresLabel = pairingState?.expiresAt
                ? new Date(pairingState.expiresAt).toLocaleString()
                : null;
              const isEditing = editingChildId === child._id;
              const isUpdating = updatingChildId === child._id;
              const isDeleting = deletingChildId === child._id;
              const isDeleteConfirmOpen = confirmDeleteChildId === child._id;
              const childActionError = childActionErrorById[child._id];

              return (
                <article key={child._id} className="parent-child-card">
                  <header>
                    <div className="parent-child-header-main">
                      <div className="parent-child-avatar">
                        {child.avatarImageUrl?.trim() ? (
                          <img src={child.avatarImageUrl} alt={`${child.name} avatar`} loading="lazy" />
                        ) : (
                          <span>{child.name.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <p className="story-language">Age {child.age}</p>
                        <h3>{child.name}</h3>
                      </div>
                    </div>
                    <p className="story-meta">Daily limit: {child.dailyReadingLimitMinutes} min</p>
                  </header>
                  <label className="parent-child-avatar-upload">
                    <span>{uploadingChildAvatarId === child._id ? "Uploading picture..." : "Upload Child Picture"}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      disabled={isUpdating || isDeleting || uploadingChildAvatarId === child._id}
                      onChange={(event) => {
                        const selectedFile = event.target.files?.[0] ?? null;
                        void handleChildAvatarUpload(child._id, selectedFile);
                        event.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="ghost-button"
                    onClick={() => void handleGeneratePairingCode(child._id)}
                    disabled={pairingState?.loading || isUpdating || isDeleting || uploadingChildAvatarId === child._id}
                  >
                    {pairingState?.loading ? "Generating code..." : "Generate 4-Digit Code"}
                  </button>
                  <div className="parent-child-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => handleEditChildStart(child)}
                      disabled={isUpdating || isDeleting || uploadingChildAvatarId === child._id}
                    >
                      {isEditing ? "Editing..." : "Edit Child"}
                    </button>
                    <button
                      type="button"
                      className="ghost-button danger"
                      onClick={() => handleDeleteChildRequest(child._id)}
                      disabled={isUpdating || isDeleting || uploadingChildAvatarId === child._id}
                    >
                      {isDeleting ? "Deleting..." : isDeleteConfirmOpen ? "Confirm Delete" : "Delete Child"}
                    </button>
                  </div>
                  {isDeleteConfirmOpen && (
                    <div className="parent-child-delete-confirm" role="alert">
                      <p>
                        Delete <strong>{child.name}</strong>? This disables reader devices linked to this child.
                      </p>
                      <div className="parent-child-delete-actions">
                        <button
                          type="button"
                          className="ghost-button danger"
                          onClick={() => void handleDeleteChildConfirm(child)}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Yes, Delete"}
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={handleDeleteChildCancel}
                          disabled={isDeleting}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                  {isEditing && (
                    <form className="parent-child-edit-form" onSubmit={(event) => void handleUpdateChild(event, child._id)}>
                      <label>
                        <span>Child Name</span>
                        <input
                          type="text"
                          value={editChildForm.name}
                          onChange={(event) =>
                            setEditChildForm((current) => ({ ...current, name: event.target.value }))
                          }
                          maxLength={80}
                          required
                        />
                      </label>
                      <label>
                        <span>Age</span>
                        <input
                          type="number"
                          min={0}
                          max={18}
                          value={editChildForm.age}
                          onChange={(event) =>
                            setEditChildForm((current) => ({
                              ...current,
                              age: Math.max(0, Math.min(18, Number(event.target.value) || 0)),
                            }))
                          }
                          required
                        />
                      </label>
                      <label>
                        <span>Daily Limit (minutes)</span>
                        <input
                          type="number"
                          min={1}
                          max={1440}
                          value={editChildForm.dailyReadingLimitMinutes}
                          onChange={(event) =>
                            setEditChildForm((current) => ({
                              ...current,
                              dailyReadingLimitMinutes: Math.max(
                                1,
                                Math.min(1440, Number(event.target.value) || 1)
                              ),
                            }))
                          }
                          required
                        />
                      </label>
                      <div className="parent-child-edit-actions">
                        <button type="submit" className="read-button" disabled={isUpdating}>
                          {isUpdating ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          type="button"
                          className="ghost-button"
                          onClick={handleEditChildCancel}
                          disabled={isUpdating}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                  {childActionError && <p className="error-text">{childActionError}</p>}
                  {pairingState?.error && <p className="error-text">{pairingState.error}</p>}
                  {pairingState?.code && (
                    <p className="parent-pairing-code">
                      Code: <strong>{pairingState.code}</strong>
                      {expiresLabel ? ` (expires ${expiresLabel})` : ""}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="parent-controls">
        <label>
          <span>Digest Scope</span>
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

          <section className="parent-digest-list">
            {digest.children.length === 0 && <div className="state-card">No reading data yet for this period.</div>}
            {digest.children.map((childDigest) => {
              const chartMax = Math.max(
                childDigest.dailyLimitMinutes,
                ...childDigest.dailyBreakdown.map((d) => d.minutes),
                1
              );
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

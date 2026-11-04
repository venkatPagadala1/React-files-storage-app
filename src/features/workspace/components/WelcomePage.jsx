import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faEye, faEyeSlash, faMoon, faSun, faXmark } from "@fortawesome/free-solid-svg-icons";
import { VsrLogoMark, VsrWordmark } from "../../../components/branding/VsrBrand.jsx";
import { palettes } from "../../../lib/workspaceConfig.js";
import {
  getLastRememberedAccountEmail,
  getRememberedAccountName,
} from "../../../lib/welcomeNameStorage.js";

const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL?.trim() || "";

function WelcomePage({
  theme,
  palette,
  onThemeChange,
  onPaletteChange,
  onOpenWorkspace,
  onResetPassword,
  missingSettings = [],
  isLocalAuthEmulator = false,
  authError = "",
  isAuthenticating = false,
  useRealAuthentication = true,
}) {
  const [authMode, setAuthMode] = useState("signin");
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [email, setEmail] = useState(getLastRememberedAccountEmail);
  const emailInputRef = useRef(null);
  const rememberedName = getRememberedAccountName(email);

  function handleAuthSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onOpenWorkspace({
      mode: authMode,
      name: authMode === "signup" ? String(formData.get("name") ?? "") : "",
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
  }

  async function handlePasswordReset() {
    setResetMessage("");
    const email = emailInputRef.current?.value.trim() || "";
    if (!email) {
      setResetMessage("Enter your email address first, then choose Forgot password.");
      emailInputRef.current?.focus();
      return;
    }
    try {
      await onResetPassword?.(email);
      setResetMessage("If an account exists for this email, password reset instructions have been sent.");
    } catch (error) {
      setResetMessage(error.message || "Could not send password reset instructions.");
    }
  }

  return (
    <main className="welcome-page" data-theme={theme} data-palette={palette} data-area="welcome">
      <header className="welcome-topbar" aria-label="Page settings and support">
        <label className="palette-picker">
          <span>Color</span>
          <select value={palette} onChange={(event) => onPaletteChange(event.target.value)} aria-label="Choose color theme">
            {palettes.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
        <button
          type="button"
          className="welcome-theme-toggle"
          onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        >
          <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
          <span>{theme === "light" ? "Dark" : "Light"} theme</span>
        </button>
        <button type="button" className="welcome-contact-button" onClick={() => setIsContactOpen(true)}>
          <FontAwesomeIcon icon={faEnvelope} />
          <span>Contact us</span>
        </button>
      </header>

      <section className="welcome-story" aria-labelledby="welcome-heading">
        <div className="welcome-brand">
          <span className="welcome-brand-logo">
            <span className="welcome-brand-mark"><VsrLogoMark /></span>
            <VsrWordmark className="welcome-brand-wordmark" />
          </span>
          <span>VSR GROUP OF COMPANIES</span>
        </div>
        <div className="welcome-story-copy">
          <span className="welcome-kicker">VSR WORKSPACE</span>
          <h1 id="welcome-heading">One team.<br />One place<br /><span>to grow.</span></h1>
          <p>Sign in to access your documents, learning notes, tasks, calendar, and whiteboard.</p>
        </div>
        <div className="welcome-footer">
          <span className="welcome-footer-mark"><FontAwesomeIcon icon={faEnvelope} /></span>
          <span>Secure access to your personal workspace</span>
        </div>
      </section>

      <section className="welcome-form-panel" aria-labelledby="auth-heading">
        <div className="welcome-form-card">
          {isLocalAuthEmulator && (
            <aside className="welcome-emulator-notice" role="note">
              Local test authentication is active. Accounts and workspace data are temporary and stay on this machine.
            </aside>
          )}
          <span className="welcome-form-kicker">VSR GROUP OF COMPANIES</span>
          <h2 id="auth-heading">{authMode === "signin" ? rememberedName ? `Welcome back, ${rememberedName}` : "Welcome back" : "Create your account"}</h2>
          <p className="welcome-form-intro">
            {authMode === "signin" ? "Sign in to continue to your workspace." : "Create an account to access your workspace across devices."}
          </p>

          {!useRealAuthentication ? (
            <div className="workspace-alert welcome-config-alert" role="alert">
              <strong>Workspace sign-in needs configuration.</strong>
              <span>Copy <code>.env.example</code> to <code>.env.local</code> for local development, add the Firebase Web App values and deployed Cloud Run API URL, then restart Vite.</span>
              {missingSettings.length > 0 && (
                <ul className="welcome-missing-settings">
                  {missingSettings.map((setting) => <li key={setting}><code>{setting}</code></li>)}
                </ul>
              )}
              <span>Find Firebase values in Firebase Console → Project settings → Your apps → Web app.</span>
            </div>
          ) : (
            <>
              {authError && <div className="workspace-alert" role="alert">{authError}</div>}
              <div className="welcome-auth-tabs" role="tablist" aria-label="Account options">
                <button type="button" role="tab" aria-selected={authMode === "signin"} className={authMode === "signin" ? "active" : ""} onClick={() => { setAuthMode("signin"); setResetMessage(""); }}>Sign in</button>
                <button type="button" role="tab" aria-selected={authMode === "signup"} className={authMode === "signup" ? "active" : ""} onClick={() => { setAuthMode("signup"); setResetMessage(""); }}>Sign up</button>
              </div>
              <form className="welcome-form" onSubmit={handleAuthSubmit}>
                {authMode === "signup" && (
                  <label className="welcome-field">Name
                    <input type="text" name="name" autoComplete="name" placeholder="Your name" required />
                  </label>
                )}
                <label className="welcome-field">Email
                  <input ref={emailInputRef} type="email" name="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </label>
                <label className="welcome-field">
                  <span className="welcome-password-label">
                    <span>Password</span>
                    {authMode === "signin" && <button type="button" className="welcome-forgot-password" onClick={handlePasswordReset}>Forgot password?</button>}
                  </span>
                  <span className="welcome-password-control">
                    <input type={showPassword ? "text" : "password"} name="password" autoComplete={authMode === "signin" ? "current-password" : "new-password"} placeholder="Enter your password" minLength={6} required />
                    <button type="button" className="welcome-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                  </span>
                </label>
                {resetMessage && <p className="welcome-form-message" role="status">{resetMessage}</p>}
                <button type="submit" className="welcome-create-button" disabled={isAuthenticating}>
                  {isAuthenticating ? "Please wait…" : authMode === "signin" ? "Sign in" : "Create account"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>

      {isContactOpen && (
        <div className="welcome-contact-backdrop" onClick={() => setIsContactOpen(false)}>
          <section className="welcome-contact-dialog" role="dialog" aria-modal="true" aria-labelledby="welcome-contact-title" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="welcome-contact-close" aria-label="Close contact information" onClick={() => setIsContactOpen(false)}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <span className="welcome-contact-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
            <span className="welcome-form-kicker">VSR WORKSPACE SUPPORT</span>
            <h2 id="welcome-contact-title">Contact us</h2>
            {supportEmail ? (
              <p>For workspace help, email <a href={`mailto:${supportEmail}`}>{supportEmail}</a>.</p>
            ) : (
              <p>Support contact details have not been configured. Please contact your workspace administrator.</p>
            )}
            <button type="button" className="welcome-create-button" onClick={() => setIsContactOpen(false)}>Close</button>
          </section>
        </div>
      )}
    </main>
  );
}

export default WelcomePage;

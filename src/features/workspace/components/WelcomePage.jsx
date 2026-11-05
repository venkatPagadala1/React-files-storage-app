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
    <main className="welcome-page !grid-rows-[auto_minmax(0,1fr)] !content-center !gap-y-3 !gap-x-[clamp(14px,2vw,24px)] !px-[clamp(14px,3vw,40px)] !py-[clamp(14px,2vw,26px)] max-[700px]:!grid-cols-[minmax(0,1fr)] max-[700px]:!grid-rows-[auto_auto_auto] max-[700px]:!content-start" data-theme={theme} data-palette={palette} data-area="welcome">
      <header className="welcome-topbar !relative !z-[2] !col-span-full !flex !min-h-[42px] !items-center !justify-end !gap-[9px] max-[700px]:!gap-[7px] max-[420px]:!flex-wrap" aria-label="Page settings and support">
        <label className="palette-picker !static !inline-flex !min-h-10 !w-auto !items-center !gap-2 !rounded-xl !border !border-solid !px-[13px] max-[700px]:!min-h-[38px] max-[700px]:!px-[10px] max-[700px]:!text-[0.68rem]">
          <span>Color</span>
          <select className="!max-w-[145px] max-[700px]:!max-w-[94px]" value={palette} onChange={(event) => onPaletteChange(event.target.value)} aria-label="Choose color theme">
            {palettes.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
        <button
          type="button"
          className="welcome-theme-toggle !static !inline-flex !min-h-10 !w-auto !items-center !justify-center !gap-2 !rounded-xl !border !border-solid !px-[13px] ![font-family:inherit] !text-[0.74rem] !font-bold !cursor-pointer max-[700px]:!min-h-[38px] max-[700px]:!px-[10px] max-[700px]:!text-[0.68rem]"
          onClick={() => onThemeChange(theme === "light" ? "dark" : "light")}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
          title={`Switch to ${theme === "light" ? "dark" : "light"} theme`}
        >
          <FontAwesomeIcon icon={theme === "light" ? faMoon : faSun} />
          <span>{theme === "light" ? "Dark" : "Light"} theme</span>
        </button>
        <button type="button" className="welcome-contact-button !static !inline-flex !min-h-10 !w-auto !items-center !justify-center !gap-2 !rounded-xl !border !border-solid !px-[13px] ![font-family:inherit] !text-[0.74rem] !font-bold !cursor-pointer max-[700px]:!min-h-[38px] max-[700px]:!px-[10px] max-[700px]:!text-[0.68rem] max-[420px]:!ml-auto" onClick={() => setIsContactOpen(true)}>
          <FontAwesomeIcon icon={faEnvelope} />
          <span>Contact us</span>
        </button>
      </header>

      <section className="welcome-story !relative !z-[1] !min-h-[min(690px,calc(100svh-114px))] !overflow-hidden !p-[clamp(28px,4vw,58px)] max-[700px]:!min-h-0 max-[700px]:!p-[23px]" aria-labelledby="welcome-heading">
        <div className="welcome-brand">
          <span className="welcome-brand-logo">
            <span className="welcome-brand-mark"><VsrLogoMark /></span>
            <VsrWordmark className="welcome-brand-wordmark" />
          </span>
          <span>VSR GROUP OF COMPANIES</span>
        </div>
        <div className="welcome-story-copy !my-7 max-[700px]:!my-[30px]">
          <span className="welcome-kicker">VSR WORKSPACE</span>
          <h1 className="!text-[clamp(2.7rem,5vw,5rem)] !leading-[1.02] max-[700px]:!text-[clamp(2.5rem,12vw,4rem)]" id="welcome-heading">One team.<br />One place<br /><span>to grow.</span></h1>
          <p className="!max-w-[410px]">Sign in to access your documents, learning notes, tasks, calendar, and whiteboard.</p>
        </div>
        <div className="welcome-footer !flex !items-center !gap-[10px]">
          <span className="welcome-footer-mark !grid !h-[30px] !w-[30px] !place-items-center !rounded-[10px]"><FontAwesomeIcon icon={faEnvelope} /></span>
          <span>Secure access to your personal workspace</span>
        </div>
      </section>

      <section className="welcome-form-panel !relative !z-[1] !min-h-[min(690px,calc(100svh-114px))] !overflow-hidden !p-[clamp(24px,4vw,56px)] max-[700px]:!min-h-0 max-[700px]:!px-[22px] max-[700px]:!pt-[26px] max-[700px]:!pb-[30px]" aria-labelledby="auth-heading">
        <div className="welcome-form-card !max-w-[420px]">
          {isLocalAuthEmulator && (
            <aside className="welcome-emulator-notice mb-4 rounded-[11px] border p-[10px_12px] text-[0.72rem] leading-[1.5]" role="note">
              Local test authentication is active. Accounts and workspace data are temporary and stay on this machine.
            </aside>
          )}
          <span className="welcome-form-kicker">VSR GROUP OF COMPANIES</span>
          <h2 className="!mt-[15px] !text-[clamp(1.9rem,3vw,2.4rem)]" id="auth-heading">{authMode === "signin" ? rememberedName ? `Welcome back, ${rememberedName}` : "Welcome back" : "Create your account"}</h2>
          <p className="welcome-form-intro !mb-6 !text-[0.86rem]">
            {authMode === "signin" ? "Sign in to continue to your workspace." : "Create an account to access your workspace across devices."}
          </p>

          {!useRealAuthentication ? (
            <div className="workspace-alert welcome-config-alert grid justify-stretch gap-[9px] text-left" role="alert">
              <strong>Workspace sign-in needs configuration.</strong>
              <span>Copy <code className="rounded bg-black/5 px-1 py-px text-[0.72rem]">.env.example</code> to <code className="rounded bg-black/5 px-1 py-px text-[0.72rem]">.env.local</code> for local development, add the Firebase Web App values and deployed Cloud Run API URL, then restart Vite.</span>
              {missingSettings.length > 0 && (
                <ul className="welcome-missing-settings m-0 grid gap-[3px] pl-[19px]">
                  {missingSettings.map((setting) => <li key={setting}><code className="rounded bg-black/5 px-1 py-px text-[0.72rem]">{setting}</code></li>)}
                </ul>
              )}
              <span>Find Firebase values in Firebase Console → Project settings → Your apps → Web app.</span>
            </div>
          ) : (
            <>
              {authError && <div className="workspace-alert" role="alert">{authError}</div>}
              <div className="welcome-auth-tabs !mb-[22px] !rounded-[13px] !p-1" role="tablist" aria-label="Account options">
                <button type="button" role="tab" aria-selected={authMode === "signin"} className={`!min-h-10 !rounded-[10px]${authMode === "signin" ? " active" : ""}`} onClick={() => { setAuthMode("signin"); setResetMessage(""); }}>Sign in</button>
                <button type="button" role="tab" aria-selected={authMode === "signup"} className={`!min-h-10 !rounded-[10px]${authMode === "signup" ? " active" : ""}`} onClick={() => { setAuthMode("signup"); setResetMessage(""); }}>Sign up</button>
              </div>
              <form className="welcome-form !gap-4" onSubmit={handleAuthSubmit}>
                {authMode === "signup" && (
                  <label className="welcome-field gap-2 text-[0.78rem]">Name
                    <input className="!min-h-12 !rounded-xl !px-[14px]" type="text" name="name" autoComplete="name" placeholder="Your name" required />
                  </label>
                )}
                <label className="welcome-field gap-2 text-[0.78rem]">Email
                  <input className="!min-h-12 !rounded-xl !px-[14px]" ref={emailInputRef} type="email" name="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </label>
                <label className="welcome-field gap-2 text-[0.78rem]">
                  <span className="welcome-password-label flex items-center justify-between">
                    <span>Password</span>
                    {authMode === "signin" && <button type="button" className="welcome-forgot-password border-0 bg-transparent p-0 text-[0.7rem] font-bold cursor-pointer [font-family:inherit]" onClick={handlePasswordReset}>Forgot password?</button>}
                  </span>
                  <span className="welcome-password-control">
                    <input className="!min-h-12 !min-w-0 !rounded-r-none !rounded-l-xl !px-[14px]" type={showPassword ? "text" : "password"} name="password" autoComplete={authMode === "signin" ? "current-password" : "new-password"} placeholder="Enter your password" minLength={6} required />
                    <button type="button" className="welcome-password-toggle !min-h-12 !rounded-r-xl !rounded-l-none" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>
                      <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                    </button>
                  </span>
                </label>
                {resetMessage && <p className="welcome-form-message" role="status">{resetMessage}</p>}
                <button type="submit" className="welcome-create-button !mt-[5px] !min-h-12 !rounded-xl !text-[0.82rem]" disabled={isAuthenticating}>
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
            <button type="button" className="welcome-create-button !min-h-12 !rounded-xl !text-[0.82rem]" onClick={() => setIsContactOpen(false)}>Close</button>
          </section>
        </div>
      )}
    </main>
  );
}

export default WelcomePage;

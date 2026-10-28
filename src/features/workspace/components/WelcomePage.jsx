import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";
import { VsrLogoMark, VsrWordmark } from "../../../components/branding/VsrBrand.jsx";
import { palettes } from "../../../lib/workspaceConfig.js";

function WelcomePage({
  theme,
  palette,
  signupFirstName,
  signupLastName,
  signupEmail,
  signupPassword,
  signupPasswordConfirmation,
  signupMessage,
  onThemeChange,
  onPaletteChange,
  onFirstNameChange,
  onLastNameChange,
  onEmailChange,
  onPasswordChange,
  onPasswordConfirmationChange,
  onSubmit,
  onOpenWorkspace,
}) {
  const [passwordVisible, setPasswordVisible] = useState(false);

  return (
    <main className="welcome-page" data-theme={theme} data-palette={palette}>
      <section className="welcome-story" aria-labelledby="welcome-heading">
        <div className="welcome-brand">
          <span className="welcome-brand-logo">
            <span className="welcome-brand-mark">
              <VsrLogoMark />
            </span>
            <VsrWordmark className="welcome-brand-wordmark" />
          </span>
          <span>GROUP OF COMPANIES</span>
        </div>
        <div className="welcome-story-copy">
          <span className="welcome-kicker">Your next chapter starts here</span>
          <h1 id="welcome-heading">
            Make room
            <br />
            for your
            <br />
            <span>next big idea.</span>
          </h1>
          <p>
            One thoughtful plan at a time. Gather your preparation notes,
            project ideas, and important files in one focused workspace.
          </p>
        </div>
        <span className="welcome-footer">A calmer place to think clearly.</span>
      </section>

      <section className="welcome-form-panel" aria-labelledby="signup-heading">
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
        <label className="palette-picker">
          <span>Color</span>
          <select
            value={palette}
            onChange={(event) => onPaletteChange(event.target.value)}
            aria-label="Choose color theme"
          >
            {palettes.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <div className="welcome-form-card">
          <span className="welcome-form-kicker">WELCOME TO VSR WORKSPACE</span>
          <h2 id="signup-heading">Create your account</h2>
          <p className="welcome-form-intro">
            Set up your details to preview the workspace experience.
          </p>

          <form className="welcome-form" onSubmit={onSubmit}>
            <div className="welcome-name-fields">
              <label className="welcome-field">
                <span>First name</span>
                <input
                  type="text"
                  value={signupFirstName}
                  onChange={(event) => onFirstNameChange(event.target.value)}
                  placeholder="First name"
                  autoComplete="given-name"
                  required
                />
              </label>
              <label className="welcome-field">
                <span>Last name</span>
                <input
                  type="text"
                  value={signupLastName}
                  onChange={(event) => onLastNameChange(event.target.value)}
                  placeholder="Last name"
                  autoComplete="family-name"
                  required
                />
              </label>
            </div>
            <label className="welcome-field">
              <span>Email address</span>
              <input
                type="email"
                value={signupEmail}
                onChange={(event) => onEmailChange(event.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="welcome-field">
              <span>Password</span>
              <span className="welcome-password-control">
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={signupPassword}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  className="welcome-password-toggle"
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                >
                  <FontAwesomeIcon
                    icon={passwordVisible ? faEyeSlash : faEye}
                    aria-hidden="true"
                  />
                </button>
              </span>
            </label>
            <label className="welcome-field">
              <span>Confirm password</span>
              <span className="welcome-password-control">
                <input
                  type={passwordVisible ? "text" : "password"}
                  value={signupPasswordConfirmation}
                  onChange={(event) =>
                    onPasswordConfirmationChange(event.target.value)
                  }
                  placeholder="Enter your password again"
                  autoComplete="new-password"
                  required
                  aria-invalid={
                    signupPasswordConfirmation.length > 0 &&
                    signupPassword !== signupPasswordConfirmation
                  }
                />
                <button
                  type="button"
                  className="welcome-password-toggle"
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                >
                  <FontAwesomeIcon
                    icon={passwordVisible ? faEyeSlash : faEye}
                    aria-hidden="true"
                  />
                </button>
              </span>
            </label>
            {signupMessage && (
              <p className="welcome-form-message" role="status" aria-live="polite">
                {signupMessage}
              </p>
            )}
            <button type="submit" className="welcome-create-button">
              Create account
            </button>
          </form>

          <div className="welcome-demo-notice">
            <strong>Prototype mode</strong>
            <span>
              Supabase authentication is not configured. This form does not
              create an account or send your password anywhere. Shared public
              access is not active in this local prototype.
            </span>
          </div>
          <button
            type="button"
            className="welcome-open-workspace"
            onClick={onOpenWorkspace}
          >
            Continue to local workspace
          </button>
        </div>
      </section>
    </main>
  );
}

export default WelcomePage;

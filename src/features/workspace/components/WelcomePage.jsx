import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faMoon,
  faSun,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { VsrLogoMark, VsrWordmark } from "../../../components/branding/VsrBrand.jsx";
import { palettes } from "../../../lib/workspaceConfig.js";

function WelcomePage({
  theme,
  palette,
  onThemeChange,
  onPaletteChange,
  onOpenWorkspace,
}) {
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [authMode, setAuthMode] = useState("signin");

  function handleAuthSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onOpenWorkspace({
      name: authMode === "signup" ? String(formData.get("name") ?? "") : "",
      email: String(formData.get("email") ?? ""),
    });
  }

  return (
    <main className="welcome-page" data-theme={theme} data-palette={palette} data-area="welcome">
      <section className="welcome-story" aria-labelledby="welcome-heading">
        <div className="welcome-brand">
          <span className="welcome-brand-logo">
            <span className="welcome-brand-mark">
              <VsrLogoMark />
            </span>
            <VsrWordmark className="welcome-brand-wordmark" />
          </span>
          <span>VSR GROUP OF COMPANIES</span>
        </div>
        <div className="welcome-story-copy">
          <span className="welcome-kicker">COMPANY & EMPLOYEE WORKSPACE PREVIEW</span>
          <h1 id="welcome-heading">
            One team.
            <br />
            One place
            <br />
            <span>to grow.</span>
          </h1>
          <p>
            Bring company resources, employee documents, training preparation,
            and team whiteboarding into one shared workspace experience.
          </p>
        </div>
        <span className="welcome-footer">A calmer place to think clearly.</span>
      </section>

      <section className="welcome-form-panel" aria-labelledby="auth-heading">
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
          <span className="welcome-form-kicker">VSR GROUP OF COMPANIES</span>
          <h2 id="auth-heading">
            {authMode === "signin" ? "Welcome back" : "Create a demo account"}
          </h2>
          <p className="welcome-form-intro">
            {authMode === "signin"
              ? "Sign in to explore the VSR workspace prototype."
              : "Set up a temporary profile to explore the prototype."}
          </p>

          <div className="welcome-demo-notice">
            <strong>Demo access only · no real authentication</strong>
            <span>
              Any valid email and non-empty password are accepted. Nothing is
              sent to a server, and credentials are not saved. Use mock details
              only; never enter a real or reused password.
            </span>
          </div>
          <div className="welcome-auth-tabs" role="tablist" aria-label="Account options">
            <button
              type="button"
              role="tab"
              aria-selected={authMode === "signin"}
              className={authMode === "signin" ? "active" : ""}
              onClick={() => setAuthMode("signin")}
            >
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={authMode === "signup"}
              className={authMode === "signup" ? "active" : ""}
              onClick={() => setAuthMode("signup")}
            >
              Sign up
            </button>
          </div>
          <form className="welcome-form" onSubmit={handleAuthSubmit}>
            {authMode === "signup" && (
              <label className="welcome-field">
                Name
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  placeholder="Your name"
                  required
                />
              </label>
            )}
            <label className="welcome-field">
              Email
              <input
                type="email"
                name="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </label>
            <label className="welcome-field">
              Password
              <input
                type="password"
                name="password"
                autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                placeholder="Enter any demo password"
                required
              />
            </label>
            <button type="submit" className="welcome-create-button">
              {authMode === "signin" ? "Sign in to prototype" : "Create demo account"}
            </button>
          </form>
          <button
            type="button"
            className="welcome-contact-button"
            onClick={() => setIsContactOpen(true)}
          >
            <FontAwesomeIcon icon={faEnvelope} />
            Contact us
          </button>
        </div>
      </section>
      {isContactOpen && (
        <div
          className="welcome-contact-backdrop"
          onClick={() => setIsContactOpen(false)}
        >
          <section
            className="welcome-contact-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-contact-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="welcome-contact-close"
              aria-label="Close contact information"
              onClick={() => setIsContactOpen(false)}
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
            <span className="welcome-contact-icon"><FontAwesomeIcon icon={faEnvelope} /></span>
            <span className="welcome-form-kicker">VSR GROUP OF COMPANIES</span>
            <h2 id="welcome-contact-title">Contact us</h2>
            <p>
              We’d be happy to hear from you. Company contact details and
              message delivery are not connected in this prototype. The
              following contact details are placeholders for you to replace.
            </p>
            <div className="welcome-contact-details">
              <a href="mailto:pagadalavenkateswarareddy97@gmail.com">pagadalavenkateswarareddy97@gmail.com</a>
              <a href="tel:+919154369638">+91 9154369638</a>
            </div>
            <button
              type="button"
              className="welcome-open-workspace"
              onClick={() => setIsContactOpen(false)}
            >
              Close
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

export default WelcomePage;

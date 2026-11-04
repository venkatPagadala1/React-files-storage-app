import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen, faChalkboard, faFileLines, faPlus } from "@fortawesome/free-solid-svg-icons";
import { VsrWordmark } from "../../../components/branding/VsrBrand.jsx";

function CompanyHub({ view, itemCount, userName, onOpenDocuments, onStartTraining, onOpenBoard }) {
  const isTraining = view === "training";
  const greetingName = userName?.trim();

  return (
    <div className="company-hub">
      <header className="company-hero">
        <div className="company-hero-copy">
          <span className="company-eyebrow">{isTraining ? "LEARNING & DEVELOPMENT" : "YOUR WORKSPACE"}</span>
          <h1>{isTraining ? "Your learning workspace" : greetingName ? `Welcome back, ${greetingName}` : "Welcome back"}</h1>
          <p>
            {isTraining
              ? "Create private learning notes and keep your preparation materials together."
              : "Your documents, tasks, learning notes, and planning tools are saved to your account."}
          </p>
          <div className="company-hero-actions">
            <button type="button" className="primary-action" onClick={isTraining ? onStartTraining : onOpenDocuments}>
              <FontAwesomeIcon icon={isTraining ? faPlus : faFileLines} />
              <span>{isTraining ? "Create a learning note" : "Open documents"}</span>
            </button>
            <button type="button" className="secondary-action" onClick={onOpenBoard}>
              <FontAwesomeIcon icon={faChalkboard} />
              <span>Open whiteboard</span>
            </button>
          </div>
        </div>
        <div className="company-hero-emblem" role="img" aria-label="VSR Group of Companies">
          <VsrWordmark className="welcome-brand-wordmark company-hero-wordmark" />
          <span className="company-hero-emblem-caption">GROUP OF COMPANIES</span>
        </div>
      </header>

      <section className="company-section" aria-labelledby="workspace-summary-title">
        <div className="company-section-heading">
          <div>
            <span className="company-eyebrow">PRIVATE TO YOUR ACCOUNT</span>
            <h2 id="workspace-summary-title">{isTraining ? "Learning notes" : "Your documents"}</h2>
          </div>
        </div>
        <div className="company-stat-grid">
          <article className="company-stat-card is-files-stat">
            <span className="company-stat-icon is-amber"><FontAwesomeIcon icon={isTraining ? faBookOpen : faFileLines} /></span>
            <span className="company-stat-label">{isTraining ? "Workspace items" : "Saved items"}</span>
            <strong>{itemCount}</strong>
            <span className="company-stat-note">Available after you sign in to your account</span>
          </article>
        </div>
      </section>

      <div className="company-content-grid">
        <section className="company-panel" aria-labelledby="workspace-tools-title">
          <div className="company-panel-heading">
            <span className="company-panel-icon"><FontAwesomeIcon icon={faBookOpen} /></span>
            <div>
              <h2 id="workspace-tools-title">{isTraining ? "Keep learning materials together" : "A focused place to work"}</h2>
              <span>{isTraining ? "Start with a note, then add the details that matter to you." : "Create and organize information for your own account."}</span>
            </div>
          </div>
          <p className="company-purpose-copy">
            {isTraining
              ? "Learning notes are private to your account. Add your own topics, goals, and reference materials."
              : "Use folders, notes, file uploads, sticky tasks, your calendar, and the whiteboard to organize your work."}
          </p>
        </section>
      </div>
    </div>
  );
}

export default CompanyHub;

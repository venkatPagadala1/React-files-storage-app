import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBookOpen, faChalkboard, faFileLines, faPlus } from "@fortawesome/free-solid-svg-icons";
import { VsrWordmark } from "../../../components/branding/VsrBrand.jsx";

function CompanyHub({ view, itemCount, userName, onOpenDocuments, onStartTraining, onOpenBoard }) {
  const isTraining = view === "training";
  const greetingName = userName?.trim();

  return (
    <div className="company-hub grid gap-[clamp(16px,2vw,23px)] pb-6">
      <header className="company-hero relative flex min-h-[284px] items-center justify-between gap-[22px] overflow-hidden p-[clamp(26px,4.2vw,48px)] max-[620px]:min-h-0 max-[620px]:flex-col max-[620px]:items-start max-[620px]:px-[21px] max-[620px]:py-6">
        <div className="company-hero-copy relative z-[1] max-w-[650px]">
          <span className="company-eyebrow">{isTraining ? "LEARNING & DEVELOPMENT" : "YOUR WORKSPACE"}</span>
          <h1 className="mt-[13px] max-w-[650px] text-[clamp(2rem,3.4vw,3.15rem)] font-[790] leading-[1.06] tracking-[-0.06em]">{isTraining ? "Your learning workspace" : greetingName ? `Welcome back, ${greetingName}` : "Welcome back"}</h1>
          <p className="mt-3 max-w-[560px] text-[0.9rem] leading-[1.75]">
            {isTraining
              ? "Create private learning notes and keep your preparation materials together."
              : "Your documents, tasks, learning notes, and planning tools are saved to your account."}
          </p>
          <div className="company-hero-actions mt-[22px] flex max-[620px]:max-w-[230px] flex-wrap gap-[9px]">
            <button type="button" className="primary-action min-h-11 rounded-[11px] px-[15px] max-[620px]:w-full max-[620px]:justify-center" onClick={isTraining ? onStartTraining : onOpenDocuments}>
              <FontAwesomeIcon icon={isTraining ? faPlus : faFileLines} />
              <span>{isTraining ? "Create a learning note" : "Open documents"}</span>
            </button>
            <button type="button" className="secondary-action min-h-11 rounded-[11px] px-[15px] max-[620px]:w-full max-[620px]:justify-center" onClick={onOpenBoard}>
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

      <section className="company-section grid gap-[15px]" aria-labelledby="workspace-summary-title">
        <div className="company-section-heading flex items-end justify-between gap-[14px]">
          <div>
            <span className="company-eyebrow">PRIVATE TO YOUR ACCOUNT</span>
            <h2 className="mt-[5px] text-xl font-[760] tracking-[-0.04em]" id="workspace-summary-title">{isTraining ? "Learning notes" : "Your documents"}</h2>
          </div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-[14px]">
          <article className="company-stat-card is-files-stat max-w-[440px]">
            <span className="company-stat-icon is-amber"><FontAwesomeIcon icon={isTraining ? faBookOpen : faFileLines} /></span>
            <span className="company-stat-label">{isTraining ? "Workspace items" : "Saved items"}</span>
            <strong>{itemCount}</strong>
            <span className="company-stat-note">Available after you sign in to your account</span>
          </article>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-[14px]">
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

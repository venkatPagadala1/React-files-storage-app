import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faArrowUpRightFromSquare,
  faBookOpen,
  faBriefcase,
  faBuilding,
  faChalkboard,
  faChevronDown,
  faChevronUp,
  faEye,
  faEnvelope,
  faLink,
  faFileLines,
  faFloppyDisk,
  faLock,
  faLocationDot,
  faPenToSquare,
  faPeopleGroup,
  faPlus,
  faUser,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { VsrLogoMark } from "../../../components/branding/VsrBrand.jsx";

const TRAINING_PATHS_STORAGE_KEY = "vsr-training-path-resources-v1";
const TEAM_PROFILES_STORAGE_KEY = "vsr-team-member-profiles-v1";
const learningPaths = [
  { id: "ai-engineering", title: "AI engineering foundations", detail: "Model workflows · evaluation · responsible AI", topics: 4 },
  { id: "secure-development", title: "Secure product development", detail: "Privacy · threat modeling · safe releases", topics: 6 },
  { id: "communication", title: "Communication & collaboration", detail: "Technical storytelling · team practices", topics: 3 },
];

function readTrainingResources() {
  try {
    const stored = window.localStorage.getItem(TRAINING_PATHS_STORAGE_KEY);
    if (!stored) return {};
    const resources = JSON.parse(stored);
    if (!resources || typeof resources !== "object" || Array.isArray(resources)) {
      throw new Error("Saved learning resources have an invalid format.");
    }
    return resources;
  } catch (error) {
    console.error("Could not load learning path resources.", error);
    return {};
  }
}

const demoPeople = [
  {
    initials: "VR",
    name: "Venkateswara Reddy",
    role: "AI Engineering",
    status: "Active",
    email: "venkateswara@example.com",
    title: "AI Engineer & Founder",
    location: "Hyderabad, India",
    bio: "Building practical, responsible AI products and creating a learning-focused workplace where people can grow together.",
    skills: "Applied AI, machine learning, product strategy",
    interests: "Responsible AI, mentoring, new ventures",
  },
  {
    initials: "KA",
    name: "Anjali Reddy",
    role: "Product Design",
    status: "Learning",
    email: "anjali@example.com",
    title: "Product Designer",
    location: "Hyderabad, India",
    bio: "Designs clear and thoughtful digital experiences, bringing user needs and product goals together.",
    skills: "Product design, prototyping, user research",
    interests: "Accessibility, design systems, visual storytelling",
  },
  {
    initials: "RL",
    name: "Ram & lakshman",
    role: "Platform Engineering",
    status: "Active",
    email: "ram.lakshman@example.com",
    title: "Platform Engineer",
    location: "India",
    bio: "Works on dependable platform foundations and shares practical engineering knowledge with the team.",
    skills: "Cloud platforms, developer tooling, reliability",
    interests: "Automation, system design, open learning",
  },
];

function readTeamProfiles() {
  const defaults = Object.fromEntries(
    demoPeople.map(({ initials, name, email, title, location, bio, skills, interests }) => [
      initials,
      { name, email, title, location, bio, skills, interests },
    ]),
  );
  try {
    const stored = window.localStorage.getItem(TEAM_PROFILES_STORAGE_KEY);
    if (!stored) return defaults;
    const savedProfiles = JSON.parse(stored);
    if (!savedProfiles || typeof savedProfiles !== "object" || Array.isArray(savedProfiles)) {
      throw new Error("Saved team profiles have an invalid format.");
    }
    return Object.fromEntries(
      demoPeople.map((person) => {
        const savedProfile = savedProfiles[person.initials];
        if (!savedProfile || typeof savedProfile !== "object" || Array.isArray(savedProfile)) {
          return [person.initials, defaults[person.initials]];
        }
        const profile = { ...defaults[person.initials] };
        for (const field of ["name", "email", "title", "location", "bio", "skills", "interests"]) {
          if (typeof savedProfile[field] === "string") profile[field] = savedProfile[field];
        }
        return [person.initials, profile];
      }),
    );
  } catch (error) {
    console.error("Could not load team member profiles.", error);
    return defaults;
  }
}

const demoResources = [
  { title: "Team handbook", detail: "Culture, collaboration, and ways of working", type: "POLICY · SAMPLE" },
  { title: "Responsible AI principles", detail: "Guidelines for developing and evaluating AI products", type: "GUIDE · SAMPLE" },
  { title: "New employee orientation", detail: "A starting point for joining the VSR team", type: "ONBOARDING · SAMPLE" },
];

function CompanyHub({
  view,
  role,
  itemCount,
  onOpenTraining,
  onStartTraining,
  onOpenBoard,
}) {
  const isTraining = view === "training";
  const isResources = view === "company-resources";
  const isTeamAdmin = view === "team-admin";
  const [teamRoles, setTeamRoles] = useState(() =>
    Object.fromEntries(
      demoPeople.map((person, index) => [
        person.initials,
        ["Admin", "Manager", "Employee"][index],
      ]),
    ),
  );
  const [teamProfiles, setTeamProfiles] = useState(readTeamProfiles);
  const [selectedTeamMember, setSelectedTeamMember] = useState(null);
  const [teamProfileDraft, setTeamProfileDraft] = useState(null);
  const [isEditingTeamProfile, setIsEditingTeamProfile] = useState(false);
  const [teamProfileMessage, setTeamProfileMessage] = useState("");
  const [trainingResources, setTrainingResources] = useState(readTrainingResources);
  const [expandedPathId, setExpandedPathId] = useState(null);
  const [resourceFormPathId, setResourceFormPathId] = useState(null);
  const [resourceError, setResourceError] = useState("");
  const [editingResource, setEditingResource] = useState(null);
  const [viewingResource, setViewingResource] = useState(null);
  const teamMembers = demoPeople.map((person) => ({
    ...person,
    ...teamProfiles[person.initials],
  }));

  function openTeamProfile(person) {
    setSelectedTeamMember(person.initials);
    setTeamProfileDraft({ ...teamProfiles[person.initials] });
    setIsEditingTeamProfile(false);
    setTeamProfileMessage("");
  }

  function saveTeamProfile(event) {
    event.preventDefault();
    const updatedProfile = {
      ...teamProfileDraft,
      name: teamProfileDraft.name.trim(),
      email: teamProfileDraft.email.trim(),
      title: teamProfileDraft.title.trim(),
      location: teamProfileDraft.location.trim(),
      bio: teamProfileDraft.bio.trim(),
      skills: teamProfileDraft.skills.trim(),
      interests: teamProfileDraft.interests.trim(),
    };
    if (!updatedProfile.name || !updatedProfile.email) return;

    const nextProfiles = { ...teamProfiles, [selectedTeamMember]: updatedProfile };
    try {
      window.localStorage.setItem(TEAM_PROFILES_STORAGE_KEY, JSON.stringify(nextProfiles));
      setTeamProfiles(nextProfiles);
      setTeamProfileDraft(updatedProfile);
      setIsEditingTeamProfile(false);
      setTeamProfileMessage("Profile saved in this browser.");
    } catch (error) {
      console.error("Could not save team member profile.", error);
      setTeamProfileMessage("Could not save this profile in browser storage.");
    }
  }

  function saveTrainingResources(nextResources) {
    try {
      window.localStorage.setItem(TRAINING_PATHS_STORAGE_KEY, JSON.stringify(nextResources));
      setTrainingResources(nextResources);
      setResourceError("");
      return true;
    } catch (error) {
      console.error("Could not save learning path resources.", error);
      setResourceError("Could not save this resource in browser storage.");
      return false;
    }
  }

  function addLearningResource(pathId, event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("resourceTitle") ?? "").trim();
    const url = String(formData.get("resourceUrl") ?? "").trim();
    const type = String(formData.get("resourceType") ?? "Course");
    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch {
      setResourceError("Enter a valid course or resource URL.");
      return;
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      setResourceError("Only HTTP and HTTPS links are allowed.");
      return;
    }
    if (!title) {
      setResourceError("Enter a title for this learning resource.");
      return;
    }

    const resource = { id: crypto.randomUUID(), title, url: parsedUrl.href, type };
    const nextResources = {
      ...trainingResources,
      [pathId]: [...(trainingResources[pathId] ?? []), resource],
    };
    if (saveTrainingResources(nextResources)) {
      setResourceFormPathId(null);
      event.currentTarget.reset();
    }
  }

  function removeLearningResource(pathId, resourceId) {
    saveTrainingResources({
      ...trainingResources,
      [pathId]: (trainingResources[pathId] ?? []).filter(
        (resource) => resource.id !== resourceId,
      ),
    });
  }

  function startEditingResource(pathId, resource) {
    setResourceError("");
    setResourceFormPathId(null);
    setViewingResource(null);
    setEditingResource({
      pathId,
      resourceId: resource.id,
      title: resource.title,
      url: resource.url,
      type: resource.type,
    });
  }

  function saveEditedResource(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const title = String(formData.get("editResourceTitle") ?? "").trim();
    const url = String(formData.get("editResourceUrl") ?? "").trim();
    const type = String(formData.get("editResourceType") ?? "Course");
    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch {
      setResourceError("Enter a valid course or resource URL.");
      return;
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      setResourceError("Only HTTP and HTTPS links are allowed.");
      return;
    }
    if (!title) {
      setResourceError("Enter a title for this learning resource.");
      return;
    }

    const { pathId, resourceId } = editingResource;
    const nextResources = {
      ...trainingResources,
      [pathId]: (trainingResources[pathId] ?? []).map((resource) =>
        resource.id === resourceId
          ? { ...resource, title, url: parsedUrl.href, type }
          : resource,
      ),
    };
    if (saveTrainingResources(nextResources)) setEditingResource(null);
  }

  return (
    <div className="company-hub">
      <header className="company-hero">
        <div className="company-hero-copy">
          <span className="company-eyebrow">
            {isTraining
              ? "LEARNING & DEVELOPMENT"
              : isResources
                ? "COMPANY LIBRARY"
                : isTeamAdmin
                  ? "ADMINISTRATION · PREVIEW"
                  : "VSR GROUP OF COMPANIES"}
          </span>
          <h1>
            {isTraining
              ? "Build skills that move us forward."
              : isResources
                ? "Company knowledge, ready to explore."
                : isTeamAdmin
                  ? "A clearer view of your growing team."
                : "A shared place to do your best work."}
          </h1>
          <p>
            {isTraining
              ? "Organize learning plans, capture important topics, and prepare with your team."
              : isResources
                ? "A prototype view of the policies, guides, and onboarding resources your team will use."
                : isTeamAdmin
                  ? "Review sample team members and preview role assignments."
                : "Bring company resources and employee preparation together in one thoughtfully organized workspace."}
          </p>
          <div className="company-hero-actions">
            <button type="button" className="primary-action" onClick={isTraining ? onStartTraining : onOpenTraining}>
              <FontAwesomeIcon icon={isTraining ? faFileLines : faBookOpen} />
              <span>{isTraining ? "Create a training plan" : "Explore training"}</span>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
            <button type="button" className="secondary-action" onClick={onOpenBoard}>
              <FontAwesomeIcon icon={faChalkboard} />
              <span>Open whiteboard</span>
            </button>
          </div>
        </div>
        <div className="company-hero-emblem" aria-hidden="true">
          <span className="company-emblem-glow" />
          <VsrLogoMark />
          <span className="company-emblem-caption">VSR · GROUP</span>
        </div>
      </header>

      <div className="company-prototype-banner" role="note">
        <FontAwesomeIcon icon={faLock} />
        <span>
          <strong>Prototype preview, not a secure company portal.</strong> Names and metrics below are sample data.
          Current files remain only in this browser and are not encrypted or access-controlled.
        </span>
      </div>

      <section className="company-section" aria-labelledby="company-overview-title">
        <div className="company-section-heading">
          <div>
            <span className="company-eyebrow">{isTraining ? "YOUR LEARNING SPACE" : "WORKSPACE OVERVIEW"}</span>
            <h2 id="company-overview-title">
              {isTraining
                ? "Learning at a glance"
                : isResources
                  ? "Resource library"
                  : isTeamAdmin
                    ? "Team administration"
                    : "Company at a glance"}
            </h2>
          </div>
          <span className="prototype-chip">DEMO DATA</span>
        </div>
        <div className="company-stat-grid">
          <article className="company-stat-card is-team-stat">
            <span className="company-stat-icon"><FontAwesomeIcon icon={faPeopleGroup} /></span>
            <span className="company-stat-label">Team members</span>
            <strong>24</strong>
            <span className="company-stat-note">Sample company metric</span>
          </article>
          <article className="company-stat-card is-learning-stat">
            <span className="company-stat-icon is-violet"><FontAwesomeIcon icon={faBookOpen} /></span>
            <span className="company-stat-label">Training plans</span>
            <strong>08</strong>
            <span className="company-stat-note">Example learning paths</span>
          </article>
          <article className="company-stat-card is-files-stat">
            <span className="company-stat-icon is-amber"><FontAwesomeIcon icon={faFileLines} /></span>
            <span className="company-stat-label">Your local items</span>
            <strong>{itemCount}</strong>
            <span className="company-stat-note">Saved in this browser only</span>
          </article>
        </div>
      </section>

      <div className="company-content-grid">
        <section className="company-panel" aria-labelledby="company-info-title">
          <div className="company-panel-heading">
            <span className="company-panel-icon"><FontAwesomeIcon icon={faBuilding} /></span>
            <div>
              <h2 id="company-info-title">
                {isTraining
                  ? "Suggested learning paths"
                  : isResources
                    ? "Featured company documents"
                    : isTeamAdmin
                      ? "Team members"
                          : "Our purpose & motivation"}
              </h2>
              <span>
                {isTraining
                  ? "Select a learning path to add courses and links · saved only in this browser"
                  : isResources
                    ? "Illustrative titles only · no files are attached"
                    : isTeamAdmin
                      ? "Role assignments are local UI previews only"
                      : "Founding vision · a draft for the company profile"}
              </span>
            </div>
          </div>
          {isTraining ? (
            <>
              {resourceError && <p className="learning-resource-error" role="alert">{resourceError}</p>}
              <ul className="learning-path-list">
                {learningPaths.map((path, index) => {
                  const isExpanded = expandedPathId === path.id;
                  const resources = trainingResources[path.id] ?? [];
                  return (
                    <li className={`learning-path-item${isExpanded ? " is-expanded" : ""}`} key={path.id}>
                      <button
                        type="button"
                        className="learning-path-toggle"
                        aria-expanded={isExpanded}
                        aria-controls={`learning-path-content-${path.id}`}
                        onClick={() => {
                          setExpandedPathId(isExpanded ? null : path.id);
                          setResourceFormPathId(null);
                          setResourceError("");
                        }}
                      >
                        <span className="learning-path-number">{String(index + 1).padStart(2, "0")}</span>
                        <span className="learning-path-copy">
                          <strong>{path.title}</strong>
                          <small>{path.detail}</small>
                        </span>
                        <b>{path.topics} topics · {resources.length} {resources.length === 1 ? "resource" : "resources"}</b>
                        <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} />
                      </button>
                      {isExpanded && (
                        <div className="learning-path-details" id={`learning-path-content-${path.id}`}>
                          <div className="learning-path-resource-heading">
                            <span>Courses & useful links</span>
                            <button
                              type="button"
                              className="learning-resource-add"
                              onClick={() => {
                                setResourceError("");
                                setResourceFormPathId(resourceFormPathId === path.id ? null : path.id);
                              }}
                            >
                              <FontAwesomeIcon icon={faPlus} />
                              Add course or link
                            </button>
                          </div>
                          {resources.length > 0 ? (
                            <ul className="learning-resource-items">
                              {resources.map((resource) => (
                                <li className="learning-resource-row" key={resource.id}>
                                  {editingResource?.resourceId === resource.id ? (
                                    <form
                                      className="learning-resource-form is-editing"
                                      onSubmit={saveEditedResource}
                                    >
                                      <label>
                                        Resource type
                                        <select
                                          name="editResourceType"
                                          value={editingResource.type}
                                          onChange={(event) =>
                                            setEditingResource((current) => ({
                                              ...current,
                                              type: event.target.value,
                                            }))
                                          }
                                        >
                                          <option>Course</option>
                                          <option>Video</option>
                                          <option>Article</option>
                                          <option>Documentation</option>
                                          <option>Other link</option>
                                        </select>
                                      </label>
                                      <label>
                                        Title
                                        <input
                                          name="editResourceTitle"
                                          type="text"
                                          maxLength="100"
                                          value={editingResource.title}
                                          onChange={(event) =>
                                            setEditingResource((current) => ({
                                              ...current,
                                              title: event.target.value,
                                            }))
                                          }
                                          required
                                        />
                                      </label>
                                      <label>
                                        URL
                                        <input
                                          name="editResourceUrl"
                                          type="url"
                                          maxLength="2048"
                                          value={editingResource.url}
                                          onChange={(event) =>
                                            setEditingResource((current) => ({
                                              ...current,
                                              url: event.target.value,
                                            }))
                                          }
                                          required
                                        />
                                      </label>
                                      {resourceError && <p className="learning-resource-error" role="alert">{resourceError}</p>}
                                      <div>
                                        <button
                                          type="button"
                                          className="secondary-action"
                                          onClick={() => {
                                            setEditingResource(null);
                                            setResourceError("");
                                          }}
                                        >
                                          Cancel
                                        </button>
                                        <button type="submit" className="primary-action">Save changes</button>
                                      </div>
                                    </form>
                                  ) : (
                                    <>
                                      <FontAwesomeIcon icon={faLink} />
                                      <button
                                        type="button"
                                        className="learning-resource-summary"
                                        onClick={() => setViewingResource({ ...resource, pathId: path.id, pathTitle: path.title })}
                                        aria-label={`Full view of ${resource.title}`}
                                      >
                                        <strong>{resource.title}</strong>
                                        <small>{resource.type} · opens in a new tab</small>
                                      </button>
                                      <div className="learning-resource-actions">
                                        <button
                                          type="button"
                                          aria-label={`Full view of ${resource.title}`}
                                          title="Full view"
                                          onClick={() => setViewingResource({ ...resource, pathId: path.id, pathTitle: path.title })}
                                        >
                                          <FontAwesomeIcon icon={faEye} />
                                        </button>
                                        <button
                                          type="button"
                                          aria-label={`Edit ${resource.title}`}
                                          title="Edit"
                                          onClick={() => startEditingResource(path.id, resource)}
                                        >
                                          <FontAwesomeIcon icon={faPenToSquare} />
                                        </button>
                                        <button
                                          type="button"
                                          aria-label={`Remove ${resource.title}`}
                                          title="Remove"
                                          onClick={() => removeLearningResource(path.id, resource.id)}
                                        >
                                          <FontAwesomeIcon icon={faXmark} />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="learning-resource-empty">
                              No courses or links yet. Add a useful resource for this learning path.
                            </p>
                          )}
                          {resourceFormPathId === path.id && (
                            <form
                              className="learning-resource-form"
                              onSubmit={(event) => addLearningResource(path.id, event)}
                            >
                              <label>
                                Resource type
                                <select name="resourceType" defaultValue="Course">
                                  <option>Course</option>
                                  <option>Video</option>
                                  <option>Article</option>
                                  <option>Documentation</option>
                                  <option>Other link</option>
                                </select>
                              </label>
                              <label>
                                Title
                                <input name="resourceTitle" type="text" maxLength="100" placeholder="e.g. Introduction to model evaluation" required />
                              </label>
                              <label>
                                URL
                                <input name="resourceUrl" type="url" maxLength="2048" placeholder="https://example.com/course" required />
                              </label>
                              <div>
                                <button type="button" className="secondary-action" onClick={() => setResourceFormPathId(null)}>Cancel</button>
                                <button type="submit" className="primary-action">Save resource</button>
                              </div>
                            </form>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          ) : isResources ? (
            <ul className="company-resource-list">
              {demoResources.map((resource) => (
                <li key={resource.title}>
                  <span className="company-resource-icon"><FontAwesomeIcon icon={faFileLines} /></span>
                  <span><strong>{resource.title}</strong><small>{resource.detail}</small></span>
                  <b>{resource.type}</b>
                </li>
              ))}
            </ul>
          ) : isTeamAdmin ? (
            <ul className="team-admin-list">
              {teamMembers.map((person) => (
                <li key={person.initials}>
                  <button
                    type="button"
                    className="team-profile-trigger"
                    onClick={() => openTeamProfile(person)}
                    aria-label={`View ${person.name}'s profile`}
                  >
                    <span className="company-avatar">{person.initials}</span>
                    <span className="company-person-copy">
                      <strong>{person.name}</strong>
                      <small>{person.role} · view profile</small>
                    </span>
                  </button>
                  <label>
                    <span className="visually-hidden">Preview role for {person.name}</span>
                    <select
                      value={teamRoles[person.initials]}
                      onChange={(event) =>
                        setTeamRoles((roles) => ({
                          ...roles,
                          [person.initials]: event.target.value,
                        }))
                      }
                    >
                      <option>Admin</option>
                      <option>Manager</option>
                      <option>Employee</option>
                    </select>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <div className="company-profile">
              <p>
                <strong>VSR Group of Companies</strong> is being built on a simple belief: technology should turn
                ambitious ideas into practical progress. Our goal is to bring thoughtful AI, modern software, and
                continuous learning together to help people and businesses solve meaningful problems and grow with
                confidence.
              </p>
              <blockquote className="company-motivation">
                “Build with curiosity. Learn together. Create technology that earns trust and makes a meaningful
                difference.”
                <cite>Our founding motivation</cite>
              </blockquote>
              <div><span>Purpose</span><strong>Make useful, responsible technology more accessible</strong></div>
              <div><span>Vision</span><strong>Build trusted technology ventures that help people and businesses grow</strong></div>
              <div><span>Principles</span><strong>People first · Responsible AI · Privacy by design · Learn openly</strong></div>
              <div><span>Workspace</span><strong>Company knowledge and employee learning in one planned workspace</strong></div>
            </div>
          )}
        </section>

        <section className="company-panel company-team-panel" aria-labelledby="company-team-title">
          <div className="company-panel-heading">
            <span className="company-panel-icon is-team"><FontAwesomeIcon icon={faPeopleGroup} /></span>
            <div>
              <h2 id="company-team-title">
                {isTraining
                  ? "Preparation checklist"
                  : isResources
                    ? "Resource handling"
                    : isTeamAdmin
                      ? "Administration controls"
                      : "Team activity"}
              </h2>
              <span>
                {isTraining
                  ? "A simple starting point for each topic"
                  : isResources
                    ? "Planned behavior · not implemented"
                    : isTeamAdmin
                      ? "Prototype controls · no accounts are changed"
                      : `Previewing as ${role} · sample team`}
              </span>
            </div>
          </div>
          {isTraining ? (
            <ul className="training-checklist">
              <li><span className="checklist-number">1</span>Choose a topic and define your learning goal</li>
              <li><span className="checklist-number">2</span>Capture key notes in a preparation board</li>
              <li><span className="checklist-number">3</span>Use the whiteboard to map your ideas</li>
            </ul>
          ) : isResources ? (
            <ul className="training-checklist">
              <li><span className="checklist-number">1</span>Company files will be private to approved teams</li>
              <li><span className="checklist-number">2</span>Access will be checked by the server, not this UI</li>
              <li><span className="checklist-number">3</span>Uploads remain disabled until secure storage is configured</li>
            </ul>
          ) : isTeamAdmin ? (
            <ul className="training-checklist">
              <li><span className="checklist-number">1</span>Role-based feature visibility is a visual prototype</li>
              <li><span className="checklist-number">2</span>Changes here are not saved to user accounts</li>
              <li><span className="checklist-number">3</span>Enforce permissions on the server before launch</li>
            </ul>
          ) : (
            <ul className="company-people-list">
              {demoPeople.map((person) => (
                <li key={person.initials}>
                  <span className="company-avatar">{person.initials}</span>
                  <span className="company-person-copy"><strong>{person.name}</strong><small>{person.role}</small></span>
                  <span className="company-person-status">{person.status}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="company-bottom-note">
        <FontAwesomeIcon icon={faArrowRight} />
        <span>This preview demonstrates the intended experience. Team accounts, private company storage, and real access controls are not connected.</span>
      </div>

      {selectedTeamMember && teamProfileDraft && (
        <div className="learning-resource-modal-backdrop">
          <section
            className="learning-resource-modal team-profile-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-profile-modal-title"
          >
            <div className="learning-resource-modal-heading">
              <div>
                <span>TEAM MEMBER PROFILE · LOCAL DEMO</span>
                <h2 id="team-profile-modal-title">{teamProfileDraft.name}</h2>
              </div>
              <button
                type="button"
                aria-label="Close team member profile"
                onClick={() => setSelectedTeamMember(null)}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            {isEditingTeamProfile ? (
              <form className="team-profile-form" onSubmit={saveTeamProfile}>
                <label>
                  Full name
                  <input
                    type="text"
                    maxLength="80"
                    value={teamProfileDraft.name}
                    onChange={(event) => setTeamProfileDraft((profile) => ({ ...profile, name: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Email address
                  <input
                    type="email"
                    maxLength="254"
                    value={teamProfileDraft.email}
                    onChange={(event) => setTeamProfileDraft((profile) => ({ ...profile, email: event.target.value }))}
                    required
                  />
                </label>
                <label>
                  Job title
                  <input
                    type="text"
                    maxLength="100"
                    value={teamProfileDraft.title}
                    onChange={(event) => setTeamProfileDraft((profile) => ({ ...profile, title: event.target.value }))}
                  />
                </label>
                <label>
                  Location
                  <input
                    type="text"
                    maxLength="100"
                    value={teamProfileDraft.location}
                    onChange={(event) => setTeamProfileDraft((profile) => ({ ...profile, location: event.target.value }))}
                  />
                </label>
                <label className="team-profile-form-wide">
                  About
                  <textarea
                    rows="3"
                    maxLength="600"
                    value={teamProfileDraft.bio}
                    onChange={(event) => setTeamProfileDraft((profile) => ({ ...profile, bio: event.target.value }))}
                  />
                </label>
                <label className="team-profile-form-wide">
                  Skills
                  <input
                    type="text"
                    maxLength="240"
                    placeholder="Separate skills with commas"
                    value={teamProfileDraft.skills}
                    onChange={(event) => setTeamProfileDraft((profile) => ({ ...profile, skills: event.target.value }))}
                  />
                </label>
                <label className="team-profile-form-wide">
                  Interests & learning goals
                  <input
                    type="text"
                    maxLength="240"
                    value={teamProfileDraft.interests}
                    onChange={(event) => setTeamProfileDraft((profile) => ({ ...profile, interests: event.target.value }))}
                  />
                </label>
                <div className="team-profile-form-footer">
                  <span role="status" aria-live="polite">{teamProfileMessage}</span>
                  <button type="button" className="secondary-action" onClick={() => {
                    setTeamProfileDraft({ ...teamProfiles[selectedTeamMember] });
                    setIsEditingTeamProfile(false);
                    setTeamProfileMessage("");
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-action">
                    <FontAwesomeIcon icon={faFloppyDisk} />
                    Save profile
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="team-profile-summary">
                  <span className="company-avatar team-profile-avatar">
                    {demoPeople.find((person) => person.initials === selectedTeamMember)?.initials}
                  </span>
                  <div>
                    <strong>{teamProfileDraft.title || "VSR team member"}</strong>
                    <span>{demoPeople.find((person) => person.initials === selectedTeamMember)?.role}</span>
                  </div>
                </div>
                <dl className="team-profile-details">
                  <div>
                    <dt><FontAwesomeIcon icon={faEnvelope} /> Email</dt>
                    <dd><a href={`mailto:${teamProfileDraft.email}`}>{teamProfileDraft.email}</a></dd>
                  </div>
                  <div>
                    <dt><FontAwesomeIcon icon={faLocationDot} /> Location</dt>
                    <dd>{teamProfileDraft.location || "Not provided"}</dd>
                  </div>
                  <div className="team-profile-detail-wide">
                    <dt><FontAwesomeIcon icon={faUser} /> About</dt>
                    <dd>{teamProfileDraft.bio || "No profile information added yet."}</dd>
                  </div>
                  <div className="team-profile-detail-wide">
                    <dt><FontAwesomeIcon icon={faBriefcase} /> Skills</dt>
                    <dd>{teamProfileDraft.skills || "Not provided"}</dd>
                  </div>
                  <div className="team-profile-detail-wide">
                    <dt><FontAwesomeIcon icon={faBookOpen} /> Interests & learning goals</dt>
                    <dd>{teamProfileDraft.interests || "Not provided"}</dd>
                  </div>
                </dl>
                <div className="team-profile-form-footer">
                  <span role="status" aria-live="polite">{teamProfileMessage}</span>
                  <button type="button" className="primary-action" onClick={() => {
                    setIsEditingTeamProfile(true);
                    setTeamProfileMessage("");
                  }}>
                    <FontAwesomeIcon icon={faPenToSquare} />
                    Edit profile
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}

      {viewingResource && (
        <div className="learning-resource-modal-backdrop">
          <section
            className="learning-resource-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="learning-resource-modal-title"
          >
            <div className="learning-resource-modal-heading">
              <div>
                <span>{viewingResource.type} · {viewingResource.pathTitle}</span>
                <h2 id="learning-resource-modal-title">{viewingResource.title}</h2>
              </div>
              <button
                type="button"
                aria-label="Close resource details"
                onClick={() => setViewingResource(null)}
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <dl>
              <dt>Resource URL</dt>
              <dd>{viewingResource.url}</dd>
            </dl>
            <div className="learning-resource-modal-actions">
              <button
                type="button"
                className="secondary-action"
                onClick={() => startEditingResource(viewingResource.pathId, viewingResource)}
              >
                <FontAwesomeIcon icon={faPenToSquare} />
                Edit resource
              </button>
              <a href={viewingResource.url} target="_blank" rel="noopener noreferrer">
                Open link
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
              </a>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default CompanyHub;

import { useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCamera,
  faCircleUser,
  faFloppyDisk,
  faTrash,
  faUserPen,
} from "@fortawesome/free-solid-svg-icons";

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "DM";
}

function UserProfile({ profile, onSave }) {
  const [form, setForm] = useState(profile);
  const [savedMessage, setSavedMessage] = useState("");
  const [statusTone, setStatusTone] = useState("");
  const photoInputRef = useRef(null);

  function reportStatus(message, tone) {
    setSavedMessage(message);
    setStatusTone(tone);
  }

  function handleSubmit(event) {
    event.preventDefault();
    const updatedProfile = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      title: form.title.trim(),
      bio: form.bio.trim(),
    };
    if (!updatedProfile.name || !updatedProfile.email) return;
    if (!onSave(updatedProfile)) {
      reportStatus("Profile could not be saved in this browser.", "error");
      return;
    }
    setForm(updatedProfile);
    reportStatus("Profile saved in this browser.", "success");
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setSavedMessage("");
    setStatusTone("");
  }

  function handlePhotoChange(event) {
    const [file] = event.target.files ?? [];
    event.target.value = "";
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      reportStatus("Choose a JPG, PNG, or WebP image.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reportStatus("Choose an image smaller than 5 MB.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reportStatus("The selected image could not be read.", "error");
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reportStatus("The selected image could not be opened.", "error");
      image.onload = () => {
        const scale = Math.min(1, 512 / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          reportStatus("Your browser could not process this image.", "error");
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        updateField("avatar", canvas.toDataURL("image/jpeg", 0.82));
        reportStatus("Photo added. Save your profile to keep this change.", "info");
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="user-profile-page">
      <section className="profile-hero">
        <div className="profile-avatar-group">
          <div className="profile-avatar" aria-hidden="true">
            {form.avatar
              ? <img src={form.avatar} alt="" />
              : getInitials(form.name)}
          </div>
          <div className="profile-photo-actions">
            <input
              ref={photoInputRef}
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              aria-label="Choose a profile photo"
            />
            <button
              type="button"
              className="profile-photo-button"
              onClick={() => photoInputRef.current?.click()}
            >
              <FontAwesomeIcon icon={faCamera} />
              {form.avatar ? "Change photo" : "Add photo"}
            </button>
            {form.avatar && (
              <button
                type="button"
                className="profile-photo-remove"
                onClick={() => updateField("avatar", "")}
              >
                <FontAwesomeIcon icon={faTrash} />
                Remove
              </button>
            )}
            <small className="profile-photo-help">JPG, PNG or WebP · up to 5 MB</small>
          </div>
        </div>
        <div>
          <span className="company-eyebrow">YOUR WORKSPACE PROFILE</span>
          <h2>{form.name || "Demo member"}</h2>
          <p>{form.title || "VSR workspace member"}</p>
        </div>
        <span className="profile-preview-badge">
          <FontAwesomeIcon icon={faCircleUser} />
          Local demo profile
        </span>
      </section>

      <div className="profile-content-grid">
        <section className="company-panel profile-edit-panel" aria-labelledby="profile-edit-title">
          <div className="company-panel-heading">
            <span className="company-panel-icon"><FontAwesomeIcon icon={faUserPen} /></span>
            <div>
              <h2 id="profile-edit-title">Personal details</h2>
              <span>Update how you appear in this learning workspace.</span>
            </div>
          </div>
          <form className="profile-form" onSubmit={handleSubmit}>
            <label>
              Display name
              <input
                type="text"
                value={form.name}
                maxLength="80"
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                value={form.email}
                maxLength="254"
                onChange={(event) => updateField("email", event.target.value)}
                required
              />
            </label>
            <label>
              Role or learning focus
              <input
                type="text"
                value={form.title}
                maxLength="100"
                placeholder="e.g. AI Engineering"
                onChange={(event) => updateField("title", event.target.value)}
              />
            </label>
            <label>
              About me
              <textarea
                value={form.bio}
                maxLength="400"
                rows="4"
                placeholder="What are you learning or working toward?"
                onChange={(event) => updateField("bio", event.target.value)}
              />
            </label>
            <div className="profile-form-footer">
              <span
                className={`profile-form-status${statusTone ? ` is-${statusTone}` : ""}`}
                role="status"
                aria-live="polite"
              >
                {savedMessage}
              </span>
              <button type="submit" className="primary-action">
                <FontAwesomeIcon icon={faFloppyDisk} />
                Save profile
              </button>
            </div>
          </form>
        </section>

        <aside className="company-panel profile-learning-panel">
          <span className="company-eyebrow">LEARNING TOGETHER</span>
          <h2>Your voice belongs here.</h2>
          <p>
            Your display name appears beside your comments on preparation
            events, so teammates can recognize your questions and ideas.
          </p>
          <div className="profile-comment-preview">
            <span className="profile-comment-avatar">
              {form.avatar
                ? <img src={form.avatar} alt="" />
                : getInitials(form.name)}
            </span>
            <span>
              <strong>{form.name || "Demo member"}</strong>
              <small>Learning workspace participant</small>
            </span>
          </div>
          <div className="calendar-local-notice">
            This prototype stores profile details and comments only in this
            browser. Other team members cannot see them yet.
          </div>
        </aside>
      </div>
    </div>
  );
}

export default UserProfile;

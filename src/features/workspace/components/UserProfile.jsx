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

  async function handleSubmit(event) {
    event.preventDefault();
    const updatedProfile = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      title: form.title.trim(),
      bio: form.bio.trim(),
    };
    if (!updatedProfile.name || !updatedProfile.email) return;
    reportStatus("Saving profile…", "info");
    if (!await onSave(updatedProfile)) {
      reportStatus("Profile could not be saved to your account.", "error");
      return;
    }
    setForm(updatedProfile);
    reportStatus("Profile saved to your account.", "success");
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
    <div className="user-profile-page grid gap-4 pb-6">
      <section className="profile-hero relative flex min-h-[125px] items-center justify-start gap-5 overflow-hidden p-[clamp(20px,3vw,30px)] max-[620px]:items-start max-[620px]:flex-wrap">
        <div className="profile-avatar-group">
          <div className="profile-avatar grid h-[60px] w-[60px] flex-[0_0_auto] place-items-center rounded-[20px] text-[1.15rem] font-extrabold" aria-hidden="true">
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
          <h2 className="mt-2 text-[clamp(1.35rem,2.3vw,1.8rem)] font-[760] tracking-[-0.05em]">{form.name || "Your profile"}</h2>
          <p className="mt-[7px] max-w-[640px] text-[0.78rem] leading-[1.6]">{form.title || "VSR workspace member"}</p>
        </div>
        <span className="profile-preview-badge ml-auto inline-flex items-center gap-[7px] rounded-full px-[10px] py-[7px] text-[0.59rem] font-[680] max-[620px]:ml-0">
          <FontAwesomeIcon icon={faCircleUser} />
          Account profile
        </span>
      </section>

      <div className="profile-content-grid grid grid-cols-[minmax(0,1.15fr)_minmax(260px,0.85fr)] items-start gap-[14px] max-[900px]:grid-cols-[minmax(0,1fr)]">
        <section className="company-panel profile-edit-panel !p-5 max-[620px]:!p-[14px]" aria-labelledby="profile-edit-title">
          <div className="company-panel-heading">
            <span className="company-panel-icon"><FontAwesomeIcon icon={faUserPen} /></span>
            <div>
              <h2 id="profile-edit-title">Personal details</h2>
              <span>Update how you appear in this learning workspace.</span>
            </div>
          </div>
          <form className="profile-form mt-[17px] grid gap-[13px]" onSubmit={handleSubmit}>
            <label className="grid min-w-0 gap-[6px] text-[0.66rem] font-[680]">
              Display name
              <input
                className="w-full min-h-[39px] rounded-[9px] border px-[10px] py-[9px] text-[0.68rem] [font-family:inherit] outline-none"
                type="text"
                value={form.name}
                maxLength="80"
                onChange={(event) => updateField("name", event.target.value)}
                required
              />
            </label>
            <label className="grid min-w-0 gap-[6px] text-[0.66rem] font-[680]">
              Email address
              <input
                className="w-full min-h-[39px] rounded-[9px] border px-[10px] py-[9px] text-[0.68rem] [font-family:inherit] outline-none"
                type="email"
                value={form.email}
                maxLength="254"
                readOnly
                aria-describedby="profile-email-help"
              />
              <small id="profile-email-help">Your email is managed by your sign-in account.</small>
            </label>
            <label className="grid min-w-0 gap-[6px] text-[0.66rem] font-[680]">
              Role or learning focus
              <input
                className="w-full min-h-[39px] rounded-[9px] border px-[10px] py-[9px] text-[0.68rem] [font-family:inherit] outline-none"
                type="text"
                value={form.title}
                maxLength="100"
                placeholder="e.g. AI Engineering"
                onChange={(event) => updateField("title", event.target.value)}
              />
            </label>
            <label className="grid min-w-0 gap-[6px] text-[0.66rem] font-[680]">
              About me
              <textarea
                className="w-full min-h-[78px] rounded-[9px] border px-[10px] py-[9px] text-[0.68rem] [font-family:inherit] resize-y outline-none"
                value={form.bio}
                maxLength="400"
                rows="4"
                placeholder="What are you learning or working toward?"
                onChange={(event) => updateField("bio", event.target.value)}
              />
            </label>
            <div className="profile-form-footer flex items-center justify-end gap-[9px] pt-1">
              <span
                className={`profile-form-status mr-auto text-[0.61rem]${statusTone ? ` is-${statusTone}` : ""}`}
                role="status"
                aria-live="polite"
              >
                {savedMessage}
              </span>
              <button type="submit" className="primary-action min-h-[38px]">
                <FontAwesomeIcon icon={faFloppyDisk} />
                Save profile
              </button>
            </div>
          </form>
        </section>

        <aside className="company-panel profile-learning-panel !p-5 max-[620px]:!p-[14px]">
          <span className="company-eyebrow">LEARNING TOGETHER</span>
          <h2 className="mt-[11px] text-[1.05rem] tracking-[-0.035em]">Your voice belongs here.</h2>
          <p className="text-[0.7rem] leading-[1.65]">
            Your display name appears beside your comments on preparation
            events, so teammates can recognize your questions and ideas.
          </p>
          <div className="profile-comment-preview my-4 flex items-center gap-[9px] rounded-[11px] p-3">
            <span className="profile-comment-avatar grid h-[34px] w-[34px] flex-[0_0_auto] place-items-center rounded-full text-[0.65rem]">
              {form.avatar
                ? <img src={form.avatar} alt="" />
                : getInitials(form.name)}
            </span>
            <span className="grid min-w-0 gap-[3px]">
              <strong className="overflow-hidden text-[0.67rem] text-ellipsis whitespace-nowrap">{form.name || "Your profile"}</strong>
              <small className="text-[0.58rem]">Learning workspace participant</small>
            </span>
          </div>
          <div className="calendar-local-notice px-[14px] py-[11px] text-[0.68rem] leading-[1.55]">
            Profile details are private to your signed-in account. They are not shared with other accounts.
          </div>
        </aside>
      </div>
    </div>
  );
}

export default UserProfile;

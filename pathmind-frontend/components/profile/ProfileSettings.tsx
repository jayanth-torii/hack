"use client";

import { useEffect, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { clsx } from "@/lib/clsx";
import {
  useChangePassword,
  useProfile,
  useUpdateNotifications,
  useUpdateProfile,
} from "@/hooks/useProfileQuery";
import { AlertIcon, BookIcon, CheckIcon, CloseIcon, GearIcon, LockIcon, PlusIcon } from "./ProfileIcons";

/**
 * Material 3 switch, built on a real `role="switch"` button.
 *
 * M3 geometry: a 52×32 track, a 24dp handle inset 4dp when on, a 16dp handle
 * inset 8dp when off, and the handle growing to 28dp while pressed. The handle
 * is one 24dp box that is *scaled* between those sizes rather than resized, so
 * every state change animates transform only (CLAUDE.md §7).
 *
 * The 52×32 track already clears 44px horizontally but not vertically, so the
 * `before:` pseudo-element extends the hit area to 48px without touching the
 * track's own box — the row's `py-3` keeps adjacent switches from overlapping.
 */
function Toggle({
  id,
  checked,
  onChange,
  label,
  description,
}: {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <label htmlFor={id} className="text-title-sm text-md-on-surface">
          {label}
        </label>
        <p className="mt-0.5 text-body-sm text-md-on-surface-variant">{description}</p>
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          "group relative h-8 w-[3.25rem] shrink-0 rounded-full ring-2 ring-inset transition-colors duration-fast ease-standard",
          "before:absolute before:-bottom-2 before:-top-2 before:left-0 before:right-0 before:content-['']",
          checked
            ? "bg-md-primary ring-md-primary"
            : "bg-md-surface-container-highest ring-md-outline"
        )}
      >
        {/* One 24dp box, translated and scaled: off sits 8px from the left at
            16dp, on sits 4px from the right at 24dp, pressed grows to 28dp.
            `left-0` is load-bearing — without a horizontal offset an absolutely
            positioned child falls back to its static position, and a button
            centres its content. */}
        <span
          aria-hidden
          className={clsx(
            "absolute left-0 top-1 flex h-6 w-6 items-center justify-center rounded-full",
            "transition-transform duration-base ease-standard group-active:scale-[1.1667]",
            checked
              ? "translate-x-6 scale-100 bg-md-on-primary text-md-primary"
              : "translate-x-1 scale-[0.6667] bg-md-outline text-transparent"
          )}
        >
          {checked && <CheckIcon className="h-4 w-4" />}
        </span>
      </button>
    </div>
  );
}

/**
 * Account settings: personal details, education, skills/interests,
 * notification preferences and password.
 *
 * The password section is hidden entirely for Google-only accounts — the
 * backend reports `hasPassword`, and offering a change form to someone with no
 * password would be a dead end.
 */
export function ProfileSettings() {
  const profile = useProfile();
  const updateProfile = useUpdateProfile();
  const updateNotifications = useUpdateNotifications();
  const changePassword = useChangePassword();

  const [name, setName] = useState("");
  const [school, setSchool] = useState("");
  const [degree, setDegree] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");
  const [interestDraft, setInterestDraft] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Seed the form once the profile arrives. Keyed on the id so switching
  // account (or a refetch) re-seeds rather than stranding stale values.
  useEffect(() => {
    const p = profile.data;
    if (!p) return;
    setName(p.name ?? "");
    setSchool(p.education?.school ?? "");
    setDegree(p.education?.degree ?? "");
    setFieldOfStudy(p.education?.fieldOfStudy ?? "");
    setGraduationYear(p.education?.graduationYear ? String(p.education.graduationYear) : "");
    setSkills(p.skills);
    setInterests(p.interests);
  }, [profile.data]);

  if (profile.isPending) {
    return (
      <div className="space-y-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-lg" />
        ))}
      </div>
    );
  }

  if (profile.isError) {
    return (
      <div
        role="alert"
        className="rounded-lg bg-md-error-container p-6 text-md-on-error-container"
      >
        <p className="flex items-center gap-2 text-title-md">
          <AlertIcon className="h-5 w-5 shrink-0" />
          Couldn&apos;t load your settings
        </p>
        <p className="mt-1 text-body-md">
          Your account is fine — the request just didn&apos;t come back.
        </p>
        <button
          type="button"
          onClick={() => void profile.refetch()}
          className="press state-layer mt-3 inline-flex min-h-touch items-center rounded-full border border-current px-5 text-label-lg"
        >
          Try again
        </button>
      </div>
    );
  }

  const addTag = (
    draft: string,
    list: string[],
    setList: (next: string[]) => void,
    setDraft: (next: string) => void
  ) => {
    const value = draft.trim();
    if (!value) return;
    // Mirror the server's case-insensitive de-duplication so the UI never shows
    // a tag that the save will silently merge away.
    if (list.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setDraft("");
      return;
    }
    setList([...list, value]);
    setDraft("");
  };

  const onSavePersonal = (event: React.FormEvent) => {
    event.preventDefault();
    const year = graduationYear.trim() ? Number(graduationYear) : undefined;
    updateProfile.mutate({
      name: name.trim() || undefined,
      education: {
        ...(school.trim() ? { school: school.trim() } : {}),
        ...(degree.trim() ? { degree: degree.trim() } : {}),
        ...(fieldOfStudy.trim() ? { fieldOfStudy: fieldOfStudy.trim() } : {}),
        ...(year && Number.isFinite(year) ? { graduationYear: year } : {}),
      },
      skills,
      interests,
    });
  };

  const onChangePassword = (event: React.FormEvent) => {
    event.preventDefault();
    changePassword.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword("");
          setNewPassword("");
        },
      }
    );
  };

  const prefs = profile.data?.notificationPrefs;

  const submitButton =
    "press state-layer min-h-touch rounded-full bg-md-primary px-6 text-label-lg text-md-on-primary disabled:pointer-events-none disabled:bg-md-on-surface/[0.12] disabled:text-md-on-surface/[0.38]";

  return (
    <div className="space-y-5">
      <Panel title="Personal information" icon={<GearIcon className="h-4 w-4" />}>
        <form onSubmit={onSavePersonal} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How should we address you?"
              maxLength={80}
            />
            <Input
              label="Email"
              value={profile.data?.email ?? ""}
              readOnly
              disabled
              helperText="Email changes aren't supported yet."
            />
          </div>

          <fieldset className="rounded-md border border-md-outline-variant p-4">
            <legend className="px-2 text-label-md uppercase tracking-[0.18em] text-md-on-surface-variant">
              Education
            </legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="School or university"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                maxLength={120}
              />
              <Input
                label="Degree"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                maxLength={120}
              />
              <Input
                label="Field of study"
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                maxLength={120}
              />
              <Input
                label="Graduation year"
                type="number"
                inputMode="numeric"
                min={1950}
                max={2100}
                value={graduationYear}
                onChange={(e) => setGraduationYear(e.target.value)}
              />
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={updateProfile.isPending}
            aria-busy={updateProfile.isPending}
            className={submitButton}
          >
            {updateProfile.isPending ? "Saving…" : "Save changes"}
          </button>
        </form>
      </Panel>

      <Panel title="Skills & interests" icon={<BookIcon className="h-4 w-4" />}>
        <div className="space-y-5">
          {(
            [
              {
                key: "skills" as const,
                heading: "Skills",
                list: skills,
                setList: setSkills,
                draft: skillDraft,
                setDraft: setSkillDraft,
                placeholder: "e.g. Python",
              },
              {
                key: "interests" as const,
                heading: "Interests",
                list: interests,
                setList: setInterests,
                draft: interestDraft,
                setDraft: setInterestDraft,
                placeholder: "e.g. Machine Learning",
              },
            ]
          ).map((group) => (
            <div key={group.key}>
              <p className="text-label-md uppercase tracking-[0.18em] text-md-on-surface-variant">
                {group.heading}
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {group.list.map((tag) => (
                  <li key={tag}>
                    {/* M3 input chip: 32dp, 8dp corners, trailing remove icon.
                        The visible chip stays 32dp and `before:` lifts the hit
                        area to the 44px floor. */}
                    <button
                      type="button"
                      onClick={() => group.setList(group.list.filter((t) => t !== tag))}
                      aria-label={`Remove ${tag}`}
                      className="press state-layer relative inline-flex h-8 items-center gap-1.5 rounded-sm border border-md-outline pl-3 pr-2 text-label-lg text-md-on-surface-variant before:absolute before:-bottom-1.5 before:-top-1.5 before:left-0 before:right-0 before:content-['']"
                    >
                      {tag}
                      <CloseIcon className="h-4 w-4 shrink-0" />
                    </button>
                  </li>
                ))}
                {group.list.length === 0 && (
                  <li className="text-body-md text-md-on-surface-variant">None added.</li>
                )}
              </ul>
              <div className="mt-3 flex gap-2">
                <input
                  value={group.draft}
                  onChange={(e) => group.setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      // Enter inside a tag field must not submit the form above.
                      e.preventDefault();
                      addTag(group.draft, group.list, group.setList, group.setDraft);
                    }
                  }}
                  placeholder={group.placeholder}
                  maxLength={40}
                  aria-label={`Add a ${group.key === "skills" ? "skill" : "interest"}`}
                  className="min-h-touch flex-1 rounded-xs border border-md-outline bg-md-surface-container-low px-3 text-md-on-surface placeholder:text-md-on-surface-variant"
                />
                <button
                  type="button"
                  onClick={() => addTag(group.draft, group.list, group.setList, group.setDraft)}
                  className="press state-layer inline-flex min-h-touch items-center gap-1.5 rounded-full border border-md-outline px-4 text-label-lg text-md-primary"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>
          ))}

          <p className="text-body-sm text-md-on-surface-variant">
            Tags are saved with the <span className="text-md-on-surface">Save changes</span> button
            above.
          </p>
        </div>
      </Panel>

      <Panel title="Notifications" icon={<GearIcon className="h-4 w-4" />} bodyClassName="py-1">
        <div className="divide-y divide-md-outline-variant">
          <Toggle
            id="pref-reminders"
            checked={prefs?.roadmapReminders ?? false}
            onChange={(next) => updateNotifications.mutate({ roadmapReminders: next })}
            label="Roadmap reminders"
            description="Nudges about stages you have left unfinished."
          />
          <Toggle
            id="pref-digest"
            checked={prefs?.weeklyDigest ?? false}
            onChange={(next) => updateNotifications.mutate({ weeklyDigest: next })}
            label="Weekly digest"
            description="A Monday summary of what you completed last week."
          />
          <Toggle
            id="pref-product"
            checked={prefs?.productUpdates ?? false}
            onChange={(next) => updateNotifications.mutate({ productUpdates: next })}
            label="Product updates"
            description="Occasional notes about new Vidhyora features."
          />
        </div>
        <p className="border-t border-md-outline-variant pt-3 text-body-sm text-md-on-surface-variant">
          Preferences save as you toggle them. Delivery isn&apos;t wired up yet — these record
          your choice so nothing is sent without it.
        </p>
      </Panel>

      {profile.data?.hasPassword ? (
        <Panel title="Password" icon={<LockIcon className="h-4 w-4" />}>
          <form onSubmit={onChangePassword} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Current password"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="New password"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                helperText="At least 8 characters."
                required
              />
            </div>
            <button
              type="submit"
              disabled={changePassword.isPending || !currentPassword || newPassword.length < 8}
              aria-busy={changePassword.isPending}
              className={submitButton}
            >
              {changePassword.isPending ? "Changing…" : "Change password"}
            </button>
          </form>
        </Panel>
      ) : (
        <Panel title="Password" icon={<LockIcon className="h-4 w-4" />}>
          <p className="text-body-md text-md-on-surface-variant">
            This account signs in with Google, so there is no password to change. Manage it from
            your Google account instead.
          </p>
        </Panel>
      )}
    </div>
  );
}

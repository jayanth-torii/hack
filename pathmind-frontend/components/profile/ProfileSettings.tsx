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
import { BookIcon, GearIcon, LockIcon, PlusIcon } from "./ProfileIcons";

/** Accessible switch built on a real checkbox so it works without JS styling tricks. */
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
        <label htmlFor={id} className="text-sm font-medium text-paper">
          {label}
        </label>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={clsx(
          "press relative h-6 w-11 shrink-0 rounded-full transition-colors duration-fast",
          checked ? "bg-accent" : "bg-line/25"
        )}
      >
        {/* `left-0` is load-bearing: without a horizontal offset an absolutely
            positioned child falls back to its static position, and a button
            centres its content — so the knob started mid-track and the "on"
            state pushed it off the right edge. Anchored at 0, the translate
            values are the real insets: 2px off, 22px on, inside a 44px track. */}
        <span
          aria-hidden
          className={clsx(
            "absolute left-0 top-0.5 h-5 w-5 rounded-full bg-paper shadow-e1 transition-transform duration-base ease-standard",
            checked ? "translate-x-[1.375rem]" : "translate-x-0.5"
          )}
        />
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
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
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

          <fieldset className="rounded-md border border-line/12 p-4">
            <legend className="px-2 text-xs font-bold uppercase tracking-[0.2em] text-subtle">
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
            className="press min-h-touch rounded-full bg-accent px-6 text-sm font-bold text-on-accent transition-colors duration-fast hover:bg-accent-hover disabled:bg-line/15 disabled:text-muted"
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
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-subtle">
                {group.heading}
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {group.list.map((tag) => (
                  <li key={tag}>
                    <button
                      type="button"
                      onClick={() => group.setList(group.list.filter((t) => t !== tag))}
                      aria-label={`Remove ${tag}`}
                      className="press inline-flex min-h-touch-min items-center gap-1.5 rounded-full border border-accent/30 bg-accent/[0.08] px-3 text-xs font-medium text-accent-text transition-colors duration-fast hover:border-danger/50 hover:text-danger"
                    >
                      {tag}
                      <span aria-hidden className="text-sm leading-none">
                        ×
                      </span>
                    </button>
                  </li>
                ))}
                {group.list.length === 0 && (
                  <li className="text-sm text-muted">None added.</li>
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
                  className="min-h-touch flex-1 rounded-sm border border-line/15 bg-ink/50 px-3 text-sm text-paper placeholder:text-muted"
                />
                <button
                  type="button"
                  onClick={() => addTag(group.draft, group.list, group.setList, group.setDraft)}
                  className="press inline-flex min-h-touch items-center gap-1.5 rounded-full border border-accent/45 px-4 text-sm font-semibold text-accent-text transition-colors duration-fast hover:bg-accent/12"
                >
                  <PlusIcon className="h-4 w-4" />
                  Add
                </button>
              </div>
            </div>
          ))}

          <p className="text-xs text-muted">
            Tags are saved with the <span className="text-subtle">Save changes</span> button above.
          </p>
        </div>
      </Panel>

      <Panel title="Notifications" icon={<GearIcon className="h-4 w-4" />} bodyClassName="py-1">
        <div className="divide-y divide-line/10">
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
        <p className="border-t border-line/10 pt-3 text-xs text-muted">
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
              disabled={
                changePassword.isPending || !currentPassword || newPassword.length < 8
              }
              aria-busy={changePassword.isPending}
              className="press min-h-touch rounded-full bg-accent px-6 text-sm font-bold text-on-accent transition-colors duration-fast hover:bg-accent-hover disabled:bg-line/15 disabled:text-muted"
            >
              {changePassword.isPending ? "Changing…" : "Change password"}
            </button>
          </form>
        </Panel>
      ) : (
        <Panel title="Password" icon={<LockIcon className="h-4 w-4" />}>
          <p className="text-sm text-muted">
            This account signs in with Google, so there is no password to change. Manage it from
            your Google account instead.
          </p>
        </Panel>
      )}
    </div>
  );
}

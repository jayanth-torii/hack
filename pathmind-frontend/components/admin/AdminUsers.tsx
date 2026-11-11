"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  useAdminUsers,
  useDeleteAdminUser,
  useUpdateAdminUser,
} from "@/hooks/useAdminQuery";
import { Field, Pager, RecordCard, RecordListSkeleton, Section, TimeAgo } from "./AdminPrimitives";
import { MdButton } from "@/components/md/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { StateView } from "@/components/ui/StateView";
import { Dialog } from "@/components/md/Dialog";
import { confirm } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/toast";
import { ApiClientError } from "@/lib/api-client";
import { clsx } from "@/lib/clsx";
import type { AdminUser } from "@/types/catalog";

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

const ROLE_FILTERS = [
  { value: "", label: "All roles" },
  { value: "admin", label: "Admins" },
  { value: "user", label: "Learners" },
];

const STATUS_FILTERS = [
  { value: "", label: "All accounts" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-none">
      <span className="text-body-sm text-md-on-surface-variant">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-touch min-w-0 rounded-sm border border-md-outline bg-md-surface-container px-3 text-body-md text-md-on-surface"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * The suspension form.
 *
 * A reason is required, and it is not decoration: the audit entry is the only
 * place a future admin can find out why an account was locked, and "suspended
 * by someone, at some point, for reasons unknown" is not a record anyone can
 * act on later.
 *
 * A full-screen surface on phones via `md/Dialog`, so a destructive decision
 * is never made through a card the user has to aim at.
 */
function SuspendDialog({
  user,
  onClose,
  onConfirm,
  pending,
}: {
  user: AdminUser | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  pending: boolean;
}) {
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);

  // Reset between targets, or the previous account's reason is pre-filled for
  // the next one and quietly recorded against them.
  useEffect(() => {
    setReason("");
    setTouched(false);
  }, [user?.id]);

  const error = touched && reason.trim().length < 3 ? "Give a reason of at least 3 characters" : undefined;

  return (
    <Dialog
      open={Boolean(user)}
      onClose={onClose}
      title="Suspend account"
      role="alertdialog"
      headline={false}
      size="sm"
      actions={
        <>
          <MdButton variant="text" onClick={onClose}>
            Cancel
          </MdButton>
          <MdButton
            variant="filled"
            disabled={pending}
            className="bg-md-error text-md-on-error"
            onClick={() => {
              setTouched(true);
              if (reason.trim().length < 3) return;
              onConfirm(reason.trim());
            }}
          >
            {pending ? "Suspending…" : "Suspend"}
          </MdButton>
        </>
      }
    >
      <h2 className="text-headline-sm text-md-on-surface">Suspend {user?.email}?</h2>
      <p className="mt-2 text-body-md text-md-on-surface-variant">
        They will be signed out and unable to log in. Their roadmaps, progress and certificates are
        kept, and lifting the suspension restores everything.
      </p>
      <div className="mt-5">
        <Input
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          onBlur={() => setTouched(true)}
          error={error}
          required
          maxLength={200}
          helperText={error ? undefined : "Recorded in the audit log. Only admins see it."}
        />
      </div>
    </Dialog>
  );
}

/**
 * User management.
 *
 * Every control here is paired with the server-side guard that actually
 * enforces it: the UI hides "demote" on your own row, and the API refuses it
 * regardless. The hidden control is a courtesy; the API is the rule.
 */
export function AdminUsers() {
  const me = useAuthStore((s) => s.user);

  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [suspending, setSuspending] = useState<AdminUser | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const debouncedSearch = useDebounced(search);
  const users = useAdminUsers({
    q: debouncedSearch.trim() || undefined,
    role: role || undefined,
    status: status || undefined,
    page,
    limit: 20,
  });
  const update = useUpdateAdminUser();
  const remove = useDeleteAdminUser();

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, status]);

  /**
   * Surfaces the server's own refusal text.
   *
   * The admin API's 400s are written for a person — "this is the last active
   * admin", "you cannot change your own role" — and they are the explanation
   * the UI could not have known to give. Anything else falls back to generic
   * copy rather than leaking a stack or a status code (CLAUDE.md §6).
   */
  function reportFailure(err: unknown, fallback: string) {
    if (err instanceof ApiClientError && err.status >= 400 && err.status < 500) {
      toast.error(err.message);
      return;
    }
    toast.error(fallback);
  }

  async function changeRole(user: AdminUser, nextRole: "user" | "admin") {
    const ok = await confirm({
      title: nextRole === "admin" ? "Make this account an admin?" : "Remove admin access?",
      message:
        nextRole === "admin"
          ? `${user.email} will be able to see every account, suspend users and unpublish courses.`
          : `${user.email} will lose access to the admin area. They keep their learning data.`,
      confirmLabel: nextRole === "admin" ? "Make admin" : "Remove access",
      tone: nextRole === "admin" ? "accent" : "danger",
    });
    if (!ok) return;

    setBusyId(user.id);
    try {
      await update.mutateAsync({ id: user.id, role: nextRole });
      toast.success(
        nextRole === "admin" ? `${user.email} is now an admin` : `${user.email} is no longer an admin`,
        "They need to sign out and back in for the change to reach their session."
      );
    } catch (err) {
      reportFailure(err, "That role change could not be applied.");
    } finally {
      setBusyId(null);
    }
  }

  async function suspend(reason: string) {
    if (!suspending) return;
    const target = suspending;
    setBusyId(target.id);
    try {
      await update.mutateAsync({ id: target.id, suspended: true, suspendedReason: reason });
      toast.success(`${target.email} suspended`);
      setSuspending(null);
    } catch (err) {
      reportFailure(err, "That account could not be suspended.");
    } finally {
      setBusyId(null);
    }
  }

  async function restore(user: AdminUser) {
    setBusyId(user.id);
    try {
      await update.mutateAsync({ id: user.id, suspended: false });
      toast.success(`${user.email} restored`);
    } catch (err) {
      reportFailure(err, "That account could not be restored.");
    } finally {
      setBusyId(null);
    }
  }

  async function deleteAccount(user: AdminUser) {
    const ok = await confirm({
      title: "Delete this account permanently?",
      message: `${user.email}, along with their progress, goals, certificates and activity history, will be erased. This cannot be undone — suspending is reversible, deleting is not.`,
      confirmLabel: "Delete permanently",
      tone: "danger",
    });
    if (!ok) return;

    setBusyId(user.id);
    try {
      await remove.mutateAsync(user.id);
      toast.success(`${user.email} deleted`);
    } catch (err) {
      reportFailure(err, "That account could not be deleted.");
    } finally {
      setBusyId(null);
    }
  }

  const items = users.data?.items ?? [];

  return (
    <Section
      title="Users"
      description="Search the directory, change roles, and suspend or restore accounts."
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1">
          <Input
            label="Search by email or name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="search"
            autoComplete="off"
          />
        </div>
        <div className="flex min-w-0 gap-3">
          <FilterSelect label="Role" value={role} options={ROLE_FILTERS} onChange={setRole} />
          <FilterSelect
            label="Status"
            value={status}
            options={STATUS_FILTERS}
            onChange={setStatus}
          />
        </div>
      </div>

      <div className="mt-5">
        {users.isLoading ? (
          <RecordListSkeleton />
        ) : users.isError ? (
          <StateView
            tone="error"
            title="The user directory could not be loaded"
            description="The server did not answer. No accounts have been changed."
            primary={{ label: "Try again", onClick: () => void users.refetch() }}
          />
        ) : items.length === 0 ? (
          <StateView
            title="No accounts match"
            description="Try a different search term, or clear the role and status filters."
            primary={{
              label: "Clear filters",
              onClick: () => {
                setSearch("");
                setRole("");
                setStatus("");
              },
            }}
          />
        ) : (
          <ul className={clsx("space-y-3", users.isFetching && "opacity-60 transition-opacity")}>
            {items.map((user) => {
              const isMe = user.id === me?.id;
              const busy = busyId === user.id;
              return (
                <RecordCard
                  key={user.id}
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="break-all">{user.email}</span>
                      {isMe && (
                        <span className="text-label-md text-md-on-surface-variant">(you)</span>
                      )}
                    </span>
                  }
                  subtitle={user.name ?? undefined}
                  badges={
                    <>
                      {user.role === "admin" && <Badge tone="brand">Admin</Badge>}
                      {user.suspended && (
                        <Badge tone="warning">
                          Suspended{user.suspendedReason ? `: ${user.suspendedReason}` : ""}
                        </Badge>
                      )}
                    </>
                  }
                  fields={
                    <>
                      <Field label="Joined">
                        <TimeAgo iso={user.createdAt} />
                      </Field>
                      <Field label="Last sign-in">
                        {user.lastLoginAt ? <TimeAgo iso={user.lastLoginAt} /> : "Never"}
                      </Field>
                      <Field label="Courses">{user.savedCount}</Field>
                      <Field label="Stages done">{user.stagesCompleted}</Field>
                    </>
                  }
                  actions={
                    isMe ? (
                      // Your own row carries no controls. Every one of them is
                      // refused server-side anyway, and a button that always
                      // errors is worse than no button.
                      <span className="text-body-sm text-md-on-surface-variant">
                        Ask another admin
                      </span>
                    ) : (
                      <>
                        <MdButton
                          variant="outlined"
                          size="sm"
                          disabled={busy}
                          onClick={() => changeRole(user, user.role === "admin" ? "user" : "admin")}
                        >
                          {user.role === "admin" ? "Remove admin" : "Make admin"}
                        </MdButton>
                        {user.suspended ? (
                          <MdButton
                            variant="tonal"
                            size="sm"
                            disabled={busy}
                            onClick={() => restore(user)}
                          >
                            Restore
                          </MdButton>
                        ) : (
                          <MdButton
                            variant="outlined"
                            size="sm"
                            disabled={busy}
                            className="border-md-error text-md-error"
                            onClick={() => setSuspending(user)}
                          >
                            Suspend
                          </MdButton>
                        )}
                        <MdButton
                          variant="text"
                          size="sm"
                          disabled={busy}
                          className="text-md-error"
                          onClick={() => deleteAccount(user)}
                        >
                          Delete
                        </MdButton>
                      </>
                    )
                  }
                />
              );
            })}
          </ul>
        )}

        {users.data && (
          <Pager
            page={users.data.page}
            pages={users.data.pages}
            total={users.data.total}
            onChange={setPage}
          />
        )}
      </div>

      <SuspendDialog
        user={suspending}
        onClose={() => setSuspending(null)}
        onConfirm={suspend}
        pending={Boolean(suspending && busyId === suspending.id)}
      />
    </Section>
  );
}

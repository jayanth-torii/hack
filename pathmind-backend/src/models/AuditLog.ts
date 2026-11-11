import { Schema, model, type Document, type Types } from "mongoose";

/**
 * Append-only record of every state-changing action an admin takes.
 *
 * Admin powers (suspend an account, change a role, unpublish a course, delete
 * a roadmap) are invisible to the person they affect and irreversible from the
 * UI, so the question "who did this, and when" has to be answerable after the
 * fact. Nothing in the app writes here except `recordAudit`, and no route can
 * delete an entry — the collection is written once and only ever read.
 *
 * `targetLabel` is denormalised on purpose: the log has to stay readable after
 * the user or roadmap it refers to has been deleted, which is precisely the
 * case where the entry matters most.
 */
export type AuditAction =
  | "user.role_changed"
  | "user.suspended"
  | "user.unsuspended"
  | "user.deleted"
  | "roadmap.updated"
  | "roadmap.published"
  | "roadmap.unpublished"
  | "roadmap.deleted";

export const AUDIT_ACTIONS: AuditAction[] = [
  "user.role_changed",
  "user.suspended",
  "user.unsuspended",
  "user.deleted",
  "roadmap.updated",
  "roadmap.published",
  "roadmap.unpublished",
  "roadmap.deleted",
];

export interface AuditLogDocument extends Document {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  actorEmail: string;
  action: AuditAction;
  targetType: "user" | "roadmap";
  targetId: string;
  /** Human label for the target, frozen at write time. */
  targetLabel: string;
  /** Small, non-sensitive diff — never a password hash, token or raw body. */
  meta?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const auditLogSchema = new Schema<AuditLogDocument>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorEmail: { type: String, required: true },
    action: { type: String, required: true, enum: AUDIT_ACTIONS },
    targetType: { type: String, required: true, enum: ["user", "roadmap"] },
    targetId: { type: String, required: true },
    targetLabel: { type: String, required: true },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// The log is read newest-first, occasionally filtered to one target's history.
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

export const AuditLog = model<AuditLogDocument>("AuditLog", auditLogSchema);

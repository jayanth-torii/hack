import { Types } from "mongoose";
import { AuditLog, type AuditAction } from "../../models/AuditLog";
import { logger } from "../../config/logger";

export interface RecordAuditInput {
  actorId: string;
  actorEmail: string;
  action: AuditAction;
  targetType: "user" | "roadmap";
  targetId: string;
  targetLabel: string;
  meta?: Record<string, unknown>;
}

/**
 * Appends one audit entry.
 *
 * Unlike `recordActivity`, a failure here is **loud**: the audit trail is a
 * security control, and an admin action whose record silently vanished is
 * worse than an admin action that failed. The caller still decides whether to
 * fail the request — every admin controller awaits this *after* the write it
 * describes has succeeded, so a throw here surfaces as a 500 on an action that
 * did happen, which is the honest failure mode. It is never swallowed.
 */
export async function recordAudit(input: RecordAuditInput): Promise<void> {
  await AuditLog.create({
    actorId: new Types.ObjectId(input.actorId),
    actorEmail: input.actorEmail,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    targetLabel: input.targetLabel,
    ...(input.meta ? { meta: input.meta } : {}),
  });
  logger.info(
    {
      actorId: input.actorId,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
    },
    "Admin action recorded"
  );
}

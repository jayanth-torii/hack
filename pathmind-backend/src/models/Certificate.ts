import { Schema, model, type Document, type Types } from "mongoose";

/**
 * A credential this platform issued, as opposed to the third-party
 * certification *links* attached to a roadmap stage.
 *
 * Issued only when every stage of a roadmap is complete, and immutable after
 * that: the serial is what a downloaded PDF is verified against, so re-issuing
 * would invalidate a certificate already in someone's hands.
 */
export interface CertificateDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  roadmapId: Types.ObjectId;
  /** Snapshotted so the certificate still reads correctly if the roadmap changes. */
  topic: string;
  recipientName: string;
  stagesCompleted: number;
  serial: string;
  issuedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const certificateSchema = new Schema<CertificateDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    roadmapId: { type: Schema.Types.ObjectId, ref: "Roadmap", required: true },
    topic: { type: String, required: true, trim: true },
    recipientName: { type: String, required: true, trim: true },
    stagesCompleted: { type: Number, required: true, min: 1 },
    serial: { type: String, required: true, unique: true },
    issuedAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// One certificate per roadmap per learner — the issue endpoint is idempotent.
certificateSchema.index({ userId: 1, roadmapId: 1 }, { unique: true });

export const Certificate = model<CertificateDocument>("Certificate", certificateSchema);

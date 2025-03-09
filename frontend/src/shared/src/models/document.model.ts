// services/document-service/src/models/document.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IDocument extends Document {
  title: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  memberId: mongoose.Types.ObjectId;
  category: string;
  tags?: string[];
  uploadedBy: mongoose.Types.ObjectId;
  isProtected: boolean;
  password?: string;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    memberId: {
      type: Schema.Types.ObjectId,
      ref: 'Member',
      required: true
    },
    category: {
      type: String,
      required: true
    },
    tags: {
      type: [String],
      default: []
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isProtected: {
      type: Boolean,
      default: false
    },
    password: {
      type: String
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED', 'DELETED'],
      default: 'ACTIVE'
    }
  },
  { timestamps: true }
);

// Export the model and return your IDocument interface
export default mongoose.model<IDocument>('Document', DocumentSchema);
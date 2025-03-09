// services/document-service/src/models/member.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IMember extends Document {
  userId: mongoose.Types.ObjectId;
  panNumber: string;
  fullName: string;
  email: string;
  documents?: mongoose.Types.ObjectId[];
  remark?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    panNumber: {
      type: String,
      required: true,
      unique: true
    },
    fullName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    documents: [{
      type: Schema.Types.ObjectId,
      ref: 'Document'
    }],
    remark: {
      type: String
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE'
    }
  },
  { timestamps: true }
);

export default mongoose.model<IMember>('Member', MemberSchema);
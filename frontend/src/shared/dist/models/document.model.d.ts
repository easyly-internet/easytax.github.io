import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IDocument, {}, {}, {}, mongoose.Document<unknown, {}, IDocument> & IDocument & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;

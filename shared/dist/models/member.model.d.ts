import mongoose, { Document } from 'mongoose';
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
declare const _default: mongoose.Model<IMember, {}, {}, {}, mongoose.Document<unknown, {}, IMember> & IMember & {
    _id: mongoose.Types.ObjectId;
}, any>;
export default _default;

// src/index.ts - Main entry point for the Member service
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDatabase } from './database';
import memberRoutes from './routes/member.routes';
import documentRoutes from './routes/document.routes';
import paymentRoutes from './routes/payment.routes';
import authMiddleware from './middleware/auth.middleware';
import errorHandler from './middleware/error.middleware';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API routes
app.use('/api/members', authMiddleware, memberRoutes);
app.use('/api/documents', authMiddleware, documentRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      logger.info(`Member service running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// src/models/member.model.ts - Member schema definition
import mongoose, { Document, Schema } from 'mongoose';

export interface IMember extends Document {
  panNumber: string;
  fullName: string;
  email: string;
  mobileNo: string;
  aadharCard?: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  lastUploadedDate: Date;
  financialYears: {
    year: string;
    status: 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED';
    taxRefund?: number;
    fees?: number;
    documents: {
      type: string;
      fileKey: string;
      uploadedAt: Date;
    }[];
  }[];
  caReference?: mongoose.Types.ObjectId;
  subscription: {
    plan: 'BASIC' | 'STANDARD' | 'PREMIUM';
    startDate: Date;
    endDate: Date;
    autoRenew: boolean;
    amount: number;
    paymentId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const MemberSchema: Schema = new Schema(
  {
    panNumber: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobileNo: { type: String, required: true },
    aadharCard: { type: String },
    status: {
      type: String,
      enum: ['ACTIVE', 'PENDING', 'INACTIVE'],
      default: 'PENDING'
    },
    lastUploadedDate: { type: Date },
    financialYears: [
      {
        year: { type: String, required: true },
        status: {
          type: String,
          enum: ['COMPLETED', 'IN_PROGRESS', 'NOT_STARTED'],
          default: 'NOT_STARTED'
        },
        taxRefund: { type: Number },
        fees: { type: Number },
        documents: [
          {
            type: { type: String, required: true },
            fileKey: { type: String, required: true },
            uploadedAt: { type: Date, default: Date.now }
          }
        ]
      }
    ],
    caReference: { type: Schema.Types.ObjectId, ref: 'CA' },
    subscription: {
      plan: {
        type: String,
        enum: ['BASIC', 'STANDARD', 'PREMIUM'],
        default: 'BASIC'
      },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      autoRenew: { type: Boolean, default: true },
      amount: { type: Number, required: true },
      paymentId: { type: String }
    }
  },
  { timestamps: true }
);

export default mongoose.model<IMember>('Member', MemberSchema);

// src/controllers/member.controller.ts - Controller for member operations
import { Request, Response, NextFunction } from 'express';
import Member from '../models/member.model';
import { createS3Client } from '../utils/s3';
import { createNotification } from '../utils/notifications';
import { logger } from '../utils/logger';

/**
 * Get all members with pagination and filtering
 */
export const getMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const filter: any = {};

    // Apply filters if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.fromDate && req.query.toDate) {
      filter.createdAt = {
        $gte: new Date(req.query.fromDate as string),
        $lte: new Date(req.query.toDate as string)
      };
    }

    if (req.query.mobileNo) {
      filter.mobileNo = req.query.mobileNo;
    }

    const members = await Member.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Member.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: members.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      data: members
    });
  } catch (error) {
    logger.error('Error fetching members:', error);
    next(error);
  }
};

/**
 * Get member by ID
 */
export const getMemberById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const member = await Member.findById(req.params.id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    logger.error(`Error fetching member ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Create new member
 */
export const createMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      panNumber,
      fullName,
      email,
      mobileNo,
      aadharCard,
      subscription
    } = req.body;

    // Check if member with PAN already exists
    const existingMember = await Member.findOne({ panNumber });
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'Member with this PAN number already exists'
      });
    }

    // Create the subscription dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription

    const member = await Member.create({
      panNumber,
      fullName,
      email,
      mobileNo,
      aadharCard,
      status: 'ACTIVE',
      lastUploadedDate: new Date(),
      financialYears: [
        {
          year: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
          status: 'NOT_STARTED',
          documents: []
        }
      ],
      subscription: {
        ...subscription,
        startDate,
        endDate
      }
    });

    // Send welcome notification
    await createNotification({
      to: email,
      subject: 'Welcome to Tax Sahi Hai',
      template: 'welcome',
      data: {
        name: fullName,
        subscriptionPlan: subscription.plan,
        endDate: endDate.toLocaleDateString()
      }
    });

    res.status(201).json({
      success: true,
      data: member
    });
  } catch (error) {
    logger.error('Error creating member:', error);
    next(error);
  }
};

/**
 * Update member details
 */
export const updateMember = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const member = await Member.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    logger.error(`Error updating member ${req.params.id}:`, error);
    next(error);
  }
};

/**
 * Upload document for a member
 */
export const uploadDocument = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, year } = req.params;
    const { type, file } = req.body;

    const member = await Member.findById(id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Upload file to S3/MinIO
    const s3 = createS3Client();
    const fileKey = `${id}/${year}/${type}-${Date.now()}`;

    await s3.upload({
      Bucket: process.env.DOCUMENT_BUCKET || 'taxsahihai-documents',
      Key: fileKey,
      Body: Buffer.from(file, 'base64'),
      ContentType: 'application/pdf'
    }).promise();

    // Update member document list
    const yearIndex = member.financialYears.findIndex(fy => fy.year === year);
    if (yearIndex === -1) {
      // Year doesn't exist, add it
      member.financialYears.push({
        year,
        status: 'IN_PROGRESS',
        documents: [{
          type,
          fileKey,
          uploadedAt: new Date()
        }]
      });
    } else {
      // Add document to existing year
      member.financialYears[yearIndex].documents.push({
        type,
        fileKey,
        uploadedAt: new Date()
      });
      member.financialYears[yearIndex].status = 'IN_PROGRESS';
    }

    member.lastUploadedDate = new Date();
    await member.save();

    res.status(200).json({
      success: true,
      data: member
    });
  } catch (error) {
    logger.error(`Error uploading document for member ${req.params.id}:`, error);
    next(error);
  }
};

// Additional controller methods would be implemented here
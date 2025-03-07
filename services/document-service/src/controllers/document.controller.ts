import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import Document from '../models/document.model';
import MemberYear from '../models/memberyear.model';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/apiError';
import { validateDocumentUpload } from '../validation/document.validation';
import { upload } from '../index';

/**
 * Upload document
 * @route POST /api/documents/upload
 */
export const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Multer upload middleware
    upload.array('documents', 5)(req, res, async (err) => {
      if (err) {
        return next(new ApiError(400, err.message));
      }

      try {
        // Validate request
        const { errors, isValid } = validateDocumentUpload(req.body);
        if (!isValid) {
          return res.status(400).json({ success: false, errors });
        }

        const { memberId, financialYear, documentNames, isProtected, passwords } = req.body;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
          return res.status(400).json({
            success: false,
            errors: { documents: ['No files uploaded'] }
          });
        }

        // Find or create member year
        let memberYear = await MemberYear.findOne({ memberId, financialYear });

        if (!memberYear) {
          memberYear = new MemberYear({
            memberId,
            financialYear,
            documents: [],
            protectedDocuments: [],
            status: 'TobeStarted'
          });
        }

        // Process each file
        const documentPromises = files.map(async (file, index) => {
          const documentName = Array.isArray(documentNames)
            ? documentNames[index]
            : `Document ${index + 1}`;

          // Create document record
          const document = {
            path: file.path.replace(process.env.STORAGE_PATH || '', ''),
            name: documentName,
            originalName: file.originalname,
            type: file.mimetype,
            size: file.size,
            uploadedAt: new Date()
          };

          // Add to appropriate array based on protection status
          if (isProtected === 'true') {
            const password = Array.isArray(passwords) ? passwords[index] : '';
            if (!password) {
              throw new ApiError(400, 'Password is required for protected documents');
            }

            const protectedDocument = {
              ...document,
              password
            };

            memberYear.protectedDocuments = [...(memberYear.protectedDocuments || []), protectedDocument];
          } else {
            memberYear.documents = [...(memberYear.documents || []), document];
          }

          return document;
        });

        // Wait for all documents to be processed
        await Promise.all(documentPromises);

        // Save member year
        await memberYear.save();

        res.status(201).json({
          success: true,
          message: 'Documents uploaded successfully',
          data: memberYear
        });
      } catch (error) {
        next(error);
      }
    });
  } catch (error) {
    logger.error('Error in uploadDocument controller:', error);
    next(error);
  }
};

/**
 * Get documents by member and financial year
 * @route GET /api/documents/:memberId/:financialYear
 */
export const getDocumentsByMemberAndYear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, financialYear } = req.params;

    // Find member year
    const memberYear = await MemberYear.findOne({ memberId, financialYear });

    if (!memberYear) {
      return res.status(404).json({
        success: false,
        errors: { message: ['Documents not found for this member and financial year'] }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        documents: memberYear.documents || [],
        protectedDocuments: memberYear.protectedDocuments?.map(doc => ({
          ...doc,
          password: undefined // Remove password from response
        })) || [],
        status: memberYear.status
      }
    });
  } catch (error) {
    logger.error('Error in getDocumentsByMemberAndYear controller:', error);
    next(error);
  }
};

/**
 * Download document
 * @route GET /api/documents/download/:memberId/:financialYear/:documentId
 */
export const downloadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, financialYear, documentId } = req.params;
    const { password } = req.query;

    // Find member year
    const memberYear = await MemberYear.findOne({ memberId, financialYear });

    if (!memberYear) {
      return res.status(404).json({
        success: false,
        errors: { message: ['Member or financial year not found'] }
      });
    }

    // Find document
    let document = memberYear.documents?.find(doc => doc._id.toString() === documentId);
    let isProtected = false;

    // If not found in regular documents, check protected documents
    if (!document) {
      const protectedDoc = memberYear.protectedDocuments?.find(doc => doc._id.toString() === documentId);

      if (!protectedDoc) {
        return res.status(404).json({
          success: false,
          errors: { message: ['Document not found'] }
        });
      }

      // Verify password for protected document
      if (!password || protectedDoc.password !== password) {
        return res.status(401).json({
          success: false,
          errors: { message: ['Invalid password for protected document'] }
        });
      }

      document = protectedDoc;
      isProtected = true;
    }

    // Construct file path
    const filePath = path.join(process.env.STORAGE_PATH || '', document.path);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        errors: { message: ['File not found on server'] }
      });
    }

    // Send file
    res.download(filePath, document.originalName || document.name);
  } catch (error) {
    logger.error('Error in downloadDocument controller:', error);
    next(error);
  }
};

/**
 * Download all documents as ZIP
 * @route GET /api/documents/download-all/:memberId/:financialYear
 */
export const downloadAllDocuments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, financialYear } = req.params;
    const { password } = req.query;

    // Find member year
    const memberYear = await MemberYear.findOne({ memberId, financialYear });

    if (!memberYear) {
      return res.status(404).json({
        success: false,
        errors: { message: ['Member or financial year not found'] }
      });
    }

    // Create a zip file
    const zipName = `${memberId}_${financialYear}_documents.zip`;
    const zipPath = path.join(process.env.STORAGE_PATH || '', 'temp', zipName);

    // Ensure temp directory exists
    const tempDir = path.join(process.env.STORAGE_PATH || '', 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });

    output.on('close', () => {
      // Send the zip file
      res.download(zipPath, zipName, (err) => {
        // Delete the temporary file after sending
        if (fs.existsSync(zipPath)) {
          fs.unlinkSync(zipPath);
        }
      });
    });

    archive.on('error', (err) => {
      throw new ApiError(500, 'Error creating zip file: ' + err.message);
    });

    archive.pipe(output);

    // Add regular documents
    if (memberYear.documents && memberYear.documents.length > 0) {
      for (const doc of memberYear.documents) {
        const filePath = path.join(process.env.STORAGE_PATH || '', doc.path);

        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: doc.originalName || doc.name });
        }
      }
    }

    // Add protected documents if password provided and valid
    if (memberYear.protectedDocuments && memberYear.protectedDocuments.length > 0 && password) {
      // Check if password is valid for any protected document
      const anyValidPassword = memberYear.protectedDocuments.some(doc => doc.password === password);

      if (anyValidPassword) {
        for (const doc of memberYear.protectedDocuments.filter(d => d.password === password)) {
          const filePath = path.join(process.env.STORAGE_PATH || '', doc.path);

          if (fs.existsSync(filePath)) {
            // Add password to filename to indicate it was protected
            const fileName = `${path.parse(doc.originalName || doc.name).name}_(protected)${path.extname(doc.originalName || doc.name)}`;
            archive.file(filePath, { name: fileName });
          }
        }
      }
    }

    // Finalize the archive
    archive.finalize();
  } catch (error) {
    logger.error('Error in downloadAllDocuments controller:', error);
    next(error);
  }
};

/**
 * Delete document
 * @route DELETE /api/documents/:memberId/:financialYear/:documentId
 */
export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, financialYear, documentId } = req.params;
    const { password } = req.body;

    // Find member year
    const memberYear = await MemberYear.findOne({ memberId, financialYear });

    if (!memberYear) {
      return res.status(404).json({
        success: false,
        errors: { message: ['Member or financial year not found'] }
      });
    }

    // Check if document exists in regular documents
    let documentIndex = memberYear.documents?.findIndex(doc => doc._id.toString() === documentId) ?? -1;
    let isProtected = false;

    // If not found in regular documents, check protected documents
    if (documentIndex === -1) {
      documentIndex = memberYear.protectedDocuments?.findIndex(doc => doc._id.toString() === documentId) ?? -1;

      if (documentIndex === -1) {
        return res.status(404).json({
          success: false,
          errors: { message: ['Document not found'] }
        });
      }

      // Verify password for protected document
      if (!password || memberYear.protectedDocuments![documentIndex].password !== password) {
        return res.status(401).json({
          success: false,
          errors: { message: ['Invalid password for protected document'] }
        });
      }

      isProtected = true;
    }

    // Get document before removing
    const document = isProtected
      ? memberYear.protectedDocuments![documentIndex]
      : memberYear.documents![documentIndex];

    // Remove document from array
    if (isProtected) {
      memberYear.protectedDocuments = memberYear.protectedDocuments?.filter((_, i) => i !== documentIndex);
    } else {
      memberYear.documents = memberYear.documents?.filter((_, i) => i !== documentIndex);
    }

    // Save member year
    await memberYear.save();

    // Delete file from storage
    const filePath = path.join(process.env.STORAGE_PATH || '', document.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteDocument controller:', error);
    next(error);
  }
};

/**
 * Update document metadata
 * @route PATCH /api/documents/:memberId/:financialYear/:documentId
 */
export const updateDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId, financialYear, documentId } = req.params;
    const { name, password, newPassword } = req.body;

    // Find member year
    const memberYear = await MemberYear.findOne({ memberId, financialYear });

    if (!memberYear) {
      return res.status(404).json({
        success: false,
        errors: { message: ['Member or financial year not found'] }
      });
    }

    // Check if document exists in regular documents
    let documentIndex = memberYear.documents?.findIndex(doc => doc._id.toString() === documentId) ?? -1;
    let isProtected = false;

    // If not found in regular documents, check protected documents
    if (documentIndex === -1) {
      documentIndex = memberYear.protectedDocuments?.findIndex(doc => doc._id.toString() === documentId) ?? -1;

      if (documentIndex === -1) {
        return res.status(404).json({
          success: false,
          errors: { message: ['Document not found'] }
        });
      }

      // Verify password for protected document
      if (!password || memberYear.protectedDocuments![documentIndex].password !== password) {
        return res.status(401).json({
          success: false,
          errors: { message: ['Invalid password for protected document'] }
        });
      }

      isProtected = true;
    }

    // Update document
    if (isProtected) {
      if (name) {
        memberYear.protectedDocuments![documentIndex].name = name;
      }
      if (newPassword) {
        memberYear.protectedDocuments![documentIndex].password = newPassword;
      }
    } else {
      if (name) {
        memberYear.documents![documentIndex].name = name;
      }
    }

    // Save member year
    await memberYear.save();

    res.status(200).json({
      success: true,
      message: 'Document updated successfully'
    });
  } catch (error) {
    logger.error('Error in updateDocument controller:', error);
    next(error);
  }
};
// src/components/Documents/DocumentUpload.tsx
import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Grid,
  Chip,
  Divider
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useMutation } from '@tanstack/react-query';
import { uploadDocument } from '../../shared/src/services/document/documentService';

interface DocumentUploadProps {
  memberId: string;
  financialYear: string;
  onUploadSuccess: () => void;
}

const documentTypes = [
  { value: 'form16', label: 'Form 16' },
  { value: 'form26as', label: 'Form 26AS' },
  { value: 'investment_proof', label: 'Investment Proof' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'pan_card', label: 'PAN Card' },
  { value: 'aadhar_card', label: 'Aadhar Card' },
  { value: 'other', label: 'Other' }
];

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  memberId,
  financialYear,
  onUploadSuccess
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState('form16');
  const [documentName, setDocumentName] = useState('');
  const [isProtected, setIsProtected] = useState(false);
  const [password, setPassword] = useState('');
  const [dragActive, setDragActive] = useState(false);


  const uploadMutation = useMutation(
      ({ memberId, file, financialYear, isProtected, password }:
           { memberId: string; file: File; financialYear: string; isProtected?: boolean; password?: string }
      ) => uploadDocument(memberId, file, financialYear, isProtected, password),
      {
        onSuccess: () => {
          setFiles([]);
          setDocumentName('');
          setPassword('');
          onUploadSuccess();
        }
      }
  );


  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length === 0) return;
    uploadMutation.mutate({
      memberId: memberId,
      file: files[0],  // Replace with actual file
      financialYear: financialYear,
      isProtected: isProtected,
      password: password  // Optional
    });
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Typography variant="h6" gutterBottom>
            Upload Tax Documents
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Upload tax-related documents for the financial year {financialYear}
          </Typography>

          <Box
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            sx={{
              border: '2px dashed',
              borderColor: dragActive ? 'primary.main' : 'divider',
              borderRadius: 1,
              padding: 4,
              textAlign: 'center',
              backgroundColor: dragActive ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
              transition: 'background-color 0.2s, border-color 0.2s',
              cursor: 'pointer',
              mb: 3
            }}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <UploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drag and drop files here
            </Typography>
            <Typography variant="body2" color="textSecondary">
              or click to browse from your computer
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Supports: PDF, JPG, PNG (Max: 10MB per file)
            </Typography>
          </Box>

          {files.length > 0 && (
            <Box mb={3}>
              <Typography variant="subtitle2" gutterBottom>
                Selected Files ({files.length})
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                {files.map((file, index) => (
                  <Box
                    key={index}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    py={1}
                    sx={index < files.length - 1 ? { borderBottom: '1px solid', borderColor: 'divider' } : {}}
                  >
                    <Box>
                      <Typography variant="body2" component="span">
                        {file.name}
                      </Typography>
                      <Typography variant="caption" display="block" color="textSecondary">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleRemoveFile(index)}
                      startIcon={<CloseIcon />}
                    >
                      Remove
                    </Button>
                  </Box>
                ))}
              </Paper>
            </Box>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Document Details
            </Typography>
            <Divider sx={{ mb: 3 }} />

            <Box mb={3}>
              <TextField
                select
                label="Document Type"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                fullWidth
                variant="outlined"
                required
              >
                {documentTypes.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Box>

            <Box mb={3}>
              <TextField
                label="Document Name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                fullWidth
                variant="outlined"
                placeholder={files[0]?.name || "E.g., Form 16 FY 2022-23"}
                helperText="Leave blank to use file name"
              />
            </Box>

            <Box mb={3} display="flex" alignItems="center">
              <Typography variant="body2" mr={2}>
                Password Protected
              </Typography>
              <Chip
                label={isProtected ? "Yes" : "No"}
                color={isProtected ? "primary" : "default"}
                onClick={() => setIsProtected(!isProtected)}
              />
            </Box>

            {isProtected && (
              <Box mb={3}>
                <TextField
                  label="Document Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  variant="outlined"
                  required
                />
              </Box>
            )}

            <Button
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              startIcon={uploadMutation.isLoading ? <CircularProgress size={20} color="inherit" /> : <UploadIcon />}
              onClick={handleSubmit}
              disabled={files.length === 0 || uploadMutation.isLoading || (isProtected && !password)}
            >
              {uploadMutation.isLoading ? 'Uploading...' : 'Upload Documents'}
            </Button>

            {uploadMutation.isError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {(uploadMutation.error as Error)?.message || 'Failed to upload documents. Please try again.'}
              </Alert>
            )}

            {uploadMutation.isSuccess && (
              <Alert icon={<CheckIcon />} severity="success" sx={{ mt: 2 }}>
                Documents uploaded successfully!
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DocumentUpload;
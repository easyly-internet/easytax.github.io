// src/components/Documents/DocumentViewerDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Typography,
  IconButton,
  Tooltip,
  Paper
} from '@mui/material';
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  GetApp as DownloadIcon,
  Close as CloseIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  RotateRight as RotateIcon
} from '@mui/icons-material';
import { Document as DocumentType } from '../../../../shared/src/types/document';

interface DocumentViewerDialogProps {
  open: boolean;
  onClose: () => void;
  document: DocumentType | null;
}

const DocumentViewerDialog: React.FC<DocumentViewerDialogProps> = ({
  open,
  onClose,
  document
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handleDownload = () => {
    if (document?.path) {
      window.open(document.path, '_blank');
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
    // In a real implementation, you would set totalPages based on PDF document info
    setTotalPages(5); // Example value
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load document. Please try again.');
  };

  // Determine file type
  const getFileType = () => {
    if (!document?.path) return null;

    const extension = document.path.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif'].includes(extension || '')) {
      return 'image';
    } else if (extension === 'pdf') {
      return 'pdf';
    }
    return 'unknown';
  };

  const fileType = getFileType();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: '90vh',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" noWrap sx={{ flex: 1 }}>
          {document?.name}
        </Typography>
        <Box>
          <Tooltip title="Download">
            <IconButton onClick={handleDownload}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton onClick={onClose} edge="end">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Document Toolbar */}
        <Box sx={{ display: 'flex', alignItems: 'center', p: 1, backgroundColor: 'background.default', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Zoom Out">
              <IconButton onClick={handleZoomOut} disabled={zoomLevel <= 0.5}>
                <ZoomOutIcon />
              </IconButton>
            </Tooltip>
            <Typography variant="body2" sx={{ mx: 1 }}>
              {Math.round(zoomLevel * 100)}%
            </Typography>
            <Tooltip title="Zoom In">
              <IconButton onClick={handleZoomIn} disabled={zoomLevel >= 3}>
                <ZoomInIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Rotate">
              <IconButton onClick={handleRotate}>
                <RotateIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {fileType === 'pdf' && (
            <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
              <Tooltip title="Previous Page">
                <span>
                  <IconButton onClick={handlePrevPage} disabled={currentPage <= 1}>
                    <PrevIcon />
                  </IconButton>
                </span>
              </Tooltip>
              <Typography variant="body2" sx={{ mx: 1 }}>
                {currentPage} / {totalPages}
              </Typography>
              <Tooltip title="Next Page">
                <span>
                  <IconButton onClick={handleNextPage} disabled={currentPage >= totalPages}>
                    <NextIcon />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          )}
        </Box>

        {/* Document Viewer */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            p: 2
          }}
        >
          {isLoading && (
            <CircularProgress />
          )}

          {error && (
            <Paper elevation={0} sx={{ p: 3, textAlign: 'center', backgroundColor: 'background.default' }}>
              <Typography color="error" paragraph>
                {error}
              </Typography>
              <Button variant="outlined" onClick={() => setIsLoading(true)}>
                Retry
              </Button>
            </Paper>
          )}

          {!error && document?.path && (
            <>
              {fileType === 'image' ? (
                <img
                  src={document.path}
                  alt={document.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transition: 'transform 0.2s ease',
                    visibility: isLoading ? 'hidden' : 'visible'
                  }}
                  onLoad={handleLoad}
                  onError={handleError}
                />
              ) : fileType === 'pdf' ? (
                <Box
                  sx={{
                    width: '100%',
                    height: '100%',
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center'
                  }}
                >
                  {/* In a real implementation, use a PDF viewer library like react-pdf */}
                  <iframe
                    src={`${document.path}#page=${currentPage}`}
                    title={document.name}
                    width="100%"
                    height="100%"
                    style={{ border: 'none', display: isLoading ? 'none' : 'block' }}
                    onLoad={handleLoad}
                    onError={handleError}
                  />
                </Box>
              ) : (
                <Paper elevation={0} sx={{ p: 3, textAlign: 'center', backgroundColor: 'background.default' }}>
                  <Typography paragraph>
                    This file type cannot be previewed. Please download the file to view it.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                  >
                    Download
                  </Button>
                </Paper>
              )}
            </>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid', borderColor: 'divider', px: 2 }}>
        <Typography variant="caption" color="textSecondary" sx={{ flex: 1 }}>
          {document?.size ? `Size: ${document.size}` : ''}
          {document?.upload_date ? ` • Uploaded: ${new Date(document.upload_date).toLocaleDateString()}` : ''}
        </Typography>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentViewerDialog;
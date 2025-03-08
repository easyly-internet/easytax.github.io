// src/components/Documents/DocumentPasswordDialog.tsx
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';

interface DocumentPasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  documentName: string;
  isVerifying?: boolean;
  error?: string;
}

const DocumentPasswordDialog: React.FC<DocumentPasswordDialogProps> = ({
  open,
  onClose,
  onSubmit,
  documentName,
  isVerifying = false,
  error
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleClose = () => {
    setPassword('');
    setLocalError('');
    onClose();
  };

  const handleSubmit = () => {
    if (!password.trim()) {
      setLocalError('Please enter the document password');
      return;
    }

    setLocalError('');
    onSubmit(password);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle>
        Password Protected Document
      </DialogTitle>
      <DialogContent>
        <Box mb={2} display="flex" alignItems="center">
          <LockIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="body2">
            The document <strong>{documentName}</strong> is password protected.
            Please enter the password to access it.
          </Typography>
        </Box>

        <TextField
          autoFocus
          fullWidth
          label="Document Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          variant="outlined"
          error={Boolean(localError || error)}
          helperText={localError || error}
          onKeyDown={handleKeyDown}
          disabled={isVerifying}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={handleClose} color="inherit" disabled={isVerifying}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isVerifying || !password.trim()}
          startIcon={isVerifying ? <CircularProgress size={16} /> : null}
        >
          {isVerifying ? 'Verifying...' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DocumentPasswordDialog;
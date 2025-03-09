// src/components/Documents/DocumentList.tsx
import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  TextField,
  InputAdornment,
  Tooltip,
  CircularProgress,
  Button
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  LockOutlined as LockIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDocumentsByMemberId, deleteDocument } from '../../shared/src/services/document/documentService';
import { Document } from '../../shared/src/types/document';
import DocumentPasswordDialog from './DocumentPasswordDialog';
import DocumentViewerDialog from './DocumentViewerDialog';
import ConfirmationDialog from '../common/ConfirmationDialog';

interface DocumentListProps {
  memberId: string;
  financialYear?: string;
}

const DocumentList: React.FC<DocumentListProps> = ({ memberId, financialYear }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(
    ['documents', memberId, financialYear, searchTerm],
    () => getDocumentsByMemberId(memberId, financialYear),
    {
      keepPreviousData: true
    }
  );

  const deleteMutation = useMutation(deleteDocument, {
    onSuccess: () => {
      queryClient.invalidateQueries(['documents', memberId]);
      setIsDeleteDialogOpen(false);
    }
  });

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, documentId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setCurrentDocumentId(documentId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setCurrentDocumentId(null);
  };

  const handleViewDocument = (document: Document) => {
    setSelectedDocument(document);
    handleMenuClose();

    if (document.is_protected) {
      setIsPasswordDialogOpen(true);
    } else {
      setIsViewerOpen(true);
    }
  };

  const handleDownloadDocument = (document: Document) => {
    setSelectedDocument(document);
    handleMenuClose();

    if (document.is_protected) {
      setIsPasswordDialogOpen(true);
    } else {
      // Implement document download logic
      window.open(document.path, '_blank');
    }
  };

  const handleDeleteDocument = (document: Document) => {
    setSelectedDocument(document);
    handleMenuClose();
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedDocument) {
      deleteMutation.mutate(selectedDocument.id);
    }
  };

  const handlePasswordSubmit = (password: string) => {
    if (selectedDocument) {
      // In a real app, validate password against backend
      // For now, just open document viewer or download
      setIsPasswordDialogOpen(false);
      setIsViewerOpen(true);
    }
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const getDocumentTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'form16': 'Form 16',
      'form26as': 'Form 26AS',
      'investment_proof': 'Investment Proof',
      'bank_statement': 'Bank Statement',
      'pan_card': 'PAN Card',
      'aadhar_card': 'Aadhar Card',
      'other': 'Other'
    };
    return typeMap[type] || type;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6">
          Documents
          {financialYear && ` for FY ${financialYear}`}
        </Typography>
        <Box display="flex" alignItems="center">
          <TextField
            placeholder="Search documents"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              )
            }}
            sx={{ mr: 2 }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            size="small"
          >
            Filter
          </Button>
        </Box>
      </Box>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <TableContainer>
          {isLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" p={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box p={3} textAlign="center">
              <Typography color="error">
                Error loading documents. Please try again.
              </Typography>
            </Box>
          ) : data?.length === 0 ? (
            <Box p={3} textAlign="center">
              <Typography color="textSecondary">
                No documents found. Upload documents to see them here.
              </Typography>
            </Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Financial Year</TableCell>
                  <TableCell>Uploaded On</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(data || [])
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {document.is_protected && (
                            <Tooltip title="Password Protected">
                              <LockIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                            </Tooltip>
                          )}
                          <Typography variant="body2">
                            {document.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {getDocumentTypeLabel(document.type)}
                      </TableCell>
                      <TableCell>{document.financial_year}</TableCell>
                      <TableCell>{formatDate(document.upload_date)}</TableCell>
                      <TableCell>
                        <Chip
                          label={document.status}
                          size="small"
                          color={
                            document.status === 'APPROVED' ? 'success' :
                            document.status === 'PENDING' ? 'warning' :
                            document.status === 'REJECTED' ? 'error' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, document.id)}
                        >
                          <MoreIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={data?.length || 0}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {data?.find(doc => doc.id === currentDocumentId) && (
          <>
            <MenuItem onClick={() => {
              const doc = data.find(d => d.id === currentDocumentId);
              if (doc) handleViewDocument(doc);
            }}>
              <ListItemIcon>
                <ViewIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>View</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => {
              const doc = data.find(d => d.id === currentDocumentId);
              if (doc) handleDownloadDocument(doc);
            }}>
              <ListItemIcon>
                <DownloadIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Download</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => {
              const doc = data.find(d => d.id === currentDocumentId);
              if (doc) handleDeleteDocument(doc);
            }}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Delete</ListItemText>
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Document Password Dialog */}
      <DocumentPasswordDialog
        open={isPasswordDialogOpen}
        onClose={() => setIsPasswordDialogOpen(false)}
        onSubmit={handlePasswordSubmit}
        documentName={selectedDocument?.name || ''}
      />

      {/* Document Viewer Dialog */}
      <DocumentViewerDialog
        open={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={selectedDocument}
      />

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        open={isDeleteDialogOpen}
        title="Delete Document"
        content={`Are you sure you want to delete the document "${selectedDocument?.name}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
        isLoading={deleteMutation.isLoading}
      />
    </Box>
  );
};
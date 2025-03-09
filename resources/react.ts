// src/components/Dashboard/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Container, Grid, Paper, Typography, Box, Card, CardContent } from '@mui/material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import DashboardCard from './DashboardCard';
import { fetchDashboardStats } from '../../../../shared/src/services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { DashboardStats } from '../../types/dashboard';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardStats();
        setStats(data);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!stats) {
    return (
      <Container>
        <Typography variant="h5" color="error">
          Failed to load dashboard data. Please try again.
        </Typography>
      </Container>
    );
  }

  const { members, documents, references, logs } = stats;

  // Data for pie chart
  const memberStatusData = [
    { name: 'Active', value: stats.memberStats.active },
    { name: 'Pending', value: stats.memberStats.pending },
    { name: 'Inactive', value: stats.memberStats.inactive },
  ];

  // Data for bar chart
  const monthlyStats = stats.monthlyStats.map(item => ({
    month: item.month,
    members: item.newMembers,
    documents: item.newDocuments,
  }));

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* Summary cards */}
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Members"
            value={members.toString()}
            icon="people"
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Documents Uploaded"
            value={documents.toString()}
            icon="description"
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="References"
            value={references.toString()}
            icon="share"
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <DashboardCard
            title="Logs"
            value={logs.toString()}
            icon="history"
            color="#9c27b0"
          />
        </Grid>

        {/* Member status distribution */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 300
            }}
          >
            <Typography variant="h6" gutterBottom>
              Member Status Distribution
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={memberStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {memberStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Monthly Statistics */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 300
            }}
          >
            <Typography variant="h6" gutterBottom>
              Monthly Activity
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyStats}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="members" fill="#8884d8" name="New Members" />
                <Bar dataKey="documents" fill="#82ca9d" name="Uploaded Documents" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Activities */}
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            <Box>
              {stats.recentActivities.map((activity, index) => (
                <Card key={index} sx={{ mb: 1, backgroundColor: '#f5f5f5' }}>
                  <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
                    <Grid container>
                      <Grid item xs={3} md={2}>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(activity.date).toLocaleDateString()} {new Date(activity.date).toLocaleTimeString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={3} md={2}>
                        <Typography variant="body2">
                          {activity.user}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={8}>
                        <Typography variant="body1">
                          {activity.action}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;

// src/components/Members/MembersList.tsx
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  TextField,
  Grid,
  Box,
  IconButton,
  Chip,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FileDownload as ExportIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers';
import { fetchMembers, deleteMember } from '../../../../shared/src/services/api';
import { Member } from '../../types/member';
import LoadingSpinner from '../common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';
import ConfirmDialog from '../common/ConfirmDialog';

const MembersList: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [memberToDelete, setMemberToDelete] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadMembers();
  }, [page, rowsPerPage, search, fromDate, toDate, statusFilter]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: rowsPerPage.toString(),
      });

      if (search) params.append('search', search);
      if (fromDate) params.append('fromDate', fromDate.toISOString());
      if (toDate) params.append('toDate', toDate.toISOString());
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetchMembers(params);
      setMembers(response.data);
      setTotalCount(response.total);
    } catch (error) {
      console.error('Error loading members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const handleAddMember = () => {
    navigate('/members/create');
  };

  const handleEditMember = (id: string) => {
    navigate(`/members/edit/${id}`);
  };

  const handleViewMember = (id: string) => {
    navigate(`/members/${id}`);
  };

  const handleDeleteClick = (id: string) => {
    setMemberToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (memberToDelete) {
      try {
        await deleteMember(memberToDelete);
        loadMembers();
      } catch (error) {
        console.error('Error deleting member:', error);
      }
    }
    setDeleteDialogOpen(false);
    setMemberToDelete(null);
  };

  const handleExportExcel = () => {
    // Export functionality would be implemented here
    console.log('Export to Excel');
  };

  const getStatusChip = (status: string) => {
    let color: 'success' | 'warning' | 'error' = 'success';

    switch (status) {
      case 'ACTIVE':
        color = 'success';
        break;
      case 'PENDING':
        color = 'warning';
        break;
      case 'INACTIVE':
        color = 'error';
        break;
      default:
        color = 'success';
    }

    return <Chip label={status} color={color} size="small" />;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Members
        </Typography>
        <Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddMember}
            sx={{ mr: 2 }}
          >
            Add Member
          </Button>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportExcel}
          >
            Export Excel
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              variant="outlined"
              value={search}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="From Date"
              value={fromDate}
              onChange={(date) => setFromDate(date)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="To Date"
              value={toDate}
              onChange={(date) => setToDate(date)}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              select
              fullWidth
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="INACTIVE">Inactive</option>
            </TextField>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <TableContainer component={Paper} elevation={3}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>#</TableCell>
                  <TableCell>PAN Number</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Mobile No</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No members found
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member, index) => (
                    <TableRow key={member._id}>
                      <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                      <TableCell>{member.panNumber}</TableCell>
                      <TableCell>{member.fullName}</TableCell>
                      <TableCell>{member.mobileNo}</TableCell>
                      <TableCell>{getStatusChip(member.status)}</TableCell>
                      <TableCell>
                        {new Date(member.updatedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewMember(member._id)}
                        >
                          <ViewIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleEditMember(member._id)}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(member._id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Member"
        content="Are you sure you want to delete this member? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteDialogOpen(false)}
      />
    </Container>
  );
};

export default MembersList;

// src/components/AITaxFiling/TaxFilingAssistant.tsx
import React, { useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ChatBubble as ChatIcon,
  Upload as UploadIcon,
  Check as CheckIcon,
  DescriptionOutlined as DocumentIcon,
  ArrowForwardIos as ArrowIcon
} from '@mui/icons-material';
import { getAITaxAdvice, submitDocumentForAnalysis } from '../../../../shared/src/services/aiService';

const steps = ['Upload Documents', 'AI Analysis', 'Review & Submit'];

const TaxFilingAssistant: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [userQuery, setUserQuery] = useState('');
  const [conversation, setConversation] = useState<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI tax filing assistant. Please upload your income and investment documents, and I\'ll help you optimize your tax filing.',
      timestamp: new Date()
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setFiles(Array.from(event.target.files));
    }
  };

  const handleSubmitFiles = async () => {
    if (files.length === 0) {
      setError('Please upload at least one document');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Process each file
      const results = await Promise.all(
        files.map(file => submitDocumentForAnalysis(file))
      );

      setAnalysisResults({
        totalIncome: results.reduce((sum, r) => sum + (r.income || 0), 0),
        totalDeductions: results.reduce((sum, r) => sum + (r.deductions || 0), 0),
        documents: results.map(r => r.summary),
        taxLiability: results.reduce((sum, r) => sum + (r.taxLiability || 0), 0),
        optimizationTips: results.flatMap(r => r.optimizationTips || [])
      });

      // Add assistant message
      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'I\'ve analyzed your documents. You can now review the summary or ask me questions about your tax filing.',
          timestamp: new Date()
        }
      ]);

      setActiveStep(1);
    } catch (err) {
      console.error('Error analyzing documents:', err);
      setError('Failed to analyze your documents. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuerySubmit = async () => {
    if (!userQuery.trim()) return;

    const newUserMessage = {
      role: 'user' as const,
      content: userQuery,
      timestamp: new Date()
    };

    setConversation(prev => [...prev, newUserMessage]);
    setUserQuery('');
    setIsProcessing(true);

    try {
      const response = await getAITaxAdvice(userQuery, analysisResults);

      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.advice,
          timestamp: new Date()
        }
      ]);
    } catch (err) {
      console.error('Error getting AI advice:', err);
      setConversation(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your question. Please try again.',
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNext = () => {
    setActiveStep(prev => prev + 1);
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Upload Your Tax Documents
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Please upload your income documents, investment proofs, and any other relevant financial statements.
              Our AI will analyze them to help you file your taxes efficiently.
            </Typography>

            <Box sx={{ mt: 3, mb: 3 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                sx={{ mr: 2 }}
              >
                Select Files
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={handleFileChange}
                />
              </Button>

              {files.length > 0 && (
                <Typography variant="body2">
                  {files.length} file(s) selected
                </Typography>
              )}
            </Box>

            {files.length > 0 && (
              <List>
                {files.map((file, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <DocumentIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={file.name}
                      secondary={`${(file.size / 1024).toFixed(2)} KB`}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            {error && (
              <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                onClick={handleSubmitFiles}
                disabled={isProcessing || files.length === 0}
              >
                {isProcessing ? <CircularProgress size={24} /> : 'Process Documents'}
              </Button>
            </Box>
          </Paper>
        );

      case 1:
        return (
          <>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Summary
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Typography variant="body1">
                      Total Income: ₹{analysisResults?.totalIncome?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="body1">
                      Total Deductions: ₹{analysisResults?.totalDeductions?.toLocaleString() || 0}
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', mt: 1 }}>
                      Tax Liability: ₹{analysisResults?.taxLiability?.toLocaleString() || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={8}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Optimization Tips
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <List>
                      {analysisResults?.optimizationTips?.map((tip: string, index: number) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <ArrowIcon color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={tip} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ask Your Tax Questions
              </Typography>

              <Box sx={{ mb: 3, mt: 3, maxHeight: '300px', overflowY: 'auto' }}>
                {conversation.map((message, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                      mb: 2
                    }}
                  >
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        maxWidth: '80%',
                        backgroundColor: message.role === 'user' ? '#e3f2fd' : '#f5f5f5'
                      }}
                    >
                      <Typography variant="body1">
                        {message.content}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Ask a question about your taxes..."
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  disabled={isProcessing}
                  onKeyPress={(e) => e.key === 'Enter' && handleQuerySubmit()}
                />
                <Button
                  variant="contained"
                  sx={{ ml: 2 }}
                  onClick={handleQuerySubmit}
                  disabled={isProcessing || !userQuery.trim()}
                >
                  {isProcessing ? <CircularProgress size={24} /> : <ChatIcon />}
                </Button>
              </Box>
            </Paper>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Continue to Filing
              </Button>
            </Box>
          </>
        );

      case 2:
        return (
          <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Review and Submit
            </Typography>

            <Alert severity="info" sx={{ mb: 3 }}>
              Please review your tax information before final submission.
            </Alert>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card elevation={1}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Tax Summary
                    </Typography>
                    <Divider sx={{ mb: 2 }} />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Income:
                        </Typography>
                        <Typography variant="body1">
                          ₹{analysisResults?.totalIncome?.toLocaleString() || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Total Deductions:
                        </Typography>
                        <Typography variant="body1">
                          ₹{analysisResults?.totalDeductions?.toLocaleString() || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Taxable Income:
                        </Typography>
                        <Typography variant="body1">
                          ₹{(analysisResults?.totalIncome - analysisResults?.totalDeductions)?.toLocaleString() || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary">
                          Tax Liability:
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          ₹{analysisResults?.taxLiability?.toLocaleString() || 0}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  Uploaded Documents
                </Typography>
                <List>
                  {files.map((file, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={handleBack}>
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
              >
                Submit Tax Filing
              </Button>
            </Box>
          </Paper>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        AI Tax Filing Assistant
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {renderStepContent()}
    </Container>
  );
};

export default TaxFilingAssistant;
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TableSortLabel, TablePagination, TextField, Toolbar, Checkbox, IconButton, Tooltip, Alert, CircularProgress, Button, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import { CSVLink } from 'react-csv';

const API_URL = 'http://localhost:4001/api/v1';

const headCells = [
  { id: 'username', label: 'Username', align: 'left' },
  { id: 'name', label: 'Name', align: 'left' },
  { id: 'role', label: 'Role', align: 'center' },
  { id: 'createdAt', label: 'Date Joined', align: 'center' },
  { id: 'actions', label: 'Actions', align: 'center', sortable: false },
];

function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function EnhancedTableHead({ order, orderBy, onRequestSort }) {
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };
  return (
    <TableHead>
      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.align}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{ fontWeight: 600 }}
          >
            {headCell.sortable === false ? (
              headCell.label
            ) : (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
                hideSortIcon={false}
                sx={{ '& .MuiTableSortLabel-icon': { opacity: 1 } }}
              >
                {headCell.label}
              </TableSortLabel>
            )}
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

const UserList = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState([]);
  const [bulkDeactivateDialogOpen, setBulkDeactivateDialogOpen] = useState(false);
  const [bulkActivateDialogOpen, setBulkActivateDialogOpen] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);

  useEffect(() => {
    if (currentUser) fetchUsers();
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await currentUser?.getIdToken();
      if (!token) {
        setError('No authentication token');
        setLoading(false);
        return;
      }
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      const { data } = await axios.get(`${API_URL}/admin/users`, config);
      setUsers(data.users || []);
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Admin always on top
  const sortedUsers = [...users].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;
    return getComparator(order, orderBy)(a, b);
  });
  const filteredUsers = sortedUsers.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.name?.toLowerCase().includes(searchLower)
    );
  });
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredUsers.length) : 0;
  const visibleUsers = filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Prepare CSV data (exclude avatar, __v, firebase uid and email)
  // Export all filtered users (not just current page)
  const userCsvData = filteredUsers.map(u => ({
    username: u.username,
    name: u.name,
    role: u.role,
    dateJoined: new Date(u.createdAt).toLocaleDateString('en-PH')
  }));

  const isSelected = (id) => selected.indexOf(id) !== -1;
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = visibleUsers.filter(u => u.role !== 'admin' && (currentUser?.email !== u.email && currentUser?.uid !== u.firebaseUid)).map((n) => n._id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };
  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };
  const handleBulkDeactivate = () => {
    setBulkDeactivateDialogOpen(true);
  };
  const handleBulkDeactivateConfirm = async () => {
    setBatchLoading(true);
    try {
      const token = await currentUser?.getIdToken();
      if (!token) {
        setError('No authentication token');
        setBatchLoading(false);
        return;
      }
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await Promise.all(selected.map(async (userId) => {
        await axios.put(`${API_URL}/admin/users/${userId}/deactivate`, {}, config);
      }));
      setBulkDeactivateDialogOpen(false);
      setSelected([]);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deactivating users');
      setBulkDeactivateDialogOpen(false);
    } finally {
      setBatchLoading(false);
    }
  };
  const handleBulkDeactivateCancel = () => {
    setBulkDeactivateDialogOpen(false);
  };

  const handleBulkActivate = () => {
    setBulkActivateDialogOpen(true);
  };
  const handleBulkActivateConfirm = async () => {
    setBatchLoading(true);
    try {
      const token = await currentUser?.getIdToken();
      if (!token) {
        setError('No authentication token');
        setBatchLoading(false);
        return;
      }
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      await Promise.all(selected.map(async (userId) => {
        await axios.put(`${API_URL}/admin/users/${userId}/activate`, {}, config);
      }));
      setBulkActivateDialogOpen(false);
      setSelected([]);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error activating users');
      setBulkActivateDialogOpen(false);
    } finally {
      setBatchLoading(false);
    }
  };
  const handleBulkActivateCancel = () => {
    setBulkActivateDialogOpen(false);
  };

  return (
    <AdminLayout>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Users Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage users
          </Typography>
        </Box>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : users.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No users found</Typography>
          </Paper>
        ) : (
          <Paper sx={{ width: '100%', mb: 2 }}>
            <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, backgroundColor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: '60px', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                  All Users
                </Typography>
                <TextField
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                  size="small"
                  sx={{ minWidth: '300px' }}
                />
                <Button
                  component={CSVLink}
                  data={userCsvData}
                  filename={"users.csv"}
                  variant="outlined"
                  sx={{ ml: 1, py: 0.6, px: 1.5, borderRadius: 1 }}
                >
                  Download CSV
                </Button>
              </Box>
              {!loading && selected.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" color="error" onClick={handleBulkDeactivate}>
                    Deactivate Selected
                  </Button>
                  <Button variant="contained" color="success" onClick={handleBulkActivate}>
                    Activate Selected
                  </Button>
                </Box>
              )}
            </Toolbar>
            {/* CSV download is placed next to search above */}
            <TableContainer>
              <Table aria-label="users table" sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell padding="checkbox" sx={{ width: 50 }}>
                      <Checkbox
                        color="primary"
                        indeterminate={selected.length > 0 && selected.length < visibleUsers.filter(u => u.role !== 'admin').length}
                        checked={visibleUsers.filter(u => u.role !== 'admin' && (currentUser?.email !== u.email && currentUser?.uid !== u.firebaseUid)).length > 0 && selected.length === visibleUsers.filter(u => u.role !== 'admin' && (currentUser?.email !== u.email && currentUser?.uid !== u.firebaseUid)).length}
                        onChange={handleSelectAllClick}
                        inputProps={{ 'aria-label': 'select all users' }}
                      />
                    </TableCell>
                    {headCells.map((headCell) => (
                      <TableCell
                        key={headCell.id}
                        align={headCell.align}
                        sortDirection={orderBy === headCell.id ? order : false}
                        sx={{ fontWeight: 600 }}
                      >
                        {headCell.sortable === false ? (
                          headCell.label
                        ) : (
                          <TableSortLabel
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : 'asc'}
                            onClick={(e) => handleRequestSort(e, headCell.id)}
                            hideSortIcon={false}
                            sx={{ '& .MuiTableSortLabel-icon': { opacity: 1 } }}
                          >
                            {headCell.label}
                            {orderBy === headCell.id ? (
                              <Box component="span" sx={visuallyHidden}>
                                {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                              </Box>
                            ) : null}
                          </TableSortLabel>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleUsers.map((user, index) => {
                    const isSelf = currentUser?.email === user.email || currentUser?.uid === user.firebaseUid;
                    const isItemSelected = isSelected(user._id);
                    let roleColor = user.role === 'admin' ? '#f44336' : user.role === 'user' ? '#4caf50' : '#1976d2';
                    const handleRowClick = (event) => {
                      // Only select if not clicking the button
                      if (event.target.closest('button')) return;
                      if (user.role !== 'admin' && !isSelf) handleClick(event, user._id);
                    };
                    const handleSingleDeactivate = async () => {
                      try {
                        const token = await currentUser?.getIdToken();
                        if (!token) {
                          setError('No authentication token');
                          return;
                        }
                        const config = { headers: { 'Authorization': `Bearer ${token}` } };
                        if (user.isDeactivated) {
                          await axios.put(`${API_URL}/admin/users/${user._id}/activate`, {}, config);
                        } else {
                          await axios.put(`${API_URL}/admin/users/${user._id}/deactivate`, {}, config);
                        }
                        await fetchUsers();
                      } catch (err) {
                        setError(err.response?.data?.message || 'Error updating user status');
                      }
                    };
                    return (
                      <TableRow
                        hover
                        onClick={handleRowClick}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={user._id}
                        selected={isItemSelected}
                        sx={{ cursor: user.role !== 'admin' && !isSelf ? 'pointer' : 'default' }}
                      >
                        <TableCell padding="checkbox" sx={{ width: 50 }}>
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            disabled={user.role === 'admin' || isSelf}
                            inputProps={{ 'aria-labelledby': `user-checkbox-${index}` }}
                          />
                        </TableCell>
                        <TableCell align="left">{user.username}</TableCell>
                        <TableCell align="left">{user.name}</TableCell>
                        <TableCell align="center">
                          <Box sx={{
                            display: 'inline-block',
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            backgroundColor: roleColor,
                            color: '#fff',
                            fontWeight: 'bold',
                            minWidth: '80px',
                            maxWidth: '80px',
                            textAlign: 'center',
                            textTransform: 'capitalize'
                          }}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Box>
                        </TableCell>
                        <TableCell align="center">{new Date(user.createdAt).toLocaleDateString('en-PH')}</TableCell>
                        <TableCell align="center">
                          <Button
                            variant="contained"
                            color={user.isDeactivated ? 'success' : 'error'}
                            size="small"
                            disabled={isSelf || user.role === 'admin'}
                            onClick={handleSingleDeactivate}
                            sx={{ minWidth: '100px' }}
                          >
                            {user.isDeactivated ? 'Activate' : 'Deactivate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={6} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredUsers.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        )}
        {/* Bulk Deactivate Dialog */}
        <Dialog open={bulkDeactivateDialogOpen} onClose={handleBulkDeactivateCancel} disableEnforceFocus disableRestoreFocus>
          <DialogTitle>Confirm Bulk Deactivate</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to deactivate {selected.length} user(s)? This action cannot be undone.
            </DialogContentText>
            {batchLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={32} />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleBulkDeactivateCancel} disabled={batchLoading}>Cancel</Button>
            <Button onClick={handleBulkDeactivateConfirm} color="error" variant="contained" disabled={batchLoading}>
              Deactivate Selected
            </Button>
          </DialogActions>
        </Dialog>
        {/* Bulk Activate Dialog */}
        <Dialog open={bulkActivateDialogOpen} onClose={handleBulkActivateCancel} disableEnforceFocus disableRestoreFocus
          PaperProps={{ sx: { minWidth: 400 } }}>
          <DialogTitle>Confirm Bulk Activate</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to activate {selected.length} user(s)?
            </DialogContentText>
            {batchLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={32} />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleBulkActivateCancel} disabled={batchLoading}>Cancel</Button>
            <Button onClick={handleBulkActivateConfirm} color="success" variant="contained" disabled={batchLoading}>
              Activate Selected
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}

export default UserList;

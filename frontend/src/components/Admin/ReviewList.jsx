import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import {
  Box,
  Collapse,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Tooltip,
  CircularProgress,
  Alert,
  TableSortLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  TablePagination,
  Checkbox,
  TextField,
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { Star } from 'lucide-react';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:4001/api/v1';

// Format anonymous username
const formatAnonymousName = (username) => {
  if (!username || username.length === 0) return 'Anonymous';
  if (username.length === 1) return username;
  const firstLetter = username.charAt(0);
  const lastLetter = username.charAt(username.length - 1);
  return `${firstLetter}*****${lastLetter}`;
};

// Truncate comment
const truncateComment = (comment, maxLength = 50) => {
  if (!comment) return 'No comment';
  if (comment.length <= maxLength) return comment;
  return comment.substring(0, maxLength) + '...';
};

// Review Row Component with Collapse
function ReviewRow({ row, onDelete, isSelected, onSelectChange }) {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { currentUser } = useAuth();

  const handleDelete = async () => {
    try {
      const token = await currentUser?.getIdToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      await axios.delete(
        `${API_URL}/reviews?id=${row._id}&productId=${row.product._id}`,
        config
      );

      toast.success('Review deleted successfully');
      setDeleteDialogOpen(false);
      onDelete();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error(error.response?.data?.message || 'Error deleting review');
    }
  };

  const displayName = row.isAnonymous ? formatAnonymousName(row.username) : row.username;

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell padding="checkbox" sx={{ width: 50 }}>
          <Checkbox
            checked={isSelected}
            onChange={(e) => onSelectChange(row._id, e.target.checked)}
          />
        </TableCell>
        <TableCell sx={{ width: 50 }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row" sx={{ fontWeight: 400, width: 200 }}>
          <Tooltip title={row.product.name}>
            <div style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%'
            }}>
              {row.product.name}
            </div>
          </Tooltip>
        </TableCell>
        <TableCell sx={{ width: 150 }}>{displayName}</TableCell>
        <TableCell sx={{ width: 80, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 400 }}>
              {row.rating}
            </Typography>
            <Star
              size={16}
              className="fill-yellow-500 text-yellow-500"
            />
          </Box>
        </TableCell>
        <TableCell sx={{ width: 180 }}>
          <Tooltip title={row.comment || 'No comment'}>
            <div style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%'
            }}>
              {truncateComment(row.comment, 50)}
            </div>
          </Tooltip>
        </TableCell>
        <TableCell sx={{ width: 120, textAlign: 'center' }}>
          {new Date(row.createdAt).toLocaleDateString('en-PH')}
        </TableCell>
        <TableCell sx={{ width: 100 }} align="center">
          <Tooltip title="Delete Review">
            <IconButton
              color="error"
              size="small"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </TableCell>
      </TableRow>

      {/* Collapse Row with Details */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Review Details
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Product Info */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Product Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Product ID:</strong> {row.product._id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Product Name:</strong> {row.product.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Category:</strong> {row.product.category}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Price:</strong> ₱{row.product.price.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>

                {/* Reviewer Info */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Reviewer Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Username:</strong> {row.username}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Display Name:</strong> {displayName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Anonymous:</strong> {row.isAnonymous ? 'Yes' : 'No'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Reviewed Date:</strong> {new Date(row.createdAt).toLocaleString('en-PH')}
                  </Typography>
                </Box>
              </Box>

              {/* Rating */}
              <Box sx={{ mt: 3, mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Rating
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={24}
                      className={`${
                        i < row.rating
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {row.rating}/5
                  </Typography>
                </Box>
              </Box>

              {/* Comment */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Comment
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', backgroundColor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                  {row.comment || 'No comment provided'}
                </Typography>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Review</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this review? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

// Main ReviewList Component
const ReviewList = () => {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState([]);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchReviews();
    }
  }, [currentUser]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = await currentUser?.getIdToken();

      if (!token) {
        setError('No authentication token');
        setLoading(false);
        return;
      }

      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Fetch all products to get their reviews
      const { data: productsData } = await axios.get(`${API_URL}/admin/products`, config);
      
      // Collect all reviews from all products
      const allReviews = [];
      if (productsData.products) {
        productsData.products.forEach(product => {
          if (product.reviews && product.reviews.length > 0) {
            product.reviews.forEach(review => {
              allReviews.push({
                ...review,
                product: {
                  _id: product._id,
                  name: product.name,
                  category: product.category,
                  price: product.price
                }
              });
            });
          }
        });
      }

      setReviews(allReviews);
      setError('');
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setError(error.response?.data?.message || 'Error fetching reviews');
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

  const handleSelectChange = (reviewId, isChecked) => {
    if (isChecked) {
      setSelected([...selected, reviewId]);
    } else {
      setSelected(selected.filter(id => id !== reviewId));
    }
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = visibleReviews.map((review) => review._id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const bulkDeleteHandler = async () => {
    if (selected.length === 0) {
      toast.warning('Please select reviews to delete', { position: 'bottom-right' });
      return;
    }
    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      const token = await currentUser?.getIdToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // Delete each selected review
      await Promise.all(
        selected.map(async (reviewId) => {
          const review = reviews.find(r => r._id === reviewId);
          if (review) {
            await axios.delete(
              `${API_URL}/reviews?id=${reviewId}&productId=${review.product._id}`,
              config
            );
          }
        })
      );

      toast.success(`${selected.length} review(s) deleted successfully`, { position: 'bottom-right' });
      setSelected([]);
      setBulkDeleteDialogOpen(false);
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting reviews', {
        position: 'bottom-right'
      });
    }
  };

  const handleBulkDeleteCancel = () => {
    setBulkDeleteDialogOpen(false);
  };

  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => {
          let aValue = orderBy === 'product' ? (a.product?.name || '') : a[orderBy];
          let bValue = orderBy === 'product' ? (b.product?.name || '') : b[orderBy];
          
          // Convert to lowercase for string comparison
          if (typeof aValue === 'string') aValue = aValue.toLowerCase();
          if (typeof bValue === 'string') bValue = bValue.toLowerCase();
          
          if (bValue < aValue) return -1;
          if (bValue > aValue) return 1;
          return 0;
        }
      : (a, b) => {
          let aValue = orderBy === 'product' ? (a.product?.name || '') : a[orderBy];
          let bValue = orderBy === 'product' ? (b.product?.name || '') : b[orderBy];
          
          // Convert to lowercase for string comparison
          if (typeof aValue === 'string') aValue = aValue.toLowerCase();
          if (typeof bValue === 'string') bValue = bValue.toLowerCase();
          
          if (aValue < bValue) return -1;
          if (aValue > bValue) return 1;
          return 0;
        };
  };

  const sortedReviews = [...reviews].sort(getComparator(order, orderBy));

  // Filter by search query
  const filteredReviews = sortedReviews.filter((review) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      review.product?.name.toLowerCase().includes(searchLower) ||
      review.username?.toLowerCase().includes(searchLower) ||
      review.comment?.toLowerCase().includes(searchLower)
    );
  });

  // Pagination
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredReviews.length) : 0;
  const visibleReviews = filteredReviews.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <AdminLayout>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Reviews Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage product reviews
          </Typography>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : reviews.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No reviews found
            </Typography>
          </Paper>
        ) : (
          <Paper sx={{ width: '100%', mb: 2 }}>
            <Box sx={{ 
              pl: { sm: 2 },
              pr: { xs: 1, sm: 1 },
              backgroundColor: '#f5f5f5',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              minHeight: '60px',
              flexWrap: 'wrap',
              gap: 2
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                {selected.length > 0 ? (
                  <Typography variant="subtitle1" sx={{ fontWeight: 400 }}>
                    {selected.length} selected
                  </Typography>
                ) : (
                  <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                    All Reviews
                  </Typography>
                )}
                {!selected.length > 0 && (
                  <TextField
                    placeholder="Search reviews..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(0);
                    }}
                    size="small"
                    sx={{ minWidth: '300px' }}
                  />
                )}
              </Box>
              {selected.length > 0 && (
                <Tooltip title="Delete">
                  <IconButton onClick={bulkDeleteHandler} color="error">
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
            <TableContainer>
              <Table aria-label="collapsible reviews table" sx={{ tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell padding="checkbox" sx={{ width: 50, fontWeight: 600 }}>
                      <Checkbox
                        indeterminate={selected.length > 0 && selected.length < visibleReviews.length}
                        checked={visibleReviews.length > 0 && selected.length === visibleReviews.length}
                        onChange={handleSelectAllClick}
                      />
                    </TableCell>
                    <TableCell sx={{ width: 50, fontWeight: 600 }} />
                    <TableCell sx={{ width: 200, fontWeight: 600 }}>
                      <TableSortLabel
                        active={orderBy === 'product'}
                        direction={orderBy === 'product' ? order : 'asc'}
                        onClick={(e) => handleRequestSort(e, 'product')}
                        hideSortIcon={false}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            opacity: 1,
                          },
                        }}
                      >
                        Product
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: 150, fontWeight: 600 }}>
                      <TableSortLabel
                        active={orderBy === 'username'}
                        direction={orderBy === 'username' ? order : 'asc'}
                        onClick={(e) => handleRequestSort(e, 'username')}
                        hideSortIcon={false}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            opacity: 1,
                          },
                        }}
                      >
                        Reviewer
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: 80, fontWeight: 600, textAlign: 'center' }}>
                      <TableSortLabel
                        active={orderBy === 'rating'}
                        direction={orderBy === 'rating' ? order : 'asc'}
                        onClick={(e) => handleRequestSort(e, 'rating')}
                        hideSortIcon={false}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            opacity: 1,
                          },
                        }}
                      >
                        Rating
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: 180, fontWeight: 600 }}>
                      <TableSortLabel
                        active={orderBy === 'comment'}
                        direction={orderBy === 'comment' ? order : 'asc'}
                        onClick={(e) => handleRequestSort(e, 'comment')}
                        hideSortIcon={false}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            opacity: 1,
                          },
                        }}
                      >
                        Comment
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: 120, fontWeight: 600, textAlign: 'center' }}>
                      <TableSortLabel
                        active={orderBy === 'createdAt'}
                        direction={orderBy === 'createdAt' ? order : 'asc'}
                        onClick={(e) => handleRequestSort(e, 'createdAt')}
                        hideSortIcon={false}
                        sx={{
                          '& .MuiTableSortLabel-icon': {
                            opacity: 1,
                          },
                        }}
                      >
                        Date
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: 100, fontWeight: 600 }} align="center">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleReviews.map((review) => (
                    <ReviewRow
                      key={review._id}
                      row={review}
                      onDelete={fetchReviews}
                      isSelected={selected.includes(review._id)}
                      onSelectChange={handleSelectChange}
                    />
                  ))}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={8} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredReviews.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        )}
      </Box>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={handleBulkDeleteCancel}>
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selected.length} review(s)? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBulkDeleteCancel}>Cancel</Button>
          <Button onClick={handleBulkDeleteConfirm} color="error" variant="contained">
            Delete Selected
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default ReviewList;

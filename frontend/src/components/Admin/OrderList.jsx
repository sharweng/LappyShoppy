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
  Select,
  MenuItem,
  Tooltip,
  CircularProgress,
  Alert,
  TableSortLabel,
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import { toast } from 'react-toastify';

const API_URL = 'http://localhost:4001/api/v1';

// Order status badges with colors
const statusColors = {
  pending: { bg: '#fff3cd', color: '#856404', label: 'Pending' },
  processing: { bg: '#cfe2ff', color: '#084298', label: 'Processing' },
  shipped: { bg: '#cff4fc', color: '#055160', label: 'Shipped' },
  delivered: { bg: '#d1e7dd', color: '#0f5132', label: 'Delivered' },
  cancelled: { bg: '#f8d7da', color: '#842029', label: 'Cancelled' },
};

const statusOptions = ['processing', 'shipped', 'delivered', 'cancelled'];

// Order Row Component with Collapse
function OrderRow({ row, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(row.orderStatus);
  const [updating, setUpdating] = useState(false);
  const { currentUser } = useAuth();

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const token = await currentUser?.getIdToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      await axios.put(
        `${API_URL}/admin/order/${row._id}`,
        { orderStatus: newStatus },
        config
      );

      setStatus(newStatus);
      toast.success('Order status updated successfully');
      onStatusChange();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Error updating order status');
    } finally {
      setUpdating(false);
    }
  };

  const statusColor = statusColors[status] || statusColors.pending;

  return (
    <>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ width: 50 }}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row" sx={{ fontWeight: 600, width: 180 }}>
          {row._id}
        </TableCell>
        <TableCell sx={{ width: 150 }}>{row.user?.name || 'Unknown'}</TableCell>
        <TableCell align="center" sx={{ width: 130 }}>
          ₱{row.totalPrice?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
        </TableCell>
        <TableCell align="center" sx={{ width: 160 }}>
          <Select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            size="small"
            sx={{ 
              minWidth: 140,
              width: '100%'
            }}
            renderValue={(value) => statusColors[value]?.label || value}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {statusColors[option].label}
              </MenuItem>
            ))}
          </Select>
        </TableCell>
        <TableCell align="center" sx={{ width: 140 }}>
          {new Date(row.createdAt).toLocaleDateString('en-PH')}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                Order Details - {row._id}
              </Typography>

              {/* Order Items */}
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Items Ordered
              </Typography>
              <Table size="small" sx={{ mb: 3 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Product</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Quantity</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Price</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600 }}>Subtotal</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {row.orderItems?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell align="center">{item.quantity}</TableCell>
                      <TableCell align="center">
                        ₱{item.price?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="center">
                        ₱{(item.price * item.quantity)?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Shipping Address */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Shipping Address
                  </Typography>
                  <Typography variant="body2">{row.shippingInfo?.address}</Typography>
                  <Typography variant="body2">{row.shippingInfo?.city}, {row.shippingInfo?.state}</Typography>
                  <Typography variant="body2">{row.shippingInfo?.country} - {row.shippingInfo?.pinCode}</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    <strong>Phone:</strong> {row.shippingInfo?.phoneNo}
                  </Typography>
                </Box>

                {/* Payment Info */}
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Payment Information
                  </Typography>
                  <Typography variant="body2">
                    <strong>Method:</strong> {row.paymentInfo?.method || 'Not specified'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status:</strong> {row.paymentInfo?.status || 'Not specified'}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    <strong>Total Price:</strong> ₱{row.totalPrice?.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Box>

              {/* Order Timeline */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  Order Timeline
                </Typography>
                <Typography variant="body2">
                  <strong>Ordered:</strong> {new Date(row.createdAt).toLocaleString('en-PH')}
                </Typography>
                {row.deliveredAt && (
                  <Typography variant="body2">
                    <strong>Delivered:</strong> {new Date(row.deliveredAt).toLocaleString('en-PH')}
                  </Typography>
                )}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// Main Orders List Component
const OrderList = () => {
  const { currentUser } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');

  useEffect(() => {
    if (currentUser) {
      fetchOrders();
    }
  }, [currentUser]);

  const fetchOrders = async () => {
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

      const { data } = await axios.get(`${API_URL}/admin/orders`, config);
      setOrders(data.orders || []);
      setError('');
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error.response?.data?.message || 'Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const getComparator = (order, orderBy) => {
    return order === 'desc'
      ? (a, b) => {
          let aValue = orderBy === 'user' ? (a.user?.name || 'Unknown') : a[orderBy];
          let bValue = orderBy === 'user' ? (b.user?.name || 'Unknown') : b[orderBy];
          
          // Convert to lowercase for string comparison
          if (typeof aValue === 'string') aValue = aValue.toLowerCase();
          if (typeof bValue === 'string') bValue = bValue.toLowerCase();
          
          if (bValue < aValue) return -1;
          if (bValue > aValue) return 1;
          return 0;
        }
      : (a, b) => {
          let aValue = orderBy === 'user' ? (a.user?.name || 'Unknown') : a[orderBy];
          let bValue = orderBy === 'user' ? (b.user?.name || 'Unknown') : b[orderBy];
          
          // Convert to lowercase for string comparison
          if (typeof aValue === 'string') aValue = aValue.toLowerCase();
          if (typeof bValue === 'string') bValue = bValue.toLowerCase();
          
          if (aValue < bValue) return -1;
          if (aValue > bValue) return 1;
          return 0;
        };
  };

  const sortedOrders = [...orders].sort(getComparator(order, orderBy));

  return (
    <AdminLayout>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Orders Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and update order statuses
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
        ) : orders.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No orders found
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table aria-label="collapsible orders table" sx={{ tableLayout: 'fixed' }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ width: 50, fontWeight: 600 }} />
                  <TableCell sx={{ width: 180, fontWeight: 600 }}>
                    <TableSortLabel
                      active={orderBy === '_id'}
                      direction={orderBy === '_id' ? order : 'asc'}
                      onClick={(e) => handleRequestSort(e, '_id')}
                      hideSortIcon={false}
                      sx={{
                        '& .MuiTableSortLabel-icon': {
                          opacity: 1,
                        },
                      }}
                    >
                      Order ID
                      {orderBy === '_id' ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ width: 150, fontWeight: 600 }}>
                    <TableSortLabel
                      active={orderBy === 'user'}
                      direction={orderBy === 'user' ? order : 'asc'}
                      onClick={(e) => handleRequestSort(e, 'user')}
                      hideSortIcon={false}
                      sx={{
                        '& .MuiTableSortLabel-icon': {
                          opacity: 1,
                        },
                      }}
                    >
                      Customer
                      {orderBy === 'user' ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center" sx={{ width: 130, fontWeight: 600 }}>
                    <TableSortLabel
                      active={orderBy === 'totalPrice'}
                      direction={orderBy === 'totalPrice' ? order : 'asc'}
                      onClick={(e) => handleRequestSort(e, 'totalPrice')}
                      hideSortIcon={false}
                      sx={{
                        '& .MuiTableSortLabel-icon': {
                          opacity: 1,
                        },
                      }}
                    >
                      Total
                      {orderBy === 'totalPrice' ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center" sx={{ width: 160, fontWeight: 600 }}>
                    <TableSortLabel
                      active={orderBy === 'orderStatus'}
                      direction={orderBy === 'orderStatus' ? order : 'asc'}
                      onClick={(e) => handleRequestSort(e, 'orderStatus')}
                      hideSortIcon={false}
                      sx={{
                        '& .MuiTableSortLabel-icon': {
                          opacity: 1,
                        },
                      }}
                    >
                      Status
                      {orderBy === 'orderStatus' ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center" sx={{ width: 140, fontWeight: 600 }}>
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
                      {orderBy === 'createdAt' ? (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      ) : null}
                    </TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedOrders.map((orderItem) => (
                  <OrderRow
                    key={orderItem._id}
                    row={orderItem}
                    onStatusChange={fetchOrders}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </AdminLayout>
  );
};

export default OrderList;

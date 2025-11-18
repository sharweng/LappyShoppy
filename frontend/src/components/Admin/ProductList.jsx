import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import { alpha } from '@mui/material/styles';
import { 
  Box, 
  Button, 
  IconButton, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogContentText, 
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Toolbar,
  Typography,
  Paper,
  Checkbox,
  CircularProgress,
  Tooltip,
  TextField,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import { toast } from 'react-toastify';
import { CSVLink } from 'react-csv';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;

// Comparator functions for sorting
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// Table Head Component
const headCells = [
  { id: 'name', numeric: false, disablePadding: true, label: 'Product Name', align: 'left' },
  { id: 'brand', numeric: false, disablePadding: false, label: 'Brand', align: 'center' },
  { id: 'price', numeric: false, disablePadding: false, label: 'Price', align: 'center' },
  { id: 'stock', numeric: false, disablePadding: false, label: 'Stock', align: 'center' },
  { id: 'category', numeric: false, disablePadding: false, label: 'Category', align: 'center' },
  { id: 'actions', numeric: false, disablePadding: false, label: 'Actions', sortable: false, align: 'center' },
];

function EnhancedTableHead(props) {
  const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;
  
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <TableHead>
      <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
        <TableCell padding="checkbox" sx={{ width: 50 }}>
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
            inputProps={{ 'aria-label': 'select all products' }}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.align || (headCell.numeric ? 'right' : 'left')}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
            sx={{
              width: headCell.id === 'name' ? 250 : headCell.id === 'brand' ? 120 : headCell.id === 'price' ? 130 : headCell.id === 'stock' ? 120 : headCell.id === 'category' ? 120 : 120,
              flexShrink: 0,
              fontWeight: 600
            }}
          >
            {headCell.sortable === false ? (
              headCell.label
            ) : (
              <TableSortLabel
                active={orderBy === headCell.id}
                direction={orderBy === headCell.id ? order : 'asc'}
                onClick={createSortHandler(headCell.id)}
                hideSortIcon={false}
                sx={{
                  '& .MuiTableSortLabel-icon': {
                    opacity: 1,
                  },
                }}
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
  );
}

// Enhanced Toolbar Component
function EnhancedTableToolbar(props) {
  const { numSelected, onDelete, onAddProduct } = props;

  return (
    <Toolbar
      sx={[
        {
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          backgroundColor: '#f5f5f5'
        },
        numSelected > 0 && {
          bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
        },
      ]}
    >
      {numSelected > 0 ? (
        <Typography
          sx={{ flex: '1 1 100%' }}
          color="inherit"
          variant="subtitle1"
          component="div"
        >
          {numSelected} selected
        </Typography>
      ) : (
        <Box sx={{ flex: '1 1 100%' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            All Products
          </Typography>

        </Box>
      )}

      {numSelected > 0 ? (
        <Tooltip title="Delete">
          <IconButton onClick={onDelete} color="error">
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      ) : (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAddProduct}
          sx={{ whiteSpace: 'nowrap' }}
        >
          Add Product
        </Button>
      )}
    </Toolbar>
  );
}

const ProductList = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDeleted, setIsDeleted] = useState(false);
  const [selected, setSelected] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const getAdminProducts = async () => {
    try {
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

      const { data } = await axios.get(`${API_URL}/admin/products`, config);
      console.log(data);
      setProducts(data.products || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error.response?.data?.message || 'Error fetching products');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      getAdminProducts();
    }
  }, [currentUser]);

  useEffect(() => {
    if (error) {
      toast.error(error, { position: 'bottom-right' });
    }

    if (isDeleted) {
      toast.success('Product deleted successfully', { position: 'bottom-right' });
      setIsDeleted(false);
      getAdminProducts();
    }
  }, [error, isDeleted]);

  const deleteProduct = async (id) => {
    try {
      const token = await currentUser?.getIdToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      const { data } = await axios.delete(`${API_URL}/admin/product/${id}`, config);
      setIsDeleted(data.success);
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting product', {
        position: 'bottom-right'
      });
    }
  };

  const deleteProductHandler = (id) => {
    setProductToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProduct(productToDelete);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const bulkDeleteHandler = async () => {
    if (selected.length === 0) {
      toast.warning('Please select products to delete', { position: 'bottom-right' });
      return;
    }

    setBulkDeleteDialogOpen(true);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      const token = await currentUser?.getIdToken();
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };

      await axios.post(`${API_URL}/admin/products/bulk-delete`, { productIds: selected }, config);
      toast.success(`${selected.length} product(s) deleted successfully`, { position: 'bottom-right' });
      setSelected([]);
      setBulkDeleteDialogOpen(false);
      getAdminProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error deleting products', {
        position: 'bottom-right'
      });
    }
  };

  const handleBulkDeleteCancel = () => {
    setBulkDeleteDialogOpen(false);
  };

  // Table sorting handlers
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = products.map((n) => n._id);
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const isSelected = (id) => selected.indexOf(id) !== -1;

  // Filter by search query
  const filteredProducts = products.filter((product) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(searchLower) ||
      product.brand?.toLowerCase().includes(searchLower) ||
      product.price?.toString().includes(searchLower) ||
      product.stock?.toString().includes(searchLower) ||
      product.category?.toLowerCase().includes(searchLower)
    );
  });

  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows = page > 0 ? Math.max(0, (1 + page) * rowsPerPage - filteredProducts.length) : 0;

  const visibleRows = filteredProducts
    .slice()
    .sort(getComparator(order, orderBy))
    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Prepare CSV data for products (exclude internal fields like __v)
  // Export all filtered products (not just current page)
  const productCsvData = filteredProducts.map(p => ({
    name: p.name,
    brand: p.brand || '',
    price: p.price,
    stock: p.stock,
    category: p.category || '',
    createdAt: p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-PH') : ''
  }));

  return (
    <AdminLayout>
      <Box sx={{ width: '100%', p: { xs: 2, md: 4 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            Products Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage products
          </Typography>
        </Box>
        {!currentUser ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <p>Loading authentication...</p>
          </Box>
        ) : loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Paper sx={{ width: '100%', mb: 2 }}>
            <Toolbar
              sx={[
                {
                  pl: { sm: 2 },
                  pr: { xs: 1, sm: 1 },
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  minHeight: '60px',
                  gap: 2,
                  borderBottom: '1px solid #e0e0e0'
                },
                selected.length > 0 && {
                  bgcolor: (theme) =>
                    alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
                },
              ]}
            >
              {selected.length > 0 ? (
                <>
                  <Typography
                    sx={{ flex: '1 1 100%' }}
                    color="inherit"
                    variant="subtitle1"
                    component="div"
                  >
                    {selected.length} selected
                  </Typography>
                  <Tooltip title="Delete">
                    <IconButton onClick={bulkDeleteHandler} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                      All Products
                    </Typography>
                    <TextField
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setPage(0);
                      }}
                      size="small"
                      sx={{ minWidth: '300px' }}
                    />
                    <Button
                      component={CSVLink}
                      data={productCsvData}
                      filename={"products.csv"}
                      variant="outlined"
                      sx={{ ml: 1, py: 0.6, px: 1.5, borderRadius: 1 }}
                    >
                      Download CSV
                    </Button>
                  </Box>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/admin/product/new')}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    Add Product
                  </Button>
                </>
              )}
            </Toolbar>
            {/* CSV download moved next to search */}
            <TableContainer>
              <Table sx={{ minWidth: 750, tableLayout: 'fixed' }} aria-labelledby="tableTitle">
                <EnhancedTableHead
                  numSelected={selected.length}
                  order={order}
                  orderBy={orderBy}
                  onSelectAllClick={handleSelectAllClick}
                  onRequestSort={handleRequestSort}
                  rowCount={filteredProducts.length}
                />
                <TableBody>
                  {visibleRows.map((product, index) => {
                    const isItemSelected = isSelected(product._id);
                    const labelId = `enhanced-table-checkbox-${index}`;
                    const stockValue = product.stock;
                    const backgroundColor = stockValue > 10 ? '#4caf50' : stockValue > 0 ? '#ff9800' : '#f44336';

                    return (
                      <TableRow
                        hover
                        onClick={(event) => handleClick(event, product._id)}
                        role="checkbox"
                        aria-checked={isItemSelected}
                        tabIndex={-1}
                        key={product._id}
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox" sx={{ width: 50 }}>
                          <Checkbox
                            color="primary"
                            checked={isItemSelected}
                            inputProps={{ 'aria-labelledby': labelId }}
                          />
                        </TableCell>
                        <TableCell component="th" id={labelId} scope="row" padding="none" sx={{ width: 250 }}>
                          <Tooltip title={product.name}>
                            <div style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '100%'
                            }}>
                              {product.name}
                            </div>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center" sx={{ width: 120 }}>{product.brand || 'N/A'}</TableCell>
                        <TableCell align="center" sx={{ width: 130 }}>
                          ₱{product.price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="center" sx={{ width: 120 }}>
                          <Box
                            sx={{
                              display: 'inline-block',
                              px: 2,
                              py: 0.5,
                              borderRadius: 1,
                              backgroundColor: backgroundColor,
                              color: '#ffffff',
                              fontWeight: 'bold',
                              minWidth: '50px',
                              textAlign: 'center'
                            }}
                          >
                            {stockValue}
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ width: 120 }}>{product.category || 'N/A'}</TableCell>
                        <TableCell align="center" sx={{ width: 120 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Tooltip title="Edit">
                              <IconButton
                                color="primary"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/product/edit/${product._id}`);
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                color="error"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteProductHandler(product._id);
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {emptyRows > 0 && (
                    <TableRow style={{ height: 53 * emptyRows }}>
                      <TableCell colSpan={7} />
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={filteredProducts.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
        )}
      </Box>

      {/* Single Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this product? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onClose={handleBulkDeleteCancel}>
        <DialogTitle>Confirm Bulk Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete {selected.length} product(s)? This action cannot be undone.
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

export default ProductList;

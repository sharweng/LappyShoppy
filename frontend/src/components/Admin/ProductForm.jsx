import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const API_URL = 'http://localhost:4001/api/v1';

const categories = [
  'Electronics',
  'Cameras',
  'Laptops',
  'Accessories',
  'Headphones',
  'Food',
  'Books',
  'Clothes/Shoes',
  'Beauty/Health',
  'Sports',
  'Outdoor',
  'Home',
];

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    brand: '',
    processor: '',
    ram: '',
    storage: '',
    screenSize: '',
    graphics: 'Integrated',
    operatingSystem: 'Windows 11',
    category: 'Laptops',
    seller: '',
    stock: '',
  });

  const [images, setImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  useEffect(() => {
    if (isEditMode) {
      fetchProduct();
    }
  }, [id]);

  const getAuthConfig = async () => {
    try {
      const token = await currentUser?.getIdToken();
      if (!token) {
        throw new Error('No authentication token available');
      }
      return {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };
    } catch (error) {
      console.error('Error getting auth token:', error);
      throw error;
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`${API_URL}/product/${id}`);
      const product = data.product;

      setFormData({
        name: product.name || '',
        price: product.price || '',
        description: product.description || '',
        brand: product.brand || '',
        processor: product.processor || '',
        ram: product.ram || '',
        storage: product.storage || '',
        screenSize: product.screenSize || '',
        graphics: product.graphics || 'Integrated',
        operatingSystem: product.operatingSystem || 'Windows 11',
        category: product.category || 'Laptops',
        seller: product.seller || '',
        stock: product.stock || '',
      });

      setExistingImages(product.images || []);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError('Error loading product data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    files.forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (reader.readyState === 2) {
          setImages((oldImages) => [...oldImages, reader.result]);
        }
      };

      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages((prevImages) => prevImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name || !formData.price || !formData.brand || !formData.processor) {
      setError('Please fill in all required fields');
      return;
    }

    if (!isEditMode && images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    try {
      setUploading(true);
      const config = await getAuthConfig();

      // Combine existing images (if editing) with new images
      const allImages = isEditMode ? [...existingImages.map(img => img.url), ...images] : images;

      const productData = {
        ...formData,
        images: allImages,
      };

      let response;
      if (isEditMode) {
        response = await axios.put(`${API_URL}/admin/product/${id}`, productData, config);
      } else {
        response = await axios.post(`${API_URL}/admin/product/new`, productData, config);
      }

      setSuccess(
        isEditMode ? 'Product updated successfully!' : 'Product created successfully!'
      );

      setTimeout(() => {
        navigate('/admin/products');
      }, 1500);
    } catch (error) {
      console.error('Error saving product:', error);
      setError(error.response?.data?.message || 'Error saving product');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh',
          }}
        >
          <CircularProgress />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: { xs: 2, md: 4 } }}>
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/admin/products')}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {isEditMode ? 'Edit Product' : 'Add New Product'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEditMode ? 'Update product information' : 'Create a new laptop product'}
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <Paper sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            {/* Basic Information Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>
                Basic Information
              </Typography>
              
              <Grid container spacing={3}>
                {/* Row 1: Name, Brand, Price */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    placeholder="Enter product name"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    placeholder="e.g., Dell, HP, Lenovo"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Price (PHP)"
                    name="price"
                    type="number"
                    value={formData.price}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    InputProps={{ startAdornment: '₱' }}
                    placeholder="0.00"
                  />
                </Grid>

                {/* Row 2: Stock, Category, Seller */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Stock"
                    name="stock"
                    type="number"
                    value={formData.stock}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    placeholder="Available quantity"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Category</InputLabel>
                    <Select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      label="Category"
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Seller"
                    name="seller"
                    value={formData.seller}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    placeholder="Seller name or store"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Description - Full Width Flexible */}
            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                variant="outlined"
                multiline
                minRows={4}
                maxRows={8}
                placeholder="Enter detailed product description..."
              />
            </Box>

            {/* Laptop Specifications Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 3 }}>
                Laptop Specifications
              </Typography>
              
              <Grid container spacing={3}>
                {/* Row 1: Processor, RAM, Storage */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Processor"
                    name="processor"
                    value={formData.processor}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    placeholder="e.g., Intel Core i7 13th Gen"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="RAM"
                    name="ram"
                    value={formData.ram}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    placeholder="e.g., 16GB DDR5"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Storage"
                    name="storage"
                    value={formData.storage}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    placeholder="e.g., 512GB SSD"
                  />
                </Grid>

                {/* Row 2: Screen Size, Graphics Card, Operating System */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Screen Size"
                    name="screenSize"
                    value={formData.screenSize}
                    onChange={handleInputChange}
                    required
                    variant="outlined"
                    placeholder="e.g., 15.6 inch"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Graphics Card"
                    name="graphics"
                    value={formData.graphics}
                    onChange={handleInputChange}
                    variant="outlined"
                    placeholder="e.g., NVIDIA GeForce RTX 3050"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Operating System"
                    name="operatingSystem"
                    value={formData.operatingSystem}
                    onChange={handleInputChange}
                    variant="outlined"
                    placeholder="e.g., Windows 11 Pro"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Bottom Section: Image Upload and Action Buttons in one row */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              pt: 3,
              borderTop: '1px solid',
              borderColor: 'divider',
              flexWrap: 'wrap',
              gap: 2
            }}>
              {/* Left: Product Images Upload */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1.5 }}>
                  Product Images
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  size="large"
                  sx={{ 
                    py: 1.5,
                    px: 4,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '1rem'
                  }}
                >
                  Upload Images
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Button>
              </Box>

              {/* Right: Submit Buttons */}
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/admin/products')}
                  disabled={uploading}
                  size="large"
                  sx={{ 
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={uploading}
                  size="large"
                  startIcon={uploading ? <CircularProgress size={20} /> : null}
                  sx={{ 
                    px: 4,
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem'
                  }}
                >
                  {uploading
                    ? 'Saving...'
                    : isEditMode
                    ? 'Update Product'
                    : 'Create Product'}
                </Button>
              </Box>
            </Box>

            {/* Existing Images (Edit Mode) */}
            {existingImages.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Current Images
                </Typography>
                <ImageList cols={4} gap={16} sx={{ mt: 1 }}>
                  {existingImages.map((image, index) => (
                    <ImageListItem key={index} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                      <img
                        src={image.url}
                        alt={`Product ${index + 1}`}
                        style={{ height: 180, objectFit: 'cover' }}
                      />
                      <ImageListItemBar
                        actionIcon={
                          <IconButton
                            sx={{ color: 'white' }}
                            onClick={() => removeExistingImage(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                        sx={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)' }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </Box>
            )}

            {/* New Images Preview */}
            {images.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  New Images ({images.length})
                </Typography>
                <ImageList cols={4} gap={16} sx={{ mt: 1 }}>
                  {images.map((image, index) => (
                    <ImageListItem key={index} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        style={{ height: 180, objectFit: 'cover' }}
                      />
                      <ImageListItemBar
                        actionIcon={
                          <IconButton
                            sx={{ color: 'white' }}
                            onClick={() => removeImage(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                        sx={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 70%, rgba(0,0,0,0) 100%)' }}
                      />
                    </ImageListItem>
                  ))}
                </ImageList>
              </Box>
            )}
          </form>
        </Paper>
      </Box>
    </AdminLayout>
  );
};

export default ProductForm;

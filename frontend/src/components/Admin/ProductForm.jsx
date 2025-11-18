import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLayout from './AdminLayout';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
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
  FormHelperText,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/api/v1`;

const categories = [
  'Business Laptop',
  'Gaming Laptop',
  'Chromebooks',
  'Convertible Laptops'
];

// Yup validation schema
const productSchema = yup.object().shape({
  name: yup.string()
    .required('Product name is required')
    .min(3, 'Product name must be at least 3 characters'),
  price: yup.number()
    .required('Price is required')
    .positive('Price must be a positive number')
    .typeError('Price must be a number'),
  description: yup.string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters'),
  brand: yup.string()
    .required('Brand is required')
    .min(2, 'Brand must be at least 2 characters'),
  processor: yup.string()
    .required('Processor is required')
    .min(3, 'Processor must be at least 3 characters'),
  ram: yup.string()
    .required('RAM is required'),
  storage: yup.string()
    .required('Storage is required'),
  screenSize: yup.string()
    .required('Screen size is required'),
  graphics: yup.string()
    .required('Graphics is required'),
  operatingSystem: yup.string()
    .required('Operating system is required'),
  category: yup.string()
    .required('Category is required'),
  seller: yup.string()
    .required('Seller is required')
    .min(2, 'Seller must be at least 2 characters'),
  stock: yup.number()
    .required('Stock is required')
    .integer('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .typeError('Stock must be a number'),
});

const ProductForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, reset } = useForm({
    resolver: yupResolver(productSchema),
    mode: 'onBlur',
    defaultValues: {
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
      category: 'Gaming Laptop',
      seller: '',
      stock: '',
    }
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

      // Use reset to populate form with fetched data
      reset({
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

  const onSubmit = async (formData) => {
    setError('');
    setSuccess('');

    // Additional image validation
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
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Basic Information Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}>
                Basic Information
              </Typography>
              
              <Grid container spacing={2}>
                {/* Row 1: Name, Brand, Price */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Product Name"
                    {...register('name')}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                    variant="outlined"
                    size="small"
                    placeholder="Enter product name"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Brand"
                    {...register('brand')}
                    error={!!errors.brand}
                    helperText={errors.brand?.message}
                    variant="outlined"
                    size="small"
                    placeholder="e.g., Dell, HP, Lenovo"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Price (PHP)"
                    {...register('price')}
                    error={!!errors.price}
                    helperText={errors.price?.message}
                    variant="outlined"
                    size="small"
                    InputProps={{ startAdornment: '₱' }}
                    placeholder="0.00"
                    inputProps={{ inputMode: 'decimal' }}
                  />
                </Grid>

                {/* Row 2: Stock, Category, Seller */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Stock"
                    {...register('stock')}
                    error={!!errors.stock}
                    helperText={errors.stock?.message}
                    variant="outlined"
                    size="small"
                    placeholder="Available quantity"
                    inputProps={{ inputMode: 'numeric' }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <FormControl fullWidth variant="outlined" error={!!errors.category} size="small">
                    <InputLabel>Category</InputLabel>
                    <Select
                      {...register('category')}
                      label="Category"
                      defaultValue="Gaming Laptop"
                    >
                      {categories.map((category) => (
                        <MenuItem key={category} value={category}>
                          {category}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.category && <FormHelperText>{errors.category.message}</FormHelperText>}
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Seller"
                    {...register('seller')}
                    error={!!errors.seller}
                    helperText={errors.seller?.message}
                    variant="outlined"
                    size="small"
                    placeholder="Seller name or store"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Description - Full Width Flexible */}
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Description"
                {...register('description')}
                error={!!errors.description}
                helperText={errors.description?.message}
                variant="outlined"
                size="small"
                multiline
                minRows={2}
                maxRows={4}
                placeholder="Enter detailed product description..."
              />
            </Box>

            {/* Laptop Specifications Section */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}>
                Laptop Specifications
              </Typography>
              
              <Grid container spacing={2}>
                {/* Row 1: Processor, RAM, Storage */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Processor"
                    {...register('processor')}
                    error={!!errors.processor}
                    helperText={errors.processor?.message}
                    variant="outlined"
                    size="small"
                    placeholder="e.g., Intel Core i7 13th Gen"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="RAM"
                    {...register('ram')}
                    error={!!errors.ram}
                    helperText={errors.ram?.message}
                    variant="outlined"
                    size="small"
                    placeholder="e.g., 16GB DDR5"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Storage"
                    {...register('storage')}
                    error={!!errors.storage}
                    helperText={errors.storage?.message}
                    variant="outlined"
                    size="small"
                    placeholder="e.g., 512GB SSD"
                  />
                </Grid>

                {/* Row 2: Screen Size, Graphics Card, Operating System */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Screen Size"
                    {...register('screenSize')}
                    error={!!errors.screenSize}
                    helperText={errors.screenSize?.message}
                    variant="outlined"
                    size="small"
                    placeholder="e.g., 15.6 inch"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Graphics Card"
                    {...register('graphics')}
                    error={!!errors.graphics}
                    helperText={errors.graphics?.message}
                    variant="outlined"
                    size="small"
                    placeholder="e.g., NVIDIA GeForce RTX 3050"
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Operating System"
                    {...register('operatingSystem')}
                    error={!!errors.operatingSystem}
                    helperText={errors.operatingSystem?.message}
                    variant="outlined"
                    size="small"
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
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              flexWrap: 'wrap',
              gap: 2
            }}>
              {/* Left: Product Images Upload */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary', mb: 1 }}>
                  Product Images
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<CloudUploadIcon />}
                  size="medium"
                  sx={{ 
                    py: 1,
                    px: 3,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontSize: '0.95rem'
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
                  size="medium"
                  sx={{ 
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontSize: '0.95rem'
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  size="medium"
                  startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
                  sx={{ 
                    px: 3,
                    py: 1,
                    textTransform: 'none',
                    fontSize: '0.95rem'
                  }}
                >
                  {isSubmitting
                    ? 'Saving...'
                    : isEditMode
                    ? 'Update Product'
                    : 'Create Product'}
                </Button>
              </Box>
            </Box>

            {/* Existing Images (Edit Mode) */}
            {existingImages.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Current Images
                </Typography>
                <ImageList cols={4} gap={12} sx={{ mt: 1 }}>
                  {existingImages.map((image, index) => (
                    <ImageListItem key={index} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                      <img
                        src={image.url}
                        alt={`Product ${index + 1}`}
                        style={{ height: 150, objectFit: 'cover' }}
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
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  New Images ({images.length})
                </Typography>
                <ImageList cols={4} gap={12} sx={{ mt: 1 }}>
                  {images.map((image, index) => (
                    <ImageListItem key={index} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        style={{ height: 150, objectFit: 'cover' }}
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

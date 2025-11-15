const express = require('express');
const router = express.Router();
const upload = require("../utils/multer");

const { 
    newProduct,
    getSingleProduct,
    getAdminProducts,
    updateProduct,
    deleteProduct,
    getProducts,
    productSales,
    createProductReview,
    getProductReviews,
    deleteReview,
    bulkDeleteProducts,
    getFilterOptions,
    checkUserCanReview,
    
    } = require('../controllers/product');

    const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')

router.post('/admin/product/new', isAuthenticatedUser, upload.array('images', 10), newProduct);
router.get('/product/:id', getSingleProduct)
router.get('/admin/products', isAuthenticatedUser, authorizeRoles('admin'), getAdminProducts);

router.put('/admin/product/:id', upload.array('images', 10), updateProduct);
router.delete('/admin/product/:id', deleteProduct);
router.post('/admin/products/bulk-delete', isAuthenticatedUser, authorizeRoles('admin'), bulkDeleteProducts);

router.get('/products', getProducts)
router.get('/products/filter-options', getFilterOptions);
router.get('/admin/product-sales', productSales);
router.put('/review', isAuthenticatedUser, createProductReview);
router.get('/reviews', getProductReviews);
router.get('/review/can-review', isAuthenticatedUser, checkUserCanReview);
router.delete('/reviews', isAuthenticatedUser, deleteReview);

module.exports = router
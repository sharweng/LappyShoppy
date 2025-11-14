const express = require('express')
const router = express.Router();

const { newOrder,
	myOrders,
	getSingleOrder,
	deleteOrder,
	allOrders,
	updateOrder,
	totalOrders,
	totalSales,
	customerSales,
	salesPerMonth,
	salesByDateRange,
	productsSoldPerMonth,
	productsSoldByDateRange,
		

	} = require('../controllers/order')
const { isAuthenticatedUser, authorizeRoles } = require('../middlewares/auth')

router.route('/order/new').post(isAuthenticatedUser, newOrder);
router.get('/orders/me', isAuthenticatedUser, myOrders);
router.route('/order/:id').get(isAuthenticatedUser, getSingleOrder);
router.get('/admin/orders/', isAuthenticatedUser, authorizeRoles('admin'), allOrders);
// router.route('/admin/order/:id').delete(isAuthenticatedUser, deleteOrder);
router.route('/admin/order/:id').put(isAuthenticatedUser, updateOrder).delete(isAuthenticatedUser, deleteOrder);
router.get('/admin/total-orders', totalOrders);
router.get('/admin/total-sales', totalSales);
router.get('/admin/customer-sales', customerSales);
router.get('/admin/sales-per-month', salesPerMonth);
router.get('/admin/sales-by-date-range', salesByDateRange);
router.get('/admin/products-sold-per-month', productsSoldPerMonth);
router.get('/admin/products-sold-by-date-range', productsSoldByDateRange);
module.exports = router;
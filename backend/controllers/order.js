const Order = require('../models/order');
const Product = require('../models/product');
const sendEmail = require('../utils/sendEmail');
const { generateOrderPDF } = require('../utils/generatePDF');
const { getOrderConfirmationEmail, getOrderStatusUpdateEmail } = require('../utils/emailTemplates');
const { getUserEmail } = require('../utils/getUserEmail');



// Create a new order   =>  /api/v1/order/new
exports.newOrder = async (req, res, next) => {
    const {
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo

    } = req.body;

    const order = await Order.create({
        orderItems,
        shippingInfo,
        itemsPrice,
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user._id
    })

    // Subtract stock immediately when order is created
    for (const item of orderItems) {
        await updateStock(item.product, item.quantity, 'subtract');
    }

    // Populate user details for email
    await order.populate('user', 'name email');

    try {
        // Get email from Firebase (more reliable than MongoDB)
        const userEmail = req.user.firebaseEmail || order.user.email;
        
        console.log('Email Debug - Order Confirmation:');
        console.log('  req.user.firebaseEmail:', req.user.firebaseEmail);
        console.log('  order.user.email:', order.user.email);
        console.log('  Final userEmail:', userEmail);
        console.log('  Auth Provider:', req.user.authProvider || 'not set');
        
        if (!userEmail) {
            console.warn('No email available for order confirmation');
            throw new Error('User email not found');
        }

        // Generate PDF receipt
        const pdfBuffer = await generateOrderPDF(order, `receipt-${order._id}.pdf`);

        // Get HTML email template
        const htmlEmail = getOrderConfirmationEmail(order);

        // Send confirmation email with PDF attachment
        await sendEmail({
            email: userEmail,
            subject: `Order Confirmation - LappyShoppy`,
            html: htmlEmail,
            attachments: [
                {
                    filename: `LappyShoppy-Receipt-${order._id}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        console.log('Order confirmation email sent successfully to:', userEmail);
    } catch (error) {
        console.error('Error sending email:', error.message);
        // Don't fail the request if email fails
    }

    res.status(200).json({
        success: true,
        order
    })
}

exports.myOrders = async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id })
    // console.log(req.user)
    res.status(200).json({
        success: true,
        orders
    })
}

exports.getSingleOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate('user', 'name email')
    if (!order) {
        res.status(404).json({
            message: 'No Order found with this ID',

        })
    }
    res.status(200).json({
        success: true,
        order
    })
}

exports.allOrders = async (req, res, next) => {
    try {
        const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 })
        
        let totalAmount = 0;
        orders.forEach(order => {
            totalAmount += order.totalPrice
        })

        res.status(200).json({
            success: true,
            totalAmount,
            orders
        })
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching orders'
        })
    }
}

exports.deleteOrder = async (req, res, next) => {
    const order = await Order.findByIdAndDelete(req.params.id)

    if (!order) {
        return res.status(400).json({
            message: 'No Order found with this ID',

        })
      
    }
    return res.status(200).json({
        success: true
    })
}

exports.updateOrder = async (req, res, next) => {
    const order = await Order.findById(req.params.id)
    const newStatus = req.body.orderStatus || req.body.status;

    if (!order) {
        return res.status(404).json({
            success: false,
            message: 'Order not found with this ID'
        })
    }

    if (order.orderStatus === 'Delivered') {
        return res.status(400).json({
            success: false,
            message: 'You have already delivered this order'
        })
    }

    // Handle order cancellation - restore stock
    if ((newStatus === 'Cancelled' || newStatus === 'cancelled') && order.orderStatus !== 'Cancelled') {
        // Restore stock by adding back the quantities
        for (const item of order.orderItems) {
            await updateStock(item.product, item.quantity, 'add');
        }
        order.cancelledAt = Date.now();
    }

    // Only update stock when order is delivered (already subtracted at checkout)
    if (newStatus === 'Delivered' || newStatus === 'delivered') {
        order.deliveredAt = Date.now()
        // Update payment status to Paid when order is delivered
        order.paymentInfo.status = 'Paid'
    }

    order.orderStatus = newStatus
    await order.save()

    try {
        // Re-fetch the order with populated user details to ensure data is fresh
        // Include firebaseUid because getUserEmail needs it for OAuth users
        const updatedOrder = await Order.findById(req.params.id).populate('user', 'name email firebaseUid');
        
        if (!updatedOrder) {
            console.error('Order not found after save');
            return res.status(200).json({
                success: true,
                order
            });
        }

        // Get user email from Firebase or MongoDB
        const userEmail = await getUserEmail(updatedOrder.user);

        console.log('Email Debug - Order Status Update:');
        console.log('  Updated Order User Email:', updatedOrder.user?.email);
        console.log('  User Firebase UID:', updatedOrder.user?.firebaseUid);
        console.log('  Retrieved userEmail:', userEmail);

        if (!userEmail) {
            console.warn('No email found for order notification');
            return res.status(200).json({
                success: true,
                order: updatedOrder
            });
        }

        // Generate PDF receipt
        const pdfBuffer = await generateOrderPDF(updatedOrder, `receipt-${updatedOrder._id}.pdf`);

        // Get HTML email template for status update
        const htmlEmail = getOrderStatusUpdateEmail(updatedOrder);

        // Send status update email with PDF attachment
        await sendEmail({
            email: userEmail,
            subject: `Order Status Update - LappyShoppy`,
            html: htmlEmail,
            attachments: [
                {
                    filename: `LappyShoppy-Receipt-${updatedOrder._id}.pdf`,
                    content: pdfBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        console.log('Order status update email sent successfully to:', userEmail);
        
        res.status(200).json({
            success: true,
            order: updatedOrder
        });
    } catch (error) {
        console.error('Error sending email:', error.message);
        console.error('Error stack:', error.stack);
        // Return the updated order even if email fails
        const finalOrder = await Order.findById(req.params.id).populate('user', 'name email firebaseUid');
        res.status(200).json({
            success: true,
            order: finalOrder
        });
    }
}

async function updateStock(id, quantity, operation = 'subtract') {
    const product = await Product.findById(id);

    if (!product) {
        console.error(`Product not found with ID: ${id}`);
        return;
    }

    if (operation === 'subtract') {
        product.stock = product.stock - quantity;
    } else if (operation === 'add') {
        product.stock = product.stock + quantity;
    }

    await product.save({ validateBeforeSave: false })
}

exports.totalOrders = async (req, res, next) => {
    const totalOrders = await Order.aggregate([
        {
            $group: {
                _id: null,
                count: { $sum: 1 }
            }
        }
    ])
    if (!totalOrders) {
        return res.status(404).json({
            message: 'error total orders',
        })
    }
    res.status(200).json({
        success: true,
        totalOrders
    })

}

exports.totalSales = async (req, res, next) => {
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                totalSales: { $sum: "$totalPrice" }
            }
        }
    ])
    if (!totalSales) {
        return res.status(404).json({
            message: 'error total sales',
        })
    }
    res.status(200).json({
        success: true,
        totalSales
    })
}

exports.customerSales = async (req, res, next) => {
    const customerSales = await Order.aggregate([
        {
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                as: 'userDetails'
            },
        },
        // {
        //     $group: {
        //         _id: "$user",
        //         total: { $sum: "$totalPrice" },
        //     }
        // },

        { $unwind: "$userDetails" },
        {
            $group: {
                _id: "$user",
                total: { $sum: "$totalPrice" },
                doc: { "$first": "$$ROOT" },

            }
        },

        {
            $replaceRoot: {
                newRoot: { $mergeObjects: [{ total: '$total' }, '$doc'] },
            },
        },
        // {
        //     $group: {
        //         _id: "$userDetails.name",
        //         total: { $sum: "$totalPrice" }
        //     }
        // },
        {
            $project: {
                _id: 0,
                "userDetails.name": 1,
                total: 1,
            }
        },
        { $sort: { total: -1 } },

    ])
    console.log(customerSales)
    if (!customerSales) {
        return res.status(404).json({
            message: 'error customer sales',
        })


    }
    // return console.log(customerSales)
    res.status(200).json({
        success: true,
        customerSales
    })

}

exports.salesPerMonth = async (req, res, next) => {
    const salesPerMonth = await Order.aggregate([

        {
            $group: {
                // _id: {month: { $month: "$paidAt" } },
                _id: {
                    year: { $year: "$paidAt" },
                    month: { $month: "$paidAt" }
                },
                total: { $sum: "$totalPrice" },
            },
        },

        {
            $addFields: {
                month: {
                    $let: {
                        vars: {
                            monthsInString: [, 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', ' Sept', 'Oct', 'Nov', 'Dec']
                        },
                        in: {
                            $arrayElemAt: ['$$monthsInString', "$_id.month"]
                        }
                    }
                }
            }
        },
        { $sort: { "_id.month": 1 } },
        {
            $project: {
                _id: 0,
                month: 1,
                total: 1,
            }
        }

    ])
    if (!salesPerMonth) {
        return res.status(404).json({
            message: 'error sales per month',
        })
    }
    // return console.log(customerSales)
    res.status(200).json({
        success: true,
        salesPerMonth
    })

}
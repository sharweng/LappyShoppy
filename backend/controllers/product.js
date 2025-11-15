const Product = require('../models/product')
const Order = require('../models/order');

const cloudinary = require('cloudinary')
const APIFeatures = require('../utils/apiFeatures');



exports.newProduct = async (req, res, next) => {
console.log(req.files)
	let images = []
	// if (typeof req.files === 'string') {
	// 	images.push(req.files)
	// } else {
	// 	images = req.files
	// }

    if (typeof req.body.images === 'string') {
		images.push(req.body.images)
	} else {
		images = req.body.images
	}

	let imagesLinks = [];

	for (let i = 0; i < images.length; i++) {
		try {
			const result = await cloudinary.v2.uploader.upload(images[i], {
				folder: 'products',
				width: 150,
				crop: "scale",
			});

			imagesLinks.push({
				public_id: result.public_id,
				url: result.secure_url
			})

		} catch (error) {
			console.log(error)
		}

	}

	req.body.images = imagesLinks
	req.body.user = req.user.id;

	const product = await Product.create(req.body);

	if (!product)
		return res.status(400).json({
			success: false,
			message: 'Product not created'
		})


	return res.status(201).json({
		success: true,
		product
	})
}

exports.getSingleProduct = async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    return res.status(200).json({
        success: true,
        product
    })
}

exports.getAdminProducts = async (req, res, next) => {

    const products = await Product.find();
    if (!products) {
        return res.status(404).json({
            success: false,
            message: 'Products not found'
        })
    }
    return res.status(200).json({
        success: true,
        products
    })

}

exports.updateProduct = async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    // console.log(req.body)
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }
    let images = []

    // if (typeof req.files === 'string') {
    //     images.push(req.files)
    // } else {
    //     images = req.files
    // }
    if (typeof req.body.images === 'string') {
		images.push(req.body.images)
	} else {
		images = req.body.images
	}
    console.log(images)
 
    let imagesLinks = [];
    for (let i = 0; i < images.length; i++) {
        const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: 'products',
            width: 150,
            crop: "scale",
        });
        imagesLinks.push({
            public_id: result.public_id,
            url: result.secure_url
        })

    }
    req.body.images = imagesLinks
    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
        useFindandModify: false
    })
    // console.log(product)
    return res.status(200).json({
        success: true,
        product
    })
}
exports.deleteProduct = async (req, res, next) => {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }

    return res.status(200).json({
        success: true,
        message: 'Product deleted'
    })
}

exports.getProducts = async (req, res) => {

    const resPerPage = 8;
    const productsCount = await Product.countDocuments();

    // const products = await Product.find()
    const apiFeatures = new APIFeatures(Product.find(), req.query).search().filter()
    
    apiFeatures.pagination(resPerPage);
	const products = await apiFeatures.query;
    let filteredProductsCount = products.length;

    if (!products)
        return res.status(400).json({ message: 'error loading products' })
    return res.status(200).json({
        success: true,
        products,
        filteredProductsCount,
        resPerPage,
        productsCount,

    })
    // if (!products)
    //     return res.status(400).json({ message: 'error loading products' })
    
    // return res.status(200).json({
    //     success: true,
    //     products,
    //     resPerPage,
    //     productsCount,

    // })
}

exports.getAdminProducts = async (req, res, next) => {

	const products = await Product.find();

	res.status(200).json({
		success: true,
		products
	})

}

exports.deleteProduct = async (req, res, next) => {
	const product = await Product.findByIdAndDelete(req.params.id);
	if (!product) {
		return res.status(404).json({
			success: false,
			message: 'Product not found'
		})
	}

	res.status(200).json({
		success: true,
		message: 'Product deleted'
	})
}

exports.productSales = async (req, res, next) => {
    const totalSales = await Order.aggregate([
        {
            $group: {
                _id: null,
                total: { $sum: "$itemsPrice" }

            },
            
        },
    ])
    console.log( totalSales)
    const sales = await Order.aggregate([
        { $project: { _id: 0, "orderItems": 1, totalPrice: true } },
        { $unwind: "$orderItems" },
        {
            $group: {
                _id: { product: "$orderItems.name" },
                total: { $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] } }
            },
        },
    ])
	console.log(sales)
    
    if (!totalSales) {
		return res.status(404).json({
			message: 'error sales'
		})
       
    }
    if (!sales) {
		return res.status(404).json({
			message: 'error sales'
		})
      
    }
    
    let totalPercentage = {}
    totalPercentage = sales.map(item => {
         
        // console.log( ((item.total/totalSales[0].total) * 100).toFixed(2))
        percent = Number (((item.total/totalSales[0].total) * 100).toFixed(2))
        total =  {
            name: item._id.product,
            percent
        }
        return total
    }) 
     console.log(totalPercentage)
    res.status(200).json({
        success: true,
        totalPercentage,
        sales,
        totalSales
    })

}

exports.createProductReview = async (req, res, next) => {
	const { rating, comment, productId, isAnonymous } = req.body;

	// Check if user has a delivered order containing this product
	const deliveredOrder = await Order.findOne({
		user: req.user._id,
		'orderItems.product': productId,
		orderStatus: 'Delivered'
	});

	if (!deliveredOrder) {
		return res.status(403).json({
			success: false,
			message: 'You can only review products from delivered orders'
		})
	}

	const review = {
		user: req.user._id,
		name: req.user.name,
		rating: Number(rating),
		comment: comment || '',
		isAnonymous: isAnonymous || false
	}
	const product = await Product.findById(productId);
	
	if (!product) {
		return res.status(404).json({
			success: false,
			message: 'Product not found'
		})
	}

	const isReviewed = product.reviews.find(
		r => r.user.toString() === req.user._id.toString()
	)
	if (isReviewed) {
		product.reviews.forEach(review => {
			if (review.user.toString() === req.user._id.toString()) {
				review.comment = comment || '';
				review.rating = rating;
				review.isAnonymous = isAnonymous || false;
			}
		})
	} else {
		product.reviews.push(review);
		product.numOfReviews = product.reviews.length
	}
	product.ratings = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length
	await product.save({ validateBeforeSave: false });
	if (!product)
		return res.status(400).json({
			success: false,
			message: 'review not posted'
		})
	return res.status(200).json({
		success: true,
		review: isReviewed ? product.reviews.find(r => r.user.toString() === req.user._id.toString()) : review
	})
}

exports.getProductReviews = async (req, res, next) => {
    const product = await Product.findById(req.query.id);
    
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }

    // Sort reviews with current user's review at the top (if authenticated)
    let reviews = [...product.reviews];
    if (req.user && req.user._id) {
        reviews.sort((a, b) => {
            const aIsCurrentUser = a.user.toString() === req.user._id.toString();
            const bIsCurrentUser = b.user.toString() === req.user._id.toString();
            
            if (aIsCurrentUser && !bIsCurrentUser) return -1;
            if (!aIsCurrentUser && bIsCurrentUser) return 1;
            return 0;
        });
    }

    res.status(200).json({
        success: true,
        reviews: reviews
    })
}

exports.deleteReview = async (req, res, next) => {
    console.log(req.query)
    const product = await Product.findById(req.query.productId);
    
    if (!product) {
        return res.status(404).json({
            success: false,
            message: 'Product not found'
        })
    }

    // Find the review to delete
    const reviewToDelete = product.reviews.find(review => review._id.toString() === req.query.id.toString());
    
    if (!reviewToDelete) {
        return res.status(404).json({
            success: false,
            message: 'Review not found'
        })
    }

    // Check if user is admin or the review owner
    const isAdmin = req.user.role === 'admin';
    const isReviewOwner = reviewToDelete.user.toString() === req.user._id.toString();

    if (!isAdmin && !isReviewOwner) {
        return res.status(403).json({
            success: false,
            message: 'You are not authorized to delete this review'
        })
    }

    const reviews = product.reviews.filter(review => review._id.toString() !== req.query.id.toString());
    const numOfReviews = reviews.length;

    const ratings = numOfReviews > 0 ? reviews.reduce((acc, item) => item.rating + acc, 0) / numOfReviews : 0;

    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews
    }, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    return res.status(200).json({
        success: true
    })
}

exports.bulkDeleteProducts = async (req, res, next) => {
    try {
        const { productIds } = req.body;
        
        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide product IDs to delete'
            });
        }

        // Delete all products with the given IDs
        const result = await Product.deleteMany({ _id: { $in: productIds } });

        return res.status(200).json({
            success: true,
            message: `${result.deletedCount} products deleted successfully`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error deleting products',
            error: error.message
        });
    }
}

exports.getFilterOptions = async (req, res, next) => {
    try {
        // Get unique values for each filter field
        const brands = await Product.distinct('brand');
        const processors = await Product.distinct('processor');
        const screenSizes = await Product.distinct('screenSize');
        const graphics = await Product.distinct('graphics');

        return res.status(200).json({
            success: true,
            filters: {
                brands: brands.sort(),
                processors: processors.sort(),
                screenSizes: screenSizes.sort(),
                graphics: graphics.sort()
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching filter options',
            error: error.message
        });
    }
}

exports.checkUserCanReview = async (req, res, next) => {
    try {
        const productId = req.query.productId;
        
        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        // Check if user has a delivered order containing this product
        const deliveredOrder = await Order.findOne({
            user: req.user._id,
            'orderItems.product': productId,
            orderStatus: 'Delivered'
        });

        // Check if user already has a review for this product
        const product = await Product.findById(productId);
        const existingReview = product ? product.reviews.find(
            r => r.user.toString() === req.user._id.toString()
        ) : null;

        return res.status(200).json({
            success: true,
            canReview: !!deliveredOrder,
            hasReview: !!existingReview,
            review: existingReview || null
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error checking review eligibility',
            error: error.message
        });
    }
}









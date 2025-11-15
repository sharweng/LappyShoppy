product = require("../models/product");
class APIFeatures {
    constructor(query, queryStr) {
        this.query = query;
        this.queryStr = queryStr;
    }
    // http://localhost:2173?keyword=apple&price[]
    // http://localhost:4001/api/v1/products?page=1&keyword=apple&price[lte]=1000&price[gte]=10
    search() {
        const keyword = this.queryStr.keyword ? {
            name: {
                $regex: this.queryStr.keyword,
                $options: 'i'
            }
        } : {}
        console.log(this.query, this.queryStr);
        this.query = this.query.find({ ...keyword });
        return this;
    }

    filter() {
        // { 'price[gte]': '100', 'price[lte]': '1000' }
        const queryCopy = { ...this.queryStr };
        // console.log(queryCopy);
        // Removing fields from the query
        const removeFields = ['keyword',  'page']
        removeFields.forEach(el => delete queryCopy[el]);

        let filterQuery = {};
        
        // Handle price filter
        if (queryCopy['price[gte]'] || queryCopy['price[lte]']) {
            filterQuery.price = {};
            if (queryCopy['price[gte]']) {
                filterQuery.price.$gte = Number(queryCopy['price[gte]']);
            }
            if (queryCopy['price[lte]']) {
                filterQuery.price.$lte = Number(queryCopy['price[lte]']);
            }
            delete queryCopy['price[gte]'];
            delete queryCopy['price[lte]'];
        }

        // Handle other filters (exact match)
        const filterableFields = ['category', 'brand', 'processor', 'ram', 'storage', 'screenSize', 'graphics', 'operatingSystem'];
        filterableFields.forEach(field => {
            if (queryCopy[field]) {
                filterQuery[field] = queryCopy[field];
                delete queryCopy[field];
            }
        });

        // Handle rating filter
        if (queryCopy['ratings[gte]'] || queryCopy['ratings[lte]']) {
            filterQuery.ratings = {};
            if (queryCopy['ratings[gte]']) {
                filterQuery.ratings.$gte = Number(queryCopy['ratings[gte]']);
            }
            if (queryCopy['ratings[lte]']) {
                filterQuery.ratings.$lte = Number(queryCopy['ratings[lte]']);
            }
            delete queryCopy['ratings[gte]'];
            delete queryCopy['ratings[lte]'];
        }

        console.log('Filter Query:', filterQuery);

        this.query = this.query.find(filterQuery);
        return this;
    }

    pagination(resPerPage) {
        const currentPage = Number(this.queryStr.page) || 1;
        const skip = resPerPage * (currentPage - 1);

        this.query = this.query.limit(resPerPage).skip(skip);
        return this;
    }
}
module.exports = APIFeatures
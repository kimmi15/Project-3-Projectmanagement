const moment = require('moment')
const bookModel = require("../models/bookModel");
const reviewModel = require("../models/reviewModel");
const userModel = require("../models/userModel");
const validator = require("../validator/validate")








//-----------------------------------------create Book Api---------------------------------------------------------
const createBook = async function (req, res) {
    try {
        let requestBody = req.body
        // console.log(requestBody)

       
        let validUserId = req.decodedToken.userId
        let { title, excerpt, ISBN, category, reviews, subcategory, releasedAt, userId, isDeleted } = requestBody;


        if (!validator.isValidRequestBody(requestBody)) return res.status(400).send({ status: false, message: "Please, provide book details to create book...!" })

        //title
        if (!validator.valid(title) || !validator.regexSpaceChar(title)) return res.status(400).send({ status: false, message: "book title is required in valid format...!" });
        let checkTitle = await bookModel.findOne({ title: title });
        if (checkTitle) return res.status(400).send({ status: false, message: " Book title is already exist" })

        excerpt
        if (!validator.valid(excerpt)) return res.status(400).send({ status: false, message: "excerpt is required...!" })
        if (!validator.regexSpaceChar(excerpt)) return res.status(400).send({ status: false, message: "Please enter the proper format excerpt...!" });

        //userId
        if (!validator.valid(userId)) return res.status(400).send({ status: false, message: "UserId is required...!" })
        if (req.body.hasOwnProperty('userId')) {
            if (!validator.isValidObjectId(userId)) return res.status(400).send({ status: false, message: "please enter the valid UserId...!" })
         }
        let checkUser = await userModel.findById(userId);
        if (!checkUser) return res.status(404).send({ status: false, message: "author is not found" });
        if (requestBody.userId != validUserId) return res.status(403).send({ status: false, message: "Error, authorization failed" });

        //ISBN
        if (!validator.valid(ISBN)) return res.status(400).send({ status: false, message: "ISBN number is required...!" })
        if (!validator.isbnRegex(ISBN)) return res.status(400).send({ status: false, message: "enter the valid isbn number...!" })
        let checkISBN = await bookModel.findOne({ ISBN: ISBN })
        if (checkISBN) return res.status(400).send({ status: false, message: "book with same ISBN is already present...!" })

        //category
        if (!validator.valid(category) || !validator.regexSpaceChar(category)) return res.status(400).send({ status: false, message: "category in valid format is required...!" })

        //subcategory
        if (!validator.valid(subcategory) || subcategory.length == 0) return res.status(400).send({ status: false, message: "Subcategory required in request body...!" })

        if (validator.valid(subcategory)) {
            let temp = subcategory;
            if (typeof (subcategory) == 'object')
                subcategory = temp;
        } else {
            subcategory = temp.split(',').map(string)
        }

        //reviews
        if (validator.valid(reviews))
            if (reviews != '0')
                return res.status(400).send({ status: false, message: "review can't set value other than zero while creating new book...!" })

        //releasedAt
        if (!validator.valid(releasedAt)) return res.status(400).send({ status: false, message: "releaseeAt is required...!" })
        if (!moment.utc(releasedAt, "YYYY-MM-DD", true).isValid()) return res.status(400).send({ status: false, message: "enter date in valid format eg. (YYYY-MM-DD)...!" })


        let bookdata = { title, excerpt, ISBN, category, reviews, subcategory, releasedAt, userId, isDeleted };

        //DB call for creation
        let saveBook = await bookModel.create(bookdata);
        return res.status(201).send({ status: true, message: "Success", data: saveBook })


    } catch (err) { return res.status(500).send({ status: false, message: err.message }); }
}


//--------------------------------------------getBook_API-----------------------------------------------------------

const getBooks = async function (req, res) {
    try {
        let data = req.query
        let filter = { isDeleted: false, ...data };

        if (req.query.hasOwnProperty('userId')) {
            if (!validator.isValidObjectId(req.query.userId)) return res.status(400).send({ status: false, message: "please enter the valid UserId...!" })
        }

        //DB call for find
        let findBooks = await bookModel.find(filter).select({ title: 1, excerpt: 1, userId: 1, category: 1, releasedAt: 1, reviews: 1, _id: 1 }).sort({ title: 1 })
        if (!findBooks) return res.status(404).send({ status: false, msg: "No Book found" })
        if (findBooks.length == 0) return res.status(404).send({ status: false, msg: "please enter existing Book" })

        return res.status(200).send({ status: true, message: 'Books list', data: findBooks })

    }
    catch (err) { return res.status(500).send({ status: false, message: err.message }); }
};


//--------------------------------------------getBook_Param_API-----------------------------------------------------

const getBooksById = async function (req, res) {

    try {

        let filter = req.params.bookId

        if (req.params.hasOwnProperty('bookId')) {
            if (!validator.isValidObjectId(req.params.bookId)) return res.status(400).send({ status: false, message: "please enter the valid BookId...!" })
        }

        let checkBookName = await bookModel.findOne({ _id: filter, isDeleted: false }).select({ __v: 0 }) //Check book Name From DB/
        if (!checkBookName) return res.status(404).send({ status: true, message: "No such book Name found" });


        let getReviewData = await reviewModel.find({ bookId: filter, isDeleted: false }).select({ bookId: 1, reviewedBy: 1, reviewedAt: 1, rating: 1, review: 1 })
        if (!getReviewData) return res.status(404).send({ status: false, message: "no review given to this book" })

        let bookData = checkBookName.toObject();
        bookData["ReviewsData"] = getReviewData;

        return res.status(200).send({ status: true, message: "Books list", data: bookData });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
};

//------------------------------------------------------upadte_API--------------------------------------------------
const updateBookByParam = async function (req, res) {
    try {
        let bookId = req.params.bookId
        const requestBody = req.body;
        let { title, excerpt, releasedAt, ISBN } = req.body

        if (!validator.isValidRequestBody(requestBody)) return res.status(400).send({ status: false, message: "Please, provide book details to Update the book...!" })

        //DB call for find Id
        let checkBook = await bookModel.findById({ _id: bookId, isDeleted: false });
        if (!checkBook) return res.status(404).send({ status: false, message: "No such book found...!" })

        //edge case
        if (checkBook.isDeleted === true) return res.status(400).send({ status: false, message: "YOu can't update book is already deleted...!" });

        //title
        if (!validator.regexSpaceChar(title)) return res.status(400).send({ status: false, message: "book title is required in valid format...!" });
        let checkTitle = await bookModel.findOne({ title: title });
        if (checkTitle)
            return res.status(400).send({ status: false, message: " Book is already exist, Enter new book name...!" })

        //excerpt
        if (!validator.regexSpaceChar(excerpt)) return res.status(400).send({ status: false, message: "Please enter the proper format excerpt...!" });

        //ISBN
        if (!validator.valid(ISBN)) return res.status(400).send({ status: false, message: "ISBN number is required for book Updation...!" })
        if (!validator.isbnRegex(ISBN)) return res.status(400).send({ status: false, message: "enter the valid isbn number...!" })
        let checkISBN = await bookModel.findOne({ ISBN: ISBN })
        if (checkISBN) return res.status(400).send({ status: false, message: "book with same ISBN is already present...!" })

        //releasedAt
        let date = moment.utc(releasedAt, "YYYY-MM-DD", true)
        if (!date.isValid()) return res.status(400).send({ status: false, message: "enter date in valid format eg. (YYYY-MM-DD)...!" })
        requestBody.releasedAt = date


        //Update part
        if (checkBook.isDeleted === false) {   //condtion here we wants to perform

            const updateBook = await bookModel.findOneAndUpdate(
                { _id: bookId },
                {
                    $set: {
                        title: requestBody.title,
                        excerpt: requestBody.excerpt,
                        ISBN: requestBody.ISBN,
                        releasedAt: requestBody.releasedAt,
                    }
                },
                { new: true, upsert: true })

            res.status(200).send({ Status: true, message: "Success", Data: updateBook })

        }
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })

    }
}



//------------------------------------------------------upadte_API--------------------------------------------------
const deleteBookByParam = async function (req, res) {
    try {
        let bookId1 = req.params.bookId;

        //DB call
        let checkBook = await bookModel.findById({ _id: bookId1 })
        if (!checkBook) return res.status(404).send({ status: false, data: "no such book exist " })
        if (checkBook.isDeleted == true) return res.status(400).send({ status: false, data: "book is already deleted...!" })
        if (checkBook.isDeleted == false) {   //condition wants to excecute

            await bookModel.findOneAndUpdate(
                { _id: bookId1 },
                { $set: { isDeleted: true, deletedAt: new Date() } },
                // { new: true }
            );

            return res.status(200).send({ status: true, message: "Deleted suceefully...!" })

        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })

    }

}

module.exports = { createBook, getBooks, deleteBookByParam, updateBookByParam, getBooksById }

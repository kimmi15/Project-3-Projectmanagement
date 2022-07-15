const bookModel = require("../models/bookModel")
const reviewModel = require("../models/reviewModel")
const validator = require("../validator/validate")


//Create Review
const createReview = async function (req, res) {
    try {
        let requestBody = req.body
        let bookId = req.params.bookId
        let { reviewedBy, rating, review } = requestBody

        if (!validator.isValidRequestBody(requestBody)) return res.status(400).send({ status: false, message: "Please, provide book details to create book...!" })
        if (!validator.isValidObjectId(bookId)) return res.status(400).send({ status: false, message: "Please,enter valid bookId....!" })

        //bookId
        let checkBook = await bookModel.findOne({ _id: bookId });
        if (checkBook.isDeleted == true) return res.status(400).send({ status: false, message: "Book is deleted...!" })
  
        //reviewBy
        if (!validator.regexSpaceChar(reviewedBy)) return res.status(400).send({ status: false, message: "reviewedBy name is not valid format...!" });

        //rating
        if (!Number.isInteger(rating)) return res.status(400).send({ status: false, message: "rating should be integer" })
        if (!(rating >= 1 && rating <= 5)) return res.status(400).send({ status: false, message: "Rating should be inbetween 1-5 " });

        //review
        if (!validator.valid(review) || !validator.regexSpaceChar(review)) return res.status(400).send({ status: false, message: "review name is not valid format...!" });

         const reviewedData = { bookId, reviewedBy, reviewedAt: new Date(), rating, review }

        //review
        if (review == undefined)
            delete reviewedData.review

        let saveReview = await reviewModel.create(reviewedData)
        let obj = saveReview.toObject();
        delete obj.isDeleted;
        delete obj.__v;

        await bookModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { $inc: { reviews: 1 } })
        return res.status(201).send({ status: true, message: "Review given successfully", data: obj })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }

}



const updateReview = async function (req, res) {
    try {
        //check book
        let bookId = req.params.bookId;
        if (!validator.isValidObjectId(bookId)) return res.status(400).send({ status: false, message: "Please enter valid bookId...!" })
        const bookExist = await bookModel.findOne({ _id: bookId, isDeleted: false }).select({ deletedAt: 0, __v: 0, ISBN: 0 }).lean(); //With the Mongoose lean() method, the documents are returned as plain objects.
        if (!bookExist) return res.status(404).send({ status: false, message: "No such book found...!" });

        //check review
        let reviewId = req.params.reviewId;
        if (!validator.isValidObjectId(reviewId)) return res.status(400).send({ status: false, message: "enter valid reviewId...!" })
        const reviewExist = await reviewModel.findOne({ _id: reviewId, bookId: bookId, isDeleted: false })
        if (!reviewExist) return res.status(404).send({ status: false, message: "review not found...!" })


        //request body
        if (!validator.isValidRequestBody(req.body)) return res.status(400).send({ status: false, message: "data in request is required...!" })
        let requestBody = req.body;

        // Update the review - review, rating, reviewer's name.
        let { review, rating, reviewedBy } = requestBody;

        //request body
        if (!validator.regexSpaceChar(reviewedBy)) return res.status(400).send({ status: false, message: "reviewedBy name is not valid format...!" });
        if (!Number.isInteger(rating)) return res.status(400).send({ status: false, message: "rating should be integer" })
        if (!(rating >= 1 && rating <= 5)) return res.status(400).send({ status: false, message: "Rating should be inbetween 1-5 " });
        if (!validator.regexSpaceChar(review)) return res.status(400).send({ status: false, message: "review name is not valid format...!" });


        //update review
        let updatedReview = await reviewModel.findOneAndUpdate({ _id: reviewId, bookId: bookId, isDeleted: false }, requestBody, { new: true }).select({ isDeleted: 0, __v: 0 })
        bookExist.reviewsData = updatedReview;
        return res.status(200).send({ status: true, message: "Updated Successfully", data: bookExist })


    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



const deleteBookByParam = async function (req, res) {
    try {
        //bookId from Params
        let bookId = req.params.bookId;

        if (!validator.isValidObjectId(bookId)) return res.status(400).send({ status: false, message: "Please enter valid bookId...!" })
        const bookExist = await bookModel.findOne({ _id: bookId, isDeleted: false }).select({ deletedAt: 0 })
        if (!bookExist) return res.status(404).send({ status: false, message: "No such book found...!" });

        //reviewId from params
        let reviewId = req.params.reviewId;
        if (!validator.isValidObjectId(reviewId)) return res.status(400).send({ status: false, message: "enter valid reviewId...!" })

        //DB call
        const reviewExist = await reviewModel.findOne({ _id: reviewId, bookId: bookId })
        if (!reviewExist) return res.status(404).send({ status: false, message: "review not found...!" })

        if (reviewExist.isDeleted == true) return res.status(400).send({ status: false, data: "review is already deleted...!" })
        if (reviewExist.isDeleted == false) {   //condition wants to excecute

            await reviewModel.findOneAndUpdate(
                { _id: reviewId, bookId: bookId, isDeleted: false },
                { $set: { isDeleted: true } },
                { new: true }
            );
            await bookModel.findOneAndUpdate({ _id: bookId, isDeleted: false }, { $inc: { reviews: -1 } })
            return res.status(200).send({ status: true, message: "deleted succesfully...!" })

        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })

    }

}


module.exports = { createReview, updateReview, deleteBookByParam }

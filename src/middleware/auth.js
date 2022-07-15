let jwt = require("jsonwebtoken")
const mongoose = require('mongoose');
const bookModel = require("../models/bookModel")
let decodedToken;

const isValidObjectId = (ObjectId) => {
  return mongoose.Types.ObjectId.isValid(ObjectId);   // to validate a MongoDB ObjectId we are use .isValid() method on ObjectId
};

/****************************************(Authentication)*****************************************************/
const authentication = async function (req, res, next) {
  try {
    let token = req.headers["x-api-key"] || req.headers["x-Api-key"];

    if (!token) return res.status(401).send({ status: false, message: "Missing authentication token in request" });

         decodedToken = jwt.verify(token, "Book-Management")

         req.decodedToken = decodedToken

        next();

   

  } catch (error) {
    if (error.message == 'invalid token') return res.status(400).send({ status: false, message: "invalid token" });

    if (error.message == "jwt expired") return res.status(400).send({ status: false, message: "please login one more time, token is expired" });

    if (error.message == "invalid signature") return res.status(401).send({ status: false, message: "invalid signature" });

    return res.status(500).send({ status: false, message: error.message });
  }
};


  
  /*********************************************(Authorization)************************************************ */
  const authorise = async function (req, res, next) {
    try {
  
      let loginAuthor = decodedToken.userId;
  
      let userLogging;
  
  
  
      /**validation for path params */
      if (req.params.hasOwnProperty('bookId')) {
        if (!isValidObjectId(req.params.bookId))return res.status(400).send({ status: false, msg: "Enter a valid book Id" }) 
  
        let bookData = await bookModel.findById(req.params.bookId);        
  
        if (!bookData)                                          //you entering the author id here of any othor author
          return res.status(404).send({ status: false, msg: "Error, Please check Id and try again" });
  
        userLogging = bookData.userId.toString();
    
  
      }
  
       if (loginAuthor !== userLogging)
        return res.status(403).send({ status: false, msg: "Error, authorization failed" });
        
        next()
    
      } 
      catch (err) {
       res.status(500).send({ status: false ,message: err.msg })
    }
   
  }
  
module.exports = { authentication, authorise }
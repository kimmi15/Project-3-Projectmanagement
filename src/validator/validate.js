
const mongoose = require('mongoose');

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const valid = function (value) {

    if (typeof (value) === 'undefined' || value === null) return false
    if (typeof (value) === "string" && value.trim().length == 0) return false

    return true
}

let isValidTitle = function (title) {
    return ["Mr", "Mrs", "Miss"].indexOf(title) !== -1
}

const isValidObjectId = (ObjectId) => {
    return mongoose.Types.ObjectId.isValid(ObjectId);   // to validate a MongoDB ObjectId we are use .isValid() method on ObjectId
};


const isValidEmail = function (value) {
    if (/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(value)) { return true }
    else return false

}

const isValidPassword = function (value) {
    if (/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,15}$/.test(value)) { return true }
    else return false
}

const moblieRegex = function (mobile) {
    let regex = /^(?:(?:\+|0{0,2})91(\s*|[\-])?|[0]?)?([6789]\d{2}([ -]?)\d{3}([ -]?)\d{4})$/
    return regex.test(mobile)
}


let isbnRegex = (ISBN) => {
    return (/^(?=(?:\D*\d){10}(?:(?:\D*\d){3})?$)[\d-]+$/.test(ISBN.trim()))

}
let isREgexName = function (attribute) {
    return (/^[a-zA-Z]{2,20}$/.test(attribute.trim()))
}

let regexSpaceChar = function (attribute) {
    return (/^[A-Za-z\s]{1,}[\,]{0,1}[A-Za-z\s]{0,}$/.test(attribute))
}


module.exports = { isValidRequestBody, valid,isValidTitle, isbnRegex, isREgexName, regexSpaceChar, isValidObjectId, isValidEmail, isValidPassword, moblieRegex }




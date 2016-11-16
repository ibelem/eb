const mongoose = require('./db'), Schema = mongoose.Schema

var eBookSchema = new Schema({
    title: String,
    href: String,
    thumburl: String,
    imgurl: String,
    author: Array,
    publisher: String,
    publishdate: Date,
    page: Number,
    format: Array,
    edition: String,
    language: String,
    isbn10: String,
    isbn13: String,
    description: String,
    tableofcontents: String,
    download: Array,
    tag: Array,
    lastupdate: Date
})

module.exports = mongoose.model('book', eBookSchema)

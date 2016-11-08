const mongoose = require('./db.js'), Schema = mongoose.Schema

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
    downloadurlpdf: String,
    downloadurlepub: String,
    size: String,
    tag: Array,
    uploaddate: Date,
    lastupdate: Date
})

module.exports = mongoose.model('book', eBookSchema)

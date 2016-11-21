const book = require("./dbebook")

let wherestr = { 'publishdate': { '$gt': '2016-01-01 00:00:00' } }
let opt = { 'thumburl': 1, '_id': 0 }

book.find(wherestr, opt, function (err, res) {
    if (err) {
        console.log(err)
    }
    else {
        console.log(res)
    }
}).sort({ 'publishdate': -1 })

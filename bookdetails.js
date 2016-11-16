const cheerio = require('cheerio')
const request = require('superagent')
require('superagent-proxy')(request)
const Throttle = require('superagent-throttle')
const book = require('./dbebook')
const common = require('./common')

let proxy = process.env.http_proxy || 'http://anr.io:1080'

let throttle = new Throttle({
    active: true,
    rate: 5,
    ratePer: 12000,
    concurrent: 5
})

let getURL = function () {
    //let wherestr = {'author' : 'Mott'}
    let wherestr = {}
    //let opt = { 'href': 1, 'title': 1, "_id": 0 }
    let opt = { 'href': 1, "_id": 0 }

    book.find(wherestr, opt, function (err, res) {
        if (err) {
            console.log(err)
        }
        else {
            for (i of res) {
                reqBookDetail(i.href)
            }
        }
    })
}

//reqBookDetail('http://www.foxebook.net/learning-perl-making-easy-things-easy-and-hard-things-possible-7th-edition/')

let reqBookDetail = function (url) {
    request
        .get(url)
        .set('User-Agent', common.ua())
        .set('Accept', 'text/html,application/xhtml+xml,application/xmlq=0.9,image/webp,*/*q=0.8')
        .set('Host', 'www.foxebook.net')
        .set('Referer', 'http://www.foxebook.net/')
        .withCredentials()
        .proxy(proxy)
        .use(throttle.plugin())
        .end((err, res) => {
            if (err) {
                console.log(err)
            } else {
                console.log(res.status)
                getBookDetail(err, res.text, url)
            }
        })
}

let getBookDetail = function (err, html, url) {
    let edition = ''
    let language = ''
    let isbn10 = 0
    let isbn13 = 0
    let description = ''
    let tableofcontents = ''
    let download = []
    let downloadsub = []

    if (err) { console.log(err) }
    else {
        var $ = cheerio.load(html)
        let panelprimary = $('.panel-primary')[0]
        var $ = cheerio.load(panelprimary)
        let divdescription = $('.panel-body')
        description = divdescription.text().trim()
        if (description.indexOf('Table of Contents') > -1) {
            tableofcontents = description.split('Table of Contents')[1].trim()
            description = description.replace(tableofcontents, '').replace('Table of Contents', '').trim()
        }

        var $ = cheerio.load(html)
        let divdownload = $('#download table tbody tr')
        $(divdownload).each(function () {
            let itemdownload = $(this).html().trim()
            let tditem = itemdownload.replace('<td>').split('</td>')
            let downloaditem = ''
            for (i of tditem) {
                let tditemtrim = i.trim()
                if (tditemtrim) {
                    if (tditemtrim.indexOf('<a') > -1) {
                        let expression = /[-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?/gi
                        let regex = new RegExp(expression)
                        downloaditem = tditemtrim.match(regex)[0]
                        downloadsub.push(downloaditem)
                    } else {
                        downloaditem = i.replace('<td>', '').replace('undefined', '')
                        downloadsub.push(downloaditem)
                    }
                }
            }
            download.push(downloadsub)
            downloadsub = []
        })

        var $ = cheerio.load(html)
        let ullibookdetails = $('ul.list-unstyled li')
        $(ullibookdetails).each(function () {
            let item = $(this).text().trim()
            if (item.indexOf('Edition:') > -1) {
                edition = item.replace('Edition:', '').trim()
            }
            if (item.indexOf('Language:') > -1) {
                language = item.replace('Language:', '').trim()
            }
            if (item.indexOf('ISBN-10:') > -1) {
                isbn10 = item.replace('ISBN-10:', '').trim()
            }
            if (item.indexOf('ISBN-13:') > -1) {
                isbn13 = item.replace('ISBN-13:', '').trim()
            }
        })

        let wherestr = { 'href': url }
        let updatestr = {
            'description': description, 'edition': edition, 'language': language,
            'tableofcontents': tableofcontents, 'isbn10': isbn10, 'isbn13': isbn13, 'download': download,
            'lastupdate': new Date()
        }

        book.update(wherestr, updatestr, function (err, res) {
            if (err) {
                console.log(err)
            }
            else {
                console.log(res)
            }
        })

    }
}

let updateEmptyBookDetail = function () {
    let wherestr = { 'isbn10': '' }
    let opt = { 'href': 1, '_id': 0 }

    book.find(wherestr, opt, function (err, res) {
        if (err) {
            console.log(err)
        }
        else {
            for (i of res) {
                reqBookDetail(i.href)
            }
        }
    })
}

getURL()
updateEmptyBookDetail()


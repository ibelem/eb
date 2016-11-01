const express = require('express')
const cheerio = require('cheerio')
const request = require('superagent')
require('superagent-proxy')(request)
const Throttle = require('superagent-throttle')
let mongoose = require('mongoose')
mongoose.connect('mongodb://localhost:27017/ebook')

let proxy = process.env.http_proxy || 'http://child-prc.X.com:913'
const BASEURL = 'http://www.foxebook.net/'
const PUBLISHER = ['oreilly-media']
const PUBLISHER2 = ['oreilly-media', 'apress', 'manning-publications', 'packtpub', 'wiley', 'wrox', 'addison-wesley-professional']
const PUBLISHERLIST = ['O\'Reilly Media', 'Apress', 'Manning Publications', 'Packt Publishing', 'Wiley', 'Wrox', 'Addison-Wesley Professional']

let pl = []
for (let i in PUBLISHERLIST) {
    pl.push(' ')
}

let throttle = new Throttle({
    active: true,
    rate: 5,
    ratePer: 12000,
    concurrent: 5
})

let num = Math.floor(Math.random() * 5)
let ualist = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36',
    'Mozilla/5.0 (X11 Ubuntu Linux x86_64 rv:49.0) Gecko/20100101 Firefox/49.0',
    'Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A'
]
let ua = ualist[num]

for (let pub of PUBLISHER) {
    let urllist = []
    for (let i = 1; i < 3; i++) {
        let page = 'http://www.foxebook.net/publisher/' + pub + '/page/' + i + '/'
        urllist.push(page)
    }

    for (let url of urllist) {
        if (url.indexOf('/page/1/') > -1) {
            url = url.replace('page/1/', '')
        }
        urlforjson = url
        request
            .get(url)
            .set('User-Agent', ua)
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
                    getBookList(err, res.text, pub)
                }
            })
    }
}


function getBookList(err, html, pub) {
    if (err) { console.log(err) }
    else {
        var $ = cheerio.load(html)
        let $main = $('main.col-md-8')
        var $ = cheerio.load($main.html())
        let authors = []
        let format = []

        $('div.row').each(function (idx, elem) {
            var $ = cheerio.load(elem)
            let urlslash = BASEURL + $('.col-md-9 a').attr('href')
            let url = urlslash.trim().replace('.net//', '.net/')
            let thumburl = 'http:' + $('.col-md-3 img').attr('src')
            let imgurl = thumburl.trim().replace('._SL200_', '')
            let authorelement = $('.col-md-9 .info a')
            $(authorelement).each(function (i, a) {
                let authorclean = $(this).text().trim().replace('Download', '')
                authorclean = authorclean.replaceArray(PUBLISHERLIST, pl)
                if (authorclean.trim()) {
                    authors.push(authorclean)
                }
            })

            let title = $('.col-md-9 a').attr('title').trim()
            let publisherelement = $('.col-md-9 .info')[2]
            var $ = cheerio.load(publisherelement)
            let publisher = $('a').text().trim()
            let lastline = $.text().trim().replace(publisher, '')
            let publishdate = lastline.match(/\d{2,4}(-\d{1,2}){0,2}/g)[0]
            let page = lastline.replace(publishdate, '').trim().match(/\d{1,6}\spages/g)[0].replace('pages', '').trim()
            let formatlist = lastline.replace(publishdate, '').replace(page, '').replace('pages', '').trim().split(',')

            for (let i of formatlist) {
                if (i.trim()) {
                    format.push(i.trim())
                }
            }

            oreillymedia.create({
                title: title,
                href: url,
                humburl: thumburl,
                imgurl: imgurl,
                author: authors,
                publisher: publisher,
                publishdate: publishdate,
                page: page,
                format: format
            }, function (err, msg) {
                if (err) console.log(err)
                else (publisher + ': ' + 'title' + ' - inserted.')
            })

            authors = []
            format = []
        })
    }
}

var eBookSchema = new mongoose.Schema({
    title: String,
    href: String,
    humburl: String,
    imgurl: String,
    author: Array,
    publisher: String,
    publishdate: Date,
    page: Number,
    format: Array,
    edition: String,
    language: String,
    isbn10: Number,
    isbn13: Number,
    description: String,
    tableofcontents: String,
    downloadurlpdf: String,
    downloadurlepub: String,
    size: String,
    uploaddate: Date,
    lastupdate: Date
})

var oreillymedia = mongoose.model('oreillymedia', eBookSchema);

String.prototype.replaceArray = function (find, replace) {
    var replaceString = this;
    for (var i = 0; i < find.length; i++) {
        replaceString = replaceString.replace(find[i], replace[i]);
    }
    return replaceString;
}

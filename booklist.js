const express = require('express')
const cheerio = require('cheerio')
const request = require('superagent')
require('superagent-proxy')(request)
const Throttle = require('superagent-throttle')
const book = require("./dbebook")
const common = require('./common')

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

for (let pub of PUBLISHER) {
    let urllist = []
    for (let i = 1; i < 50; i++) {
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

            book.create({
                title: title,
                href: url,
                thumburl: thumburl,
                imgurl: imgurl,
                author: authors,
                publisher: publisher,
                publishdate: publishdate,
                page: page,
                format: format,
                edition: '',
                language: '',
                isbn10: '',
                isbn13: '',
                description: '',
                tableofcontents: '',
                tag: [''],
                download: [''],
                lastupdate: new Date()
            }, function (err, msg) {
                if (err) console.log(err)
                else (publisher + ': ' + 'title' + ' - inserted.')
            })

            authors = []
            format = []
        })
    }
}

String.prototype.replaceArray = function (find, replace) {
    var replaceString = this;
    for (var i = 0; i < find.length; i++) {
        replaceString = replaceString.replace(find[i], replace[i]);
    }
    return replaceString;
}

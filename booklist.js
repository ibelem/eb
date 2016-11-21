const cheerio = require('cheerio')
const request = require('superagent')
require('superagent-proxy')(request)
const Throttle = require('superagent-throttle')
const book = require("./dbebook")
const common = require('./common')

let proxy = process.env.http_proxy || 'http://anr.io:1080'
const BASEURL = 'http://www.foxebook.net/'
const PUBLISHER = ['oreilly-media',]
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

let getBookList = function (err, html, pub) {
    if (err) { console.log(err) }
    else {
        var $ = cheerio.load(html)
        let $main = $('main.col-md-8')
        var $ = cheerio.load($main.html())

        $('div.row').each(function (idx, elem) {
            let author = []
            let format = []
            var $ = cheerio.load(elem)
            let urlslash = BASEURL + $('.col-md-9 a').attr('href')
            let url = urlslash.trim().replace('.net//', '.net/')
            let thumburlori = 'http:' + $('.col-md-3 img').attr('src')
            let thumburl = thumburlori.replace('http:http:', 'http:')
            let imgurlori = thumburl.trim().replace('._SL200_', '')
            let imgurl = imgurlori.replace('http:http:', 'http:')
            let authorelement = $('.col-md-9 .info a')
            $(authorelement).each(function (i, a) {
                let authorclean = $(this).text().trim().replace('Download', '')
                authorclean = authorclean.replaceArray(PUBLISHERLIST, pl)
                if (authorclean.trim()) {
                    author.push(authorclean)
                }
            })

            let title = $('.col-md-9 a').attr('title').trim()
            let publisherelement = $('.col-md-9 .info')[2]
            var $ = cheerio.load(publisherelement)
            let publisher = $('a').text().trim()
            let lastline = $.text().trim().replace(publisher, '')
            let publishdate = lastline.match(/\d{2,4}(-\d{1,2}){0,2}/g)[0]
            //console.log('[>>>] Analyzing ' + url)
            let page = ''
            try {
                page = lastline.replace(publishdate, '').trim().match(/(\d{1,6}\s){0,1}pages/g)[0].replace('pages', '').trim()
            } catch (e) {
                page = 0
            }

            let formatlist = lastline.replace(publishdate, '').replace(page, '').replace('pages', '').trim().split(',')

            for (let i of formatlist) {
                if (i.trim()) {
                    format.push(i.trim())
                }
            }

            checkBookURLinDB(url, author, format).then(function onFullfilled(value) {
                let n = new book({
                    title: title,
                    href: url,
                    thumburl: thumburl,
                    imgurl: imgurl,
                    author: value[1],
                    publisher: publisher,
                    publishdate: publishdate,
                    page: page,
                    format: value[2],
                    edition: '',
                    language: '',
                    isbn10: '',
                    isbn13: '',
                    description: '',
                    tableofcontents: '',
                    tag: [],
                    download: [],
                    lastupdate: new Date()
                })
                n.save(function (err, msg) {
                    if (err) console.log(err)
                    else console.log('[+++] Inserted: ' + publisher + ' - ' + title)
                })
            }).catch(function onRejected(err) {
                console.error('[---] Skip insertion - exist ' + err + ' ' + url)
            })

            author = []
            format = []
        })
    }
}

let checkBookURLinDB = function (url, author, format) {
    return new Promise(function (resolve, reject) {
        let wherestr = { 'href': url }
        book.count(wherestr, function (err, res) {
            if (err) {
                reject(err)
            }
            else {
                if (res == 0) {
                    resolve([res, author, format])
                } else {
                    reject(res)
                }
            }
        })
    })
}

String.prototype.replaceArray = function (find, replace) {
    var replaceString = this;
    for (var i = 0; i < find.length; i++) {
        replaceString = replaceString.replace(find[i], replace[i]);
    }
    return replaceString;
}

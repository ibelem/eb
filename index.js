let express = require('express')
let cheerio = require('cheerio')
let request = require('superagent')
require('superagent-proxy')(request)
let fs = require('fs')
let path = require('path')
let async = require('async')

let proxy = process.env.http_proxy || 'http://child-prc.X.com:913'
const BASEURL = 'http://www.foxebook.net/'
const URL = 'http://www.foxebook.net/publisher/oreilly-media/'
const PUBLISHER = ['oreilly-media', 'apress', 'manning-publications', 'packtpub', 'wiley', 'wrox', 'addison-wesley-professional']

function createPublisherDir() {
    fs.mkdir(path.join(__dirname, 'publisher'), function (err) {
        if (err) { console.log(err) }
        else console.log(pub + ' created')
    })
    for (let pub of PUBLISHER) {
        console.log(pub)
        fs.mkdir(path.join(__dirname, 'publisher', pub), function (err) {
            if (err) { console.log(err) }
            else console.log(pub + ' created under \'publisher\' folder.')
        })
    }
}

function createJSON(err, path, data) {
    if (err) { console.log(err) }
    else {
        fs.writeFileSync(path, JSON.stringify(data));
            console.log(path + ' created')
    }
}

function getUrlList(err) {
    if (err) { console.log(err) }
    else {
        let urllist = []
        for (let pub of PUBLISHER) {
            for (let i = 1; i < 50; i++) {
                let page = 'http://www.foxebook.net/publisher/' + pub + '/page/' + i + '/'
                urllist.push(page)
            }
        }
        //return urllist
        return ['http://www.foxebook.net/publisher/oreilly-media/page/1/', 'http://www.foxebook.net/publisher/oreilly-media/page/2/']
    }
}

//createPublisherDir()
//console.log(getUrlList())
//onRequest()

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

for(var url of getUrlList()){
    onRequest(url)
    sleep(5000)
}

//Callback  Promise 
function onRequest(url) {
    console.log(url)
    request
        .get(url)
        .set('User-Agent', setUA())
        .set('Accept', 'text/html,application/xhtml+xml,application/xmlq=0.9,image/webp,*/*q=0.8')
        .set('Host', 'www.foxebook.net')
        .set('Referer', 'http://www.foxebook.net/')
        .withCredentials()
        .proxy(proxy)
        .end(onResponse)
}

function onResponse(err, res) {
    if (err) {
        console.log(err)
    } else {
        console.log(res.status)
        getBookList(err, res.text)
    }
}

function getBookList(err, html) {
    if (err) { console.log(err) }
    else {
        var $ = cheerio.load(html)
        let $main = $('main.col-md-8')
        var $ = cheerio.load($main.html())
        let items = []
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
                let authorclean = $(this).text().trim().replace('O\'Reilly Media', '').replace('Download', '')
                if (authorclean.trim()) {
                    authors.push(authorclean)
                }
            })

            let title = $('.col-md-9 a').attr('title').trim()
            let publisherelement = $('.col-md-9 .info')[2]
            var $ = cheerio.load(publisherelement)
            let publisher = $('a').text().trim()
            let lastline = $.text().trim().replace(publisher, '')
            let publishdate = lastline.match(/\d{0,4}-\d{0,2}-\d{0,2}/g)[0]
            let page = lastline.replace(publishdate, '').trim().match(/\d{1,6}\spages/g)[0].replace('pages', '').trim()
            let formatlist = lastline.replace(publishdate, '').replace(page, '').replace('pages', '').trim().split(',')
            for (let i of formatlist) {
                if (i.trim()) {
                    format.push(i.trim())
                }
            }

            items.push({
                title: title,
                href: url,
                humburl: thumburl,
                imgurl: imgurl,
                author: authors,
                publisher: publisher,
                publishdate: publishdate,
                page: page,
                format: format
            })
            authors = []
            format = []
        })
        //console.log(items)
        createJSON(err, path.join(__dirname, 'publisher', 'oreilly-media', '1.json'), items)
    }
}

function setUA() {
    let num = Math.floor(Math.random() * 5)
    let ualist = [
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36',
        'Mozilla/5.0 (X11 Ubuntu Linux x86_64 rv:49.0) Gecko/20100101 Firefox/49.0',
        'Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A'
    ]
    let ua = ualist[num]
    console.log(ua)
    return ua
}

var setua = function() {
    let num = Math.floor(Math.random() * 5)
    let ualist = [
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36',
        'Mozilla/5.0 (X11 Ubuntu Linux x86_64 rv:49.0) Gecko/20100101 Firefox/49.0',
        'Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A'
    ]
    let ua = ualist[num]
    console.log(ua)
    return ua  
}

exports.setua = setua;
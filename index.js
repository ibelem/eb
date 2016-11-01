const express = require('express')
const cheerio = require('cheerio')
const request = require('superagent')
require('superagent-proxy')(request)
const Throttle = require('superagent-throttle')
const fs = require('fs')
const path = require('path')
const async = require('async')

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
    rate: 4,
    ratePer: 12000,
    concurrent: 10
})

let dirpublisher = path.join(__dirname, 'publisher')
fs.readdir(dirpublisher, function (err) {
    if (err) {
        fs.mkdir(dirpublisher, function (err) {
            if (err) { console.log(err) }
            else {
                console.log(dirpublisher + ' created')
                //createDirSubPublisher()
            }
        })
    }
    else {
        console.log(dirpublisher + ' exists.')
        //createDirSubPublisher()
    }
})

function createDirSubPublisher() {
    for (let pub of PUBLISHER) {
        let dirsubpublisher = path.join(__dirname, 'publisher', pub)
        fs.readdir(dirsubpublisher, function (err) {
            if (err) {
                fs.mkdir(dirsubpublisher, function (err) {
                    if (err) { console.log(err) }
                    else console.log(dirsubpublisher + ' created.')
                })
            }
            //else console.log(dirsubpublisher + ' exists.')
        })
    }
}

function createJSON(err, path, data) {
    if (err) { console.log(err) }
    else {
        fs.writeFileSync(path, JSON.stringify(data));
        console.log(path + ' created.')
    }
}


let num = Math.floor(Math.random() * 5)
let ualist = [
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36',
    'Mozilla/5.0 (X11 Ubuntu Linux x86_64 rv:49.0) Gecko/20100101 Firefox/49.0',
    'Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A'
]
let ua = ualist[num]

let urllist = []
for (let pub of PUBLISHER) {
    for (let i = 1; i < 49; i++) {
        let page = 'http://www.foxebook.net/publisher/' + pub + '/page/' + i + '/'
        urllist.push(page)
    }
}

for (let url of urllist) {
    if(url.indexOf('/page/1/') >-1){
        url = url.replace('page/1/', '')
    }
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
                getBookList(err, res.text, url)
            }
        })
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getBookList(err, html, url) {
    if (err) { console.log(err) }
    else {
        var $ = cheerio.load(html)
        let $main = $('main.col-md-8')
        var $ = cheerio.load($main.html())
        let authors = []
        let format = []
        let items = []
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
            console.log(format)

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

        let pathjson = url.replace(BASEURL, '').replace('publisher/', '').replace(/\//g, '-')
        pathjson = pathjson + '.json'
        pathjson = pathjson.replace('-.json','.json')
        createJSON(err, path.join(__dirname, 'publisher', pathjson), items)
    }
}

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

String.prototype.replaceArray = function(find, replace) {
  var replaceString = this;
  for (var i = 0; i < find.length; i++) {
    replaceString = replaceString.replace(find[i], replace[i]);
  }
  return replaceString;
}

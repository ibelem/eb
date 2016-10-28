let express = require('express')
let cheerio = require('cheerio')
let request = require('superagent')
require('superagent-proxy')(request)
let mkdirp = require('mkdirp')

let proxy = process.env.http_proxy || 'http://child-prc.X.com:913'
let baseurl = 'http://www.foxebook.net/'
let url = 'http://www.foxebook.net/publisher/oreilly-media/'
let publisher =['oreilly-media', 'apress', 'manning-publications', 'packtpub', 'Wiley', 'wrox', 'addison-wesley-professional']

function createpublisherdir() {
    for (var pub of publisher) {
        console.log(pub)
        mkdirp('./publisher/' + pub, function (err) {
            if (err) {
                console.log(err)
            }
            else console.log(pub + ' created under \'publisher\' folder.')
        })
    }
}

function geturllist() {
    var urllist = []
    for(var pub of publisher) {
        for (var i = 1; i < 50; i++) {
            var page = 'http://www.foxebook.net/publisher/' + pub + '/page/' + i + '/'
            urllist.push(page)
        }
    }
    return urllist
}

//console.log(geturllist())
//onrequest()
//createpublisherdir()

function onrequest() {
    request
        .get(url)
        .set('User-Agent', setua())
        .set('Accept', 'text/html,application/xhtml+xml,application/xmlq=0.9,image/webp,*/*q=0.8')
        .set('Host', 'www.foxebook.net')
        .set('Referer', 'http://www.foxebook.net/')
        .withCredentials()
        .proxy(proxy)
        .end(onresponse)
}

function onresponse(err, res) {
    if (err) {
        console.log(err)
    } else {
        console.log(res.status)
        getbooklist(err, res.text)
    }
}

function getbooklist(err, html) {
    if (err) {
        console.log(err)
    } else {
        var $ = cheerio.load(html)
        var $main = $('main.col-md-8')
        var $ = cheerio.load($main.html())
        var items = []
        $('div.row').each(function (idx, elem) {
            var $ = cheerio.load(elem)
            var urlslash = baseurl + $('.col-md-9 a').attr('href')
            var url = urlslash.trim().replace('.net//', '.net/')
            var thumburl = 'http:' + $('.col-md-3 img').attr('src')
            var imgurl = thumburl.trim().replace('._SL200_', '')
            items.push({
                title: $('.col-md-9 a').text(),
                href: url,
                humburl: thumburl,
                imgurl: imgurl
            })
        })
        console.log(items)
    }
}

function setua(){
    var num = Math.floor(Math.random()*5)
    var ualist = [
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36',
        'Mozilla/5.0 (X11 Ubuntu Linux x86_64 rv:49.0) Gecko/20100101 Firefox/49.0', 
        'Opera/9.80 (X11; Linux i686; Ubuntu/14.10) Presto/2.12.388 Version/12.16',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_9_3) AppleWebKit/537.75.14 (KHTML, like Gecko) Version/7.0.3 Safari/7046A194A'
    ]
    var ua = ualist[num]
    console.log(ua)
    return ua
}
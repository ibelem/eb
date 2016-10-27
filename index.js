var express = require('express');
var cheerio = require('cheerio');
var request = require('superagent');
require('superagent-proxy')(request);
var proxy = process.env.http_proxy || 'http://child-prc.X.com:913';

var baseurl = 'http://www.foxebook.net/';
var url = 'http://www.foxebook.net/publisher/oreilly-media/';

request
    .get(process.argv[2] || url)
    .set('User-Agent', 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:49.0) Gecko/20100101 Firefox/49.0')
    .set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
    .set('Host', 'www.foxebook.net')
    .set('Referer', 'http://www.foxebook.net/')
    .withCredentials()
    .proxy(proxy)
    .end(onresponse);

function onresponse(err, res) {
    if (err) {
        console.log(err);
    } else {
        //console.log(res.status);
        getbooklist(err, res.text);
    }
}

function getbooklist(err, html) {
    if (err) {
        console.log(err);
    } else {
        var $ = cheerio.load(html)
        var $main = $('main.col-md-8');
        var $ = cheerio.load($main.html());
        var items = [];
        $('div.row').each(function (idx, elem) {
            //var $element = $(element);
            var $ = cheerio.load(elem);
            var bookurlslash = baseurl + $('.col-md-9 a').attr('href');
            var bookurl = bookurlslash.trim().replace('.net//', '.net/');
            var bookthumburlh200 = 'http:' + $('.col-md-3 img').attr('src');
            var bookimgurl = bookthumburlh200.trim().replace('._SL200_', '');
            items.push({
                title: $('.col-md-9 a').text(),
                href: bookurl,
                humburlh200: bookthumburlh200,
                imgurl: bookimgurl
            });
        });
        console.log(items);
    }
}
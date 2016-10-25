var express = require('express');
var cheerio = require('cheerio');
var request = require('superagent');
require('superagent-proxy')(request);
var proxy = process.env.http_proxy || 'http://child-prc.com:913';

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
        //console.log(res.text);
        getbooklist(err, res.text);
    }
}

function getbooklist(err, html) {
    if (err) {
        console.log(err);
    } else {
        var $ = cheerio.load(html)
        var items = [];
        $('#content .row .col-md-9 h3 a').each(function (idx, element) {
            var $element = $(element);
            console.log($element.attr('title'));

            var bookurl = baseurl + $element.attr('href');
            bookurl = bookurl.replace('//', '/');

            items.push({
                title: $element.attr('title'),
                href: bookurl
            });

            console.log(items);
        });

    }
}

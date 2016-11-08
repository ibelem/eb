const express = require('express')
const cheerio = require('cheerio')
const request = require('superagent')
require('superagent-proxy')(request)
const Throttle = require('superagent-throttle')
const async = require('async')
const mongoose = require('./db')
const book = require('./dbebook')
const ua = require('./ua')
const fs = require('fs')
const path = require('path')

let proxy = process.env.http_proxy || 'http://child-prc.X.com:913'
const BASEURL = 'http://www.foxebook.net/'
const PUBLISHER = ['oreilly-media']
const PUBLISHER2 = ['oreilly-media', 'apress', 'manning-publications', 'packtpub', 'wiley', 'wrox', 'addison-wesley-professional']
const PUBLISHERLIST = ['O\'Reilly Media', 'Apress', 'Manning Publications', 'Packt Publishing', 'Wiley', 'Wrox', 'Addison-Wesley Professional']

let throttle = new Throttle({
    active: true,
    rate: 5,
    ratePer: 12000,
    concurrent: 5
})

function getURL() {
    //let wherestr = {'author' : 'Mott'}
    let wherestr = {}
    //let opt = { 'href': 1, 'title': 1, "_id": 0 }

    let opt = { 'href': 1, "_id": 0 }

    book.find(wherestr, opt, function (err, res) {
        if (err) {
            console.log(err)
        }
        else {
            //console.log(res)
            fs.writeFileSync(path.join(__dirname, 'href.json'), JSON.stringify(res));
        }
    })
}

reqBookDetail('http://www.foxebook.net/gradle-recipes-for-android-master-the-new-build-system-for-android/')

function reqBookDetail(url) {
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
                getBookDetail(err, res.text, url)
            }
        })
}
/*

*/

function getBookDetail(err, html, url) {
    let edition = ''
    let language = ''
    let isbn10 = 0
    let isbn13 = 0
    let description = ''
    let tableofcontents = ''
    let downloadurlpdf = ''
    let downloadurlepub = ''
    let size = ''
    let uploaddate = ''

    if (err) { console.log(err) }
    else {
        var $ = cheerio.load(html)
        let panelprimary = $('.panel-primary')[0]
        var $ = cheerio.load(panelprimary)
        let divdescription = $('.panel-body')
        description = divdescription.text().trim()
        var $ = cheerio.load(html)
        let ullibookdetails = $('ul.list-unstyled li')
        $(ullibookdetails).each(function (i, li) {
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

        var wherestr = { 'href': url };
        var updatestr = { 'description': description, 'edition': edition, 'language': language, 'isbn10': isbn10, 'isbn13': isbn13, 'lastupdate': new Date() };

        book.update(wherestr, updatestr, function (err, res) {
            if (err) {
                console.log(err);
            }
            else {
                console.log(res);
            }
        })
    }
}
 
String.prototype.replaceArray = function (find, replace) {
    var replaceString = this
    for (var i = 0; i < find.length; i++) {
        replaceString = replaceString.replace(find[i], replace[i])
    }
    return replaceString
}

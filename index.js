
//sudo apt install phantomjs
//npm install --save phantom
//npm install --save phantomjs

var path = require('path');
var childProcess = require('child_process');
var phantom = require('phantom');

phantom.create({
    parameters: {
        'proxy': 'http://child-prc.intel.com:913'
    }
}, function (browser) {
    browser.createPage(function (page) {
        page.open('http://cn.bing.com', function (status) {
            console.log("Status: " + status);
            if (status === "success") {
                page.render('example.png');
            }
            phantom.exit();
        });
    });
});

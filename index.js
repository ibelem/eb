var page = require('webpage').create(function (browser) {
    browser.createPage(page)(function (page) {
        browser.setProxy('child-prc.intel.com', '913', 'http', null, null, function () {
            page.open('http://cn.bing.com/', function (status) {
                console.log("Status: " + status);
                if (status === "success") {
                    page.render('oreilly.png');
                }
                phantom.exit();
            });
        });
    });
});

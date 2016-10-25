
//sudo apt install phantomjs
//npm install --save phantom

var phantom = require('phantom');
 
let sitepage;
let phInstance;
phantom.create()
    .then(instance => {
        phInstance = instance;
        return instance.createPage();
    })
    .then(page => {
        sitepage = page;
        return page.open('https://www.baidu.com');
    })
    .then(status => {
        console.log(status);
        return sitepage.property('content');
    })
    .then(content => {
        console.log(content);
        sitepage.close();
        phInstance.exit();
    })
    .catch(error => {
        console.log(error);
        phInstance.exit();
    });
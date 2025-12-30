const { Jimp } = require('jimp');

async function testJimp() {
    console.log('Testing Jimp import...');
    try {
        if (typeof Jimp.read === 'function') {
            console.log('Jimp.read is a function.');
        } else {
            console.log('Jimp.read is NOT a function.');
            console.log('Jimp keys:', Object.keys(Jimp));
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

testJimp();

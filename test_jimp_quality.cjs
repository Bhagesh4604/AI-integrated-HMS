const { Jimp } = require('jimp');

async function testQuality() {
    try {
        const image = await new Jimp({ width: 100, height: 100, color: 0xFFFFFFFF });

        // Test direct quality method
        if (typeof image.quality === 'function') {
            console.log('image.quality() exists.');
        } else {
            console.log('image.quality() DOES NOT exist.');
        }

        // Test getBuffer syntax
        console.log('Testing getBuffer variants...');
        try {
            const buffer = await image.getBuffer(Jimp.MIME_JPEG, { quality: 60 });
            console.log('getBuffer with options object worked!');
        } catch (e) {
            console.log('getBuffer with options object failed:', e.message);
        }

        try {
            const buffer = await image.getBuffer(Jimp.MIME_JPEG);
            console.log('getBuffer with only MIME type worked!');
        } catch (e) {
            console.log('getBuffer with only MIME type failed:', e.message);
        }

    } catch (error) {
        console.error('Test startup failed:', error);
    }
}

testQuality();

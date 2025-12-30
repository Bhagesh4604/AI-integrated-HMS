const { Jimp } = require('jimp');

async function testResize() {
    try {
        // Create a new image of 1000x1000
        const image = await new Jimp({ width: 1000, height: 1000, color: 0xFFFFFFFF });

        console.log('Original size:', image.width, image.height);
        console.log('Jimp.AUTO type:', typeof Jimp.AUTO);
        console.log('Jimp.AUTO value:', Jimp.AUTO);

        // Try resizing
        try {
            console.log('Attempting image.resize(800, Jimp.AUTO)...');
            image.resize({ w: 800 }); // Debugging artifacts cleaned up mentally.
            console.log('Success with object syntax { w: 800 }!');
            console.log('New size:', image.width, image.height);
        } catch (err) {
            console.log('Object syntax failed:', err.message);

            try {
                console.log('Attempting old syntax image.resize(800, -1)...');
                image.resize(800, -1);
                console.log('Success with old syntax!');
            } catch (err2) {
                console.log('Old syntax failed:', err2.message);
            }
        }

    } catch (error) {
        console.error('Test startup failed:', error);
    }
}

testResize();

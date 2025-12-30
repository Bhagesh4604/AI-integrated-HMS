const { Jimp } = require('jimp');

async function testQuality2() {
    console.log('Testing Jimp Quality 2...');
    try {
        const image = await new Jimp({ width: 100, height: 100, color: 0xFF0000FF });

        try {
            console.log('Attempting getBuffer("image/jpeg", { quality: 60 })...');
            const buffer = await image.getBuffer("image/jpeg", { quality: 60 });
            console.log('Success! Buffer length:', buffer.length);
        } catch (e) {
            console.log('Failed:', e.message);
        }

    } catch (error) {
        console.error('Startup failed:', error);
    }
}

testQuality2();

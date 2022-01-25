const { ImgurClient } = require('imgur');
const path = require('path');
const { createReadStream } = require('fs');
const screenshotAndUploadToImgur = async (page, title, description) => {
    await page.screenshot({ path: 'screenshot.png' });
    const client = new ImgurClient({
        clientId: process.env.IMGUR_CLIENT_ID,
        clientSecret: process.env.IMGUR_CLIENT_SECRET,
    });
    const imgPath = path.resolve(__dirname, 'screenshot.png');
    const response = await client.upload({
        image: createReadStream(imgPath),
        title,
        description,
    });
    return response[0].data.link;
};
module.exports = { screenshotAndUploadToImgur };

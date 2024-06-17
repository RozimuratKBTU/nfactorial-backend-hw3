const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const cron = require('node-cron');

async function scrapeData() {
    const url = 'https://kolesa.kz/cars/toyota/novye-avtomobili/camry/?auto-car-grbody=1&_sys-hasphoto=2&auto-custom=2';
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        const cars = [];

        $('.a-card__info').each((i, elem) => {
            const carTitle = $(elem).
            find('.a-card__description').text().trim();
            const carPrice = $(elem).
            find('.a-card__price').text().trim();
            const carStreet = $(elem).
            find('.a-card__title').text().trim();
            const carDescription = $(elem)
                .find('.a-card__text-preview')
                .text()
                .trim();
            cars.push({
                carTitle,
                carPrice,
                carStreet,
                carDescription,
            });
        });

        return cars;
    } catch (e) {
        console.error('Some errors was happened');
    }
}

function readAndCompareData() {
    let previousData = [];
    try {
        const data = fs.readFileSync('data.json', 'utf-8');
        previousData = JSON.parse(data);
    } catch (err) {
        console.error('Error while reading a file..');
    }

    scrapeData().then((newData) => {
        const addedData = newData.filter((e) => {
            return !previousData.some(
                (prevItem) => prevItem.carTitle === e.carTitle
            );
        });

        if (addedData.length > 0) {
            console.log(addedData.length);
            console.log('New data');
            addedData.forEach((item) => console.log(item));
            fs.writeFileSync('data.json', JSON.stringify(newData), 'utf8');
        } else {
            console.log('There is no new data.');
        }
    });
}

cron.schedule('* * * * * *', () => {
    console.log('Start scrapping the data...');
    readAndCompareData();
});
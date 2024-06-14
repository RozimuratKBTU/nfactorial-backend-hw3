const axios = require("axios");
require('dotenv').config();
const cheerio = require("cheerio");
const express = require("express");
const app = express();
const fs = require("fs").promises;
const cron = require('node-cron');

async function fetchData(filePath) {
    try {
        const data = await fs.readFile(filePath, "utf8");
        return cheerio.load(data);
    } catch (error) {
        console.error(`Error fetching data from ${filePath}:`, error);
        throw error;
    }
}

async function parseProduct(filePath) {
    const $ = await fetchData(filePath);
    const products = [];

    $(".item-card__info").each((index, element) => {
        try {
            const title = $(element)
                .find(".item-card__name")
                .text()
                .trim();
            const link = $(element).find("a").attr("href");
            let price = $(element)
                .find(".item-card__price")
                .text()
                .trim();

            products.push({
                title,
                price,
                link,
            });
        } catch (error) {
            console.error(`Error parsing product at index ${index}:`, error);
        }
    });

    return products;
}

async function saveProductsToFile(products, filename) {
    try {
        const data = JSON.stringify(products, null, 2);
        await fs.writeFile(filename, data, "utf8");
        console.log(`Data saved to ${filename}`);
    } catch (error) {
        console.error(`Error saving data to ${filename}:`, error);
    }
}

async function fetchAndSaveProducts() {
    const filePath = "example.html";
    try {
        const products = await parseProduct(filePath);
        await saveProductsToFile(products, "products.json");
    } catch (error) {
        console.error(error);
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    // Start cron job only after server is running
    cron.schedule('* * * * *', fetchAndSaveProducts);
});

// Initial fetch and save
fetchAndSaveProducts();

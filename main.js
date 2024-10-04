const dotenv = require('dotenv');

dotenv.config('./.env');

const API_KEY = process.env.WEBHOOK;
const fetchURL = 'https://api.porssisahko.net/v1/latest-prices.json';

// Fetch the electricity prices from the API
async function fetchElectricityPrices() {
    try {
        const response = await fetch(fetchURL);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        data.prices.reverse();
        return data;

    } catch (error) {
        console.error('There was a problem fetching the electricity prices:', error);
    }
}

// Get the high prices of the day in a string format
async function getHighPricesString(data) {
    let dateToday = new Date().toLocaleDateString();
    let pricesToday = [];
    data.prices.forEach(content => {
        let date = new Date(content.startDate).toLocaleDateString();
        if (date === dateToday) {
            if (content.price > 9) {
                let time = new Date(content.startDate).toLocaleTimeString('fi-FI', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                let price = new Intl.NumberFormat('fi-FI', {
                    maximumFractionDigits: 2,
                    maximumFractionDigits: 2
                }).format(content.price);
                pricesToday.push({
                    time: time,
                    price: price
                });
            }
        }
    });
    const finalString = pricesToday.map(price => `klo: ${price.time}, hinta: ${price.price}snt/kWh`).join('\n\n');
    return finalString;
}

// Send a message to the Discord channel
async function alertHighPrices(data) {
    const message = {
        "content": data,
        "username": 'Price Bot'
    };

    const response = await fetch(API_KEY, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(message)
    });

    if (response.ok) {
        console.log('Message sent successfully!');
    } else {
        console.error('Error sending message:', response.statusText);
    }
}

async function app() {
    const data = await fetchElectricityPrices();
    const highPricesString = await getHighPricesString(data);

    if (highPricesString.length > 0) {
        alertHighPrices(highPricesString);
    }
}

app();
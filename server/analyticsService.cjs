const ss = require('simple-statistics');

// Simulated training data (Time of Day (hour) -> Wait Time (minutes))
// Assumption: Wait times are longer during mid-day (10 AM - 2 PM)
const trainingData = [
    [9, 15], [9.5, 20],
    [10, 30], [10.5, 45],
    [11, 40], [11.5, 50],
    [12, 60], [12.5, 55],
    [13, 45], [13.5, 40],
    [14, 30], [14.5, 25],
    [15, 20], [15.5, 15],
    [16, 10], [16.5, 10],
    [17, 5]
];

// Perform linear regression
// y = mx + c
const regression = ss.linearRegression(trainingData);
const line = ss.linearRegressionLine(regression);

function predictWaitTime(hourOfDay) {
    if (!hourOfDay) {
        const now = new Date();
        hourOfDay = now.getHours() + now.getMinutes() / 60;
    }

    let predicted = line(hourOfDay);
    // Ensure wait time isn't negative or unreasonably low/high for the demo
    return Math.max(5, Math.ceil(predicted));
}

module.exports = {
    predictWaitTime
};

const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const moment = require('moment');
const path = require('path');

if (process.argv.length < 3) {
    console.log("No input file!");
    return;
}

let filePath = process.argv[2];

let dateRange = {
    start: moment('2020-03-12', "YYYY-MM-DD"),
    end: moment()
};

fixTransactions(filePath, dateRange);

function fixTransactions(inputFilePath, dateRange) {
    const results = [];

    function getOutputPath(filePath) {
        let directory = path.dirname(filePath);
        let fileName = path.basename(filePath);
        let extension = path.extname(fileName);
        let name = fileName.replace(extension, "");
        let newName = name + `-${dateRange.start.format("YYYYMMDD")}-${dateRange.end.format("YYYYMMDD")}-fixed` + extension;
        let outputFilePath = path.join(directory, newName);
        return outputFilePath;
    }

    let outputFilePath = getOutputPath(inputFilePath);

    console.log(`Reading: ${inputFilePath}\n\tFrom: ${dateRange.start} => ${dateRange.end}\n\tOutput: ${outputFilePath}`);

    function processResults(results) {
        //filter results in date range
        let resultsInRange = results.filter(result => {
            let date = moment(result.Date + " " + result.Time, 'MM/DD/YYYY h:m A');
            return date.isBetween(dateRange.start, dateRange.end);
        });

        //early out
        if (resultsInRange.length < 1) {
            console.log("No results in date range!");
            return;
        }

        //get header
        let firstResult = resultsInRange[0];
        let header = Object.keys(firstResult).map(key => {
            return {id: key, title: key}
        });

        //fix results
        resultsInRange.forEach(result => {
            let date = moment(result.Date, 'MM/DD/YYYY').format("YYYY-MM-DD");
            result.Date = date;
            result.Amount = Number(result.Amount) * -1;
            // console.log(result);
        });

        //write to output
        const csvWriter = createCsvWriter({
            path: outputFilePath,
            header: header,
            alwaysQuote: true
        });
        csvWriter.writeRecords(resultsInRange)       // returns a promise
            .then(() => {
                console.log('...Done');
            });
    }

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
            processResults(results);
        });
}
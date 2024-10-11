const express = require('express');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const bodyParser = require('body-parser');

const app = express();
const port = 8080;

// Set view engine and static files
app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Serve Bootstrap files from node_modules
app.use('/bootstrap', express.static(path.join(__dirname, 'node_modules/bootstrap/dist')));

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.render('main');
});

app.get('/crops', (req, res) => {
    res.render('crops', { about: 'about', services: 'services', home: 'home' });
});

app.get('/cropInfo', (req, res) => {
    const cropName = req.query.crop.toLowerCase();
    console.log(cropName);
    fs.readFile(path.join(__dirname, 'crops.json'), 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        const crops = JSON.parse(data).crops;
        const crop = crops.find(c => c.name.toLowerCase() === cropName);
        console.log(crop);
        res.render('cropInfo.ejs', { crop: crop, about: 'about', services: 'services', home: 'home' });
    });
});

// app.post('/predict', (req, res) => {
//     const inputData = {
//         Nitrogen: req.body.Nitrogen,
//         P: req.body.P,
//         K: req.body.K,
//         temperature: req.body.temperature,
//         humidity: req.body.humidity,
//         ph: req.body.ph,
//         rainfall_In_mm: req.body.rainfall_In_mm
//     };

//     exec(`python models/predict.py '${JSON.stringify(inputData)}'`, (error, stdout, stderr) => {
//         if (error) {
//             console.error(`Error executing script: ${error}`);
//             return res.status(500).send('Internal Server Error');
//         }

//         const prediction = stdout.trim(); 
//         res.render('result', { prediction: prediction }); 
//     });
// });

app.get('/soil', (req, res) => {
    res.render('soil', { about: 'about', services: 'services', home: 'home' });
});
app.get('/cost', (req, res) => {
    res.render('cost', { about: 'about', services: 'services', home: 'home' });
});
app.get('/profile', (req, res) => {
    res.render('profile', { about: 'about', services: 'services', home: 'home' });
});

app.listen(port, (err) => {
    if (err) console.log(err);
    else console.log('The website is hosted on http://localhost:8080');
});

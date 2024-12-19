const express = require('express');
const Disease = require('../models/Diseases_model');
const router = express.Router();
const fs = require('fs').promises;

router.post('/populate-diseases', async (req, res) => {
    try {
        const data = await fs.readFile('./disease.json', 'utf8');
        const diseases = JSON.parse(data).disease;

        const normalizedDiseases = diseases.map(disease => ({
            ...disease,
            name: disease.name.toLowerCase()
        }));

        const insertedDiseases = await Disease.insertMany(normalizedDiseases);
        res.status(201).json({ message: 'Diseases added successfully!', insertedDiseases });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

router.get('/fetch-by-name/:name', async (req, res) => {
    try {
        const diseaseName = req.params.name.toString().toLowerCase().trim();
        const disease = await Disease.findOne({ name: diseaseName });
        if (!disease) {
            return res.status(404).json({ message: `No disease found with name: ${diseaseName}` });
        }
        res.status(200).json(disease);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

router.get('/fetch-all-names', async (req, res) => {
    try {
        const diseaseNames = await Disease.find({}, 'name');
        res.status(200).json(diseaseNames);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

router.put('/update-by-name/:name', async (req, res) => {
    try {
        const diseaseName = req.params.name.toLowerCase();
        const updatedDisease = await Disease.findOneAndUpdate(
            { name: diseaseName },
            { $set: req.body },
            { new: true }
        );
        if (!updatedDisease) {
            return res.status(404).json({ message: 'Disease not found' });
        }
        res.status(200).json(updatedDisease);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

router.delete('/delete-by-name/:name', async (req, res) => {
    try {
        const diseaseName = req.params.name.toLowerCase();
        const deletedDisease = await Disease.findOneAndDelete({ name: diseaseName });
        if (!deletedDisease) {
            return res.status(404).json({ message: 'Disease not found' });
        }
        res.status(200).json({ message: 'Disease deleted successfully', deletedDisease });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});



router.get('/count', async (req, res) => {
    try {
        const count = await Disease.countDocuments();
        res.status(200).json({ totalDiseases: count });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;

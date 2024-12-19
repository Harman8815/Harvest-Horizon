const express = require('express');
const Crop = require('../models/Crops_model');
const router = express.Router();
const fs = require('fs').promises;

// Working and tested this route
router.post('/populate-crops', async (req, res) => {
    try {
        const data = await fs.readFile('./crops.json', 'utf8');
        const crops = JSON.parse(data).crops;

        const normalizedCrops = crops.map(crop => ({
            ...crop,
            name: crop.name.toLowerCase()
        }));

        const insertedCrops = await Crop.insertMany(normalizedCrops);
        res.status(201).json({ message: 'Crops added successfully!', insertedCrops });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});


router.get('/fetch-by-name/:name', async (req, res) => {
    try {
        const cropName = req.params.name.toString().toLowerCase().trim();
        const crop = await Crop.findOne({ name: cropName });
        if (!crop) {
            return res.status(404).json({ message: `No crop found with name: ${cropName}` });
        }
        res.status(200).json(crop);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});

router.get('/fetch-all-names', async (req, res) => {
    try {
        const cropNames = await Crop.find({}, 'name');
        res.status(200).json(cropNames);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});
router.put('/update-by-name/:name', async (req, res) => {
    try {
        const cropName = req.params.name.toLowerCase();
        const updatedCrop = await Crop.findOneAndUpdate(
            { name: cropName },
            { $set: req.body },
            { new: true }
        );
        if (!updatedCrop) {
            return res.status(404).json({ message: 'Crop not found' });
        }
        res.status(200).json(updatedCrop);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});
router.delete('/delete-by-name/:name', async (req, res) => {
    try {
        const cropName = req.params.name.toLowerCase();
        const deletedCrop = await Crop.findOneAndDelete({ name: cropName });
        if (!deletedCrop) {
            return res.status(404).json({ message: 'Crop not found' });
        }
        res.status(200).json({ message: 'Crop deleted successfully', deletedCrop });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});
router.get('/fetch-by-type/:type', async (req, res) => {
    try {
        const crops = await Crop.find({ type: req.params.type });
        if (!crops.length) {
            return res.status(404).json({ message: `No crops found for type: ${req.params.type}` });
        }
        res.status(200).json(crops);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});
router.get('/fetch-by-soil/:soilType', async (req, res) => {
    try {
        const crops = await Crop.find({ soilType: { $regex: req.params.soilType, $options: 'i' } });
        if (!crops.length) {
            return res.status(404).json({ message: `No crops found for soil type: ${req.params.soilType}` });
        }
        res.status(200).json(crops);
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});
router.get('/count', async (req, res) => {
    try {
        const count = await Crop.countDocuments();
        res.status(200).json({ totalCrops: count });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;

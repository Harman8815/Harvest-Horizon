const mongoose = require('mongoose');

// Define the schema for crop details
const cropSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  scientificName: { type: String, required: true },
  soilType: { type: String, required: true },
  rainfall: { type: String, required: true },
  temperature: { type: String, required: true },
  info: {
    overview: { type: String, required: true },
    soilRequirements: [{ type: String, required: true }],
    climateAndRainfall: [{ type: String, required: true }],
    plantingMethods: [{ type: String, required: true }],
    waterManagement: [{ type: String, required: true }],
    fertilization: [{ type: String, required: true }],
    pestAndDiseaseManagement: [{ type: String, required: true }],
    harvesting: [{ type: String, required: true }],
    postHarvestManagement: [{ type: String, required: true }],
    conclusion: { type: String, required: true }
  }
});

// Create the model
const Crop = mongoose.model('Crop', cropSchema);

module.exports = Crop;

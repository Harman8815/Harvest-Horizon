const mongoose = require('mongoose');

const diseaseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  disease_name: {
    type: String,
    required: true
  },
  causal_organism: {
    type: String,
    required: true
  },
  symptoms: {
    type: [String],
    required: true
  },
  host_crops: {
    type: [String],
    required: true
  },
  disease_cycle: {
    type: String,
    required: true
  },
  environmental_conditions: {
    type: [String],
    required: true
  },
  transmission: {
    type: String,
    required: true
  },
  impact: {
    type: String,
    required: true
  },
  management_strategies: {
    type: [String],
    required: true
  },
  prevention_tips: {
    type: [String],
    required: true
  },
  geographic_distribution: {
    type: String,
    required: true
  },
  treatment_or_cure: {
    type: [String],
    required: true
  },
  economic_importance: {
    type: String,
    required: true
  }
});

const Disease = mongoose.model('Disease', diseaseSchema);

module.exports = Disease;

import * as tf from '@tensorflow/tfjs';

async function loadModel() {
  const model = await tf.loadLayersModel('./trained_model.keras');
  const prediction = model.predict(tf.tensor2d([[inputData]]));
  console.log(prediction);
}

loadModel();

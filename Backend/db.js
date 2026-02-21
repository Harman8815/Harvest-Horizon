const mongoose = require('mongoose');
const mongoURI='mongodb+srv://HarmanDeep:MQacNdu6ldzVigIY@cluster0.8rztr8n.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const connectToMongodb =()=>{
    mongoose.connect(mongoURI)
       .then(() => console.log('MongoDB Connected...'))
       .catch(err => console.error(err));
}

module.exports = connectToMongodb;

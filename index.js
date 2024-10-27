const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const axios = require("axios");
const fetch = require("node-fetch");

const app = express();
const port = 8080;
const WEATHER_API_KEY = "f6484f00a0078d8b688fe7fb289d6500";

// Set view engine and static files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Serve Bootstrap files from node_modules
app.use(
  "/bootstrap",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist"))
);

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));

// Function to determine the icon based on weather conditions
function getWeatherIcon(weather) {
  const iconMapping = {
      storm: 'storm.svg',
      drizzle: 'drizzle.svg',
      rain: 'rain.svg',
      snow: 'snow.svg',
      atmosphere: 'atmosphere.svg',
      clear: 'sun.svg',
      clouds: 'clouds.svg'
  };

  if (!weather || weather.length === 0) return iconMapping.clouds; // Default icon

  const weatherId = weather[0].id; // Take the first weather condition
  let iconName = '';

  if (weatherId < 250) {
      iconName = iconMapping.storm;
  } else if (weatherId < 350) {
      iconName = iconMapping.drizzle;
  } else if (weatherId < 550) {
      iconName = iconMapping.rain;
  } else if (weatherId < 650) {
      iconName = iconMapping.snow;
  } else if (weatherId < 800) {
      iconName = iconMapping.atmosphere;
  } else if (weatherId === 800) {
      iconName = iconMapping.clear;
  } else {
      iconName = iconMapping.clouds;
  }

  return iconName;
}

// Function to fetch weather data
async function getWeatherData(city, country) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&lang=en&units=metric&appid=${WEATHER_API_KEY}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();

        data.icon = getWeatherIcon(data.weather);
        return data;
    } catch (error) {
        console.error('Error fetching weather data:', error.message);
        return { error: error.message };
    }

}

// Routes
app.get("/", async (req, res) => {
  const cities = [
      { name: 'Gwalior', country: 'India' },
      { name: 'New York', country: 'USA' },
      { name: 'London', country: 'UK' }
  ];

  const weatherDataArray = await Promise.all(cities.map(city => getWeatherData(city.name, city.country)));
  // weatherDataArray.icon = getWeatherIcon(weatherDataArray.weather);
  console.log(weatherDataArray);

  res.render("main", { weatherDataArray });
});
app.get("/weather", (req, res) => {
  res.render("weather", { about: "about", services: "services", home: "home" });
});
app.get("/getweather", async (req, res) => {
  const city = req.query.city; // Get city from query parameters
  const country = req.query.country; // Get country from query parameters

  if (!city || !country) {
    return res.status(400).json({ error: "City and country are required." });
  }

  try {
    const weatherData = await getWeatherData(city, country); // Fetch weather data
    res.json(weatherData); // Return the weather data as JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch weather data." });
  }
});

app.get("/crops", (req, res) => {
    res.render("crops", { about: "about", services: "services", home: "home" });
});

app.get("/cropInfo", (req, res) => {
    const cropName = req.query.crop.toLowerCase();
    console.log(cropName);
    
    fs.readFile(path.join(__dirname, "crops.json"), "utf8", (err, data) => {
        if (err) {
            console.error("Error reading file:", err);
            return res.status(500).json({ error: "Internal server error" });
        }
        const crops = JSON.parse(data).crops;
        const crop = crops.find((c) => c.name.toLowerCase() === cropName);
        console.log(crop);
        
        res.render("cropInfo.ejs", {
            crop: crop,
            about: "about",
            services: "services",
            home: "home",
        });
    });
});

app.get("/crop_prediction", (req, res) => {
    res.render("crop_prediction", {
        about: "about",
        services: "services",
        home: "home",
    });
});

app.get("/cost", (req, res) => {
    res.render("cost", { about: "about", services: "services", home: "home" });
});

app.post("/predict", (req, res) => {
    const inputData = {
        Nitrogen: req.body.Nitrogen,
        P: req.body.P,
        K: req.body.K,
        temperature: req.body.temperature,
        humidity: req.body.humidity,
        ph: req.body.ph,
        rainfall_In_mm: req.body.rainfall_In_mm,
    };

    axios.post("http://localhost:5000/predict", inputData)
        .then((response) => {
            res.json({
                prediction: response.data.prediction,
            });
        })
        .catch((error) => {
            console.error("Error calling Flask API:", error);
            res.status(500).send("Error making prediction");
        });
});

app.get("/profile", (req, res) => {
    res.render("profile", { about: "about", services: "services", home: "home" });
});

// Start the server
app.listen(port, (err) => {
    if (err) console.log(err);
    else console.log(`The website is hosted on http://localhost:${port}`);
});

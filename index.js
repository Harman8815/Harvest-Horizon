const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const axios = require("axios");
const fetch = require("node-fetch");
const session = require("express-session");
const multer = require("multer");
const { Blob } = require("buffer");

const app = express();
const port = 8081;
const WEATHER_API_KEY = "f6484f00a0078d8b688fe7fb289d6500";

// Load Environment Variables
require('dotenv').config();

// Determine Backend URL based on .env configuration
const getBackendUrl = () => {
  const isLocal = process.env.USE_LOCAL_BACKEND === 'true';
  return isLocal ? process.env.LOCAL_BACKEND_URL : process.env.PRODUCTION_BACKEND_URL;
};

const BACKEND_BASE_URL = getBackendUrl();
console.log(`Initialized with Backend URL: ${BACKEND_BASE_URL}`);

// -------------------------- Configuration --------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/bootstrap",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist"))
);

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "mySecretKey",
    resave: false,
    saveUninitialized: true,
  })
);

// Storage Configuration
const storage = multer.memoryStorage();
const upload = multer({ storage });

// In-memory user storage
const users = [{ username: "h", password: "123" }];

// -------------------------- Helper Functions --------------------------
const getWeatherIcon = (weather) => {
  const iconMapping = {
    storm: "storm.svg",
    drizzle: "drizzle.svg",
    rain: "rain.svg",
    snow: "snow.svg",
    atmosphere: "atmosphere.svg",
    clear: "sun.svg",
    clouds: "clouds.svg",
  };
  if (!weather || weather.length === 0) return iconMapping.clouds;

  const weatherId = weather[0].id;
  if (weatherId < 250) return iconMapping.storm;
  if (weatherId < 350) return iconMapping.drizzle;
  if (weatherId < 550) return iconMapping.rain;
  if (weatherId < 650) return iconMapping.snow;
  if (weatherId < 800) return iconMapping.atmosphere;
  return weatherId === 800 ? iconMapping.clear : iconMapping.clouds;
};

const getWeatherData = async (city, country) => {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city},${country}&lang=en&units=metric&appid=${WEATHER_API_KEY}`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    data.icon = getWeatherIcon(data.weather);
    return data;
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
    return { error: error.message };
  }
};

const isAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  res.redirect("/signin");
};

// -------------------------- Routes --------------------------

// Weather Routes
app.get("/", async (req, res) => {
  const cities = [
    { name: "Gwalior", country: "India" },
    { name: "New York", country: "USA" },
    { name: "London", country: "UK" },
  ];
  const weatherDataArray = await Promise.all(
    cities.map((city) => getWeatherData(city.name, city.country))
  );
  res.render("main", { weatherDataArray });

});

app.get("/weather", (req, res) => {
  res.render("weather", { about: "about", services: "services", home: "home" });
});

app.get("/getweather", async (req, res) => {
  const { city, country } = req.query;
  if (!city || !country)
    return res.status(400).json({ error: "City and country are required." });

  try {
    const weatherData = await getWeatherData(city, country);
    res.json(weatherData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch weather data." });
  }
});

// Crop Information Routes
app.get("/crops", (req, res) => {
  res.render("crops", { about: "about", services: "services", home: "home" });
});

app.get("/cropInfo", (req, res) => {
  const cropName = req.query.crop.toLowerCase();
  fs.readFile(path.join(__dirname, "crops.json"), "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Internal server error" });

    const crops = JSON.parse(data).crops;
    const crop = crops.find((c) => c.name.toLowerCase() === cropName);

    res.render("cropInfo", {
      crop,
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

app.get("/yield", (req, res) => {
  res.render("yield", { about: "about", services: "services", home: "home" });
});

app.get("/crop_disease_prediction", (req, res) => {
  res.render("crop disease", { about: "about", services: "services", home: "home" });
});

const mime = require("mime-types");
const FormData = require("form-data");



// Helper for API Retries (Handles slow ML backend startup)
const axiosRetry = async (config, retries = 3, backoff = 2000) => {
  try {
    return await axios(config);
  } catch (err) {
    if (retries > 0 && (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT')) {
      console.warn(`Backend not ready, retrying in ${backoff}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return axiosRetry(config, retries - 1, backoff * 1.5);
    }
    throw err;
  }
};

app.post("/crop_disease_predict", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded" });
  }

  try {
    const fileExtension = path.extname(req.file.originalname);
    const mimeType = mime.lookup(fileExtension);
    if (!mimeType) return res.status(400).json({ error: "Unsupported file format" });

    const formData = new FormData();
    formData.append("image", req.file.buffer, {
      filename: `image${fileExtension}`,
      contentType: mimeType,
    });

    const response = await axiosRetry({
      method: 'post',
      url: `${BACKEND_BASE_URL}/predict-image`,
      data: formData,
      headers: { ...formData.getHeaders() },
      timeout: 30000 // 30s timeout for heavy models
    });

    const prediction = response.data.prediction.toLowerCase();
    console.log(`Disease Prediction Result: ${prediction}`);
    const diseaseData = JSON.parse(fs.readFileSync(path.join(__dirname, "disease.json"), "utf8")).disease;

    const matchedCrop = diseaseData.find(d => {
      const normalizedModelPred = prediction.toLowerCase().replace(/[^a-z0-9]/g, "");
      const normalizedDbName = d.name.toLowerCase().replace(/[^a-z0-9]/g, "");
      return normalizedModelPred.includes(normalizedDbName) || normalizedDbName.includes(normalizedModelPred);
    }) || diseaseData[0];

    return res.render("diseaseinfo", { crop: matchedCrop, about: "about", services: "services", home: "home" });

  } catch (error) {
    console.error("Prediction error:", error.message);
    const errorMsg = error.response?.data?.details || error.response?.data?.error || error.message;
    res.render("error", {
      errorDetails: `Disease prediction failed: ${errorMsg}`
    });
  }
});

app.post("/yield_predict", async (req, res) => {
  const inputData = {
    "Year": req.body.year,
    "average_rain_fall_mm_per_year": req.body.average_rain_fall_mm_per_year,
    "pesticides_tonnes": req.body.pesticides_tonnes,
    "avg_temp": req.body.avg_temp,
    "Area": req.body.area,
    "Item": req.body.item,
  };

  try {
    console.log("Sending Yield Prediction payload:", inputData);
    const response = await axiosRetry({
      method: 'post',
      url: `${BACKEND_BASE_URL}/predict-yield`,
      data: inputData
    });
    console.log("Yield Prediction response:", response.data);
    res.json(response.data);
  } catch (error) {
    console.error("Yield API failed:", error.message);
    res.status(500).json({
      error: "Error making prediction",
      details: error.response?.data?.details || error.message
    });
  }
});

app.post("/predict", async (req, res) => {
  const inputData = {
    N: req.body.Nitrogen,
    P: req.body.P,
    K: req.body.K,
    temperature: req.body.temperature,
    humidity: req.body.humidity,
    ph: req.body.ph,
    rainfall: req.body.rainfall_In_mm,
  };

  try {
    console.log("Sending Crop Prediction payload:", inputData);
    const response = await axiosRetry({
      method: 'post',
      url: `${BACKEND_BASE_URL}/predict`,
      data: inputData
    });
    console.log("Crop Prediction response:", response.data);
    const cropName = response.data.prediction.toString().toLowerCase();

    fs.readFile(path.join(__dirname, "crops.json"), "utf8", (err, data) => {
      if (err) throw new Error("Internal filesystem error");
      const crops = JSON.parse(data).crops;
      const crop = crops.find((c) => c.name.toLowerCase() === cropName);
      if (!crop) throw new Error("Predicted crop not found in database");
      res.render("cropInfo.ejs", { crop, about: "about", services: "services", home: "home" });
    });
  } catch (error) {
    console.error("Crop API failed:", error.message);
    res.render("error", {
      errorDetails: `Crop recommendation failed: ${error.response?.data?.error || error.message}`
    });
  }
});

// User Authentication Routes
app.get("/signup", (req, res) => res.render("signup"));

app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (!users.some((user) => user.username === username)) {
    users.push({ username, password });
    req.session.user = { username };
    res.redirect("/profile");
  } else {
    res.send("User already exists. Please sign in.");
  }
});

app.get("/signin", (req, res) => res.render("signin"));

app.post("/signin", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    req.session.user = { username };
    res.redirect("/profile");
  } else {
    res.send("Invalid username or password.");
  }
});

app.get("/profile", isAuthenticated, (req, res) => {
  res.render("profile", { about: "about", services: "services", home: "home" });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/signin");
});

app.get("/error", (req, res) => {
  res.render("error", { errorDetails: req.query.details || "An unknown error occurred." });
});

app.get("/hashmapedit", (req, res) => {
  res.render("hashmapedit");
});

// -------------------------- Start Server --------------------------
app.listen(port, (err) => {
  if (err) console.error(err);
  else console.log(`The website is hosted on http://localhost:${port}`);
});

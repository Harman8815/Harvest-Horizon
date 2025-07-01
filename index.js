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
const port = 8080;
const WEATHER_API_KEY = "f6484f00a0078d8b688fe7fb289d6500";

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

const mime = require("mime-types"); // For getting MIME type from file extensions
const FormData = require("form-data");



app.post("/crop_disease_predict", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file uploaded" });
  }

  try {
    const fileExtension = path.extname(req.file.originalname);
    const mimeType = mime.lookup(fileExtension);

    if (!mimeType) {
      return res.status(400).json({ error: "Unsupported file format" });
    }

    // Prepare form data for prediction API
    const formData = new FormData();
    formData.append("image", req.file.buffer, {
      filename: `image${fileExtension}`,
      contentType: mimeType,
    });

    // STEP 1: Send image to prediction API (Flask or Rendered)
    const predictionResponse = await axios.post(
      "https://harvest-horizon-backend.onrender.com/predict-image",
      formData,
      { headers: formData.getHeaders() }
    );

    let cropName = predictionResponse.data.prediction?.toLowerCase()?.replace(/_/g, '');
    if (!cropName) {
      return res.status(500).json({ error: "Invalid prediction received" });
    }

    // STEP 2: Try reading from local `disease.json` (backup lookup)
    const diseaseDataPath = path.join(__dirname, "disease.json");
    let diseaseData;

    try {
      const fileContent = fs.readFileSync(diseaseDataPath, "utf8");
      diseaseData = JSON.parse(fileContent).disease;
    } catch (err) {
      console.error("Error reading or parsing disease.json:", err);
      diseaseData = null;
    }

    // STEP 3: Try to match using local JSON (if available)
    if (diseaseData) {
      const matchedCrop = diseaseData.find(d =>
        d.name.replace(/_/g, '').toLowerCase() === cropName
      );

      if (matchedCrop) {
        return res.render("diseaseinfo", {
          crop: matchedCrop,
          about: "about",
          services: "services",
          home: "home",
        });
      }
    }

    // STEP 4: Fallback — fetch from your local Node API
    const validNames = [
      "cedar_apple_rust", "healthy", "blueberry_healthy", "powdery_mildew", "cherry_healthy",
      "cercospora_leaf_spot_gray_leaf_spot", "common_rust", "northern_leaf_blight", "corn_healthy",
      "black_rot", "esca_black_measles", "leaf_blight_isariopsis_leaf_spot", "grape_healthy",
      "haunglongbing_citrus_greening", "bacterial_spot_peach", "peach_healthy",
      "bacterial_spot_pepper_bell", "pepper_bell_healthy", "potato_early_blight",
      "potato_late_blight", "potato_healthy", "raspberry_healthy", "soybean_healthy",
      "squash_powdery_mildew", "strawberry_leaf_scorch", "strawberry_healthy",
      "tomato_bacterial_spot", "tomato_early_blight", "tomato_late_blight",
      "tomato_leaf_mold", "tomato_septoria_leaf_spot", "tomato_spider_mites",
      "tomato_target_spot", "tomato_tomato_yellow_leaf_curl_virus",
      "tomato_tomato_mosaic_virus", "tomato_healthy"
    ];

    const matchedName = validNames.find(name =>
      cropName.includes(name.replace(/[^a-zA-Z0-9]/g, "_"))
    );

    const finalName = matchedName || validNames[Math.floor(Math.random() * validNames.length)];

    const apiResponse = await axios.get(`http://localhost:2000/api/diseases/fetch-by-name/${finalName}`);
    const finalCrop = apiResponse.data;

    return res.render("diseaseinfo", {
      crop: finalCrop,
      about: "about",
      services: "services",
      home: "home",
    });

  } catch (error) {
    console.error("Error:", error.message || error);
    return res.status(500).json({ error: "Internal server error during prediction" });
  }
});

app.post("/yield_predict", (req, res) => {
  const inputData = {
    year: req.body.year,
    average_rainfall: req.body.average_rain_fall_mm_per_year,
    pesticides: req.body.pesticides_tonnes,
    avg_temp: req.body.avg_temp,
    area: req.body.area,
    item: req.body.item,
  };

  axios.post("https://harvest-horizon-backend.onrender.com/predict-yield", inputData)
    .then((response) => {
      console.log(response);
      res.json(response);
    })
    .catch((error) => {
      console.error("Error calling Flask API:", error);
      res.status(500).json({ error: "Error making prediction" });
    });
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
    // Send data to the Flask API for prediction
    const response = await axios.post("https://harvest-horizon-backend.onrender.com/predict", inputData);
    let cropName = response.data.prediction.toString().toLowerCase();

    console.log("Predicted Crop:", cropName);
    cropName = cropName.toString().toLowerCase();
    // Fetch crop details from another API
    let cropResponse = await axios.get(`https://harvest-horizon-backend-db.onrender.com/api/crops/fetch-by-name/${cropName}`);
    let crop = cropResponse.data;
    // console.log(crop);
    // Render the EJS template with fetched crop details
    res.render("cropInfo.ejs", {
      crop,
      about: "about",
      services: "services",
      home: "home",
    });
  } catch (error) {
    console.error("Error:", error.message || error);
    res.status(500).send("An error occurred while processing the request.");
  }
});

// User Authentication Routes

app.get("/signup", (req, res) => res.render("signup"));

app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (!users.some((user) => user.username === username)) {
    users.push({ username, password });
    req.session.user = { username };
    res.redirect("/dashboard");
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

app.get("/hashmapedit", (req, res) => {
  res.render("hashmapedit");
});

// -------------------------- Start Server --------------------------
app.listen(port, (err) => {
  if (err) console.error(err);
  else console.log(`The website is hosted on http://localhost:${port}`);
});

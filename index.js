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
  // [
    // [0]   {
    // [0]     error: 'request to https://api.openweathermap.org/data/2.5/weather?q=Gwalior,India&lang=en&units=metric&appid=f6484f00a0078d8b688fe7fb289d6500 failed, reason: read ECONNRESET'
    // [0]   },
    // [0]   {
    // [0]     error: 'request to https://api.openweathermap.org/data/2.5/weather?q=New%20York,USA&lang=en&units=metric&appid=f6484f00a0078d8b688fe7fb289d6500 failed, reason: read ECONNRESET'
    // [0]   },
    // [0]   {
    // [0]     error: 'request to https://api.openweathermap.org/data/2.5/weather?q=London,UK&lang=en&units=metric&appid=f6484f00a0078d8b688fe7fb289d6500 failed, reason: read ECONNRESET'
    // [0]   }
    // [0] ]
  // if(weatherDataArray.error){
  //   weatherDataArray=[
  //     [0]   {
  //     [0]     coord: { lon: 78.1792, lat: 26.2236 },
  //     [0]     weather: [ [Object] ],
  //     [0]     base: 'stations',
  //     [0]     main: {
  //     [0]       temp: 14.6,
  //     [0]       feels_like: 12.82,
  //     [0]       temp_min: 14.6,
  //     [0]       temp_max: 14.6,
  //     [0]       pressure: 1021,
  //     [0]       humidity: 27,
  //     [0]       sea_level: 1021,
  //     [0]       grnd_level: 994
  //     [0]     },
  //     [0]     visibility: 10000,
  //     [0]     wind: { speed: 2.85, deg: 315, gust: 4.02 },
  //     [0]     clouds: { all: 40 },
  //     [0]     dt: 1734063495,
  //     [0]     sys: { country: 'IN', sunrise: 1734053170, sunset: 1734091024 },
  //     [0]     timezone: 19800,
  //     [0]     id: 1270583,
  //     [0]     name: 'Gwalior',
  //     [0]     cod: 200,
  //     [0]     icon: 'clouds.svg'
  //     [0]   },
  //     [0]   {
  //     [0]     coord: { lon: -74.006, lat: 40.7143 },
  //     [0]     weather: [ [Object] ],
  //     [0]     base: 'stations',
  //     [0]     main: {
  //     [0]       temp: -1.25,
  //     [0]       feels_like: -6.56,
  //     [0]       temp_min: -2.88,
  //     [0]       temp_max: -0.44,
  //     [0]       pressure: 1032,
  //     [0]       humidity: 42,
  //     [0]       sea_level: 1032,
  //     [0]       grnd_level: 1030
  //     [0]     },
  //     [0]     visibility: 10000,
  //     [0]     wind: { speed: 5.14, deg: 280 },
  //     [0]     clouds: { all: 0 },
  //     [0]     dt: 1734063364,
  //     [0]     sys: {
  //     [0]       type: 1,
  //     [0]       id: 4610,
  //     [0]       country: 'US',
  //     [0]       sunrise: 1734005473,
  //     [0]       sunset: 1734038937
  //     [0]     },
  //     [0]     timezone: -18000,
  //     [0]     id: 5128581,
  //     [0]     name: 'New York',
  //     [0]     cod: 200,
  //     [0]     icon: 'sun.svg'
  //     [0]   },
  //     [0]   {
  //     [0]     coord: { lon: -0.1257, lat: 51.5085 },
  //     [0]     weather: [ [Object] ],
  //     [0]     base: 'stations',
  //     [0]     main: {
  //     [0]       temp: 6.14,
  //     [0]       feels_like: 4.64,
  //     [0]       temp_min: 5.57,
  //     [0]       temp_max: 7.1,
  //     [0]       pressure: 1027,
  //     [0]       humidity: 95,
  //     [0]       sea_level: 1027,
  //     [0]       grnd_level: 1022
  //     [0]     },
  //     [0]     visibility: 3500,
  //     [0]     wind: { speed: 2.06, deg: 90 },
  //     [0]     clouds: { all: 100 },
  //     [0]     dt: 1734063279,
  //     [0]     sys: {
  //     [0]       type: 2,
  //     [0]       id: 2075535,
  //     [0]       country: 'GB',
  //     [0]       sunrise: 1734076704,
  //     [0]       sunset: 1734105088
  //     [0]     },
  //     [0]     timezone: 0,
  //     [0]     id: 2643743,
  //     [0]     name: 'London',
  //     [0]     cod: 200,
  //     [0]     icon: 'atmosphere.svg'
  //     [0]   }
  //     [0] ]
  // }
  // console.log(weatherDataArray)
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
    // Extract file information
    const fileExtension = path.extname(req.file.originalname);
    const mimeType = mime.lookup(fileExtension);

    if (!mimeType) {
      return res.status(400).json({ error: "Unsupported file format" });
    }

<<<<<<< HEAD
    const formData = new FormData();
    formData.append("image", req.file.buffer, {
      filename: `image${fileExtension}`,
      contentType: mimeType,
=======
  axios
    .post("https://harvest-horizon-backend.onrender.com/predict-image", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    .then((response) => {
      let cropName = response.data.prediction.toLowerCase();

      const diseaseDataPath = path.join(__dirname, "disease.json");

      fs.readFile(diseaseDataPath, "utf8", (error, fileContent) => {
        if (error) {
          console.error("Error reading disease data file:", error);
          return res.status(500).json({ error: "Unable to read disease data file" });
        }

        let diseaseData;
        try {
          diseaseData = JSON.parse(fileContent).disease;
        } catch (parseError) {
          console.error("Error parsing disease data file:", parseError);
          return res.status(500).json({ error: "Error parsing disease data file" });
        }
        // console.log(diseaseData);
        // diseaseData = diseaseData.disease[0];
        // for (let d of diseaseData) {
        //   console.log(d.name.replace(/_/g, '').toLowerCase()); // Replace underscores with a space
        // }

        cropName = cropName.replace(/_/g, '')

        const matchedCrop = diseaseData.find((disease) => {
          return disease.name.replace(/_/g, '').toLowerCase() === cropName;
        });
        
        if (!matchedCrop) {
          console.error(`Crop not found: ${cropName}`);
          return res.status(404).json({ error: "Crop not found in disease data" });
        }

        const diseaseInfo = matchedCrop;
        // console.log(diseaseInfo);
        res.render("diseaseinfo.ejs", {
          crop: diseaseInfo,
          about: "about",
          services: "services",
          home: "home",
        });
      });
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ error: "Error making prediction" });
>>>>>>> c9b85a2662c0008405cce7139346790c1a7829d1
    });

    // Call Flask API
    const flaskResponse = await axios.post("http://127.0.0.1:5000/predict-image", formData, {
      headers: { ...formData.getHeaders() },
    });

    const cropName = flaskResponse.data.prediction.toLowerCase();

    // Define the array of valid crop names
    const names = [
      "cedar_apple_rust",
      "healthy",
      "blueberry_healthy",
      "powdery_mildew",
      "cherry_healthy",
      "cercospora_leaf_spot_gray_leaf_spot",
      "common_rust",
      "northern_leaf_blight",
      "corn_healthy",
      "black_rot",
      "esca_black_measles",
      "leaf_blight_isariopsis_leaf_spot",
      "grape_healthy",
      "haunglongbing_citrus_greening",
      "bacterial_spot_peach",
      "peach_healthy",
      "bacterial_spot_pepper_bell",
      "pepper_bell_healthy",
      "potato_early_blight",
      "potato_late_blight",
      "potato_healthy",
      "raspberry_healthy",
      "soybean_healthy",
      "squash_powdery_mildew",
      "strawberry_leaf_scorch",
      "strawberry_healthy",
      "tomato_bacterial_spot",
      "tomato_early_blight",
      "tomato_late_blight",
      "tomato_leaf_mold",
      "tomato_septoria_leaf_spot",
      "tomato_spider_mites",
      "tomato_target_spot",
      "tomato_tomato_yellow_leaf_curl_virus",
      "tomato_tomato_mosaic_virus",
      "tomato_healthy"
    ];

    // Normalize and find the closest match
    const matchedName = names.find((name) =>
      cropName.replace(/[^a-zA-Z0-9]/g, "_").includes(name)
    );

    const finalName = matchedName || names[Math.floor(Math.random() * names.length)];
    // console.log("Matched Name:", finalName);

    // Fetch details using the matched name
    const apiResponse = await axios.get(`http://localhost:2000/api/diseases/fetch-by-name/${finalName}`);
    const matchedCrop = apiResponse.data;

    res.render("diseaseinfo", {
      crop: matchedCrop,
      about: "about",
      services: "services",
      home: "home",
    });
  } catch (error) {
    console.error("Error:", error.message || error);
    res.status(500).json({ error: "Error making prediction or fetching disease data" });
  }
});



<<<<<<< HEAD
// Yield Prediction Route
=======

>>>>>>> c9b85a2662c0008405cce7139346790c1a7829d1
app.post("/yield_predict", (req, res) => {
  const inputData = {
    year: req.body.year,
    average_rainfall: req.body.average_rain_fall_mm_per_year,
    pesticides: req.body.pesticides_tonnes,
    avg_temp: req.body.avg_temp,
    area: req.body.area,
    item: req.body.item,
  };

  axios
    .post("https://harvest-horizon-backend.onrender.com/predict-yield", inputData)
    .then((response) => {
      console.log(response);
      res.json(response);
    })
    .catch((error) => {
      console.error("Error calling Flask API:", error);
      res.status(500).json({ error: "Error making prediction" });
    });
});
<<<<<<< HEAD

app.post("/predict", async (req, res) => {
  const inputData = {
=======
app.post("/predict", (req, res) => {
 const inputData = {
>>>>>>> c9b85a2662c0008405cce7139346790c1a7829d1
    N: req.body.Nitrogen,
    P: req.body.P,
    K: req.body.K,
    temperature: req.body.temperature,
    humidity: req.body.humidity,
    ph: req.body.ph,
    rainfall: req.body.rainfall_In_mm,
  };
<<<<<<< HEAD

  try {
    // Send data to the Flask API for prediction
    const response = await axios.post("http://127.0.0.1:5000/predict", inputData);
    let cropName = response.data.prediction.toString().toLowerCase();

    console.log("Predicted Crop:", cropName);
    cropName = cropName.toString().toLowerCase();
    // Fetch crop details from another API
    let cropResponse = await axios.get(`http://127.0.0.1:2000/api/crops/fetch-by-name/${cropName}`);
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

// Authentication Routes
=======
  axios
    .post("https://harvest-horizon-backend.onrender.com/predict", inputData)
    .then((response) => {
      const cropName = response.data.prediction.toString().toLowerCase();
      console.log(cropName);
      fs.readFile(path.join(__dirname, "crops.json"), "utf8", (err, data) => {
        if (err) return res.status(500).json({ error: "Internal server error" });
        const crops = JSON.parse(data).crops;
        const crop = crops.find((c) => c.name.toLowerCase() === cropName);
        console.log(crop)
        res.render("cropInfo.ejs", {
          crop,
          about: "about",
          services: "services",
          home: "home",
        });
      });
      // res.json({ prediction: response.data.prediction });
      console.log(response.data.prediction);
    })
    .catch((error) => {
      console.error("Error calling Flask API:", error);
      res.status(500).send("Error making prediction");
    });
});
// User Authentication Routes
>>>>>>> c9b85a2662c0008405cce7139346790c1a7829d1
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

const express = require("express");
const fs = require("fs");
const path = require("path");
const bodyParser = require("body-parser");
const axios = require("axios");
const fetch = require("node-fetch");
const session = require("express-session");

const app = express();
const port = 8080;
const WEATHER_API_KEY = "f6484f00a0078d8b688fe7fb289d6500";

// Set view engine and static files
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  "/bootstrap",
  express.static(path.join(__dirname, "node_modules/bootstrap/dist"))
);

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "mySecretKey",
    resave: false,
    saveUninitialized: true,
  })
);

// In-memory user storage (for demo)
const users = [{ username: "h", password: "123" }];
// Helper functions
function getWeatherIcon(weather) {
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
}

async function getWeatherData(city, country) {
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
}

// Authentication Middleware
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect("/signin");
}

// Routes
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

app.get("/crops", (req, res) => {
  res.render("crops", { about: "about", services: "services", home: "home" });
});

app.get("/cropInfo", (req, res) => {
  const cropName = req.query.crop.toLowerCase();
  fs.readFile(path.join(__dirname, "crops.json"), "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Internal server error" });
    const crops = JSON.parse(data).crops;
    const crop = crops.find((c) => c.name.toLowerCase() === cropName);
    res.render("cropInfo.ejs", {
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
}); app.get("/crop_disease_prediction", (req, res) => {
  res.render("crop disease", { about: "about", services: "services", home: "home" });
});

const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const { Blob } = require('buffer'); // Make sure to import Blob
// const diseaseDataPath = path.join(__dirname, "disease.json");
app.post("/crop_disease_predict", upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file uploaded' });
  }

  // Convert the buffer into a Blob
  const imageBlob = new Blob([req.file.buffer], { type: 'image/jpeg' });

  const formData = new FormData();
  formData.append('image', imageBlob, 'image.jpg');

  axios
    .post("http://127.0.0.1:5000/predict-image", formData, {
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
    });
});




app.post("/predict", (req, res) => {
  const inputData = {
    year: req.body.year,
    average_rainfall: req.body.average_rain_fall_mm_per_year,
    pesticides: req.body.pesticides_tonnes,
    avg_temp: req.body.avg_temp,
    area: req.body.area,
    item: req.body.item,
  };

  axios
    .post("http://127.0.0.1:5000/predict-yield", inputData)
    .then((response) => {
      console.log(response);
      res.json(response);
    })
    .catch((error) => {
      console.error("Error calling Flask API:", error);
      res.status(500).json({ error: "Error making prediction" });
    });
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
// Start the server
app.listen(port, (err) => {
  if (err) console.log(err);
  else console.log(`The website is hosted on http://localhost:${port}`);
});

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

const app = express();

const PORT = process.env.PORT || 5000;
const WEATHERAPI_KEY = process.env.WEATHERAPI_KEY;

// ==========================================
// REVERSE GEOCODING
// ==========================================

async function getDistrictFromCoordinates(
  latitude,
  longitude
) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(
        latitude
      )}&lon=${encodeURIComponent(
        longitude
      )}&zoom=18&addressdetails=1`,
      {
        headers: {
          "User-Agent":
            "Mausam-SIH-2026-PS26076/1.0",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(
        "District lookup HTTP error:",
        response.status
      );

      return "";
    }

    const data = await response.json();

    return (
      data?.address?.state_district ||
      data?.address?.district ||
      data?.address?.county ||
      ""
    );
  } catch (error) {
    console.error(
      "District lookup failed:",
      error.message
    );

    return "";
  }
}

// ==========================================
// MYSQL CONNECTION POOL
// ==========================================

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "mausam",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// ==========================================
// APP CONFIGURATION
// ==========================================

app.use(cors());
app.use(express.json());

// ==========================================
// WEATHER CACHE
// ==========================================

const weatherCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000;

function cacheKey(lat, lon) {
  return `${Number(lat).toFixed(2)},${Number(
    lon
  ).toFixed(2)}`;
}

// ==========================================
// WEATHER HELPERS
// ==========================================

function getWeatherCode(conditionText) {
  const text = String(
    conditionText || ""
  ).toLowerCase();

  if (text.includes("thunder")) return 95;
  if (text.includes("snow")) return 71;
  if (text.includes("sleet")) return 66;
  if (text.includes("rain")) return 61;
  if (text.includes("drizzle")) return 51;
  if (
    text.includes("fog") ||
    text.includes("mist")
  )
    return 45;
  if (text.includes("overcast")) return 3;
  if (text.includes("cloud")) return 2;
  if (
    text.includes("clear") ||
    text.includes("sunny")
  )
    return 0;

  return 1;
}

function normalizeWeather(data) {
  const current = data.current;
  const location = data.location;

  const forecastDays = (
    data.forecast?.forecastday || []
  ).map((day) => ({
    date: day.date,

    highC:
      typeof day.day?.maxtemp_c === "number"
        ? day.day.maxtemp_c
        : null,

    lowC:
      typeof day.day?.mintemp_c === "number"
        ? day.day.mintemp_c
        : null,

    condition:
      day.day?.condition?.text ||
      "Weather forecast",

    weatherCode: getWeatherCode(
      day.day?.condition?.text
    ),

    precipitationProbability:
      typeof day.day?.daily_chance_of_rain ===
      "number"
        ? day.day.daily_chance_of_rain
        : null,

    precipitationMm:
      typeof day.day?.totalprecip_mm ===
      "number"
        ? day.day.totalprecip_mm
        : null,

    sunrise:
      day.astro?.sunrise || null,

    sunset:
      day.astro?.sunset || null,
  }));

  const hourly = [];

  for (const day of
    data.forecast?.forecastday || []) {
    for (const hour of day.hour || []) {
      hourly.push({
        time: hour.time,

        temperatureC:
          typeof hour.temp_c === "number"
            ? hour.temp_c
            : null,

        feelsLikeC:
          typeof hour.feelslike_c === "number"
            ? hour.feelslike_c
            : null,

        condition:
          hour.condition?.text || "Weather",

        weatherCode: getWeatherCode(
          hour.condition?.text
        ),

        humidity:
          typeof hour.humidity === "number"
            ? hour.humidity
            : null,

        windKph:
          typeof hour.wind_kph === "number"
            ? hour.wind_kph
            : null,

        windDirection:
          hour.wind_dir || null,

        precipitationProbability:
          typeof hour.chance_of_rain ===
          "number"
            ? hour.chance_of_rain
            : null,

        precipitationMm:
          typeof hour.precip_mm === "number"
            ? hour.precip_mm
            : null,

        cloudCover:
          typeof hour.cloud === "number"
            ? hour.cloud
            : null,
      });
    }
  }

  return {
    source: "WeatherAPI",

    fetchedAt:
      new Date().toISOString(),

    location: {
      latitude: location.lat,
      longitude: location.lon,
      city: location.name,
      region: location.region,
      country: location.country,
      timezone: location.tz_id,
    },

    current: {
      time: location.localtime,

      temperatureC:
        typeof current.temp_c === "number"
          ? current.temp_c
          : null,

      feelsLikeC:
        typeof current.feelslike_c ===
        "number"
          ? current.feelslike_c
          : null,

      condition:
        current.condition?.text ||
        "Weather unavailable",

      weatherCode: getWeatherCode(
        current.condition?.text
      ),

      humidity:
        typeof current.humidity === "number"
          ? current.humidity
          : null,

      windKph:
        typeof current.wind_kph === "number"
          ? current.wind_kph
          : null,

      windDirection:
        current.wind_dir || null,

      pressureHpa:
        typeof current.pressure_mb ===
        "number"
          ? current.pressure_mb
          : null,

      visibilityKm:
        typeof current.vis_km === "number"
          ? current.vis_km
          : null,

      uv:
        typeof current.uv === "number"
          ? current.uv
          : null,

      cloudCover:
        typeof current.cloud === "number"
          ? current.cloud
          : null,

      precipitationMm:
        typeof current.precip_mm ===
        "number"
          ? current.precip_mm
          : null,

      rainMm:
        typeof current.precip_mm === "number"
          ? current.precip_mm
          : null,

      dewPointC: null,
    },

    hourly,

    daily: forecastDays,

    airQuality: {
      pm10:
        typeof current.air_quality?.pm10 ===
        "number"
          ? current.air_quality.pm10
          : null,

      pm25:
        typeof current.air_quality?.pm2_5 ===
        "number"
          ? current.air_quality.pm2_5
          : null,

      carbonMonoxide:
        typeof current.air_quality?.co ===
        "number"
          ? current.air_quality.co
          : null,

      nitrogenDioxide:
        typeof current.air_quality?.no2 ===
        "number"
          ? current.air_quality.no2
          : null,

      sulphurDioxide:
        typeof current.air_quality?.so2 ===
        "number"
          ? current.air_quality.so2
          : null,

      ozone:
        typeof current.air_quality?.o3 ===
        "number"
          ? current.air_quality.o3
          : null,

      usAqi:
        typeof current.air_quality?.[
          "us-epa-index"
        ] === "number"
          ? current.air_quality[
              "us-epa-index"
            ]
          : null,

      europeanAqi:
        typeof current.air_quality?.[
          "gb-defra-index"
        ] === "number"
          ? current.air_quality[
              "gb-defra-index"
            ]
          : null,
    },
  };
}

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/api/health", async (req, res) => {
  let mysqlStatus = "NOT CONNECTED";

  try {
    const [rows] = await db.query(
      "SELECT DATABASE() AS database_name"
    );

    mysqlStatus =
      rows[0]?.database_name === "mausam"
        ? "CONNECTED"
        : "CONNECTED";
  } catch (error) {
    console.error(
      "MySQL health check failed:",
      error.message
    );

    mysqlStatus = "FAILED";
  }

  res.json({
    status: "Mausam backend is running",
    provider: "WeatherAPI",
    apiKeyLoaded:
      Boolean(WEATHERAPI_KEY),

    mysql: {
      status: mysqlStatus,
      database:
        process.env.DB_NAME || "mausam",
    },

    cacheEntries: weatherCache.size,

    cacheDurationMinutes:
      CACHE_DURATION / 60000,
  });
});

// ==========================================
// USER / DEVICE API
// ==========================================

app.post("/api/user", async (req, res) => {
  try {
    const {
      deviceId,
      name,
      email,
    } = req.body;

    if (
      !deviceId ||
      typeof deviceId !== "string" ||
      !deviceId.trim()
    ) {
      return res.status(400).json({
        error: "deviceId is required.",
      });
    }

    const cleanDeviceId =
      deviceId.trim();

    const [existingUsers] =
      await db.query(
        `
        SELECT
          id,
          device_id,
          name,
          email,
          created_at,
          updated_at
        FROM users
        WHERE device_id = ?
        LIMIT 1
        `,
        [cleanDeviceId]
      );

    if (existingUsers.length > 0) {
      return res.json({
        success: true,
        existing: true,
        user: existingUsers[0],
      });
    }

    const [result] =
      await db.query(
        `
        INSERT INTO users (
          device_id,
          name,
          email
        )
        VALUES (?, ?, ?)
        `,
        [
          cleanDeviceId,
          name || null,
          email || null,
        ]
      );

    const [newUsers] =
      await db.query(
        `
        SELECT
          id,
          device_id,
          name,
          email,
          created_at,
          updated_at
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [result.insertId]
      );

    return res.status(201).json({
      success: true,
      existing: false,
      user: newUsers[0],
    });
  } catch (error) {
    console.error(
      "User creation/retrieval failed:",
      error
    );

    return res.status(500).json({
      error:
        "Unable to create or retrieve user.",
    });
  }
});

// ==========================================
// USER PREFERENCES API
// ==========================================

app.put(
  "/api/user/preferences",
  async (req, res) => {
    try {
      const {
        userId,
        interests,
        language,
      } = req.body;

      if (
        !userId ||
        !Number.isInteger(Number(userId))
      ) {
        return res.status(400).json({
          error:
            "Valid userId is required.",
        });
      }

      if (!Array.isArray(interests)) {
        return res.status(400).json({
          error:
            "interests must be an array.",
        });
      }

      const cleanUserId =
        Number(userId);

      const [users] =
        await db.query(
          `
          SELECT id
          FROM users
          WHERE id = ?
          LIMIT 1
          `,
          [cleanUserId]
        );

      if (users.length === 0) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      const cleanInterests =
        interests
          .filter(
            (interest) =>
              typeof interest ===
                "string" &&
              interest.trim().length > 0
          )
          .map((interest) =>
            interest.trim()
          );

      const cleanLanguage =
        typeof language === "string" &&
        language.trim().length > 0
          ? language.trim()
          : "English";

      const [
        existingPreferences,
      ] = await db.query(
        `
        SELECT id
        FROM user_preferences
        WHERE user_id = ?
        LIMIT 1
        `,
        [cleanUserId]
      );

      if (
        existingPreferences.length > 0
      ) {
        await db.query(
          `
          UPDATE user_preferences
          SET interests = ?,
              language = ?
          WHERE user_id = ?
          `,
          [
            JSON.stringify(
              cleanInterests
            ),
            cleanLanguage,
            cleanUserId,
          ]
        );
      } else {
        await db.query(
          `
          INSERT INTO user_preferences (
            user_id,
            interests,
            language
          )
          VALUES (?, ?, ?)
          `,
          [
            cleanUserId,
            JSON.stringify(
              cleanInterests
            ),
            cleanLanguage,
          ]
        );
      }

      const [preferences] =
        await db.query(
          `
          SELECT
            id,
            user_id,
            interests,
            language,
            created_at,
            updated_at
          FROM user_preferences
          WHERE user_id = ?
          LIMIT 1
          `,
          [cleanUserId]
        );

      return res.json({
        success: true,
        preferences:
          preferences[0],
      });
    } catch (error) {
      console.error(
        "User preferences update failed:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to save user preferences.",
      });
    }
  }
);

// ==========================================
// USER LOCATION API
// ==========================================

app.put(
  "/api/user/location",
  async (req, res) => {
    try {
      const {
        userId,
        label,
        locality,
        city,
        district,
        region,
        country,
        latitude,
        longitude,
        isPrimary,
      } = req.body;

      if (
        !userId ||
        !Number.isInteger(
          Number(userId)
        )
      ) {
        return res.status(400).json({
          error:
            "Valid userId is required.",
        });
      }

      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number"
      ) {
        return res.status(400).json({
          error:
            "Valid latitude and longitude are required.",
        });
      }

      const cleanUserId =
        Number(userId);

      /*
       * Get the actual administrative
       * district from the GPS coordinates.
       */
      const detectedDistrict =
        await getDistrictFromCoordinates(
          latitude,
          longitude
        );

      const finalDistrict =
        detectedDistrict ||
        district ||
        null;

      const [users] =
        await db.query(
          `
          SELECT id
          FROM users
          WHERE id = ?
          LIMIT 1
          `,
          [cleanUserId]
        );

      if (users.length === 0) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      const cleanLabel =
        typeof label === "string" &&
        label.trim()
          ? label.trim()
          : "Current Location";

      if (isPrimary === true) {
        await db.query(
          `
          UPDATE saved_locations
          SET is_primary = FALSE
          WHERE user_id = ?
          `,
          [cleanUserId]
        );
      }

      const [
        existingLocations,
      ] = await db.query(
        `
        SELECT id
        FROM saved_locations
        WHERE user_id = ?
        LIMIT 1
        `,
        [cleanUserId]
      );

      if (
        existingLocations.length > 0
      ) {
        await db.query(
          `
          UPDATE saved_locations
          SET
            label = ?,
            locality = ?,
            city = ?,
            district = ?,
            region = ?,
            country = ?,
            latitude = ?,
            longitude = ?,
            is_primary = ?
          WHERE user_id = ?
          LIMIT 1
          `,
          [
            cleanLabel,
            locality || null,
            city || null,
            finalDistrict,
            region || null,
            country || null,
            latitude,
            longitude,
            isPrimary === true,
            cleanUserId,
          ]
        );
      } else {
        await db.query(
          `
          INSERT INTO saved_locations (
            user_id,
            label,
            locality,
            city,
            district,
            region,
            country,
            latitude,
            longitude,
            is_primary
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            cleanUserId,
            cleanLabel,
            locality || null,
            city || null,
            finalDistrict,
            region || null,
            country || null,
            latitude,
            longitude,
            isPrimary === true,
          ]
        );
      }

      const [locations] =
        await db.query(
          `
          SELECT
            id,
            user_id,
            label,
            locality,
            city,
            district,
            region,
            country,
            latitude,
            longitude,
            is_primary,
            created_at,
            updated_at
          FROM saved_locations
          WHERE user_id = ?
          LIMIT 1
          `,
          [cleanUserId]
        );

      return res.json({
        success: true,
        location: locations[0],
      });
    } catch (error) {
      console.error(
        "User location update failed:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to save user location.",
      });
    }
  }
);

// ==========================================
// SAVED LOCATIONS API
// ==========================================

// Get all saved locations

app.get(
  "/api/user/saved-locations",
  async (req, res) => {
    try {
      const userId = Number(
        req.query.userId
      );

      if (
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        return res.status(400).json({
          error:
            "Valid userId is required.",
        });
      }

      const [locations] =
        await db.query(
          `
          SELECT
            id,
            user_id,
            label,
            locality,
            city,
            district,
            region,
            country,
            latitude,
            longitude,
            is_primary,
            created_at,
            updated_at
          FROM saved_locations
          WHERE user_id = ?
          ORDER BY
            is_primary DESC,
            updated_at DESC,
            id DESC
          `,
          [userId]
        );

      return res.json({
        success: true,
        locations,
      });
    } catch (error) {
      console.error(
        "Saved locations retrieval failed:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to retrieve saved locations.",
      });
    }
  }
);

// Add a new saved location

app.post(
  "/api/user/saved-locations",
  async (req, res) => {
    try {
      const {
        userId,
        label,
        locality,
        city,
        district,
        region,
        country,
        latitude,
        longitude,
      } = req.body;

      if (
        !userId ||
        !Number.isInteger(
          Number(userId)
        )
      ) {
        return res.status(400).json({
          error:
            "Valid userId is required.",
        });
      }

      if (
        typeof latitude !== "number" ||
        typeof longitude !== "number"
      ) {
        return res.status(400).json({
          error:
            "Valid latitude and longitude are required.",
        });
      }

      const cleanUserId =
        Number(userId);

      const [users] =
        await db.query(
          `
          SELECT id
          FROM users
          WHERE id = ?
          LIMIT 1
          `,
          [cleanUserId]
        );

      if (users.length === 0) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      const cleanLabel =
        typeof label === "string" &&
        label.trim()
          ? label.trim()
          : locality ||
            city ||
            "Saved Location";

      const [result] =
        await db.query(
          `
          INSERT INTO saved_locations (
            user_id,
            label,
            locality,
            city,
            district,
            region,
            country,
            latitude,
            longitude,
            is_primary
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE)
          `,
          [
            cleanUserId,
            cleanLabel,
            locality || null,
            city || null,
            district || null,
            region || null,
            country || null,
            latitude,
            longitude,
          ]
        );

      const [locations] =
        await db.query(
          `
          SELECT
            id,
            user_id,
            label,
            locality,
            city,
            district,
            region,
            country,
            latitude,
            longitude,
            is_primary,
            created_at,
            updated_at
          FROM saved_locations
          WHERE id = ?
          LIMIT 1
          `,
          [result.insertId]
        );

      return res.status(201).json({
        success: true,
        location: locations[0],
      });
    } catch (error) {
      console.error(
        "Saved location creation failed:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to save location.",
      });
    }
  }
);

// Delete a saved location

app.delete(
  "/api/user/saved-locations/:locationId",
  async (req, res) => {
    try {
      const locationId = Number(
        req.params.locationId
      );

      const userId = Number(
        req.query.userId
      );

      if (
        !Number.isInteger(
          locationId
        ) ||
        locationId <= 0 ||
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        return res.status(400).json({
          error:
            "Valid locationId and userId are required.",
        });
      }

      const [result] =
        await db.query(
          `
          DELETE FROM saved_locations
          WHERE id = ?
            AND user_id = ?
          `,
          [locationId, userId]
        );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          error:
            "Saved location not found.",
        });
      }

      return res.json({
        success: true,
        message:
          "Saved location deleted.",
      });
    } catch (error) {
      console.error(
        "Saved location deletion failed:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to delete saved location.",
      });
    }
  }
);

// Make a saved location primary

app.put(
  "/api/user/saved-locations/:locationId/primary",
  async (req, res) => {
    try {
      const locationId = Number(
        req.params.locationId
      );

      const userId = Number(
        req.body.userId
      );

      if (
        !Number.isInteger(
          locationId
        ) ||
        locationId <= 0 ||
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        return res.status(400).json({
          error:
            "Valid locationId and userId are required.",
        });
      }

      const connection =
        await db.getConnection();

      try {
        await connection.beginTransaction();

        await connection.query(
          `
          UPDATE saved_locations
          SET is_primary = FALSE
          WHERE user_id = ?
          `,
          [userId]
        );

        const [result] =
          await connection.query(
            `
            UPDATE saved_locations
            SET is_primary = TRUE
            WHERE id = ?
              AND user_id = ?
            `,
            [locationId, userId]
          );

        if (
          result.affectedRows === 0
        ) {
          await connection.rollback();

          return res.status(404).json({
            error:
              "Saved location not found.",
          });
        }

        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

      return res.json({
        success: true,
        message:
          "Primary location updated.",
      });
    } catch (error) {
      console.error(
        "Primary location update failed:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to update primary location.",
      });
    }
  }
);

// ==========================================
// ALERT PREFERENCES API
// ==========================================

app.put(
  "/api/user/alerts",
  async (req, res) => {
    try {
      const {
        userId,
        severeWeather,
        heavyRain,
        storm,
        extremeHeat,
        poorAirQuality,
      } = req.body;

      if (
        !userId ||
        !Number.isInteger(
          Number(userId)
        )
      ) {
        return res.status(400).json({
          error:
            "Valid userId is required.",
        });
      }

      const cleanUserId =
        Number(userId);

      const [users] =
        await db.query(
          `
          SELECT id
          FROM users
          WHERE id = ?
          LIMIT 1
          `,
          [cleanUserId]
        );

      if (users.length === 0) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      const cleanSevereWeather =
        severeWeather !== false;

      const cleanHeavyRain =
        heavyRain !== false;

      const cleanStorm =
        storm !== false;

      const cleanExtremeHeat =
        extremeHeat !== false;

      const cleanPoorAirQuality =
        poorAirQuality !== false;

      const [existingAlerts] =
        await db.query(
          `
          SELECT id
          FROM alert_preferences
          WHERE user_id = ?
          LIMIT 1
          `,
          [cleanUserId]
        );

      if (
        existingAlerts.length > 0
      ) {
        await db.query(
          `
          UPDATE alert_preferences
          SET
            severe_weather = ?,
            heavy_rain = ?,
            storm = ?,
            extreme_heat = ?,
            poor_air_quality = ?
          WHERE user_id = ?
          `,
          [
            cleanSevereWeather,
            cleanHeavyRain,
            cleanStorm,
            cleanExtremeHeat,
            cleanPoorAirQuality,
            cleanUserId,
          ]
        );
      } else {
        await db.query(
          `
          INSERT INTO alert_preferences (
            user_id,
            severe_weather,
            heavy_rain,
            storm,
            extreme_heat,
            poor_air_quality
          )
          VALUES (?, ?, ?, ?, ?, ?)
          `,
          [
            cleanUserId,
            cleanSevereWeather,
            cleanHeavyRain,
            cleanStorm,
            cleanExtremeHeat,
            cleanPoorAirQuality,
          ]
        );
      }

      const [alerts] =
        await db.query(
          `
          SELECT
            id,
            user_id,
            severe_weather,
            heavy_rain,
            storm,
            extreme_heat,
            poor_air_quality,
            created_at,
            updated_at
          FROM alert_preferences
          WHERE user_id = ?
          LIMIT 1
          `,
          [cleanUserId]
        );

      return res.json({
        success: true,
        alerts: alerts[0],
      });
    } catch (error) {
      console.error(
        "Alert preferences update failed:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to save alert preferences.",
      });
    }
  }
);

app.get(
  "/api/user/alerts",
  async (req, res) => {
    try {
      const userId = Number(
        req.query.userId
      );

      if (
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        return res.status(400).json({
          error:
            "Valid userId is required.",
        });
      }

      const [users] =
        await db.query(
          `
          SELECT id
          FROM users
          WHERE id = ?
          LIMIT 1
          `,
          [userId]
        );

      if (users.length === 0) {
        return res.status(404).json({
          error: "User not found.",
        });
      }

      const [alerts] =
        await db.query(
          `
          SELECT
            id,
            user_id,
            severe_weather,
            heavy_rain,
            storm,
            extreme_heat,
            poor_air_quality,
            created_at,
            updated_at
          FROM alert_preferences
          WHERE user_id = ?
          LIMIT 1
          `,
          [userId]
        );

      if (alerts.length === 0) {
        return res.json({
          success: true,
          alerts: {
            user_id: userId,
            severe_weather: true,
            heavy_rain: true,
            storm: true,
            extreme_heat: true,
            poor_air_quality: true,
          },
        });
      }

      return res.json({
        success: true,
        alerts: alerts[0],
      });
    } catch (error) {
      console.error(
        "Alert preferences retrieval failed:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to retrieve alert preferences.",
      });
    }
  }
);

// ==========================================
// WEATHER API
// ==========================================

app.get(
  "/api/weather",
  async (req, res) => {
    try {
      const lat = Number(
        req.query.lat
      );

      const lon = Number(
        req.query.lon
      );

      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lon)
      ) {
        return res.status(400).json({
          error:
            "Valid latitude and longitude are required.",
        });
      }

      if (!WEATHERAPI_KEY) {
        return res.status(500).json({
          error:
            "WeatherAPI key is not configured on the backend.",
        });
      }

      const key = cacheKey(
        lat,
        lon
      );

      const cached =
        weatherCache.get(key);

      if (
        cached &&
        Date.now() -
          cached.timestamp <
          CACHE_DURATION
      ) {
        return res.json(
          cached.data
        );
      }

      const url =
        `https://api.weatherapi.com/v1/forecast.json` +
        `?key=${encodeURIComponent(
          WEATHERAPI_KEY
        )}` +
        `&q=${encodeURIComponent(
          `${lat},${lon}`
        )}` +
        `&days=5` +
        `&aqi=yes` +
        `&alerts=yes`;

      const response =
        await fetch(url);

      const data =
        await response.json();

      if (!response.ok) {
        console.error(
          `WeatherAPI error for ${lat},${lon}:`,
          data?.error?.message ||
            `HTTP ${response.status}`
        );

        return res
          .status(response.status)
          .json({
            error:
              data?.error?.message ||
              `WeatherAPI returned ${response.status}`,
          });
      }

      const normalized =
        normalizeWeather(data);

      weatherCache.set(key, {
        timestamp: Date.now(),
        data: normalized,
      });

      return res.json(
        normalized
      );
    } catch (error) {
      console.error(
        "Weather request failed:",
        error
      );

      return res.status(500).json({
        error:
          "Unable to retrieve weather data.",
      });
    }
  }
);

// ==========================================
// START SERVER
// ==========================================

app.listen(
  PORT,
  "0.0.0.0",
  async () => {
    let mysqlStatus = "FAILED";

    try {
      const [rows] =
        await db.query(
          "SELECT DATABASE() AS database_name"
        );

      if (
        rows[0]?.database_name ===
        "mausam"
      ) {
        mysqlStatus =
          "CONNECTED";
      }
    } catch (error) {
      console.error(
        "MySQL startup connection failed:",
        error.message
      );
    }

    console.log(`
==========================================
        MAUSAM BACKEND SERVER
==========================================
Server running on port ${PORT}
Weather provider: WeatherAPI
MySQL database: ${mysqlStatus}
Cache duration: 10 minutes
Duplicate request protection: ON
API key loaded: ${
      WEATHERAPI_KEY ? "YES" : "NO"
    }
==========================================
`);
  }
);
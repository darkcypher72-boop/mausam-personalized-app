import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useLanguage } from "../hooks/useLanguage";
const API_BASE_URL = "http://192.168.29.129:5000";
const USER_ID_KEY = "@mausam_user_id";
const LOCATION_STORAGE_KEY = "@mausam_user_location";
const INTERESTS_STORAGE_KEY = "@mausam_user_interests";

type Interest =
  | "daily"
  | "health"
  | "fitness"
  | "travel"
  | "marine"
  | "family"
  | "agriculture"
  | "commute"
  | "events";

type PreferencesData = {
  interests: Interest[];
  updatedAt?: string;
};

type LocationInfo = {
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  country?: string;
  accuracyMeters?: number;
  timestamp?: number;
  updatedAt?: string;
  locality?: string;
  district?: string;
};

type WeatherCurrent = {
  time: string;
  temperatureC?: number;
  feelsLikeC?: number;
  condition?: string;
  weatherCode?: number;
  humidity?: number;
  windKph?: number;
  windDirection?: number | string;
  pressureHpa?: number;
  visibilityKm?: number;
  uv?: number;
  cloudCover?: number;
  precipitationMm?: number;
  rainMm?: number;
  dewPointC?: number;
};

type HourlyWeather = {
  time: string;
  temperatureC?: number;
  precipitationProbability?: number;
  precipitationMm?: number;
  weatherCode?: number;
  humidity?: number;
  windKph?: number;
  uv?: number;
  visibilityKm?: number;
};
type AlertPreferences = {
  severeWeather: boolean;
  heavyRain: boolean;
  storm: boolean;
  extremeHeat: boolean;
  poorAirQuality: boolean;
};
type ActiveWeatherAlert = {
  type:
    | "storm"
    | "heavyRain"
    | "extremeHeat"
    | "poorAirQuality"
    | "severeWeather";
  title: string;
  description: string;
  value: string;
  severity: "notice" | "warning";
};
type DailyWeather = {
  date: string;
  condition?: string;
  weatherCode?: number;
  highC?: number;
  lowC?: number;
  precipitationMm?: number;
  precipitationProbability?: number;
  sunrise?: string;
  sunset?: string;
  uvMax?: number;
  windMaxKph?: number;
};

type AirQuality = {
  pm10?: number;
  pm25?: number;
  carbonMonoxide?: number;
  nitrogenDioxide?: number;
  sulphurDioxide?: number;
  ozone?: number;
  usAqi?: number;
  europeanAqi?: number;
};

type WeatherResponse = {
  source?: string;
  fetchedAt?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    timezone?: string;
  };
  current?: WeatherCurrent;
  hourly?: HourlyWeather[];
  daily?: DailyWeather[];
  airQuality?: AirQuality;
};

type PriorityDetail = {
  interest: Interest;
  title: string;
  description: string;
  details: string[];
};

let homeWeatherCache: WeatherResponse | null = null;
let homeLocationCache: LocationInfo | null = null;
let homeInterestsCache: Interest[] | null = null;

const BASE_SECTION_ORDER = [
  "currentWeather",
  "alerts",
  "today",
  "hourly",
  "forecast",
  "sun",
  "airQuality",
  "weatherDetails",
];

function getGreeting(
  language: "English" | "हिन्दी" | "অসমীয়া",
  hour = new Date().getHours()
) {
  if (language === "हिन्दी") {
    if (hour >= 5 && hour < 12) {
      return {
        title: "सुप्रभात",
        description: "देखें कि आज का दिन आपके लिए कैसा रहेगा।",
      };
    }

    if (hour >= 12 && hour < 17) {
      return {
        title: "नमस्कार",
        description: "अपने आसपास के मौसम की जानकारी रखें।",
      };
    }

    if (hour >= 17 && hour < 21) {
      return {
        title: "शुभ संध्या",
        description: "विश्वास के साथ अपने दिन की योजना बनाएं।",
      };
    }

    return {
      title: "शुभ रात्रि",
      description: "जानकारी रखें और कल की तैयारी करें।",
    };
  }

  if (language === "অসমীয়া") {
    if (hour >= 5 && hour < 12) {
      return {
        title: "শুভ পুৱা",
        description: "আজি আপোনাৰ দিনটো কেনেকুৱা হ'ব চাওক।",
      };
    }

    if (hour >= 12 && hour < 17) {
      return {
        title: "শুভ দুপৰীয়া",
        description: "আপোনাৰ ওচৰৰ বতৰৰ অৱস্থাৰ বিষয়ে জানি থাকক।",
      };
    }

    if (hour >= 17 && hour < 21) {
      return {
        title: "শুভ সন্ধিয়া",
        description: "আত্মবিশ্বাসেৰে আপোনাৰ বাকী দিনটো পৰিকল্পনা কৰক।",
      };
    }

    return {
      title: "শুভ ৰাত্ৰি",
      description: "তথ্য লাভ কৰক আৰু কাইলৈৰ বাবে পৰিকল্পনা কৰক।",
    };
  }

  if (hour >= 5 && hour < 12) {
    return {
      title: "GOOD MORNING",
      description: "Here's what the day looks like for you.",
    };
  }

  if (hour >= 12 && hour < 17) {
    return {
      title: "GOOD AFTERNOON",
      description: "Stay updated with conditions around you.",
    };
  }

  if (hour >= 17 && hour < 21) {
    return {
      title: "GOOD EVENING",
      description: "Plan the rest of your day with confidence.",
    };
  }

  return {
    title: "GOOD NIGHT",
    description: "Stay informed and plan ahead for tomorrow.",
  };
}

function formatHour(value?: string) {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDay(value?: string) {
  if (!value) return "--";

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return date.toLocaleDateString([], {
    weekday: "short",
  });
}

function formatTime(value?: string) {
  if (!value) return "--";

  // WeatherAPI commonly returns values like:
  // "05:13 AM" or "05:14 PM"
  const timeOnlyMatch = value.match(
    /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
  );

  if (timeOnlyMatch) {
    const hour = timeOnlyMatch[1];
    const minute = timeOnlyMatch[2];
    const period = timeOnlyMatch[3].toUpperCase();

    return `${hour}:${minute} ${period}`;
  }

  // Handle full ISO/date-time values if the backend sends those.
  const date = new Date(value);

  if (!Number.isNaN(date.getTime())) {
    return date.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return "--";
}

function formatUpdated(
  value?: string,
  language: "English" | "हिन्दी" | "অসমীয়া" = "English"
) {
  if (!value) {
    if (language === "हिन्दी") return "अपडेट की प्रतीक्षा है";
    if (language === "অসমীয়া") return "আপডেটৰ বাবে অপেক্ষা কৰি আছে";
    return "Waiting for update";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    if (language === "हिन्दी") return "लाइव डेटा";
    if (language === "অসমীয়া") return "লাইভ ডাটা";
    return "Live data";
  }

  const time = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  if (language === "हिन्दी") return `अपडेट: ${time}`;
  if (language === "অসমীয়া") return `আপডেট: ${time}`;

  return `Updated ${time}`;
}

function getAqiLabel(
  aqi?: number,
  language: "English" | "हिन्दी" | "অসমীয়া" = "English"
) {
  if (typeof aqi !== "number") {
    if (language === "हिन्दी") return "उपलब्ध नहीं";
    if (language === "অসমীয়া") return "উপলব্ধ নহয়";
    return "UNAVAILABLE";
  }

  if (language === "हिन्दी") {
    if (aqi <= 50) return "अच्छा";
    if (aqi <= 100) return "मध्यम";
    if (aqi <= 150) return "संवेदनशील के लिए अस्वास्थ्यकर";
    if (aqi <= 200) return "अस्वास्थ्यकर";
    if (aqi <= 300) return "बहुत अस्वास्थ्यकर";
    return "खतरनाक";
  }

  if (language === "অসমীয়া") {
    if (aqi <= 50) return "ভাল";
    if (aqi <= 100) return "মধ্যম";
    if (aqi <= 150) return "সংবেদনশীল লোকৰ বাবে অস্বাস্থ্যকৰ";
    if (aqi <= 200) return "অস্বাস্থ্যকৰ";
    if (aqi <= 300) return "অতি অস্বাস্থ্যকৰ";
    return "বিপজ্জনক";
  }

  if (aqi <= 50) return "GOOD";
  if (aqi <= 100) return "MODERATE";
  if (aqi <= 150) return "UNHEALTHY";
  if (aqi <= 200) return "UNHEALTHY";
  if (aqi <= 300) return "VERY UNHEALTHY";

  return "HAZARDOUS";
}

function getAqiProgress(aqi?: number) {
  if (typeof aqi !== "number") {
    return 0;
  }

  return Math.min(Math.max(aqi / 300, 0), 1);
}

function getWeatherSymbol(code?: number) {
  if (typeof code !== "number") {
    return "○";
  }

  if (code === 0) return "○";

  if (code === 1 || code === 2) {
    return "◐";
  }

  if (code === 3) {
    return "☁";
  }

  if (code === 45 || code === 48) {
    return "≋";
  }

  if ([51, 53, 55, 56, 57].includes(code)) {
    return "≋";
  }

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return "◒";
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return "✦";
  }

  if ([95, 96, 99].includes(code)) {
    return "⚡";
  }

  return "○";
}

function getWindDirection(value?: number | string) {
  if (typeof value === "string" && value.trim()) {
    return value.toUpperCase();
  }

  if (typeof value !== "number") {
    return "--";
  }

  const directions = [
    "N",
    "NE",
    "E",
    "SE",
    "S",
    "SW",
    "W",
    "NW",
  ];

  const index = Math.round(value / 45) % 8;

  return directions[index];
}

function getInterestTitle(
  interest: Interest,
  language: "English" | "हिन्दी" | "অসমীয়া" = "English"
) {
  if (language === "हिन्दी") {
    switch (interest) {
      case "health":
        return "स्वास्थ्य और कल्याण";
      case "fitness":
        return "आउटडोर फिटनेस";
      case "travel":
        return "यात्रा";
      case "marine":
        return "समुद्र और सर्फ";
      case "family":
        return "परिवार";
      case "agriculture":
        return "कृषि और बागवानी";
      case "commute":
        return "दैनिक आवागमन";
      case "events":
        return "आउटडोर कार्यक्रम";
      case "daily":
      default:
        return "दैनिक मौसम";
    }
  }

  if (language === "অসমীয়া") {
    switch (interest) {
      case "health":
        return "স্বাস্থ্য আৰু কল্যাণ";
      case "fitness":
        return "বাহিৰৰ ফিটনেছ";
      case "travel":
        return "ভ্ৰমণ";
      case "marine":
        return "সাগৰ আৰু ছাৰ্ফ";
      case "family":
        return "পৰিয়াল";
      case "agriculture":
        return "কৃষি আৰু বাগিচা";
      case "commute":
        return "দৈনিক যাতায়াত";
      case "events":
        return "বাহিৰৰ অনুষ্ঠান";
      case "daily":
      default:
        return "দৈনন্দিন বতৰ";
    }
  }

  switch (interest) {
    case "health":
      return "Health & Wellbeing";
    case "fitness":
      return "Outdoor Fitness";
    case "travel":
      return "Travel";
    case "marine":
      return "Beach & Surf";
    case "family":
      return "Family";
    case "agriculture":
      return "Agriculture & Gardening";
    case "commute":
      return "Daily Commute";
    case "events":
      return "Outdoor Events";
    case "daily":
    default:
      return "Everyday Weather";
  }
}

function getInterestDescription(
  interest: Interest,
  language: "English" | "हिन्दी" | "অসমীয়া" = "English"
) {
  if (language === "हिन्दी") {
    switch (interest) {
      case "health":
        return "वायु गुणवत्ता, UV, आर्द्रता और स्वास्थ्य संबंधी स्थितियां।";
      case "fitness":
        return "दौड़ने का समय, हवा, गर्मी और धूप का समय।";
      case "travel":
        return "गंतव्य की स्थितियां और महत्वपूर्ण मौसम चेतावनियां।";
      case "marine":
        return "समुद्री स्थितियां, ज्वार, लहरें और पानी की जानकारी।";
      case "family":
        return "बारिश, स्कूल आवागमन और गंभीर मौसम अपडेट।";
      case "agriculture":
        return "वर्षा, मिट्टी की स्थिति और मौसमी मार्गदर्शन।";
      case "commute":
        return "दृश्यता, बारिश, कोहरा और यात्रा की स्थितियां।";
      case "events":
        return "विस्तृत पूर्वानुमान, बारिश की संभावना और आरामदायक स्थितियां।";
      case "daily":
      default:
        return "स्थितियां, पूर्वानुमान और महत्वपूर्ण अपडेट।";
    }
  }

  if (language === "অসমীয়া") {
    switch (interest) {
      case "health":
        return "বায়ুৰ গুণমান, UV, আৰ্দ্ৰতা আৰু স্বাস্থ্যৰ অৱস্থা।";
      case "fitness":
        return "দৌৰাৰ সময়, বতাহ, গৰম আৰু সূৰ্যৰ সময়।";
      case "travel":
        return "গন্তব্যৰ অৱস্থা আৰু গুৰুত্বপূৰ্ণ বতৰ সতৰ্কবাণী।";
      case "marine":
        return "সাগৰৰ অৱস্থা, জোৱাৰ, ঢৌ আৰু পানীৰ তথ্য।";
      case "family":
        return "বৰষুণ, বিদ্যালয়লৈ যাতায়াত আৰু গুৰুতৰ বতৰ আপডেট।";
      case "agriculture":
        return "বৰষুণ, মাটিৰ অৱস্থা আৰু ঋতুভিত্তিক পৰামৰ্শ।";
      case "commute":
        return "দৃশ্যমানতা, বৰষুণ, কুঁৱলী আৰু যাত্ৰাৰ অৱস্থা।";
      case "events":
        return "বিস্তৃত পূৰ্বানুমান, বৰষুণৰ সম্ভাৱনা আৰু আৰামদায়ক অৱস্থা।";
      case "daily":
      default:
        return "অৱস্থা, পূৰ্বানুমান আৰু গুৰুত্বপূৰ্ণ আপডেট।";
    }
  }

  switch (interest) {
    case "health":
      return "Air quality, UV, humidity and wellbeing conditions.";
    case "fitness":
      return "Running hours, wind, heat and sun times.";
    case "travel":
      return "Destination conditions and important weather alerts.";
    case "marine":
      return "Sea conditions, tides, waves and water information.";
    case "family":
      return "Rain, school commute and severe weather updates.";
    case "agriculture":
      return "Rainfall, soil conditions and seasonal guidance.";
    case "commute":
      return "Visibility, rain, fog and travel conditions.";
    case "events":
      return "Extended forecasts, rain probability and comfort.";
    case "daily":
    default:
      return "Conditions, forecasts and important updates.";
  }
}

function getPriorityDetails(
  interest: Interest,
  weather?: WeatherResponse,
  language: "English" | "हिन्दी" | "অসমীয়া" = "English"
): PriorityDetail {
  const current = weather?.current;

  const labels = {
    English: {
      health: "Health conditions",
      fitness: "Outdoor fitness",
      travel: "Travel conditions",
      marine: "Marine conditions",
      family: "Family conditions",
      agriculture: "Agriculture conditions",
      commute: "Commute conditions",
      events: "Event conditions",
      daily: "Everyday weather",

      aqi: "AQI",
      uv: "UV",
      humidity: "Humidity",
      wind: "Wind",
      sunrise: "Sunrise",
      visibility: "Visibility",
      rain: "Rain",
      pressure: "Pressure",
      forecast: "Forecast",
      temperature: "Temperature",
    },

    हिन्दी: {
      health: "स्वास्थ्य स्थितियां",
      fitness: "आउटडोर फिटनेस",
      travel: "यात्रा की स्थितियां",
      marine: "समुद्री स्थितियां",
      family: "परिवार की स्थितियां",
      agriculture: "कृषि की स्थितियां",
      commute: "आवागमन की स्थितियां",
      events: "कार्यक्रम की स्थितियां",
      daily: "दैनिक मौसम",

      aqi: "AQI",
      uv: "UV",
      humidity: "आर्द्रता",
      wind: "हवा",
      sunrise: "सूर्योदय",
      visibility: "दृश्यता",
      rain: "बारिश",
      pressure: "दबाव",
      forecast: "पूर्वानुमान",
      temperature: "तापमान",
    },

    "অসমীয়া": {
      health: "স্বাস্থ্যৰ অৱস্থা",
      fitness: "বাহিৰৰ ফিটনেছ",
      travel: "ভ্ৰমণৰ অৱস্থা",
      marine: "সাগৰৰ অৱস্থা",
      family: "পৰিয়ালৰ অৱস্থা",
      agriculture: "কৃষিৰ অৱস্থা",
      commute: "যাতায়াতৰ অৱস্থা",
      events: "অনুষ্ঠানৰ অৱস্থা",
      daily: "দৈনন্দিন বতৰ",

      aqi: "AQI",
      uv: "UV",
      humidity: "আৰ্দ্ৰতা",
      wind: "বতাহ",
      sunrise: "সূৰ্যোদয়",
      visibility: "দৃশ্যমানতা",
      rain: "বৰষুণ",
      pressure: "চাপ",
      forecast: "পূৰ্বানুমান",
      temperature: "উষ্ণতা",
    },
  }[language];

  switch (interest) {
    case "health":
      return {
        interest,
        title: labels.health,
        description: getInterestDescription(
          interest,
          language
        ),
        details: [
          `${labels.aqi} ${
            typeof weather?.airQuality?.usAqi === "number"
              ? weather.airQuality.usAqi
              : "--"
          }`,
          `${labels.uv} ${
            typeof current?.uv === "number"
              ? current.uv.toFixed(1)
              : "--"
          }`,
          `${labels.humidity} ${
            typeof current?.humidity === "number"
              ? `${current.humidity}%`
              : "--"
          }`,
        ],
      };

    case "fitness":
      return {
        interest,
        title: labels.fitness,
        description: getInterestDescription(
          interest,
          language
        ),
        details: [
          `${labels.wind} ${
            typeof current?.windKph === "number"
              ? `${current.windKph.toFixed(0)} km/h`
              : "--"
          }`,
          `${labels.uv} ${
            typeof current?.uv === "number"
              ? current.uv.toFixed(1)
              : "--"
          }`,
          weather?.daily?.[0]?.sunrise
            ? `${labels.sunrise} ${formatTime(
                weather.daily[0].sunrise
              )}`
            : `${labels.sunrise} --`,
        ],
      };

    case "travel":
      return {
        interest,
        title: labels.travel,
        description: getInterestDescription(
          interest,
          language
        ),
        details: [
          current?.condition ?? (
            language === "हिन्दी"
              ? "मौसम की स्थितियां"
              : language === "অসমীয়া"
              ? "বতৰৰ অৱস্থা"
              : "Weather conditions"
          ),
          `${labels.visibility} ${
            typeof current?.visibilityKm === "number"
              ? `${current.visibilityKm.toFixed(1)} km`
              : "--"
          }`,
          `${labels.rain} ${
            typeof current?.precipitationMm === "number"
              ? `${current.precipitationMm.toFixed(1)} mm`
              : "--"
          }`,
        ],
      };

    case "marine":
      return {
        interest,
        title: labels.marine,
        description: getInterestDescription(
          interest,
          language
        ),
        details: [
          `${labels.wind} ${
            typeof current?.windKph === "number"
              ? `${current.windKph.toFixed(0)} km/h`
              : "--"
          }`,
          current?.condition ?? (
            language === "हिन्दी"
              ? "वर्तमान स्थितियां"
              : language === "অসমীয়া"
              ? "বৰ্তমান অৱস্থা"
              : "Current conditions"
          ),
          `${labels.pressure} ${
            typeof current?.pressureHpa === "number"
              ? `${current.pressureHpa.toFixed(0)} hPa`
              : "--"
          }`,
        ],
      };

    case "family":
      return {
        interest,
        title: labels.family,
        description: getInterestDescription(
          interest,
          language
        ),
        details: [
          current?.condition ?? (
            language === "हिन्दी"
              ? "वर्तमान मौसम"
              : language === "অসমীয়া"
              ? "বৰ্তমান বতৰ"
              : "Current weather"
          ),
          `${labels.rain} ${
            typeof weather?.hourly?.[0]
              ?.precipitationProbability === "number"
              ? `${weather.hourly[0].precipitationProbability}%`
              : "--"
          }`,
          `${labels.visibility} ${
            typeof current?.visibilityKm === "number"
              ? `${current.visibilityKm.toFixed(1)} km`
              : "--"
          }`,
        ],
      };

    case "agriculture":
      return {
        interest,
        title: labels.agriculture,
        description: getInterestDescription(
          interest,
          language
        ),
        details: [
          `${labels.rain} ${
            typeof current?.rainMm === "number"
              ? `${current.rainMm.toFixed(1)} mm`
              : "--"
          }`,
          `${labels.humidity} ${
            typeof current?.humidity === "number"
              ? `${current.humidity}%`
              : "--"
          }`,
          `${labels.forecast} ${
            typeof weather?.daily?.[0]
              ?.precipitationProbability === "number"
              ? `${weather.daily[0].precipitationProbability}% ${
  language === "हिन्दी"
    ? "बारिश"
    : language === "অসমীয়া"
      ? "বৰষুণ"
      : "rain"
}`
              : "--"
          }`,
        ],
      };

    case "commute":
      return {
        interest,
        title: labels.commute,
        description: getInterestDescription(
          interest,
          language
        ),
        details: [
          current?.condition ?? (
            language === "हिन्दी"
              ? "वर्तमान मौसम"
              : language === "অসমীয়া"
              ? "বৰ্তমান বতৰ"
              : "Current weather"
          ),
          `${labels.visibility} ${
            typeof current?.visibilityKm === "number"
              ? `${current.visibilityKm.toFixed(1)} km`
              : "--"
          }`,
          `${labels.wind} ${
            typeof current?.windKph === "number"
              ? `${current.windKph.toFixed(0)} km/h`
              : "--"
          }`,
        ],
      };

    case "events":
      return {
        interest,
        title: labels.events,
        description: getInterestDescription(
          interest,
          language
        ),
        details: [
          current?.condition ?? (
            language === "हिन्दी"
              ? "वर्तमान मौसम"
              : language === "অসমীয়া"
              ? "বৰ্তমান বতৰ"
              : "Current weather"
          ),
          `${labels.rain} ${
            typeof weather?.daily?.[0]
              ?.precipitationProbability === "number"
              ? `${weather.daily[0].precipitationProbability}%`
              : "--"
          }`,
          `${labels.temperature} ${
            typeof current?.temperatureC === "number"
              ? `${current.temperatureC.toFixed(0)}°C`
              : "--"
          }`,
        ],
      };

    case "daily":
    default:
      return {
        interest: "daily",
        title: labels.daily,
        description: getInterestDescription(
          "daily",
          language
        ),
        details: [
          current?.condition ?? (
            language === "हिन्दी"
              ? "वर्तमान स्थितियां"
              : language === "অসমীয়া"
              ? "বৰ্তমান অৱস্থা"
              : "Current conditions"
          ),
          `${labels.temperature} ${
            typeof current?.temperatureC === "number"
              ? `${current.temperatureC.toFixed(0)}°C`
              : "--"
          }`,
          `${labels.humidity} ${
            typeof current?.humidity === "number"
              ? `${current.humidity}%`
              : "--"
          }`,
        ],
      };
  }
}

function getPersonalizedSectionOrder(
  interests: Interest[]
) {
  const priority: string[] = [];

  interests.forEach((interest) => {
    switch (interest) {
      case "health":
        priority.push("airQuality");
        break;

      case "fitness":
        priority.push("sun", "hourly");
        break;

      case "agriculture":
        priority.push("forecast", "hourly");
        break;

      case "family":
        priority.push("alerts", "forecast");
        break;

      case "commute":
        priority.push("currentWeather", "hourly");
        break;

      case "travel":
        priority.push("forecast", "alerts");
        break;

      case "events":
        priority.push("forecast", "hourly");
        break;

      case "marine":
        priority.push("weatherDetails");
        break;

      case "daily":
      default:
        priority.push("currentWeather", "forecast");
        break;
    }
  });

  return Array.from(
    new Set([
      ...priority,
      ...BASE_SECTION_ORDER,
    ])
  );
}

function getPersonalizedFocusText(
  interests: Interest[],
  language: "English" | "हिन्दी" | "অসমীয়া"
) {
  if (!interests.length) {
    if (language === "हिन्दी") {
      return "आपकी मौसम जानकारी दैनिक परिस्थितियों के अनुसार व्यवस्थित की गई है।";
    }

    if (language === "অসমীয়া") {
      return "আপোনাৰ বতৰৰ তথ্য দৈনন্দিন অৱস্থাৰ ভিত্তিত সজোৱা হৈছে।";
    }

    return "Your weather information is arranged around everyday conditions.";
  }

  const focusTexts: Record<
    Interest,
    Record<"English" | "हिन्दी" | "অসমীয়া", string>
  > = {
    daily: {
      English:
        "Everyday weather conditions and forecasts are prioritised for you.",
      हिन्दी:
        "दैनिक मौसम की स्थितियों और पूर्वानुमानों को आपके लिए प्राथमिकता दी गई है।",
      অসমীয়া:
        "দৈনন্দিন বতৰৰ অৱস্থা আৰু পূৰ্বানুমানক আপোনাৰ বাবে অগ্ৰাধিকাৰ দিয়া হৈছে।",
    },

    health: {
      English:
        "Air quality, UV and wellbeing information are prioritised for you.",
      हिन्दी:
        "वायु गुणवत्ता, UV और स्वास्थ्य संबंधी जानकारी को आपके लिए प्राथमिकता दी गई है।",
      অসমীয়া:
        "বায়ুৰ গুণমান, UV আৰু স্বাস্থ্যৰ তথ্যক আপোনাৰ বাবে অগ্ৰাধিকাৰ দিয়া হৈছে।",
    },

    fitness: {
      English:
        "Outdoor conditions, wind and sun timing are prioritised for you.",
      हिन्दी:
        "बाहरी मौसम, हवा और धूप के समय को आपके लिए प्राथमिकता दी गई है।",
      অসমীয়া:
        "বাহিৰৰ বতৰৰ অৱস্থা, বতাহ আৰু সূৰ্যৰ সময়ক আপোনাৰ বাবে অগ্ৰাধিকাৰ দিয়া হৈছে।",
    },

    travel: {
      English:
        "Forecasts, visibility and important weather information are prioritised for you.",
      हिन्दी:
        "पूर्वानुमान, दृश्यता और महत्वपूर्ण मौसम जानकारी को आपके लिए प्राथमिकता दी गई है।",
      অসমীয়া:
        "পূৰ্বানুমান, দৃশ্যমানতা আৰু গুৰুত্বপূৰ্ণ বতৰৰ তথ্যক আপোনাৰ বাবে অগ্ৰাধিকাৰ দিয়া হৈছে।",
    },

    marine: {
      English:
        "Wind and atmospheric conditions are prioritised for you.",
      हिन्दी:
        "हवा और वायुमंडलीय स्थितियों को आपके लिए प्राथमिकता दी गई है।",
      অসমীয়া:
        "বতাহ আৰু বায়ুমণ্ডলীয় অৱস্থাক আপোনাৰ বাবে অগ্ৰাধিকাৰ দিয়া হৈছে।",
    },

    family: {
      English:
        "Rain and important weather changes are prioritised for you.",
      हिन्दी:
        "बारिश और महत्वपूर्ण मौसम बदलावों को आपके लिए प्राथमिकता दी गई है।",
      অসমীয়া:
        "বৰষুণ আৰু গুৰুত্বপূৰ্ণ বতৰ পৰিৱৰ্তনক আপোনাৰ বাবে অগ্ৰাধিকাৰ দিয়া হৈছে।",
    },

    agriculture: {
      English:
        "Rainfall, humidity and forecast conditions are prioritised for you.",
      हिन्दी:
        "वर्षा, आर्द्रता और पूर्वानुमान स्थितियों को आपके लिए प्राथमिकता दी गई है।",
      অসমীয়া:
        "বৰষুণ, আৰ্দ্ৰতা আৰু পূৰ্বানুমানৰ অৱস্থাক আপোনাৰ বাবে অগ্ৰাধিকাৰ দিয়া হৈছে।",
    },

    commute: {
      English:
        "Current conditions, visibility and hourly changes are prioritised for you.",
      हिन्दी:
        "वर्तमान स्थिति, दृश्यता और प्रति घंटे के बदलावों को आपके लिए प्राथमिकता दी गई है।",
      অসমীয়া:
        "বৰ্তমান অৱস্থা, দৃশ্যমানতা আৰু ঘণ্টাভিত্তিক পৰিৱৰ্তনক আপোনাৰ বাবে অগ্ৰাধিকাৰ দিয়া হৈছে।",
    },

    events: {
      English:
        "Forecast conditions, rain probability and comfort are prioritised for you.",
      हिन्दी:
        "पूर्वानुमान, बारिश की संभावना और आरामदायक स्थितियों को आपके लिए प्राथमिकता दी गई है।",
      অসমীয়া:
        "পূৰ্বানুমান, বৰষুণৰ সম্ভাৱনা আৰু আৰামদায়ক অৱস্থাক আপোনাৰ বাবে অগ্ৰাধিকাৰ দিয়া হৈছে।",
    },
  };

  if (interests.length === 1) {
    return focusTexts[interests[0]][language];
  }

  const selectedNames = interests
    .map((interest) => getInterestTitle(interest, language))
    .join(", ");

  if (language === "हिन्दी") {
    return `आपका होम ${selectedNames} के लिए व्यक्तिगत किया गया है, जिसमें सबसे प्रासंगिक मौसम जानकारी पहले दिखाई जाती है।`;
  }

  if (language === "অসমীয়া") {
    return `আপোনাৰ হোম ${selectedNames}-ৰ বাবে ব্যক্তিগতকৃত কৰা হৈছে, য'ত আটাইতকৈ প্ৰাসংগিক বতৰৰ তথ্য প্ৰথমে দেখুওৱা হয়।`;
  }

  return `Your home is personalised for ${selectedNames}, with the most relevant weather information shown first.`;
}
async function reverseGeocodeLocation(
  latitude: number,
  longitude: number
): Promise<LocationInfo> {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

    const address = addresses?.[0];

    return {
      latitude,
      longitude,
      locality: address?.district ?? "",
      city: address?.city ?? "",
      district: "",
      region: address?.region ?? "",
      country: address?.country ?? "",
    };
  } catch {
    return {
      latitude,
      longitude,
      locality: "",
      city: "",
      district: "",
      region: "",
      country: "",
    };
  }
}

async function getDeviceLocation(): Promise<LocationInfo> {
  const servicesEnabled =
    await Location.hasServicesEnabledAsync();

  if (!servicesEnabled) {
    throw new Error(
      "Location services are disabled."
    );
  }

  const permission =
    await Location.requestForegroundPermissionsAsync();

  if (permission.status !== "granted") {
    throw new Error(
      "Location permission was not granted."
    );
  }

  const position =
    await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
      mayShowUserSettingsDialog: true,
    });

  const {
    latitude,
    longitude,
    accuracy,
  } = position.coords;

  const location = await reverseGeocodeLocation(
    latitude,
    longitude
  );

  return {
    ...location,
    accuracyMeters:
      typeof accuracy === "number"
        ? accuracy
        : undefined,
    timestamp: position.timestamp,
    updatedAt: new Date().toISOString(),
  };
}

async function fetchWeather(
  latitude: number,
  longitude: number
): Promise<WeatherResponse> {
  const url =
    `${API_BASE_URL}/api/weather` +
    `?lat=${encodeURIComponent(latitude)}` +
    `&lon=${encodeURIComponent(longitude)}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Weather request failed with status ${response.status}.`
    );
  }

  const data = await response.json();

  if (!data || typeof data !== "object") {
    throw new Error(
      "Invalid weather response."
    );
  }

  return data as WeatherResponse;
}

function normalizeDailyWeather(
  item: any
): DailyWeather {
  return {
    date:
      item?.date ??
      item?.time ??
      "",
    condition:
      item?.condition ??
      item?.description ??
      "Weather forecast",
    weatherCode:
      typeof item?.weatherCode === "number"
        ? item.weatherCode
        : typeof item?.weather_code === "number"
        ? item.weather_code
        : undefined,
    highC:
      typeof item?.highC === "number"
        ? item.highC
        : typeof item?.temperatureMaxC === "number"
        ? item.temperatureMaxC
        : typeof item?.temperature_2m_max === "number"
        ? item.temperature_2m_max
        : undefined,
    lowC:
      typeof item?.lowC === "number"
        ? item.lowC
        : typeof item?.temperatureMinC === "number"
        ? item.temperatureMinC
        : typeof item?.temperature_2m_min === "number"
        ? item.temperature_2m_min
        : undefined,
    precipitationMm:
      typeof item?.precipitationMm === "number"
        ? item.precipitationMm
        : typeof item?.precipitation_sum === "number"
        ? item.precipitation_sum
        : undefined,
    precipitationProbability:
      typeof item?.precipitationProbability ===
      "number"
        ? item.precipitationProbability
        : typeof item?.precipitation_probability_max ===
          "number"
        ? item.precipitation_probability_max
        : undefined,
    sunrise: item?.sunrise,
    sunset: item?.sunset,
    uvMax:
      typeof item?.uvMax === "number"
        ? item.uvMax
        : typeof item?.uv_index_max === "number"
        ? item.uv_index_max
        : undefined,
    windMaxKph:
      typeof item?.windMaxKph === "number"
        ? item.windMaxKph
        : typeof item?.wind_speed_10m_max === "number"
        ? item.wind_speed_10m_max
        : undefined,
  };
}

function ForecastRow({
  item,
  index,
  language,
}: {
  item: DailyWeather;
  index: number;
  language: "English" | "हिन्दी" | "অসমীয়া";
}) {
  const high =
    typeof item.highC === "number"
      ? item.highC
      : null;

  const low =
    typeof item.lowC === "number"
      ? item.lowC
      : null;

  const rainProbability =
    typeof item.precipitationProbability === "number"
      ? item.precipitationProbability
      : null;

  const todayLabel =
    language === "हिन्दी"
      ? "आज"
      : language === "অসমীয়া"
        ? "আজি"
        : "TODAY";

  const forecastLabel =
    language === "हिन्दी"
      ? "मौसम पूर्वानुमान"
      : language === "অসমীয়া"
        ? "বতৰৰ পূৰ্বানুমান"
        : "Weather forecast";

  return (
    <View style={styles.forecastRow}>
      <View style={styles.forecastDay}>
        <Text style={styles.forecastDayTitle}>
          {index === 0
            ? todayLabel
            : formatDay(item.date)}
        </Text>

        <Text style={styles.forecastCondition}>
          {item.condition ?? forecastLabel}
        </Text>
      </View>

      <Text style={styles.forecastSymbol}>
        {getWeatherSymbol(item.weatherCode)}
      </Text>

      <View style={styles.forecastTemps}>
        <Text style={styles.forecastHigh}>
          {high !== null
            ? `${high.toFixed(0)}°`
            : "--"}
        </Text>

        <Text style={styles.forecastLow}>
          {low !== null
            ? `${low.toFixed(0)}°`
            : "--"}
        </Text>
      </View>

      <Text style={styles.forecastRain}>
        {rainProbability !== null
          ? `${rainProbability}%`
          : "--"}
      </Text>
    </View>
  );
}

function SectionLabel({
  text,
}: {
  text: string;
}) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={styles.sectionLabelLine} />

      <Text style={styles.sectionLabel}>
        {text}
      </Text>

      <View style={styles.sectionLabelRule} />
    </View>
  );
}

function DetailCard({
  label,
  value,
  large = false,
}: {
  label: string;
  value: string;
  large?: boolean;
}) {
  return (
    <View style={styles.detailCard}>
      <Text style={styles.detailLabel}>
        {label}
      </Text>

      <Text
        style={[
          styles.detailValue,
          large && styles.detailValueLarge,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}
function calculateDewPoint(
  temperatureC?: number,
  humidity?: number
) {
  if (
    typeof temperatureC !== "number" ||
    typeof humidity !== "number" ||
    humidity <= 0
  ) {
    return null;
  }

  const a = 17.27;
  const b = 237.7;

  const gamma =
    (a * temperatureC) /
      (b + temperatureC) +
    Math.log(humidity / 100);

  return (
    (b * gamma) /
    (a - gamma)
  );
}
function getActiveWeatherAlerts(
  weather: WeatherResponse | null,
  preferences: AlertPreferences | null,
  language: "English" | "हिन्दी" | "অসমীয়া" = "English"
): ActiveWeatherAlert[] {
  if (!weather || !preferences) {
    return [];
  }

  const alerts: ActiveWeatherAlert[] = [];

  const current = weather.current;
  const today = weather.daily?.[0];

  if (!current) {
    return alerts;
  }

  // STORM
  const conditionText =
    current.condition?.toLowerCase() ?? "";

  const stormDetected =
    conditionText.includes("thunder") ||
    current.weatherCode === 95 ||
    current.weatherCode === 96 ||
    current.weatherCode === 99;

  if (preferences.storm && stormDetected) {
    alerts.push({
      type: "storm",
      title: "Thunderstorm conditions",
      description:
        "Thunderstorm activity is detected in your current weather conditions.",
      value:
        current.condition ?? "Thunderstorm",
      severity: "warning",
    });
  }

  // HEAVY RAIN
  const currentRain =
    typeof current.precipitationMm === "number"
      ? current.precipitationMm
      : 0;

  const todayRain =
    typeof today?.precipitationMm === "number"
      ? today.precipitationMm
      : 0;

  const todayRainProbability =
    typeof today?.precipitationProbability === "number"
      ? today.precipitationProbability
      : 0;

  const heavyRainDetected =
    currentRain >= 10 ||
    todayRain >= 20 ||
    (todayRainProbability >= 70 && currentRain > 0);

  if (preferences.heavyRain && heavyRainDetected) {
    alerts.push({
      type: "heavyRain",
      title: "Heavy rain possible",
      description:
        "Rain conditions may affect outdoor activities and local travel.",
      value:
        todayRainProbability > 0
          ? `${todayRainProbability}% rain probability`
          : `${todayRain.toFixed(1)} mm expected`,
      severity: "warning",
    });
  }

  // EXTREME HEAT
  const temperature =
    typeof current.temperatureC === "number"
      ? current.temperatureC
      : null;

  const feelsLike =
    typeof current.feelsLikeC === "number"
      ? current.feelsLikeC
      : null;

  const extremeHeatDetected =
  (feelsLike !== null && feelsLike >= 40) ||
  (temperature !== null && temperature >= 36);

  if (preferences.extremeHeat && extremeHeatDetected) {
    const heatValue =
      feelsLike !== null
        ? `Feels like ${feelsLike.toFixed(1)}°C`
        : `${temperature?.toFixed(1)}°C`;

    alerts.push({
      type: "extremeHeat",
      title: "Extreme heat conditions",
      description:
        "High temperatures may increase heat-related risk. Limit prolonged outdoor exposure.",
      value: heatValue,
      severity: "warning",
    });
  }

  // POOR AIR QUALITY
  const aqi =
    typeof weather.airQuality?.usAqi === "number"
      ? weather.airQuality.usAqi
      : null;

  if (preferences.poorAirQuality && aqi !== null && aqi > 100) {
    alerts.push({
      type: "poorAirQuality",
      title: "Poor air quality",
      description:
        "Air quality may affect sensitive individuals and outdoor activities.",
      value: `US AQI ${Math.round(aqi)}`,
      severity: aqi > 150 ? "warning" : "notice",
    });
  }

  // SEVERE WEATHER
  if (
    preferences.severeWeather &&
    alerts.some(
      (alert) => alert.severity === "warning"
    )
  ) {
    const severeAlert = alerts.find(
      (alert) => alert.severity === "warning"
    );

    if (severeAlert) {
      alerts.unshift({
        type: "severeWeather",
        title: "Severe weather alert",
        description:
          `Significant weather conditions detected: ${severeAlert.title.toLowerCase()}.`,
        value: severeAlert.value,
        severity: "warning",
      });
    }
  }

  return alerts;
}
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { language, t } = useLanguage();
  const [alertPreferences, setAlertPreferences] =
  useState<AlertPreferences | null>(null);
  const [weather, setWeather] =
    useState<WeatherResponse | null>(
      homeWeatherCache
    );

  const [location, setLocation] =
    useState<LocationInfo | null>(
      homeLocationCache
    );

  const [interests, setInterests] =
    useState<Interest[]>(
      homeInterestsCache ?? ["daily"]
    );

  const [loading, setLoading] =
    useState(
      !homeWeatherCache
    );

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [locationLoading, setLocationLoading] =
    useState(false);

  const greeting = useMemo(
  () => getGreeting(language),
  [language]
);

  const loadStoredInterests =
    useCallback(async () => {
      try {
        const raw =
          await AsyncStorage.getItem(
            INTERESTS_STORAGE_KEY
          );

        if (!raw) {
          return ["daily"] as Interest[];
        }

        const parsed =
          JSON.parse(raw) as PreferencesData;

        if (
          Array.isArray(parsed?.interests) &&
          parsed.interests.length > 0
        ) {
          return parsed.interests;
        }
      } catch {
        // Keep default interest.
      }

      return ["daily"] as Interest[];
    }, []);

  const loadStoredLocation =
    useCallback(async () => {
      try {
        const raw =
          await AsyncStorage.getItem(
            LOCATION_STORAGE_KEY
          );

        if (!raw) {
          return null;
        }

        return JSON.parse(
          raw
        ) as LocationInfo;
      } catch {
        return null;
      }
    }, []);

  const saveLocation =
    useCallback(
      async (value: LocationInfo) => {
        homeLocationCache = value;
        setLocation(value);

        try {
          await AsyncStorage.setItem(
            LOCATION_STORAGE_KEY,
            JSON.stringify(value)
          );
        } catch {
          // Ignore storage failure.
        }
      },
      []
    );

  const loadWeather =
    useCallback(
      async (
        forceLocation = false
      ) => {
        try {
          setError(null);

          let currentLocation =
  homeLocationCache;

          if (
            !currentLocation ||
            forceLocation
          ) {
            setLocationLoading(true);

            const stored =
              await loadStoredLocation();

            if (
              stored &&
              !forceLocation
            ) {
              currentLocation = stored;
              homeLocationCache = stored;
              setLocation(stored);
            } else {
              currentLocation =
                await getDeviceLocation();

              await saveLocation(
                currentLocation
              );
            }

            setLocationLoading(false);
          }

          if (!currentLocation) {
            throw new Error(
              "Unable to determine your location."
            );
          }

          const weatherData =
            await fetchWeather(
              currentLocation.latitude,
              currentLocation.longitude
            );

          homeWeatherCache =
            weatherData;

          setWeather(weatherData);
        } catch (err: any) {
          console.error(
            "Mausam weather error:",
            err
          );

          if (!homeWeatherCache) {
            setError(
              err?.message ??
                "Unable to load weather data."
            );
          }
        } finally {
          setLoading(false);
          setLocationLoading(false);
        }
      },
      [
        
        loadStoredLocation,
        saveLocation,
      ]
    );
  const loadAlertPreferences =
  useCallback(async () => {
    try {
      const userId =
        await AsyncStorage.getItem(
          USER_ID_KEY
        );

      if (!userId) {
        console.warn(
          "MAUSAM: User ID not found while loading alert preferences."
        );
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/user/alerts?userId=${encodeURIComponent(
          userId
        )}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data?.error ||
            `Alert preferences request failed with status ${response.status}`
        );
      }

      const alerts = data.alerts;

      setAlertPreferences({
        severeWeather:
          Boolean(alerts.severe_weather),
        heavyRain:
          Boolean(alerts.heavy_rain),
        storm:
          Boolean(alerts.storm),
        extremeHeat:
          Boolean(alerts.extreme_heat),
        poorAirQuality:
          Boolean(alerts.poor_air_quality),
      });

      console.log(
        "MAUSAM ALERT PREFERENCES LOADED:",
        alerts
      );
    } catch (error) {
      console.error(
        "MAUSAM ALERT PREFERENCES LOAD FAILED:",
        error
      );
    }
  }, []);
  useEffect(() => {
    let active = true;

    const initialise =
      async () => {
        try {
          const [
            storedInterests,
            storedLocation,
          ] = await Promise.all([
            loadStoredInterests(),
            loadStoredLocation(),
          ]);

          if (!active) return;

          homeInterestsCache =
            storedInterests;

          setInterests(
            storedInterests
          );

          if (storedLocation) {
            homeLocationCache =
              storedLocation;

            setLocation(
              storedLocation
            );
          }

          await Promise.all([
  loadWeather(false),
  loadAlertPreferences(),
]);
        } catch {
          if (active) {
            await loadWeather(false);
          }
        }
      };

    initialise();

    return () => {
      active = false;
    };
  }, [
    loadStoredInterests,
    loadStoredLocation,
    loadWeather,
    loadAlertPreferences,
  ]);
  
  useEffect(() => {
  const refreshOnReturn = () => {
    loadWeather(false);
    loadAlertPreferences();
  };

  const interval = setInterval(
    refreshOnReturn,
    10 * 60 * 1000
  );

  return () => {
    clearInterval(interval);
  };
}, [
  loadWeather,
  loadAlertPreferences,
]);

  const handleRefresh =
    useCallback(async () => {
      setRefreshing(true);

      try {
        await loadWeather(false);
      } finally {
        setRefreshing(false);
      }
    }, [loadWeather]);

  const handleRefreshLocation =
    useCallback(async () => {
      setLocationLoading(true);

      try {
        await loadWeather(true);
      } finally {
        setLocationLoading(false);
      }
    }, [loadWeather]);

  const sectionOrder =
  useMemo(
    () =>
      getPersonalizedSectionOrder(
        interests
      ),
    [interests]
  );

const activeWeatherAlerts =
  getActiveWeatherAlerts(
    weather,
    alertPreferences,
    language
  );

  const priorityDetails =
    useMemo(
      () =>
        interests
          .slice(0, 3)
          .map((interest) =>
            getPriorityDetails(
  interest,
  weather ?? undefined,
  language
)
          ),
      [interests, weather,language]
    );

  const current =
    weather?.current;

  const daily =
    (weather?.daily ?? []).map(
      normalizeDailyWeather
    );

  const hourly =
    weather?.hourly ?? [];

  const today =
    daily[0];

  const aqi =
    weather?.airQuality?.usAqi;

  const renderSection =
    (section: string) => {
      switch (section) {
        case "currentWeather":
          return (
            <View key={section}>
              <SectionLabel text={t.home.currentWeather} />

              <View style={styles.card}>
                <View style={styles.currentTop}>
                  <View style={styles.currentConditionBlock}>
                    <Text style={styles.currentEyebrow}>
                      {t.home.rightNow}
                    </Text>

                    <Text style={styles.currentTemperature}>
                      {typeof current?.temperatureC ===
                      "number"
                        ? `${current.temperatureC.toFixed(
                            0
                          )}°`
                        : "--"}
                    </Text>

                    <Text style={styles.currentCondition}>
                      {current?.condition ??
                        "Weather data unavailable"}
                    </Text>
                  </View>

                  <View style={styles.weatherSymbolLarge}>
                    <Text style={styles.weatherSymbolText}>
                      {getWeatherSymbol(
                        current?.weatherCode
                      )}
                    </Text>
                  </View>
                </View>

                <View style={styles.currentDivider} />

                <View style={styles.currentMetrics}>
                  <MetricItem
                    label={t.home.feelsLike}
                    value={
                      typeof current?.feelsLikeC ===
                      "number"
                        ? `${current.feelsLikeC.toFixed(
                            0
                          )}°C`
                        : "--"
                    }
                  />

                  <MetricItem
                    label={t.home.humidity}
                    value={
                      typeof current?.humidity ===
                      "number"
                        ? `${current.humidity}%`
                        : "--"
                    }
                  />

                  <MetricItem
                    label={t.home.wind}
                    value={
                      typeof current?.windKph ===
                      "number"
                        ? `${current.windKph.toFixed(
                            0
                          )} km/h`
                        : "--"
                    }
                  />
                </View>
              </View>
            </View>
          );

        case "alerts":
  return (
    <View key={section}>
      <SectionLabel text={t.home.weatherAlerts} />

      <View style={styles.card}>
        {alertPreferences === null ? (
          <View style={styles.alertEmptyState}>
            <ActivityIndicator
              size="small"
              color="#6CC9B1"
            />

            <Text style={styles.alertEmptyTitle}>
  {t.home.checkingAlertSettings}
</Text>

<Text style={styles.alertEmptyDescription}>
  {t.home.reviewingAlertPreferences}
</Text>
          </View>
        ) : activeWeatherAlerts.length === 0 ? (
          <View style={styles.alertEmptyState}>
            <View style={styles.alertStatusIndicator}>
              <View style={styles.alertStatusDot} />
            </View>

            <View style={styles.alertContent}>
              <Text style={styles.cardEyebrow}>
  {t.home.monitoringActive}
</Text>

<Text style={styles.cardTitle}>
  {t.home.noActiveAlerts}
</Text>

<Text style={styles.cardDescription}>
  {t.home.noAlertConditions}
</Text>

<View style={styles.alertData}>
  <Text style={styles.alertDataLabel}>
    {t.home.currentConditions}
  </Text>

                <Text style={styles.alertDataValue}>
                  {current?.condition ?? "--"}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View>
            {activeWeatherAlerts.map(
              (alert, index) => (
                <View
                  key={`${alert.type}-${index}`}
                  style={[
                    styles.activeAlertItem,
                    index > 0 &&
                      styles.activeAlertItemSpacing,
                  ]}
                >
                  <View
                    style={[
                      styles.alertStatusIndicator,
                      alert.severity === "warning" &&
                        styles.alertWarningIndicator,
                    ]}
                  >
                    <View
                      style={[
                        styles.alertStatusDot,
                        alert.severity === "warning" &&
                          styles.alertWarningDot,
                      ]}
                    />
                  </View>

                  <View style={styles.alertContent}>
                    <Text style={styles.cardEyebrow}>
                      {alert.severity === "warning"
  ? t.home.weatherWarning
  : t.home.weatherNotice}
                    </Text>

                    <Text style={styles.cardTitle}>
                      {alert.title}
                    </Text>

                    <Text style={styles.cardDescription}>
                      {alert.description}
                    </Text>

                    <View style={styles.alertData}>
                      <Text style={styles.alertDataLabel}>
  {t.home.indicator}
</Text>

                      <Text style={styles.alertDataValue}>
                        {alert.value}
                      </Text>
                    </View>
                  </View>
                </View>
              )
            )}
          </View>
        )}
      </View>
    </View>
  );

        case "today":
          return (
            <View key={section}>
              <SectionLabel text={t.home.today} />

              <View style={styles.card}>
                <View style={styles.detailGrid}>
                  <DetailCard
                    label={t.home.high}
                    value={`${
                      typeof today?.highC ===
                      "number"
                        ? today.highC.toFixed(0)
                        : "--"
                    }°C`}
                    large
                  />

                  <DetailCard
                    label={t.home.low}
                    value={`${
                      typeof today?.lowC ===
                      "number"
                        ? today.lowC.toFixed(0)
                        : "--"
                    }°C`}
                    large
                  />

                  <DetailCard
                    label={t.home.rain}
                    value={`${
                      typeof today?.precipitationProbability ===
                      "number"
                        ? today.precipitationProbability
                        : "--"
                    }%`}
                  />

                  <DetailCard
  label={t.home.uv}
  value={(() => {
    const uv =
      typeof today?.uvMax === "number"
        ? today.uvMax
        : typeof current?.uv === "number"
        ? current.uv
        : null;

    return typeof uv === "number"
      ? uv.toFixed(1)
      : "--";
  })()}
/>
                </View>
              </View>
            </View>
          );

        case "hourly":
          return (
            <View key={section}>
              <SectionLabel text={t.home.hourlyForecast} />

              <View style={styles.card}>
                {hourly.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {t.home.hourlyForecast} unavailable.
                  </Text>
                ) : (
                  hourly
                    .slice(0, 8)
                    .map(
                      (
                        item,
                        index
                      ) => (
                        <View
                          key={`${item.time}-${index}`}
                          style={[
                            styles.hourRow,
                            index ===
                              Math.min(
                                hourly.length,
                                8
                              ) -
                                1 &&
                              styles.hourRowLast,
                          ]}
                        >
                          <Text style={styles.hourTime}>
                            {index === 0 ? t.home.now : formatHour(item.time)}
                          </Text>

                          <Text style={styles.hourSymbol}>
                            {getWeatherSymbol(
                              item.weatherCode
                            )}
                          </Text>

                          <Text style={styles.hourTemperature}>
                            {typeof item.temperatureC ===
                            "number"
                              ? `${item.temperatureC.toFixed(
                                  0
                                )}°`
                              : "--"}
                          </Text>

                          <Text style={styles.hourRain}>
                            {typeof item.precipitationProbability ===
                            "number"
                              ? `${item.precipitationProbability}%`
                              : "--"}
                          </Text>
                        </View>
                      )
                    )
                )}
              </View>
            </View>
          );

        case "forecast":
          return (
            <View key={section}>
              <SectionLabel text={t.home.fiveDayForecast} />

              <View style={styles.card}>
                {daily.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {t.home.fiveDayForecast} unavailable.
                  </Text>
                ) : (
                  daily
                    .slice(0, 5)
                    .map(
                      (
                        item,
                        index
                      ) => (
                        <ForecastRow
  key={`${item.date}-${index}`}
  item={item}
  index={index}
  language={language}
/>
                      )
                    )
                )}
              </View>
            </View>
          );

        case "sun":
          return (
            <View key={section}>
              <SectionLabel text={t.home.sunriseSunset} />

              <View style={styles.card}>
                <View style={styles.sunRow}>
                  <View style={styles.sunItem}>
                    <View style={styles.sunCircle}>
                      <View style={styles.sunCore} />
                    </View>

                    <Text style={styles.sunLabel}>
                      {t.home.sunrise}
                    </Text>

                    <Text style={styles.sunValue}>
                      {formatTime(
                        today?.sunrise
                      )}
                    </Text>
                  </View>

                  <View style={styles.sunDivider} />

                  <View style={styles.sunItem}>
                    <View style={styles.sunCircle}>
                      <View style={styles.sunCore} />
                    </View>

                    <Text style={styles.sunLabel}>
                      {t.home.sunset}
                    </Text>

                    <Text style={styles.sunValue}>
                      {formatTime(
                        today?.sunset
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );

        case "airQuality":
          return (
            <View key={section}>
              <SectionLabel text={t.home.airQuality} />

              <View style={styles.card}>
                <View style={styles.aqiTop}>
                  <View>
                    <Text style={styles.cardEyebrow}>
                      {t.home.airQualityIndex}
                    </Text>

                    <Text style={styles.aqiValue}>
                      {typeof aqi ===
                      "number"
                        ? aqi
                        : "--"}
                    </Text>

                    <Text style={styles.aqiLabel}>
                      {getAqiLabel(aqi,language)}
                    </Text>
                  </View>

                  <View style={styles.aqiBadge}>
                    <Text style={styles.aqiBadgeText}>
                      AQI
                    </Text>
                  </View>
                </View>

                <View style={styles.aqiTrack}>
                  <View
                    style={[
                      styles.aqiFill,
                      {
                        width: `${Math.max(
                          getAqiProgress(
                            aqi
                          ) * 100,
                          aqi != null
                            ? 3
                            : 0
                        )}%`,
                      },
                    ]}
                  />
                </View>

                <View style={styles.aqiMetrics}>
                  <MetricItem
                    label={t.home.pm25}
                    value={
                      typeof weather
                        ?.airQuality
                        ?.pm25 ===
                      "number"
                        ? `${weather.airQuality.pm25.toFixed(
                            1
                          )}`
                        : "--"
                    }
                  />

                  <MetricItem
                    label={t.home.pm10}
                    value={
                      typeof weather
                        ?.airQuality
                        ?.pm10 ===
                      "number"
                        ? `${weather.airQuality.pm10.toFixed(
                            1
                          )}`
                        : "--"
                    }
                  />

                  <MetricItem
                    label={t.home.ozone}
                    value={
                      typeof weather
                        ?.airQuality
                        ?.ozone ===
                      "number"
                        ? `${weather.airQuality.ozone.toFixed(
                            1
                          )}`
                        : "--"
                    }
                  />
                </View>
              </View>
            </View>
          );

        case "weatherDetails":
          return (
            <View key={section}>
              <SectionLabel text={t.home.weatherDetails} />

              <View style={styles.card}>
                <View style={styles.detailGrid}>
                  <DetailCard
                    label={t.home.pressure}
                    value={
                      typeof current?.pressureHpa ===
                      "number"
                        ? `${current.pressureHpa.toFixed(
                            0
                          )} hPa`
                        : "--"
                    }
                  />

                  <DetailCard
                    label={t.home.visibility}
                    value={
                      typeof current?.visibilityKm ===
                      "number"
                        ? `${current.visibilityKm.toFixed(
                            1
                          )} km`
                        : "--"
                    }
                  />

                  <DetailCard
                    label={t.home.windDirection}
                    value={getWindDirection(
                      current?.windDirection
                    )}
                  />

                  <DetailCard
                    label={t.home.cloudCover}
                    value={
                      typeof current?.cloudCover ===
                      "number"
                        ? `${current.cloudCover}%`
                        : "--"
                    }
                  />

                  <DetailCard
  label={t.home.dewPoint}
  value={(() => {
    const dewPoint =
      typeof current?.dewPointC === "number"
        ? current.dewPointC
        : calculateDewPoint(
            current?.temperatureC,
            current?.humidity
          );

    return typeof dewPoint === "number"
      ? `${dewPoint.toFixed(0)}°C`
      : "--";
  })()}
/>

                  <DetailCard
                    label={t.home.uvIndex}
                    value={
                      typeof current?.uv ===
                      "number"
                        ? current.uv.toFixed(1)
                        : "--"
                    }
                  />
                </View>
              </View>
            </View>
          );

        default:
          return null;
      }
    };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#071D2B"
        translucent={false}
      />

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6CC9B1"
              colors={["#6CC9B1"]}
              progressBackgroundColor="#0D2D3D"
            />
          }
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom:
                125 + insets.bottom,
            },
          ]}
        >
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.brandRow}>
  <View style={styles.brandMark}>
    <View style={styles.brandArc} />
    <View style={styles.brandSun} />
    <View style={styles.brandHorizon} />
    <View style={styles.brandDot} />
  </View>

  <Text style={styles.brand}>MAUSAM</Text>
</View>

<View style={styles.titleRow}>
                <View
                  style={styles.titleAccent}
                />

                <View
                  style={styles.titleContent}
                >
                  <Text style={styles.pageKicker}>
  {t.home.badge}
</Text>

<Text style={styles.pageTitle}>
  {t.home.title}
</Text>

                 <Text style={styles.pageSubtitle}>
  {greeting.title}
</Text>



<Text style={styles.pageSubtitle}>
  {greeting.description}
</Text>
                </View>
              </View>
            </View>

            <View
              style={styles.headerStatus}
            >
              <View
                style={styles.statusDot}
              />

              <Text
                style={styles.statusText}
              >
                ACTIVE
              </Text>
            </View>
          </View>

          {/* LOCATION */}
          <SectionLabel text={t.home.currentLocation} />

          <View style={styles.locationCard}>
            <View style={styles.locationMain}>
              <View style={styles.locationIconBox}>
                <View
                  style={
                    styles.locationPinOuter
                  }
                >
                  <View
                    style={
                      styles.locationPinInner
                    }
                  />
                </View>
              </View>

              <View
                style={styles.locationText}
              >
                <Text
                  style={
                    styles.locationEyebrow
                  }
                >
                  {t.home.deviceLocation}
                </Text>

                <Text style={styles.locationCity}>
  {location?.locality ||
    location?.city ||
    t.home.currentLocation}
</Text>

<Text style={styles.locationRegion}>
  {[
    location?.city,
    location?.district,
    location?.region,
    location?.country,
  ]
    .filter(Boolean)
    .filter(
      (value, index, array) =>
        array.indexOf(value) === index
    )
    .join(" • ") || t.home.usingLiveLocation}
</Text>
              </View>

              <View
                style={styles.liveBadge}
              >
                <View
                  style={styles.liveBadgeDot}
                />

                <Text
  style={styles.liveBadgeText}
>
  {t.home.live}
</Text>
              </View>
            </View>

            <View
              style={styles.locationBottom}
            >
              <Text
                style={
                  styles.locationAccuracy
                }
              >
                {typeof location?.accuracyMeters === "number"
  ? `${t.home.gpsAccuracy} ±${Math.round(
      location.accuracyMeters
    )} m`
  : t.home.gpsAccuracy}
              </Text>

              <TouchableOpacity
                activeOpacity={0.75}
                onPress={
                  handleRefreshLocation
                }
              >
                <Text
                  style={
                    styles.locationRefresh
                  }
                >
                  {locationLoading ? t.home.updating : t.home.refresh}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* LOADING */}
          {loading && !weather ? (
            <View
              style={styles.loadingCard}
            >
              <ActivityIndicator
                size="small"
                color="#6CC9B1"
              />

              <Text
                style={styles.loadingText}
              >
                {t.home.loadingWeather}
              </Text>
            </View>
          ) : null}

          {/* ERROR */}
          {error && !weather ? (
            <View
              style={styles.errorCard}
            >
              <Text
                style={styles.errorEyebrow}
              >
                {t.home.weatherData}
              </Text>

              <Text
                style={styles.errorTitle}
              >
                {t.home.unableToLoadWeather}
              </Text>

              <Text
                style={styles.errorText}
              >
                {error}
              </Text>

              <TouchableOpacity
                style={styles.retryButton}
                activeOpacity={0.75}
                onPress={() =>
                  loadWeather(false)
                }
              >
                <Text
                  style={
                    styles.retryButtonText
                  }
                >
                  {t.home.tryAgain}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* PERSONALISATION */}
          <SectionLabel text={t.home.personalisation} />

<View style={styles.card}>
  <View style={styles.cardHeader}>
    <View style={styles.sectionIndicator} />

    <View style={styles.cardHeaderText}>
      <Text style={styles.cardEyebrow}>
        {t.home.prioritisedForYou}
      </Text>

      <Text style={styles.cardTitle}>
        {t.home.weatherExperience}
      </Text>

      <Text style={styles.cardDescription}>
        {getPersonalizedFocusText(interests, language)}
      </Text>
    </View>

    <View style={styles.interestCount}>
      <Text style={styles.interestCountNumber}>
        {interests.length}
      </Text>

      <Text style={styles.interestCountLabel}>
        {t.home.focus}
      </Text>
    </View>
  </View>

  <View style={styles.priorityList}>
    {priorityDetails.map(
      (priority, index) => (
        <View
          key={priority.interest}
          style={[
            styles.priorityRow,
            index === priorityDetails.length - 1 &&
              styles.priorityRowLast,
          ]}
        >
          <View style={styles.priorityNumber}>
            <Text style={styles.priorityNumberText}>
              0{index + 1}
            </Text>
          </View>

          <View style={styles.priorityContent}>
            <Text style={styles.priorityTitle}>
              {priority.title}
            </Text>

            <Text style={styles.priorityDescription}>
              {priority.description}
            </Text>
          </View>
        </View>
      )
    )}
  </View>

  <TouchableOpacity
    style={styles.manageRow}
    activeOpacity={0.75}
    onPress={() => router.push("/onboarding")}
  >
    <Text style={styles.manageText}>
      {t.home.managePreferences}
    </Text>

    <Text style={styles.chevron}>
      ›
    </Text>
  </TouchableOpacity>
</View>

          {/* PERSONALIZED WEATHER SECTIONS */}
          {sectionOrder.map(
            renderSection
          )}

          {/* DATA SOURCE */}
          <SectionLabel text={t.home.dataSource} />

          <View style={styles.infoCard}>
            <View style={styles.infoTop}>
              <View style={styles.infoLogo}>
                <View
                  style={styles.infoSun}
                />

                <View
                  style={styles.infoHorizon}
                />
              </View>

              <View
                style={styles.infoContent}
              >
                <Text
                  style={styles.infoBrand}
                >
                  MAUSAM
                </Text>

                <Text
                  style={
                    styles.infoDescription
                  }
                >
                  {t.home.liveMeteorologicalData}
                </Text>
              </View>
            </View>

            <View
              style={styles.infoDivider}
            />

            <View
              style={styles.sourceRow}
            >
              <View>
                <Text
                  style={
                    styles.infoTeam
                  }
                >
                  {t.home.liveMeteorologicalDataLabel}
                </Text>

                <Text
                  style={
                    styles.sourceName
                  }
                >
                  {weather?.source ??
  "WeatherAPI"}
                </Text>
              </View>

              <Text
                style={styles.infoMeta}
              >
                {formatUpdated(
                  weather?.fetchedAt
                )}
              </Text>
            </View>

            <View
              style={styles.infoDivider}
            />

            <View
              style={styles.infoFooter}
            >
              <Text
                style={styles.infoTeam}
              >
                TEAM ASTRAL
              </Text>

              <Text
                style={styles.infoMeta}
              >
                SIH 2026 • PS 26076
              </Text>
            </View>
          </View>

          <View
            style={styles.bottomSpace}
          />
        </ScrollView>

        {/* APP BOTTOM NAVIGATION */}
        <View
          style={[
            styles.bottomNav,
            {
              bottom:
                Math.max(
                  insets.bottom,
                  8
                ) + 8,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.75}
            onPress={() =>
              router.replace("/home")
            }
          >
            <View
              style={[
                styles.navIcon,
                styles.navIconActive,
              ]}
            >
              <View
                style={styles.homeIcon}
              >
                <View
                  style={styles.homeRoof}
                />

                <View
                  style={styles.homeDoor}
                />
              </View>
            </View>

            <Text
              style={[
                styles.navText,
                styles.navTextActive,
              ]}
            >
              {t.home.home}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.75}
            onPress={() =>
              router.replace("/profile")
            }
          >
            <View
              style={styles.navIcon}
            >
              <View
                style={styles.userIcon}
              >
                <View
                  style={styles.userHead}
                />

                <View
                  style={styles.userBody}
                />
              </View>
            </View>

            <Text
              style={styles.navText}
            >
              {t.home.profile}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

function MetricItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricItem}>
      <Text
        style={styles.metricLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.metricValue}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#071D2B",
  },

  safeArea: {
    flex: 1,
    backgroundColor: "#071D2B",
  },

  scrollContent: {
    paddingHorizontal: 18,
    paddingTop: 16,
  },

  /* HEADER */

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 27,
  },

  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  brandLockup: {
  flexDirection: "row",
  alignItems: "center",
},

brandRow: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 18,
},

brandMark: {
  width: 32,
  height: 32,
  position: "relative",
  marginRight: 9,
},

brandSun: {
  position: "absolute",
  width: 9,
  height: 9,
  borderRadius: 5,
  backgroundColor: "#F3C968",
  top: 8,
  left: 12,
},

brandArc: {
  position: "absolute",
  width: 23,
  height: 23,
  borderRadius: 12,
  borderWidth: 1.5,
  borderColor: "#6CC9B1",
  borderBottomColor: "transparent",
  borderLeftColor: "transparent",
  transform: [{ rotate: "-35deg" }],
  top: 4,
  left: 4,
},

brandHorizon: {
  position: "absolute",
  width: 20,
  height: 1.5,
  borderRadius: 2,
  backgroundColor: "#6CC9B1",
  bottom: 6,
  left: 6,
},

brandDot: {
  position: "absolute",
  width: 3,
  height: 3,
  borderRadius: 2,
  backgroundColor: "#A1DED0",
  top: 6,
  right: 4,
},

brand: {
  color: "#FFFFFF",
  fontSize: 13,
  fontWeight: "700",
  letterSpacing: 2.2,
},

  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  titleAccent: {
    width: 3,
    height: 72,
    borderRadius: 2,
    backgroundColor: "#6CC9B1",
    marginRight: 12,
    marginTop: 3,
  },

  titleContent: {
    flex: 1,
  },

  pageKicker: {
    color: "#6CC9B1",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.6,
    marginBottom: 5,
  },

  pageTitle: {
    color: "#FFFFFF",
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "700",
  },

  pageSubtitle: {
    color: "#718A96",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  headerStatus: {
    borderWidth: 1,
    borderColor: "#31505B",
    borderRadius: 18,
    paddingHorizontal: 9,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },

  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#6CC9B1",
    marginRight: 5,
  },

  statusText: {
    color: "#78939C",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1,
  },

  /* SECTION LABEL */

  sectionLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    marginBottom: 10,
  },

  sectionLabelLine: {
    width: 17,
    height: 1,
    backgroundColor: "#6CC9B1",
    marginRight: 8,
  },

  sectionLabelRule: {
    flex: 1,
    height: 1,
    backgroundColor: "#183845",
    marginLeft: 9,
  },

  sectionLabel: {
    color: "#6CC9B1",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  /* STANDARD CARDS */

  card: {
    backgroundColor: "#0D2D3D",
    borderWidth: 1,
    borderColor: "#1B3B48",
    borderRadius: 18,
    padding: 17,
    marginBottom: 23,
  },

  cardHeader: {
    flexDirection: "row",
  },

  sectionIndicator: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "#6CC9B1",
    marginRight: 12,
  },

  cardHeaderText: {
    flex: 1,
  },

  cardEyebrow: {
    color: "#5C9F8E",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 3,
  },

  cardTitle: {
    color: "#F4F7F5",
    fontSize: 16,
    lineHeight: 21,
    fontWeight: "700",
  },

  cardDescription: {
    color: "#8199A2",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  /* LOCATION */

  locationCard: {
    backgroundColor: "#0D2D3D",
    borderWidth: 1,
    borderColor: "#1B3B48",
    borderRadius: 18,
    padding: 17,
    marginBottom: 23,
  },

  locationMain: {
    flexDirection: "row",
    alignItems: "center",
  },

  locationIconBox: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#102F3D",
    borderWidth: 1,
    borderColor: "#1B4350",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  locationPinOuter: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderColor: "#6CC9B1",
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  locationPinInner: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#6CC9B1",
  },

  locationText: {
    flex: 1,
  },

  locationEyebrow: {
    color: "#5C9F8E",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginBottom: 3,
  },

  locationCity: {
    color: "#F4F7F5",
    fontSize: 17,
    fontWeight: "700",
  },

  locationRegion: {
    color: "#718B94",
    fontSize: 9,
    marginTop: 3,
  },

  liveBadge: {
    borderWidth: 1,
    borderColor: "#31505B",
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: "row",
    alignItems: "center",
  },

  liveBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#6CC9B1",
    marginRight: 5,
  },

  liveBadgeText: {
    color: "#6CC9B1",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1,
  },

  locationBottom: {
    borderTopWidth: 1,
    borderTopColor: "#1B3B48",
    marginTop: 14,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  locationAccuracy: {
    color: "#637D86",
    fontSize: 9,
  },

  locationRefresh: {
    color: "#6CC9B1",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.1,
  },

  /* LOADING / ERROR */

  loadingCard: {
    backgroundColor: "#0D2D3D",
    borderWidth: 1,
    borderColor: "#1B3B48",
    borderRadius: 18,
    padding: 22,
    marginBottom: 23,
    alignItems: "center",
  },

  loadingText: {
    color: "#8199A2",
    fontSize: 10,
    marginTop: 10,
  },

  errorCard: {
    backgroundColor: "#0D2D3D",
    borderWidth: 1,
    borderColor: "#1B3B48",
    borderRadius: 18,
    padding: 17,
    marginBottom: 23,
  },

  errorEyebrow: {
    color: "#C9A65D",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.3,
  },

  errorTitle: {
    color: "#F4F7F5",
    fontSize: 15,
    fontWeight: "700",
    marginTop: 5,
  },

  errorText: {
    color: "#8199A2",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 5,
  },

  retryButton: {
    marginTop: 14,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#31505B",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  retryButtonText: {
    color: "#6CC9B1",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.1,
  },

  /* PERSONALISATION */

  interestCount: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#102F3D",
    borderWidth: 1,
    borderColor: "#1B4350",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  interestCountNumber: {
    color: "#6CC9B1",
    fontSize: 15,
    fontWeight: "700",
  },

  interestCountLabel: {
    color: "#637D86",
    fontSize: 5,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 1,
  },

  priorityList: {
    borderTopWidth: 1,
    borderTopColor: "#1B3B48",
    marginTop: 16,
  },

  priorityRow: {
    minHeight: 62,
    borderBottomWidth: 1,
    borderBottomColor: "#1B3B48",
    flexDirection: "row",
    alignItems: "center",
  },

  priorityRowLast: {
    borderBottomWidth: 0,
  },

  priorityNumber: {
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: "#102F3D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  priorityNumberText: {
    color: "#6CC9B1",
    fontSize: 8,
    fontWeight: "700",
  },

  priorityContent: {
    flex: 1,
  },

  priorityTitle: {
    color: "#DCE7E4",
    fontSize: 12,
    fontWeight: "600",
  },

  priorityDescription: {
    color: "#718B94",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 3,
  },

  manageRow: {
    minHeight: 42,
    borderTopWidth: 1,
    borderTopColor: "#1B3B48",
    marginTop: 5,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  manageText: {
    color: "#6CC9B1",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.1,
  },

  chevron: {
    color: "#6CC9B1",
    fontSize: 25,
    fontWeight: "300",
  },

  /* CURRENT WEATHER */

  currentTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  currentConditionBlock: {
    flex: 1,
  },

  currentEyebrow: {
    color: "#5C9F8E",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.4,
  },

  currentTemperature: {
    color: "#FFFFFF",
    fontSize: 46,
    lineHeight: 52,
    fontWeight: "700",
    marginTop: 2,
  },

  currentCondition: {
    color: "#8199A2",
    fontSize: 11,
    marginTop: 2,
  },

  weatherSymbolLarge: {
    width: 78,
    height: 78,
    borderRadius: 23,
    backgroundColor: "#102F3D",
    borderWidth: 1,
    borderColor: "#1B4350",
    alignItems: "center",
    justifyContent: "center",
  },

  weatherSymbolText: {
    color: "#F3C968",
    fontSize: 37,
  },

  currentDivider: {
    height: 1,
    backgroundColor: "#1B3B48",
    marginVertical: 17,
  },

  currentMetrics: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  metricItem: {
    flex: 1,
  },

  metricLabel: {
    color: "#637D86",
    fontSize: 6,
    fontWeight: "700",
    letterSpacing: 1,
  },

  metricValue: {
    color: "#DCE7E4",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },

    /* ALERT */

  alertHeader: {
    flexDirection: "row",
  },

  alertIndicator: {
    width: 35,
    height: 35,
    borderRadius: 11,
    backgroundColor: "#102F3D",
    borderWidth: 1,
    borderColor: "#1B4350",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6CC9B1",
  },

  alertContent: {
    flex: 1,
  },

  alertData: {
    borderTopWidth: 1,
    borderTopColor: "#1B3B48",
    marginTop: 15,
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  alertDataLabel: {
    color: "#637D86",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1,
  },

  alertDataValue: {
    color: "#DCE7E4",
    fontSize: 11,
    fontWeight: "600",
  },

  alertEmptyState: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
  },

  alertEmptyTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 11,
    marginTop: 1,
  },

  alertEmptyDescription: {
    color: "#718A96",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 5,
    marginLeft: 11,
    flex: 1,
  },

  alertStatusIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#315B52",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  alertStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#6CC9B1",
  },

  activeAlertItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  activeAlertItemSpacing: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#193A47",
  },

  alertWarningIndicator: {
    borderColor: "#7A6330",
  },

  alertWarningDot: {
    backgroundColor: "#F3C968",
  },

  /* TODAY */

  detailGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  detailCard: {
    width: "48%",
    backgroundColor: "#102F3D",
    borderWidth: 1,
    borderColor: "#1B4350",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },

  detailLabel: {
    color: "#637D86",
    fontSize: 6,
    fontWeight: "700",
    letterSpacing: 1,
  },

  detailValue: {
    color: "#DCE7E4",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },

  detailValueLarge: {
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
  },

  /* HOURLY */

  hourRow: {
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: "#1B3B48",
    flexDirection: "row",
    alignItems: "center",
  },

  hourRowLast: {
    borderBottomWidth: 0,
  },

  hourTime: {
    width: 55,
    color: "#718B94",
    fontSize: 8,
    fontWeight: "600",
  },

  hourSymbol: {
    width: 38,
    color: "#F3C968",
    fontSize: 17,
  },

  hourTemperature: {
    flex: 1,
    color: "#E7EFEC",
    fontSize: 13,
    fontWeight: "600",
  },

  hourRain: {
    color: "#6CC9B1",
    fontSize: 8,
    fontWeight: "600",
  },

  /* FORECAST */

  forecastRow: {
    minHeight: 62,
    borderBottomWidth: 1,
    borderBottomColor: "#1B3B48",
    flexDirection: "row",
    alignItems: "center",
  },

  forecastDay: {
    flex: 1,
  },

  forecastDayTitle: {
    color: "#DCE7E4",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.6,
  },

  forecastCondition: {
    color: "#637D86",
    fontSize: 8,
    marginTop: 3,
  },

  forecastSymbol: {
    width: 38,
    color: "#F3C968",
    fontSize: 18,
    textAlign: "center",
  },

  forecastTemps: {
    width: 60,
    alignItems: "flex-end",
  },

  forecastHigh: {
    color: "#E8F0EE",
    fontSize: 12,
    fontWeight: "700",
  },

  forecastLow: {
    color: "#637D86",
    fontSize: 9,
    marginTop: 2,
  },

  forecastRain: {
    width: 43,
    textAlign: "right",
    color: "#6CC9B1",
    fontSize: 8,
    fontWeight: "600",
  },

  /* SUN */

  sunRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  sunItem: {
    flex: 1,
    alignItems: "center",
  },

  sunDivider: {
    width: 1,
    height: 65,
    backgroundColor: "#1B3B48",
  },

  sunCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#102F3D",
    borderWidth: 1,
    borderColor: "#1B4350",
    alignItems: "center",
    justifyContent: "center",
  },

  sunCore: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#F3C968",
  },

  sunLabel: {
    color: "#637D86",
    fontSize: 6,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 8,
  },

  sunValue: {
    color: "#E8F0EE",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 3,
  },

  /* AQI */

  aqiTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  aqiValue: {
    color: "#FFFFFF",
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "700",
    marginTop: 3,
  },

  aqiLabel: {
    color: "#6CC9B1",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },

  aqiBadge: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: "#102F3D",
    borderWidth: 1,
    borderColor: "#1B4350",
    alignItems: "center",
    justifyContent: "center",
  },

  aqiBadgeText: {
    color: "#6CC9B1",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },

  aqiTrack: {
    height: 5,
    backgroundColor: "#183845",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 16,
  },

  aqiFill: {
    height: "100%",
    backgroundColor: "#6CC9B1",
    borderRadius: 3,
  },

  aqiMetrics: {
    flexDirection: "row",
    marginTop: 16,
  },

  /* DETAILS */

  emptyText: {
    color: "#718B94",
    fontSize: 10,
    paddingVertical: 8,
  },

  /* INFORMATION */

  infoCard: {
    backgroundColor: "#0A2634",
    borderWidth: 1,
    borderColor: "#193A47",
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },

  infoTop: {
    flexDirection: "row",
    alignItems: "center",
  },

  infoLogo: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#102F3D",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginRight: 12,
  },

  infoSun: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F3C968",
    top: 9,
  },

  infoHorizon: {
    position: "absolute",
    width: 24,
    height: 1.5,
    backgroundColor: "#6CC9B1",
    bottom: 10,
  },

  infoContent: {
    flex: 1,
  },

  infoBrand: {
    color: "#F4F7F5",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.8,
  },

  infoDescription: {
    color: "#637D86",
    fontSize: 9,
    lineHeight: 14,
    marginTop: 4,
  },

  infoDivider: {
    height: 1,
    backgroundColor: "#193A47",
    marginVertical: 14,
  },

  sourceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sourceName: {
    color: "#DCE7E4",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 4,
  },

  infoFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  infoTeam: {
    color: "#6CC9B1",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1,
  },

  infoMeta: {
    color: "#536F79",
    fontSize: 7,
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  bottomSpace: {
    height: 12,
  },

  /* BOTTOM NAVIGATION */

  bottomNav: {
    position: "absolute",
    left: 16,
    right: 16,
    height: 65,
    backgroundColor: "#0C2938",
    borderWidth: 1,
    borderColor: "#1B3B48",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",

    ...Platform.select({
      android: {
        elevation: 8,
      },

      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: {
          width: 0,
          height: 4,
        },
      },
    }),
  },

  navItem: {
    width: 90,
    height: 55,
    alignItems: "center",
    justifyContent: "center",
  },

  navIcon: {
    width: 23,
    height: 23,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.55,
  },

  navIconActive: {
    opacity: 1,
  },

  navText: {
    color: "#718B94",
    fontSize: 9,
    fontWeight: "600",
    marginTop: 3,
  },

  navTextActive: {
    color: "#6CC9B1",
  },

  /* HOME ICON */

  homeIcon: {
    width: 15,
    height: 12,
    borderWidth: 1.5,
    borderColor: "#6CC9B1",
    borderRadius: 2,
    marginTop: 5,
  },

  homeRoof: {
    position: "absolute",
    width: 10,
    height: 10,
    borderLeftWidth: 1.5,
    borderTopWidth: 1.5,
    borderColor: "#6CC9B1",
    transform: [
      {
        rotate: "45deg",
      },
    ],
    top: -6,
    left: 1,
  },

  homeDoor: {
    position: "absolute",
    width: 3,
    height: 6,
    backgroundColor: "#6CC9B1",
    bottom: 0,
    left: 5,
  },

  /* PROFILE ICON */

  userIcon: {
    width: 17,
    height: 19,
    alignItems: "center",
  },

  userHead: {
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "#718B94",
  },

  userBody: {
    width: 14,
    height: 7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: "#718B94",
    marginTop: 2,
  },
});
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type Language = "English" | "हिन्दी" | "অসমীয়া";

const LANGUAGE_STORAGE_KEY = "@mausam_language";

type TranslationDictionary = {
  home: {
    badge: string;
    title: string;
    subtitle: string;

    currentLocation: string;
    live: string;
    updating: string;
    refresh: string;
    gpsAccuracy: string;

    loadingWeather: string;
    weatherData: string;
    unableToLoadWeather: string;
    tryAgain: string;

    currentWeather: string;
    rightNow: string;
    feelsLike: string;
    humidity: string;
    wind: string;

    weatherAlerts: string;
    checkingAlertSettings: string;
    monitoringActive: string;
    noActiveAlerts: string;
    noAlertConditions: string;
    currentConditions: string;
    weatherWarning: string;
    weatherNotice: string;
    reviewingAlertPreferences: string;
    indicator: string;

    today: string;
    high: string;
    low: string;
    rain: string;
    uv: string;

    hourlyForecast: string;
    now: string;

    fiveDayForecast: string;

    sunriseSunset: string;
    sunrise: string;
    sunset: string;

    airQuality: string;
    airQualityIndex: string;
    pm25: string;
    pm10: string;
    ozone: string;

    weatherDetails: string;
    pressure: string;
    visibility: string;
    windDirection: string;
    cloudCover: string;
    dewPoint: string;
    uvIndex: string;

    personalisation: string;
    prioritisedForYou: string;
    weatherExperience: string;
    focus: string;
    managePreferences: string;

    deviceLocation: string;
    usingLiveLocation: string;
    active: string;

    dataSource: string;
    liveMeteorologicalData: string;
    liveMeteorologicalDataLabel: string;
    developedBy: string;

    weatherForecast: string;

    morning: string;
    afternoon: string;
    evening: string;

    home: string;
    profile: string;
  };

  profile: {
    title: string;
    badge: string;

    personalisation: string;
    weatherExperience: string;
    weatherExperienceDescription: string;
    editInterests: string;
    editInterestsDescription: string;

    language: string;
    appLanguage: string;
    appLanguageDescription: string;
    selected: string;

    location: string;
    currentWeatherLocation: string;
    locationDescription: string;
    refreshLocation: string;
    refreshLocationDescription: string;

    personalizedWeather: string;

    home: string;
    profile: string;
  };
};

const translations: Record<Language, TranslationDictionary> = {
  English: {
    home: {
      badge: "HOME",
      title: "Weather that works\nfor you.",
      subtitle: "Personalised weather information for your day.",

      currentLocation: "CURRENT LOCATION",
      live: "LIVE",
      updating: "UPDATING",
      refresh: "REFRESH",
      gpsAccuracy: "GPS ACCURACY",

      loadingWeather: "Loading live weather data...",
      weatherData: "WEATHER DATA",
      unableToLoadWeather: "Unable to load current weather",
      tryAgain: "TRY AGAIN",

      currentWeather: "CURRENT WEATHER",
      rightNow: "RIGHT NOW",
      feelsLike: "FEELS LIKE",
      humidity: "HUMIDITY",
      wind: "WIND",

      weatherAlerts: "WEATHER ALERTS",
      checkingAlertSettings: "Checking alert settings",
      monitoringActive: "MONITORING ACTIVE",
      noActiveAlerts: "No active alerts",
      noAlertConditions:
        "No weather conditions currently meet your saved alert thresholds.",
      currentConditions: "CURRENT CONDITIONS",
      weatherWarning: "WEATHER WARNING",
      weatherNotice: "WEATHER NOTICE",
      reviewingAlertPreferences:
        "Reviewing your saved weather alert preferences.",
      indicator: "INDICATOR",

      today: "TODAY",
      high: "HIGH",
      low: "LOW",
      rain: "RAIN",
      uv: "UV",

      hourlyForecast: "HOURLY FORECAST",
      now: "NOW",

      fiveDayForecast: "5-DAY FORECAST",

      sunriseSunset: "SUNRISE & SUNSET",
      sunrise: "SUNRISE",
      sunset: "SUNSET",

      airQuality: "AIR QUALITY",
      airQualityIndex: "AIR QUALITY INDEX",
      pm25: "PM2.5",
      pm10: "PM10",
      ozone: "OZONE",

      weatherDetails: "WEATHER DETAILS",
      pressure: "PRESSURE",
      visibility: "VISIBILITY",
      windDirection: "WIND DIRECTION",
      cloudCover: "CLOUD COVER",
      dewPoint: "DEW POINT",
      uvIndex: "UV INDEX",

      personalisation: "PERSONALISATION",
      prioritisedForYou: "PRIORITISED FOR YOU",
      weatherExperience: "Your weather experience",
      focus: "FOCUS",
      managePreferences: "MANAGE PREFERENCES",

      deviceLocation: "DEVICE LOCATION",
      usingLiveLocation: "Using live device location",
      active: "ACTIVE",

      dataSource: "DATA SOURCE",
      liveMeteorologicalData:
        "Live meteorological data for your personalised weather experience.",
      liveMeteorologicalDataLabel: "LIVE METEOROLOGICAL DATA",
      developedBy: "Developed by",

      weatherForecast: "Weather forecast",

      morning: "Good morning",
      afternoon: "Good afternoon",
      evening: "Good evening",

      home: "Home",
      profile: "Profile",
    },

    profile: {
      title: "Profile & Settings",
      badge: "SETTINGS",

      personalisation: "PERSONALISATION",
      weatherExperience: "Your Weather Experience",
      weatherExperienceDescription:
        "Manage how Mausam personalises your weather homepage.",
      editInterests: "Edit Interests",
      editInterestsDescription:
        "Change the information prioritised for you",

      language: "LANGUAGE",
      appLanguage: "App Language",
      appLanguageDescription:
        "Choose the language used throughout Mausam.",
      selected: "SELECTED",

      location: "LOCATION",
      currentWeatherLocation: "Current Weather Location",
      locationDescription:
        "Mausam uses your device location to provide local weather information.",
      refreshLocation: "Refresh Location",
      refreshLocationDescription:
        "Detect your current location again",

      personalizedWeather: "Personalized weather experience",

      home: "Home",
      profile: "Profile",
    },
  },

  "हिन्दी": {
    home: {
      badge: "होम",
      title: "मौसम जो आपके\nलिए काम करे।",
      subtitle: "आपके दिन के लिए व्यक्तिगत मौसम जानकारी।",

      currentLocation: "वर्तमान स्थान",
      live: "लाइव",
      updating: "अपडेट हो रहा है",
      refresh: "रिफ्रेश",
      gpsAccuracy: "GPS सटीकता",

      loadingWeather: "लाइव मौसम डेटा लोड हो रहा है...",
      weatherData: "मौसम डेटा",
      unableToLoadWeather: "वर्तमान मौसम लोड नहीं हो सका",
      tryAgain: "पुनः प्रयास करें",

      currentWeather: "वर्तमान मौसम",
      rightNow: "अभी",
      feelsLike: "महसूस हो रहा है",
      humidity: "नमी",
      wind: "हवा",

      weatherAlerts: "मौसम चेतावनियाँ",
      checkingAlertSettings: "चेतावनी सेटिंग जाँची जा रही है",
      monitoringActive: "निगरानी सक्रिय",
      noActiveAlerts: "कोई सक्रिय चेतावनी नहीं",
      noAlertConditions:
        "वर्तमान मौसम की कोई स्थिति आपकी सहेजी गई चेतावनी सीमा से मेल नहीं खाती।",
      currentConditions: "वर्तमान स्थितियाँ",
      weatherWarning: "मौसम चेतावनी",
      weatherNotice: "मौसम सूचना",
      reviewingAlertPreferences:
        "आपकी सहेजी गई मौसम चेतावनी प्राथमिकताओं की जाँच की जा रही है।",
      indicator: "संकेतक",

      today: "आज",
      high: "अधिकतम",
      low: "न्यूनतम",
      rain: "बारिश",
      uv: "UV",

      hourlyForecast: "घंटेवार पूर्वानुमान",
      now: "अभी",

      fiveDayForecast: "5-दिन का पूर्वानुमान",

      sunriseSunset: "सूर्योदय और सूर्यास्त",
      sunrise: "सूर्योदय",
      sunset: "सूर्यास्त",

      airQuality: "वायु गुणवत्ता",
      airQualityIndex: "वायु गुणवत्ता सूचकांक",
      pm25: "PM2.5",
      pm10: "PM10",
      ozone: "ओजोन",

      weatherDetails: "मौसम विवरण",
      pressure: "दबाव",
      visibility: "दृश्यता",
      windDirection: "हवा की दिशा",
      cloudCover: "बादल",
      dewPoint: "ओसांक",
      uvIndex: "UV सूचकांक",

      personalisation: "वैयक्तिकरण",
      prioritisedForYou: "आपके लिए प्राथमिकता",
      weatherExperience: "आपका मौसम अनुभव",
      focus: "फोकस",
      managePreferences: "प्राथमिकताएँ प्रबंधित करें",

      deviceLocation: "डिवाइस स्थान",
      usingLiveLocation: "लाइव डिवाइस स्थान का उपयोग किया जा रहा है",
      active: "सक्रिय",

      dataSource: "डेटा स्रोत",
      liveMeteorologicalData:
        "आपके व्यक्तिगत मौसम अनुभव के लिए लाइव मौसम संबंधी डेटा।",
      liveMeteorologicalDataLabel: "लाइव मौसम संबंधी डेटा",
      developedBy: "द्वारा विकसित",

      weatherForecast: "मौसम पूर्वानुमान",

      morning: "सुप्रभात",
      afternoon: "शुभ दोपहर",
      evening: "शुभ संध्या",

      home: "होम",
      profile: "प्रोफ़ाइल",
    },

    profile: {
      title: "प्रोफ़ाइल और सेटिंग्स",
      badge: "सेटिंग्स",

      personalisation: "व्यक्तिकरण",
      weatherExperience: "आपका मौसम अनुभव",
      weatherExperienceDescription:
        "मौसम आपके होमपेज को आपकी प्राथमिकताओं के अनुसार कैसे तैयार करे, इसे प्रबंधित करें।",
      editInterests: "रुचियाँ बदलें",
      editInterestsDescription:
        "आपके लिए प्राथमिकता वाली जानकारी बदलें",

      language: "भाषा",
      appLanguage: "ऐप की भाषा",
      appLanguageDescription:
        "पूरे मौसम ऐप में उपयोग की जाने वाली भाषा चुनें।",
      selected: "चयनित",

      location: "स्थान",
      currentWeatherLocation: "वर्तमान मौसम स्थान",
      locationDescription:
        "मौसम स्थानीय मौसम की जानकारी देने के लिए आपके डिवाइस के स्थान का उपयोग करता है।",
      refreshLocation: "स्थान अपडेट करें",
      refreshLocationDescription:
        "अपना वर्तमान स्थान फिर से निर्धारित करें",

      personalizedWeather: "व्यक्तिगत मौसम अनुभव",

      home: "होम",
      profile: "प्रोफ़ाइल",
    },
  },

  "অসমীয়া": {
    home: {
      badge: "হোম",
      title: "আপোনাৰ বাবে\nকাম কৰা বতৰ।",
      subtitle: "আপোনাৰ দিনটোৰ বাবে ব্যক্তিগতকৃত বতৰৰ তথ্য।",

      currentLocation: "বৰ্তমান স্থান",
      live: "লাইভ",
      updating: "আপডেট হৈ আছে",
      refresh: "ৰিফ্ৰেছ",
      gpsAccuracy: "GPS সঠিকতা",

      loadingWeather: "লাইভ বতৰৰ তথ্য লোড হৈ আছে...",
      weatherData: "বতৰৰ তথ্য",
      unableToLoadWeather: "বৰ্তমানৰ বতৰ লোড কৰিব পৰা নগ'ল",
      tryAgain: "পুনৰ চেষ্টা কৰক",

      currentWeather: "বৰ্তমানৰ বতৰ",
      rightNow: "এতিয়া",
      feelsLike: "অনুভৱ",
      humidity: "আৰ্দ্ৰতা",
      wind: "বতাহ",

      weatherAlerts: "বতৰৰ সতৰ্কবাণী",
      checkingAlertSettings:
        "সতৰ্কবাণীৰ ছেটিংছ পৰীক্ষা কৰি থকা হৈছে",
      monitoringActive: "নিৰীক্ষণ সক্ৰিয়",
      noActiveAlerts: "কোনো সক্ৰিয় সতৰ্কবাণী নাই",
      noAlertConditions:
        "বৰ্তমান কোনো বতৰৰ পৰিস্থিতিয়ে আপোনাৰ সংৰক্ষিত সতৰ্কবাণীৰ সীমা পূৰণ কৰা নাই।",
      currentConditions: "বৰ্তমান পৰিস্থিতি",
      weatherWarning: "বতৰৰ সতৰ্কবাণী",
      weatherNotice: "বতৰৰ জাননী",
      reviewingAlertPreferences:
        "আপোনাৰ সংৰক্ষিত বতৰ সতৰ্কতা পছন্দসমূহ পৰীক্ষা কৰা হৈছে।",
      indicator: "সূচক",

      today: "আজি",
      high: "সৰ্বোচ্চ",
      low: "সৰ্বনিম্ন",
      rain: "বৰষুণ",
      uv: "UV",

      hourlyForecast: "ঘণ্টাভিত্তিক পূৰ্বানুমান",
      now: "এতিয়া",

      fiveDayForecast: "৫-দিনীয়া পূৰ্বানুমান",

      sunriseSunset: "সূৰ্যোদয় আৰু সূৰ্যাস্ত",
      sunrise: "সূৰ্যোদয়",
      sunset: "সূৰ্যাস্ত",

      airQuality: "বায়ুৰ গুণগত মান",
      airQualityIndex: "বায়ুৰ গুণগত মান সূচক",
      pm25: "PM2.5",
      pm10: "PM10",
      ozone: "অ'জন",

      weatherDetails: "বতৰৰ বিৱৰণ",
      pressure: "চাপ",
      visibility: "দৃশ্যমানতা",
      windDirection: "বতাহৰ দিশ",
      cloudCover: "ডাৱৰৰ আৱৰণ",
      dewPoint: "শিশিৰ বিন্দু",
      uvIndex: "UV সূচক",

      personalisation: "ব্যক্তিগতকৰণ",
      prioritisedForYou: "আপোনাৰ বাবে অগ্ৰাধিকাৰ",
      weatherExperience: "আপোনাৰ বতৰৰ অভিজ্ঞতা",
      focus: "কেন্দ্ৰবিন্দু",
      managePreferences: "পছন্দসমূহ পৰিচালনা কৰক",

      deviceLocation: "ডিভাইচৰ অৱস্থান",
      usingLiveLocation:
        "লাইভ ডিভাইচৰ অৱস্থান ব্যৱহাৰ কৰা হৈছে",
      active: "সক্ৰিয়",

      dataSource: "ডাটা উৎস",
      liveMeteorologicalData:
        "আপোনাৰ ব্যক্তিগত বতৰ অভিজ্ঞতাৰ বাবে লাইভ বতৰ সম্পৰ্কীয় ডাটা।",
      liveMeteorologicalDataLabel: "লাইভ বতৰ সম্পৰ্কীয় ডাটা",
      developedBy: "দ্বাৰা বিকশিত",

      weatherForecast: "বতৰৰ পূৰ্বানুমান",

      morning: "সুপ্ৰভাত",
      afternoon: "শুভ দুপৰীয়া",
      evening: "শুভ সন্ধিয়া",

      home: "হোম",
      profile: "প্ৰ'ফাইল",
    },

    profile: {
      title: "প্ৰ'ফাইল আৰু ছেটিংছ",
      badge: "ছেটিংছ",

      personalisation: "ব্যক্তিগতকৰণ",
      weatherExperience: "আপোনাৰ বতৰৰ অভিজ্ঞতা",
      weatherExperienceDescription:
        "মৌচমে আপোনাৰ বতৰ হোমপেজ কেনেদৰে ব্যক্তিগতকৰণ কৰিব সেয়া পৰিচালনা কৰক।",
      editInterests: "পছন্দসমূহ সলনি কৰক",
      editInterestsDescription:
        "আপোনাৰ বাবে অগ্ৰাধিকাৰ দিয়া তথ্য সলনি কৰক",

      language: "ভাষা",
      appLanguage: "এপৰ ভাষা",
      appLanguageDescription:
        "সমগ্ৰ মৌচম এপত ব্যৱহাৰ কৰিবলগীয়া ভাষা বাছনি কৰক।",
      selected: "নিৰ্বাচিত",

      location: "স্থান",
      currentWeatherLocation: "বৰ্তমান বতৰৰ স্থান",
      locationDescription:
        "মৌচমে আপোনাৰ স্থানীয় বতৰৰ তথ্য প্ৰদান কৰিবলৈ আপোনাৰ ডিভাইচৰ স্থান ব্যৱহাৰ কৰে।",
      refreshLocation: "স্থান আপডেট কৰক",
      refreshLocationDescription:
        "আপোনাৰ বৰ্তমান স্থান পুনৰ নিৰ্ধাৰণ কৰক",

      personalizedWeather: "ব্যক্তিগতকৃত বতৰৰ অভিজ্ঞতা",

      home: "হোম",
      profile: "প্ৰ'ফাইল",
    },
  },
};

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: TranslationDictionary;
};

const LanguageContext =
  createContext<LanguageContextType | null>(null);

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [language, setLanguageState] =
    useState<Language>("English");

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage =
          await AsyncStorage.getItem(
            LANGUAGE_STORAGE_KEY
          );

        if (
          savedLanguage === "English" ||
          savedLanguage === "हिन्दी" ||
          savedLanguage === "অসমীয়া"
        ) {
          setLanguageState(savedLanguage);
        }
      } catch (error) {
        console.log("Language load error:", error);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = async (
    newLanguage: Language
  ) => {
    try {
      setLanguageState(newLanguage);

      await AsyncStorage.setItem(
        LANGUAGE_STORAGE_KEY,
        newLanguage
      );
    } catch (error) {
      console.log("Language save error:", error);
    }
  };

  const t = translations[language];

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, t]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}

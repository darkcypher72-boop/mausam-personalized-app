
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const LOCATION_STORAGE_KEY = "@mausam_user_location";
const USER_ID_KEY = "@mausam_user_id";

const API_BASE_URL = "http://192.168.29.129:5000";

type LocationState =
  | "checking"
  | "requesting"
  | "detecting"
  | "ready"
  | "permission-denied"
  | "services-disabled"
  | "error";

type LocationData = {
  latitude: number;
  longitude: number;
  locality: string;
  city: string;
  district: string;
  region: string;
  country: string;
  accuracyMeters: number | null;
  timestamp: number;
  updatedAt: string;
};

export default function LocationScreen() {
  const insets = useSafeAreaInsets();

  const [state, setState] =
    useState<LocationState>("checking");

  const [locality, setLocality] =
    useState("");

  const [city, setCity] =
    useState("Current location");

  const [district, setDistrict] =
    useState("");

  const [region, setRegion] =
    useState("");

  const [country, setCountry] =
    useState("");

  const [accuracy, setAccuracy] =
    useState<number | null>(null);

  const [error, setError] = useState("");

  const [savingLocation, setSavingLocation] =
    useState(false);

  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
  try {
    setError("");
    setState("checking");

    const servicesEnabled =
      await Location.hasServicesEnabledAsync();

    if (!servicesEnabled) {
      setState("services-disabled");
      return;
    }

    let permission =
      await Location.getForegroundPermissionsAsync();

    if (
      permission.status !==
      Location.PermissionStatus.GRANTED
    ) {
      setState("requesting");

      permission =
        await Location.requestForegroundPermissionsAsync();
    }

    if (
      permission.status !==
      Location.PermissionStatus.GRANTED
    ) {
      setState("permission-denied");
      return;
    }

    setState("detecting");

    const position =
      await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        mayShowUserSettingsDialog: true,
      });

    const latitude =
      position.coords.latitude;

    const longitude =
      position.coords.longitude;

    const locationAccuracy =
      position.coords.accuracy ?? null;

    setAccuracy(locationAccuracy);

    let detectedLocality = "";
    let detectedCity = "";
    let detectedDistrict = "";
    let detectedRegion = "";
    let detectedCountry = "";

    try {
      const addresses =
        await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });

      if (addresses.length > 0) {
        const address = addresses[0];
        console.log("MAUSAM RAW REVERSE GEOCODE:", address);
        const rawName =
          typeof address.name === "string"
            ? address.name.trim()
            : "";

        const rawCity =
          typeof address.city === "string"
            ? address.city.trim()
            : "";

        const rawDistrict =
          typeof address.district === "string"
            ? address.district.trim()
            : "";

        const rawSubregion =
          typeof address.subregion === "string"
            ? address.subregion.trim()
            : "";

        const rawRegion =
          typeof address.region === "string"
            ? address.region.trim()
            : "";

        const rawCountry =
          typeof address.country === "string"
            ? address.country.trim()
            : "";

        /*
         * Keep the values returned by the geocoder
         * without inventing administrative levels.
         *
         * We will separately verify the exact Indian
         * district mapping after this syntax check.
         */

        detectedCity = rawCity;

        detectedRegion = rawRegion;

        detectedCountry = rawCountry;

        detectedLocality = rawDistrict;

        detectedDistrict = "";
      }
    } catch (reverseGeocodeError) {
      console.warn(
        "Reverse geocoding failed:",
        reverseGeocodeError
      );
    }

    /*
     * Country fallback only.
     *
     * We do not invent locality, city, district
     * or state values.
     */
    if (!detectedCountry) {
      detectedCountry = "India";
    }

    setLocality(detectedLocality);

    setCity(
      detectedCity || "Current location"
    );

    setDistrict(detectedDistrict);

    setRegion(detectedRegion);

    setCountry(detectedCountry);

    const locationData: LocationData = {
      latitude,
      longitude,
      locality: detectedLocality,
      city: detectedCity,
      district: detectedDistrict,
      region: detectedRegion,
      country: detectedCountry,
      accuracyMeters: locationAccuracy,
      timestamp: position.timestamp,
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(
      LOCATION_STORAGE_KEY,
      JSON.stringify(locationData)
    );

    setSavingLocation(true);

    const storedUserId =
      await AsyncStorage.getItem(USER_ID_KEY);

    if (!storedUserId) {
      throw new Error(
        "User ID was not found. Please restart the app."
      );
    }

    const userId = Number(storedUserId);

    if (!Number.isInteger(userId)) {
      throw new Error(
        "Invalid user ID stored on this device."
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/api/user/location`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          label: "Current Location",
          locality: detectedLocality,
          city: detectedCity || null,
          district: detectedDistrict || null,
          region: detectedRegion || null,
          country: detectedCountry || null,
          latitude,
          longitude,
          isPrimary: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data?.error ||
          `Location API failed with status ${response.status}`
      );
    }

    console.log(
      "MAUSAM LOCATION SAVED:",
      data.location
    );

    setSavingLocation(false);
    setState("ready");
  } catch (err) {
    console.error(
      "Location detection/save error:",
      err
    );

    setSavingLocation(false);

    setError(
      err instanceof Error
        ? err.message
        : "Unable to determine or save your current location."
    );

    setState("error");
  }
};

  const continueToHome = () => {
    router.replace("/home");
  };

  const openLocationSettingsMessage = () => {
    Alert.alert(
      "Location services are disabled",
      "Please turn on Location/GPS on your phone and return to Mausam.",
      [
        {
          text: "OK",
        },
      ]
    );
  };

  const accuracyText =
    accuracy === null
      ? "Accuracy unavailable"
      : accuracy <= 20
      ? `High GPS accuracy • ±${Math.round(
          accuracy
        )} m`
      : accuracy <= 100
      ? `Good location accuracy • ±${Math.round(
          accuracy
        )} m`
      : `Location accuracy • ±${Math.round(
          accuracy
        )} m`;

  /*
   * Build a readable location hierarchy.
   *
   * Only fields actually returned by the
   * reverse geocoder are displayed.
   */
  const locationHierarchy = [
    locality,
    city !== "Current location"
      ? city
      : "",
    district,
    region,
    country,
  ].filter(
    (value, index, array) =>
      Boolean(value) &&
      array.indexOf(value) === index
  );

  return (
  <View style={styles.container}>
    <View pointerEvents="none" style={styles.backgroundGlow} />
      <View
        style={[
          styles.content,
          {
            paddingTop: Math.max(
              insets.top,
              28
            ),
            paddingBottom: Math.max(
              insets.bottom,
              28
            ),
          },
        ]}
      >
        {/* HEADER */}
<View style={styles.header}>
  <View style={styles.brand}>
    <View style={styles.logo}>
      <View style={styles.logoArc} />
      <View style={styles.logoSun} />
      <View style={styles.logoHorizon} />
      <View style={styles.logoDot} />
    </View>

    <View>
      <Text style={styles.brandName}>
        MAUSAM
      </Text>

      <Text style={styles.brandCaption}>
        WEATHER, MADE PERSONAL
      </Text>
    </View>
  </View>

  <View style={styles.stepIndicator}>
    <Text style={styles.stepMuted}>01</Text>

    <View style={styles.stepLine}>
      <View style={styles.stepActive} />
    </View>

    <Text style={styles.stepText}>02</Text>
  </View>
</View>

        {/* MAIN */}
        <View style={styles.main}>
          <Text style={styles.kicker}>
            LOCATION
          </Text>

          <Text style={styles.title}>
            Weather starts{"\n"}with where you are.
          </Text>

          <Text style={styles.description}>
            Mausam uses your device location to
            retrieve weather conditions and
            forecasts for your actual position.
          </Text>

          {state === "checking" ||
          state === "requesting" ||
          state === "detecting" ? (
            <View style={styles.statusCard}>
              <ActivityIndicator
                size="small"
                color="#6CC9B1"
              />

              <View style={styles.statusTextArea}>
                <Text style={styles.statusTitle}>
                  {state === "requesting"
                    ? "Location permission required"
                    : state === "detecting"
                    ? savingLocation
                      ? "Saving your location"
                      : "Finding your precise location"
                    : "Checking location services"}
                </Text>

                <Text
                  style={styles.statusDescription}
                >
                  {state === "detecting"
                    ? savingLocation
                      ? "Saving your location securely."
                      : "Waiting for the best available GPS fix."
                    : "This may take a few moments."}
                </Text>
              </View>
            </View>
          ) : null}

          {state === "ready" ? (
            <View style={styles.locationCard}>
              <View style={styles.locationHeader}>
                <View style={styles.locationIcon}>
                  <View style={styles.pinCircle} />
                  <View style={styles.pinPoint} />
                </View>

                <View style={styles.detectedBadge}>
                  <View style={styles.detectedDot} />

                  <Text
                    style={styles.detectedText}
                  >
                    DETECTED
                  </Text>
                </View>
              </View>

              <Text style={styles.locationLabel}>
                YOUR CURRENT LOCATION
              </Text>

              <Text style={styles.locationName}>
                {locality ||
                  city ||
                  "Current location"}
              </Text>

              {locationHierarchy.length > 1 ? (
                <Text style={styles.region}>
                  {locationHierarchy
                    .slice(1)
                    .join(" • ")}
                </Text>
              ) : null}

              <View style={styles.locationDivider} />

              <View style={styles.accuracyRow}>
                <Text style={styles.accuracyLabel}>
                  LOCATION QUALITY
                </Text>

                <Text style={styles.accuracyValue}>
                  {accuracyText}
                </Text>
              </View>
            </View>
          ) : null}

          {state === "permission-denied" ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>
                Location permission is required
              </Text>

              <Text
                style={styles.errorDescription}
              >
                Mausam needs foreground location
                access to provide weather for your
                current position.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={detectLocation}
                activeOpacity={0.85}
              >
                <Text
                  style={styles.primaryButtonText}
                >
                  ALLOW LOCATION
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {state === "services-disabled" ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>
                Turn on Location
              </Text>

              <Text
                style={styles.errorDescription}
              >
                Your phone's location services
                are currently disabled. Turn on
                GPS/Location and try again.
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={
                  openLocationSettingsMessage
                }
                activeOpacity={0.85}
              >
                <Text
                  style={styles.primaryButtonText}
                >
                  CHECK AGAIN
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {state === "error" ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>
                Location could not be detected
              </Text>

              <Text
                style={styles.errorDescription}
              >
                {error ||
                  "Please check your location settings and try again."}
              </Text>

              <TouchableOpacity
                style={styles.primaryButton}
                onPress={detectLocation}
                activeOpacity={0.85}
              >
                <Text
                  style={styles.primaryButtonText}
                >
                  TRY AGAIN
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* BOTTOM */}
        <View style={styles.bottom}>
          {state === "ready" ? (
            <TouchableOpacity
              style={styles.continueButton}
              onPress={continueToHome}
              activeOpacity={0.88}
            >
              <Text
                style={styles.continueButtonText}
              >
                CONTINUE TO MAUSAM
              </Text>

              <Text
                style={styles.continueArrow}
              >
                →
              </Text>
            </TouchableOpacity>
          ) : null}

          <Text style={styles.privacyText}>
            LOCATION IS USED ONLY TO PROVIDE
            RELEVANT WEATHER INFORMATION.
          </Text>

          <Text style={styles.footer}>
            TEAM ASTRAL • SIH 2026 • PS 26076
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#071D2B",
  },
  backgroundGlow: {
  position: "absolute",
  width: 330,
  height: 330,
  borderRadius: 165,
  backgroundColor: "#0D4054",
  opacity: 0.3,
  top: -170,
  right: -145,
},
  content: {
    flex: 1,
    paddingHorizontal: 22,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: "#0D2D3D",
    borderWidth: 1,
    borderColor: "rgba(108,201,177,0.30)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 11,
  },
  logoDot: {
  position: "absolute",
  width: 3,
  height: 3,
  borderRadius: 2,
  backgroundColor: "#A1DED0",
  top: 6,
  right: 8,
},
  logoArc: {
  position: "absolute",
  width: 31,
  height: 31,
  borderRadius: 16,
  borderWidth: 1.5,
  borderColor: "#6CC9B1",
  borderBottomColor: "transparent",
  borderLeftColor: "transparent",
  transform: [{ rotate: "-35deg" }],
},

  logoSun: {
  position: "absolute",
  width: 10,
  height: 10,
  borderRadius: 5,
  backgroundColor: "#F3C968",
  top: 9,
  left: 17,
},

  logoHorizon: {
  position: "absolute",
  width: 25,
  height: 1.5,
  borderRadius: 2,
  backgroundColor: "#6CC9B1",
  bottom: 9,
  left: 9,
},

  brandName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2.4,
  },

  brandCaption: {
    color: "#6F8997",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 2,
  },

  

  stepText: {
  fontSize: 9,
  fontWeight: "800",
  color: "#6CC9B1",
},

  header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
},

  

  main: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: 35,
  },

  kicker: {
    color: "#6CC9B1",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 12,
  },

  title: {
    color: "#FFFFFF",
    fontSize: 32,
    lineHeight: 37,
    fontWeight: "700",
    letterSpacing: -0.7,
  },

  description: {
    color: "#8EA5B3",
    fontSize: 13,
    lineHeight: 21,
    marginTop: 13,
    maxWidth: 350,
  },

  statusCard: {
    marginTop: 25,
    minHeight: 82,
    borderRadius: 16,
    backgroundColor: "#0D2D3D",
    borderWidth: 1,
    borderColor: "rgba(108,201,177,0.14)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  stepLine: {
  width: 30,
  height: 2,
  backgroundColor: "rgba(255,255,255,0.10)",
  marginHorizontal: 7,
  overflow: "hidden",
},
  statusTextArea: {
    marginLeft: 13,
    flex: 1,
  },

  statusTitle: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },

  statusDescription: {
    color: "#718B98",
    fontSize: 10,
    marginTop: 5,
  },

  locationCard: {
    marginTop: 26,
    borderRadius: 20,
    backgroundColor: "#0D2D3D",
    borderWidth: 1,
    borderColor: "rgba(108,201,177,0.20)",
    padding: 18,
  },

  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepIndicator: {
  flexDirection: "row",
  alignItems: "center",
},
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(108,201,177,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepMuted: {
  fontSize: 9,
  fontWeight: "700",
  color: "#536D78",
},
stepActive: {
  width: "100%",
  height: "100%",
  backgroundColor: "#6CC9B1",
},
  pinCircle: {
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#6CC9B1",
    marginBottom: 5,
  },

  pinPoint: {
    position: "absolute",
    width: 6,
    height: 6,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: "#6CC9B1",
    transform: [{ rotate: "-45deg" }],
    bottom: 9,
  },

  detectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(108,201,177,0.08)",
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },

  detectedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#6CC9B1",
    marginRight: 5,
  },

  detectedText: {
    color: "#6CC9B1",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },

  locationLabel: {
    color: "#637E8C",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 19,
  },

  locationName: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "700",
    marginTop: 5,
  },

  region: {
    color: "#8299A5",
    fontSize: 12,
    marginTop: 3,
  },

  locationDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginVertical: 15,
  },

  accuracyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  accuracyLabel: {
    color: "#526E7B",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.9,
  },

  accuracyValue: {
    color: "#6CC9B1",
    fontSize: 9,
    fontWeight: "600",
  },

  errorCard: {
    marginTop: 25,
    borderRadius: 18,
    backgroundColor: "#0D2D3D",
    borderWidth: 1,
    borderColor: "rgba(243,201,104,0.16)",
    padding: 17,
  },

  errorTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },

  errorDescription: {
    color: "#8099A5",
    fontSize: 11,
    lineHeight: 17,
    marginTop: 7,
  },

  primaryButton: {
    height: 45,
    borderRadius: 11,
    backgroundColor: "#6CC9B1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 17,
  },

  primaryButtonText: {
    color: "#071D2B",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
  },

  bottom: {
    alignItems: "center",
  },

  continueButton: {
    width: "100%",
    height: 53,
    borderRadius: 14,
    backgroundColor: "#6CC9B1",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  continueButtonText: {
    color: "#071D2B",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },

  continueArrow: {
    color: "#071D2B",
    fontSize: 22,
    fontWeight: "500",
  },

  privacyText: {
    color: "#4F6977",
    fontSize: 7,
    lineHeight: 12,
    letterSpacing: 0.5,
    textAlign: "center",
    marginTop: 15,
  },

  footer: {
    color: "#405A67",
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 9,
    marginBottom: 2,
  },
});


import React, { useState } from "react";
import {
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const INTERESTS_STORAGE_KEY = "@mausam_user_interests";
const USER_ID_KEY = "@mausam_user_id";

const API_BASE_URL = "https://mausam-backend-zp0f.onrender.com";

const interests = [
  {
    id: "daily",
    title: "Everyday Weather",
    description: "Conditions, forecasts and important updates",
  },
  {
    id: "health",
    title: "Health & Wellbeing",
    description: "Air quality, pollen, UV and humidity",
  },
  {
    id: "fitness",
    title: "Outdoor Fitness",
    description: "Running hours, wind, heat and sun times",
  },
  {
    id: "travel",
    title: "Travel",
    description: "Destination weather, alerts and travel guidance",
  },
  {
    id: "marine",
    title: "Beach & Surf",
    description: "Sea conditions, tides, waves and water temperature",
  },
  {
    id: "family",
    title: "Family",
    description: "School commute, rain and severe weather alerts",
  },
  {
    id: "agriculture",
    title: "Agriculture & Gardening",
    description: "Rainfall, soil conditions, frost and planting guidance",
  },
  {
    id: "commute",
    title: "Daily Commute",
    description: "Traffic, rain, fog, visibility and travel conditions",
  },
  {
    id: "events",
    title: "Outdoor Events",
    description: "Extended forecasts, rain probability and comfort",
  },
];

export default function OnboardingScreen() {
  const [selected, setSelected] = useState<string[]>(["daily"]);
  const [saving, setSaving] = useState(false);

  const toggleInterest = (id: string) => {
    setSelected((current) => {
      if (current.includes(id)) {
        if (current.length === 1) {
          return current;
        }

        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  };

  const handleContinue = async () => {
    if (selected.length === 0 || saving) {
      return;
    }

    try {
      setSaving(true);

      const preferenceData = {
        interests: selected,
        updatedAt: new Date().toISOString(),
      };

      // Save locally as a backup/cache.
      await AsyncStorage.setItem(
        INTERESTS_STORAGE_KEY,
        JSON.stringify(preferenceData)
      );

      // Get the MySQL user created during app startup.
      const storedUserId =
        await AsyncStorage.getItem(USER_ID_KEY);

      if (!storedUserId) {
        throw new Error(
          "Mausam user ID was not found."
        );
      }

      const userId = Number(storedUserId);

      if (!Number.isInteger(userId)) {
        throw new Error(
          "Invalid Mausam user ID."
        );
      }

      // Save interests to MySQL.
      const response = await fetch(
        `${API_BASE_URL}/api/user/preferences`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            interests: selected,
            language: "English",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Preferences API failed with status ${response.status}`
        );
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(
          "Unable to save preferences to server."
        );
      }

      console.log(
        "MAUSAM PREFERENCES SAVED:",
        data.preferences
      );

      router.push("/location");
    } catch (error) {
      console.error(
        "Unable to save interests:",
        error
      );

      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.backgroundGlow} />
        <View style={styles.backgroundGlowSmall} />

        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <View style={styles.logoArc} />
              <View style={styles.logoSun} />
              <View style={styles.logoHorizon} />
              <View style={styles.logoDot} />
            </View>

            <View>
              <Text style={styles.brand}>MAUSAM</Text>

              <Text style={styles.brandSub}>
                WEATHER, MADE PERSONAL.
              </Text>
            </View>
          </View>

          <View style={styles.stepIndicator}>
            <Text style={styles.stepText}>01</Text>

            <View style={styles.stepLine}>
              <View style={styles.stepActive} />
            </View>

            <Text style={styles.stepMuted}>02</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.kicker}>
            LET'S PERSONALISE MAUSAM
          </Text>

          <Text style={styles.title}>
            What matters to{"\n"}you?
          </Text>

          <Text style={styles.description}>
            Tell us what you use weather information for.
            We'll organise your homepage around what is
            relevant to you.
          </Text>

          <View style={styles.selectionHeader}>
            <Text style={styles.selectionTitle}>
              SELECT YOUR INTERESTS
            </Text>

            <Text style={styles.selectionCount}>
              {selected.length} selected
            </Text>
          </View>

          <View style={styles.list}>
            {interests.map((item, index) => {
              const active = selected.includes(item.id);

              return (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.78}
                  onPress={() => toggleInterest(item.id)}
                  style={[
                    styles.interestRow,
                    active && styles.interestRowActive,
                  ]}
                >
                  <View
                    style={[
                      styles.indexBox,
                      active && styles.indexBoxActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.indexText,
                        active && styles.indexTextActive,
                      ]}
                    >
                      {(index + 1).toString().padStart(2, "0")}
                    </Text>
                  </View>

                  <View style={styles.interestContent}>
                    <Text
                      style={[
                        styles.interestTitle,
                        active && styles.interestTitleActive,
                      ]}
                    >
                      {item.title}
                    </Text>

                    <Text style={styles.interestDescription}>
                      {item.description}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.radio,
                      active && styles.radioActive,
                    ]}
                  >
                    {active && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.helper}>
            <View style={styles.helperIcon}>
              <Text style={styles.helperIconText}>i</Text>
            </View>

            <Text style={styles.helperText}>
              You can change your interests anytime from
              your profile.
            </Text>
          </View>
        </ScrollView>

        <View style={styles.bottom}>
          <View style={styles.bottomLine} />

          <TouchableOpacity
            activeOpacity={0.85}
            style={[
              styles.continueButton,
              saving && styles.continueButtonDisabled,
            ]}
            onPress={handleContinue}
            disabled={saving}
          >
            <Text style={styles.continueText}>
              {saving ? "Saving..." : "Continue"}
            </Text>

            {!saving && (
              <View style={styles.arrowCircle}>
                <Text style={styles.arrow}>→</Text>
              </View>
            )}
          </TouchableOpacity>

          <Text style={styles.bottomCaption}>
            YOUR EXPERIENCE • YOUR CHOICE
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#071D2B",
    paddingBottom: Platform.OS === "android" ? 8 : 0,
  },

  container: {
    flex: 1,
    backgroundColor: "#071D2B",
    overflow: "hidden",
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

  backgroundGlowSmall: {
    position: "absolute",
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: "#0B3447",
    opacity: 0.24,
    bottom: -120,
    left: -115,
  },

  header: {
    height: 78,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 37,
    height: 37,
    borderRadius: 11,
    backgroundColor: "#0D2D3D",
    borderWidth: 1,
    borderColor: "rgba(125,210,190,0.20)",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  logoArc: {
    position: "absolute",
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 1.4,
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
    top: 10,
    left: 13,
  },

  logoHorizon: {
    position: "absolute",
    width: 19,
    height: 1.5,
    borderRadius: 2,
    backgroundColor: "#6CC9B1",
    bottom: 9,
  },

  logoDot: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#A1DED0",
    top: 8,
    right: 8,
  },

  brand: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 2.5,
    color: "#FFFFFF",
  },

  brandSub: {
    marginTop: 2,
    fontSize: 6.5,
    fontWeight: "700",
    letterSpacing: 1.15,
    color: "#78939F",
  },

  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },

  stepText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#6CC9B1",
  },

  stepMuted: {
    fontSize: 9,
    fontWeight: "700",
    color: "#536D78",
  },

  stepLine: {
    width: 30,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.10)",
    marginHorizontal: 7,
    overflow: "hidden",
  },

  stepActive: {
    width: "50%",
    height: "100%",
    backgroundColor: "#6CC9B1",
  },

  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 35,
    paddingBottom: 45,
  },

  kicker: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.7,
    color: "#6CC9B1",
    marginBottom: 13,
  },

  title: {
    fontSize: 37,
    lineHeight: 41,
    fontWeight: "800",
    letterSpacing: -0.9,
    color: "#FFFFFF",
  },

  description: {
    marginTop: 14,
    fontSize: 13.5,
    lineHeight: 21,
    color: "#91AAB5",
    maxWidth: 360,
  },

  selectionHeader: {
    marginTop: 34,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  selectionTitle: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "#78939F",
  },

  selectionCount: {
    fontSize: 9,
    fontWeight: "700",
    color: "#6CC9B1",
  },

  list: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.09)",
  },

  interestRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  interestRowActive: {
    backgroundColor: "rgba(108,201,177,0.055)",
  },

  indexBox: {
    width: 31,
    height: 31,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.055)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  indexBoxActive: {
    backgroundColor: "rgba(108,201,177,0.13)",
  },

  indexText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#617A85",
  },

  indexTextActive: {
    color: "#6CC9B1",
  },

  interestContent: {
    flex: 1,
    paddingVertical: 8,
  },

  interestTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#C6D3D8",
  },

  interestTitleActive: {
    color: "#FFFFFF",
  },

  interestDescription: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 15,
    color: "#708994",
  },

  radio: {
    width: 21,
    height: 21,
    borderRadius: 11,
    borderWidth: 1.3,
    borderColor: "#536D78",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  radioActive: {
    borderColor: "#6CC9B1",
    backgroundColor: "#286F63",
  },

  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D9F2EA",
  },

  helper: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
  },

  helperIcon: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#526D78",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  helperIconText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#78939F",
  },

  helperText: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 14,
    color: "#667F8A",
  },

  bottom: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: Platform.OS === "android" ? 10 : 16,
    backgroundColor: "#071D2B",
  },

  bottomLine: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 12,
  },

  continueButton: {
    height: 53,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    flexShrink: 0,
  },

  continueButtonDisabled: {
    opacity: 0.65,
  },

  continueText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#123B4F",
    letterSpacing: 0.1,
  },

  arrowCircle: {
    position: "absolute",
    right: 10,
    width: 33,
    height: 33,
    borderRadius: 9,
    backgroundColor: "#123B4F",
    alignItems: "center",
    justifyContent: "center",
  },

  arrow: {
    fontSize: 18,
    color: "#FFFFFF",
    marginTop: -1,
  },

  bottomCaption: {
    textAlign: "center",
    marginTop: 9,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#536D78",
  },
});

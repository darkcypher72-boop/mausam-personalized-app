import React, { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

type AlertKey =
  | "severeWeather"
  | "heavyRain"
  | "storm"
  | "extremeHeat"
  | "poorAirQuality";

type AlertItem = {
  key: AlertKey;
  title: string;
  description: string;
  code: string;
};

const ALERTS: AlertItem[] = [
  {
    key: "severeWeather",
    title: "Severe Weather",
    description:
      "Important warnings for dangerous or rapidly changing weather.",
    code: "01",
  },
  {
    key: "heavyRain",
    title: "Heavy Rain",
    description:
      "Notifications when significant rainfall is expected.",
    code: "02",
  },
  {
    key: "storm",
    title: "Storm",
    description:
      "Alerts for thunderstorms and potentially hazardous conditions.",
    code: "03",
  },
  {
    key: "extremeHeat",
    title: "Extreme Heat",
    description:
      "Warnings when temperatures or heat conditions become dangerous.",
    code: "04",
  },
  {
    key: "poorAirQuality",
    title: "Poor Air Quality",
    description:
      "Notifications when air quality reaches unhealthy levels.",
    code: "05",
  },
];

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<Record<AlertKey, boolean>>({
    severeWeather: true,
    heavyRain: true,
    storm: true,
    extremeHeat: true,
    poorAirQuality: false,
  });

  const [loading] = useState(false);

  function toggleAlert(key: AlertKey) {
    setAlerts((current) => ({
      ...current,
      [key]: !current[key],
    }));
  }

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
          contentContainerStyle={styles.content}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <View style={styles.brandMark}>
                <View style={styles.brandSun} />
                <View style={styles.brandHorizon} />
              </View>

              <Text style={styles.brand}>MAUSAM</Text>
            </View>

            <View style={styles.titleRow}>
              <View style={styles.titleAccent} />

              <View style={styles.titleContent}>
                <Text style={styles.pageKicker}>
                  NOTIFICATIONS
                </Text>

                <Text style={styles.pageTitle}>
                  Alert Preferences
                </Text>

                <Text style={styles.pageSubtitle}>
                  Choose the weather conditions you want
                  Mausam to notify you about.
                </Text>
              </View>
            </View>
          </View>

          {/* Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusIndicator}>
              <View style={styles.statusDot} />
            </View>

            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>
                PERSONAL ALERTS
              </Text>

              <Text style={styles.statusDescription}>
                Alerts are tailored to your selected
                preferences.
              </Text>
            </View>
          </View>

          {/* Section */}
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>
                WEATHER NOTIFICATIONS
              </Text>

              <Text style={styles.sectionTitle}>
                What should we monitor?
              </Text>
            </View>

            <Text style={styles.sectionCount}>
              {Object.values(alerts).filter(Boolean).length}/5
            </Text>
          </View>

          {/* Alert Cards */}
          <View style={styles.alertList}>
            {ALERTS.map((item) => {
              const enabled = alerts[item.key];

              return (
                <View
                  key={item.key}
                  style={[
                    styles.alertCard,
                    enabled && styles.alertCardActive,
                  ]}
                >
                  <View style={styles.alertNumber}>
                    <Text style={styles.alertNumberText}>
                      {item.code}
                    </Text>
                  </View>

                  <View style={styles.alertInfo}>
                    <View style={styles.alertTitleRow}>
                      <Text style={styles.alertTitle}>
                        {item.title}
                      </Text>

                      <View
                        style={[
                          styles.stateBadge,
                          enabled &&
                            styles.stateBadgeActive,
                        ]}
                      >
                        <View
                          style={[
                            styles.stateDot,
                            enabled &&
                              styles.stateDotActive,
                          ]}
                        />

                        <Text
                          style={[
                            styles.stateText,
                            enabled &&
                              styles.stateTextActive,
                          ]}
                        >
                          {enabled ? "ON" : "OFF"}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.alertDescription}>
                      {item.description}
                    </Text>
                  </View>

                  <Switch
                    value={enabled}
                    onValueChange={() =>
                      toggleAlert(item.key)
                    }
                    disabled={loading}
                    trackColor={{
                      false: "#203E4A",
                      true: "#397B6D",
                    }}
                    thumbColor={
                      enabled ? "#F3C968" : "#718B94"
                    }
                    ios_backgroundColor="#203E4A"
                  />
                </View>
              );
            })}
          </View>

          {/* Information */}
          <View style={styles.infoCard}>
            <Text style={styles.infoKicker}>
              MAUSAM GUIDANCE
            </Text>

            <Text style={styles.infoText}>
              You can change these preferences at any
              time. Important emergency warnings may
              still be shown when required for public
              safety.
            </Text>
          </View>

          {/* Continue */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              STEP 03 / PERSONALISE
            </Text>

            <Text style={styles.footerHint}>
              Your preferences will be used to organise
              your personalised weather homepage.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator
              size="small"
              color="#6CC9B1"
            />

            <Text style={styles.loadingText}>
              Saving preferences...
            </Text>
          </View>
        </View>
      )}
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

  content: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 45,
  },

  header: {
    marginBottom: 25,
  },

  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },

  brandMark: {
    width: 21,
    height: 21,
    marginRight: 8,
    position: "relative",
  },

  brandSun: {
    position: "absolute",
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#F3C968",
    top: 1,
    left: 6,
  },

  brandHorizon: {
    position: "absolute",
    height: 1.5,
    width: 19,
    backgroundColor: "#6CC9B1",
    bottom: 4,
    left: 1,
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
    height: 76,
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

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A2634",
    borderWidth: 1,
    borderColor: "#193A47",
    borderRadius: 15,
    padding: 14,
    marginBottom: 28,
  },

  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#102F3C",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#6CC9B1",
  },

  statusContent: {
    flex: 1,
  },

  statusTitle: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 3,
  },

  statusDescription: {
    color: "#718A96",
    fontSize: 10,
    lineHeight: 15,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 11,
  },

  sectionKicker: {
    color: "#6CC9B1",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  sectionCount: {
    color: "#F3C968",
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 2,
  },

  alertList: {
    gap: 9,
  },

  alertCard: {
    minHeight: 88,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D2D3D",
    borderWidth: 1,
    borderColor: "#1B3B48",
    borderRadius: 15,
    paddingVertical: 13,
    paddingHorizontal: 12,
  },

  alertCardActive: {
    borderColor: "#285347",
  },

  alertNumber: {
    width: 29,
    height: 29,
    borderRadius: 8,
    backgroundColor: "#0A2634",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  alertNumberText: {
    color: "#607C89",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.7,
  },

  alertInfo: {
    flex: 1,
    paddingRight: 9,
  },

  alertTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },

  alertTitle: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },

  alertDescription: {
    color: "#718A96",
    fontSize: 9.5,
    lineHeight: 14,
  },

  stateBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#28434F",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 3,
    marginLeft: 5,
  },

  stateBadgeActive: {
    borderColor: "#315B50",
  },

  stateDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#526C77",
    marginRight: 4,
  },

  stateDotActive: {
    backgroundColor: "#6CC9B1",
  },

  stateText: {
    color: "#607883",
    fontSize: 6,
    fontWeight: "700",
    letterSpacing: 0.7,
  },

  stateTextActive: {
    color: "#6CC9B1",
  },

  infoCard: {
    backgroundColor: "#0A2634",
    borderWidth: 1,
    borderColor: "#193A47",
    borderRadius: 15,
    padding: 15,
    marginTop: 18,
  },

  infoKicker: {
    color: "#F3C968",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.3,
    marginBottom: 6,
  },

  infoText: {
    color: "#718A96",
    fontSize: 9.5,
    lineHeight: 15,
  },

  footer: {
    marginTop: 24,
    paddingHorizontal: 3,
  },

  footerText: {
    color: "#6CC9B1",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 5,
  },

  footerHint: {
    color: "#526D79",
    fontSize: 9,
    lineHeight: 14,
  },

  loadingOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(7,29,43,0.72)",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingCard: {
    backgroundColor: "#0D2D3D",
    borderWidth: 1,
    borderColor: "#1B3B48",
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  loadingText: {
    color: "#FFFFFF",
    fontSize: 11,
    marginLeft: 10,
  },
});

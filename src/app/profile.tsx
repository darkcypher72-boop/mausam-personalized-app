import React from "react";
import {
  Platform,
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

import {
  Language,
  useLanguage,
} from "../hooks/useLanguage";

const LANGUAGES: Language[] = [
  "English",
  "हिन्दी",
  "অসমীয়া",
];

const LANGUAGE_LABELS: Record<Language, string> = {
  English: "English",
  "हिन्दी": "हिन्दी",
  "অসমীয়া": "অসমীয়া",
};

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();

  const {
    language,
    setLanguage,
    t,
  } = useLanguage();

  const handleLanguageChange = async (
    selectedLanguage: Language
  ) => {
    await setLanguage(selectedLanguage);
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
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: 125 + insets.bottom,
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

                <Text style={styles.brand}>
                  MAUSAM
                </Text>
              </View>

              <View style={styles.titleRow}>
                <View style={styles.titleAccent} />

                <View style={styles.titleContent}>
                  <Text style={styles.pageKicker}>
                    {t.profile.badge}
                  </Text>

                  <Text style={styles.pageTitle}>
                    {t.profile.title}
                  </Text>

                  <Text style={styles.pageSubtitle}>
                    Manage your personalised weather experience.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.headerStatus}>
              <View style={styles.statusDot} />

              <Text style={styles.statusText}>
                ACTIVE
              </Text>
            </View>
          </View>

          {/* PERSONALISATION */}
          <SectionLabel
            text={t.profile.personalisation}
          />

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.sectionIndicator} />

              <View style={styles.cardHeaderText}>
                <Text style={styles.cardEyebrow}>
                  YOUR MAUSAM
                </Text>

                <Text style={styles.cardTitle}>
                  {t.profile.weatherExperience}
                </Text>

                <Text style={styles.cardDescription}>
                  {t.profile.weatherExperienceDescription}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.75}
              onPress={() => router.push("/onboarding")}
            >
              <View style={styles.actionIcon}>
                <View style={styles.preferenceIcon}>
                  <View style={styles.preferenceLineTop} />
                  <View style={styles.preferenceLineMiddle} />
                  <View style={styles.preferenceLineBottom} />

                  <View style={styles.preferenceDotTop} />
                  <View style={styles.preferenceDotMiddle} />
                  <View style={styles.preferenceDotBottom} />
                </View>
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>
                  {t.profile.editInterests}
                </Text>

                <Text style={styles.actionSubtitle}>
                  {t.profile.editInterestsDescription}
                </Text>
              </View>

              <View style={styles.actionArrow}>
                <Text style={styles.chevron}>
                  ›
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* LANGUAGE */}
          <SectionLabel
            text={t.profile.language}
          />

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.sectionIndicator} />

              <View style={styles.cardHeaderText}>
                <Text style={styles.cardEyebrow}>
                  LANGUAGE
                </Text>

                <Text style={styles.cardTitle}>
                  {t.profile.appLanguage}
                </Text>

                <Text style={styles.cardDescription}>
                  {t.profile.appLanguageDescription}
                </Text>
              </View>
            </View>

            <View style={styles.languageList}>
              {LANGUAGES.map((item, index) => {
                const selected = language === item;

                return (
                  <TouchableOpacity
                    key={item}
                    activeOpacity={0.75}
                    onPress={() =>
                      handleLanguageChange(item)
                    }
                    style={[
                      styles.languageRow,
                      index === LANGUAGES.length - 1 &&
                        styles.languageRowLast,
                      selected &&
                        styles.languageRowSelected,
                    ]}
                  >
                    <View style={styles.languageLeft}>
                      <View
                        style={[
                          styles.languageIndex,
                          selected &&
                            styles.languageIndexSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.languageIndexText,
                            selected &&
                              styles.languageIndexTextSelected,
                          ]}
                        >
                          0{index + 1}
                        </Text>
                      </View>

                      <View>
                        <Text
                          style={[
                            styles.languageText,
                            selected &&
                              styles.languageTextSelected,
                          ]}
                        >
                          {LANGUAGE_LABELS[item]}
                        </Text>

                        {selected && (
                          <Text
                            style={styles.selectedLabel}
                          >
                            {t.profile.selected}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View
                      style={[
                        styles.radio,
                        selected &&
                          styles.radioSelected,
                      ]}
                    >
                      {selected && (
                        <View
                          style={styles.radioInner}
                        />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* LOCATION */}
          <SectionLabel
            text={t.profile.location}
          />

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.sectionIndicator} />

              <View style={styles.cardHeaderText}>
                <Text style={styles.cardEyebrow}>
                  LIVE LOCATION
                </Text>

                <Text style={styles.cardTitle}>
                  {t.profile.currentWeatherLocation}
                </Text>

                <Text style={styles.cardDescription}>
                  {t.profile.locationDescription}
                </Text>
              </View>
            </View>

            <View style={styles.locationStatus}>
              <View style={styles.locationStatusLeft}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                </View>

                <View>
                  <Text style={styles.locationStatusTitle}>
                    DEVICE LOCATION
                  </Text>

                  <Text style={styles.locationStatusSubtitle}>
                    Used for local weather data
                  </Text>
                </View>
              </View>

              <Text style={styles.liveText}>
                LIVE
              </Text>
            </View>

            <TouchableOpacity
              style={styles.actionRow}
              activeOpacity={0.75}
              onPress={() =>
                router.replace("/location")
              }
            >
              <View style={styles.actionIcon}>
                <View style={styles.locationIcon}>
                  <View style={styles.locationPinOuter}>
                    <View style={styles.locationPinInner} />
                  </View>
                </View>
              </View>

              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>
                  {t.profile.refreshLocation}
                </Text>

                <Text style={styles.actionSubtitle}>
                  {t.profile.refreshLocationDescription}
                </Text>
              </View>

              <View style={styles.actionArrow}>
                <Text style={styles.chevron}>
                  ›
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* INFORMATION */}
          <SectionLabel text="ABOUT" />

          <View style={styles.infoCard}>
            <View style={styles.infoTop}>
              <View style={styles.infoLogo}>
                <View style={styles.infoSun} />
                <View style={styles.infoHorizon} />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoBrand}>
                  MAUSAM
                </Text>

                <Text style={styles.infoDescription}>
                  {t.profile.personalizedWeather}
                </Text>
              </View>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoFooter}>
              <Text style={styles.infoTeam}>
                TEAM ASTRAL
              </Text>

              <Text style={styles.infoMeta}>
                SIH 2026 • PS 26076
              </Text>
            </View>
          </View>

          <View style={styles.bottomSpace} />
        </ScrollView>

        {/* APP BOTTOM NAVIGATION */}
        <View
          style={[
            styles.bottomNav,
            {
              bottom:
                Math.max(insets.bottom, 8) + 8,
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
            <View style={styles.navIcon}>
              <View style={styles.homeIcon}>
                <View style={styles.homeRoof} />
                <View style={styles.homeDoor} />
              </View>
            </View>

            <Text style={styles.navText}>
              {t.profile.home}
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
              style={[
                styles.navIcon,
                styles.navIconActive,
              ]}
            >
              <View style={styles.userIcon}>
                <View style={styles.userHead} />
                <View style={styles.userBody} />
              </View>
            </View>

            <Text
              style={[
                styles.navText,
                styles.navTextActive,
              ]}
            >
              {t.profile.profile}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
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

  brandHorizon: {
  position: "absolute",
  width: 20,
  height: 1.5,
  borderRadius: 2,
  backgroundColor: "#6CC9B1",
  bottom: 6,
  left: 6,
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
  brandDot: {
  position: "absolute",
  width: 3,
  height: 3,
  borderRadius: 2,
  backgroundColor: "#A1DED0",
  top: 6,
  right: 4,
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

  /* CARDS */

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

  /* ACTION */

  actionRow: {
    minHeight: 61,
    borderTopWidth: 1,
    borderTopColor: "#1B3B48",
    marginTop: 16,
    paddingTop: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#102F3D",
    borderWidth: 1,
    borderColor: "#1B4350",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  actionContent: {
    flex: 1,
  },

  actionTitle: {
    color: "#E8F0EE",
    fontSize: 13,
    fontWeight: "600",
  },

  actionSubtitle: {
    color: "#718B94",
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  actionArrow: {
    width: 25,
    alignItems: "flex-end",
  },

  chevron: {
    color: "#6CC9B1",
    fontSize: 25,
    fontWeight: "300",
  },

  /* PREFERENCE ICON */

  preferenceIcon: {
    width: 20,
    height: 18,
    position: "relative",
  },

  preferenceLineTop: {
    position: "absolute",
    width: 16,
    height: 1.4,
    backgroundColor: "#6CC9B1",
    top: 3,
    left: 2,
  },

  preferenceLineMiddle: {
    position: "absolute",
    width: 16,
    height: 1.4,
    backgroundColor: "#6CC9B1",
    top: 8,
    left: 2,
  },

  preferenceLineBottom: {
    position: "absolute",
    width: 16,
    height: 1.4,
    backgroundColor: "#6CC9B1",
    top: 13,
    left: 2,
  },

  preferenceDotTop: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#6CC9B1",
    top: 1.5,
    left: 7,
  },

  preferenceDotMiddle: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#6CC9B1",
    top: 6.5,
    left: 12,
  },

  preferenceDotBottom: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#6CC9B1",
    top: 11.5,
    left: 5,
  },

  /* LANGUAGE */

  languageList: {
    borderTopWidth: 1,
    borderTopColor: "#1B3B48",
    marginTop: 16,
  },

  languageRow: {
    minHeight: 61,
    borderBottomWidth: 1,
    borderBottomColor: "#1B3B48",
    paddingHorizontal: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  languageRowLast: {
    borderBottomWidth: 0,
  },

  languageRowSelected: {
    backgroundColor: "#102F3D",
    marginHorizontal: -5,
    paddingHorizontal: 8,
    borderRadius: 9,
    borderBottomWidth: 0,
  },

  languageLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  languageIndex: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: "#102F3D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  languageIndexSelected: {
    backgroundColor: "#153F43",
  },

  languageIndexText: {
    color: "#637D86",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  languageIndexTextSelected: {
    color: "#6CC9B1",
  },

  languageText: {
    color: "#D4E0DE",
    fontSize: 14,
    fontWeight: "600",
  },

  languageTextSelected: {
    color: "#6CC9B1",
  },

  selectedLabel: {
    color: "#5C9F8E",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 3,
  },

  radio: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#405A64",
    alignItems: "center",
    justifyContent: "center",
  },

  radioSelected: {
    borderColor: "#6CC9B1",
  },

  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#6CC9B1",
  },

  /* LOCATION */

  locationStatus: {
    marginTop: 15,
    borderWidth: 1,
    borderColor: "#193F4C",
    backgroundColor: "#0A2735",
    borderRadius: 12,
    minHeight: 54,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  locationStatusLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  liveIndicator: {
    width: 29,
    height: 29,
    borderRadius: 9,
    backgroundColor: "#102F3D",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#6CC9B1",
  },

  locationStatusTitle: {
    color: "#C9D8D5",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
  },

  locationStatusSubtitle: {
    color: "#637D86",
    fontSize: 9,
    marginTop: 2,
  },

  liveText: {
    color: "#6CC9B1",
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  locationIcon: {
    width: 19,
    height: 19,
    alignItems: "center",
    justifyContent: "center",
  },

  locationPinOuter: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderColor: "#6CC9B1",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  locationPinInner: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#6CC9B1",
  },

  /* ABOUT */

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

  /* BOTTOM NAV */

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
    borderColor: "#718B94",
    borderRadius: 2,
    marginTop: 5,
  },

  homeRoof: {
    position: "absolute",
    width: 10,
    height: 10,
    borderLeftWidth: 1.5,
    borderTopWidth: 1.5,
    borderColor: "#718B94",
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
    backgroundColor: "#718B94",
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
    borderColor: "#6CC9B1",
  },

  userBody: {
    width: 14,
    height: 7,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderColor: "#6CC9B1",
    marginTop: 2,
  },
});
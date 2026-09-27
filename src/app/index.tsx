
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

export default function SplashScreen() {
  const progress = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 45,
        useNativeDriver: true,
      }),

      Animated.timing(progress, {
        toValue: 1,
        duration: 2600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace("/onboarding");
    }, 3100);

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* Subtle background atmosphere */}
        <View style={styles.backgroundGlow} />
        <View style={styles.backgroundGlowSmall} />

        <Animated.View
          style={[
            styles.content,
            {
              opacity: fade,
              transform: [{ scale }],
            },
          ]}
        >

          {/* =========================
              LOGO
          ========================== */}

          <View style={styles.logoArea}>

            {/* Original MAUSAM symbol */}
            <View style={styles.logo}>

              {/* Outer atmospheric arc */}
              <View style={styles.outerArc} />

              {/* Sun */}
              <View style={styles.sun} />

              {/* Horizon */}
              <View style={styles.horizon} />

              {/* Small atmospheric point */}
              <View style={styles.atmosphereDot} />

            </View>

            <Text style={styles.appName}>MAUSAM</Text>

            <Text style={styles.slogan}>
              Weather, made personal.
            </Text>

          </View>


          {/* =========================
              PROGRESS
          ========================== */}

          <View style={styles.progressArea}>

            <Text style={styles.loadingText}>
              PREPARING YOUR EXPERIENCE
            </Text>

            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressWidth,
                  },
                ]}
              />
            </View>

          </View>


          {/* =========================
              FOOTER
          ========================== */}

          <View style={styles.footer}>

            <View style={styles.footerLine} />

            <Text style={styles.team}>
              TEAM ASTRAL
            </Text>

            <Text style={styles.footerText}>
              SIH 2026 • PS 26076
            </Text>

            <Text style={styles.footerText}>
              Developed for
            </Text>

            <Text style={styles.organization}>
              Ministry of Earth Sciences
            </Text>

            <Text style={styles.department}>
              India Meteorological Department
            </Text>

          </View>

        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#071D2B",
  },

  container: {
    flex: 1,
    backgroundColor: "#071D2B",
    overflow: "hidden",
  },

  /* =========================
     BACKGROUND
  ========================== */

  backgroundGlow: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: "#0D4054",
    opacity: 0.32,
    top: -190,
    right: -150,
  },

  backgroundGlowSmall: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#0B3447",
    opacity: 0.28,
    bottom: -120,
    left: -100,
  },

  /* =========================
     MAIN
  ========================== */

  content: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: 27,
    justifyContent: "space-between",
    alignItems: "center",
  },

  /* =========================
     LOGO
  ========================== */

  logoArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    width: 112,
    height: 112,
    borderRadius: 34,
    backgroundColor: "#0D2D3D",
    borderWidth: 1,
    borderColor: "rgba(125, 210, 190, 0.22)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 27,
  },

  /*
   * ORIGINAL SYMBOL
   *
   * The mark combines:
   * - rising sun
   * - atmospheric orbit
   * - horizon
   *
   * It is deliberately geometric rather than
   * resembling an existing government/weather logo.
   */

  outerArc: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#6CC9B1",
    borderBottomColor: "transparent",
    borderLeftColor: "transparent",
    transform: [{ rotate: "-35deg" }],
  },

  sun: {
    position: "absolute",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F3C968",
    top: 29,
    left: 40,
  },

  horizon: {
    position: "absolute",
    width: 56,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#6CC9B1",
    bottom: 30,
    left: 28,
  },

  atmosphereDot: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#A1DED0",
    top: 23,
    right: 26,
  },

  appName: {
    fontSize: 36,
    fontWeight: "800",
    letterSpacing: 6,
    color: "#FFFFFF",
    marginLeft: 6,
  },

  slogan: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.5,
    color: "#91AAB5",
  },

  /* =========================
     PROGRESS
  ========================== */

  progressArea: {
    width: "100%",
    maxWidth: 360,
    marginBottom: 30,
  },

  loadingText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "#718D99",
    textAlign: "center",
    marginBottom: 10,
  },

  progressTrack: {
    width: "100%",
    height: 3,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#65C6AE",
  },

  /* =========================
     FOOTER
  ========================== */

  footer: {
    width: "100%",
    alignItems: "center",
  },

  footerLine: {
    width: 32,
    height: 1,
    backgroundColor: "#52717D",
    marginBottom: 15,
  },

  team: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: "#D7E4E8",
  },

  footerText: {
    marginTop: 5,
    fontSize: 9,
    color: "#718B96",
    letterSpacing: 0.4,
  },

  organization: {
    marginTop: 10,
    fontSize: 10,
    fontWeight: "600",
    color: "#A9BEC6",
  },

  department: {
    marginTop: 3,
    fontSize: 9,
    color: "#718B96",
  },
});


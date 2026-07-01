import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import i18n from '@/lib/i18n';
import { useAppStore } from '@/lib/appStore';
import { BackgroundOrbs } from '@/components/shell/BackgroundOrbs';
import { GlassSurface } from '@/components/shell/GlassSurface';
import { GLASS_RADIUS } from '@/lib/glassStyles';
import { useOnboardingStyles } from '@/components/onboarding/onboardingStyles';

const SUPPORTED_LANGUAGES = ['en', 'am'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const GAVEL_SVG = `<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gh" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F5E6A8"/>
      <stop offset="0.45" stop-color="#F4D03F"/>
      <stop offset="0.75" stop-color="#D4A017"/>
      <stop offset="1" stop-color="#8B6914"/>
    </linearGradient>
    <linearGradient id="gh2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8B6914"/>
      <stop offset="0.5" stop-color="#D4A017"/>
      <stop offset="1" stop-color="#8B6914"/>
    </linearGradient>
    <radialGradient id="glow1" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#F4D03F" stop-opacity="0.42"/>
      <stop offset="1" stop-color="#F4D03F" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="110" cy="72" r="72" fill="url(#glow1)"/>
  <rect x="85" y="120" width="50" height="9" rx="3" fill="#8B6914"/>
  <rect x="85" y="120" width="50" height="3" rx="1" fill="#F4D03F"/>
  <rect x="103" y="58" width="14" height="62" rx="4" fill="url(#gh2)"/>
  <rect x="55" y="38" width="110" height="24" rx="7" fill="url(#gh)" stroke="#8B6914" stroke-width="1"/>
  <rect x="55" y="38" width="110" height="4" rx="2" fill="#F5E6A8" opacity="0.85"/>
  <rect x="75" y="42" width="2" height="18" fill="#8B6914" opacity="0.5"/>
  <rect x="143" y="42" width="2" height="18" fill="#8B6914" opacity="0.5"/>
  <ellipse cx="110" cy="42" rx="40" ry="2" fill="#FFFAF0" opacity="0.6"/>
  <circle cx="38" cy="42" r="2" fill="#F4D03F"/>
  <circle cx="182" cy="48" r="1.5" fill="#F4D03F"/>
  <circle cx="172" cy="108" r="1.5" fill="#F4D03F"/>
  <circle cx="42" cy="100" r="1" fill="#F4D03F"/>
</svg>`;

const STEPS_SVG = `<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="sb1" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F4D03F"/>
      <stop offset="1" stop-color="#8B6914"/>
    </linearGradient>
    <linearGradient id="sb2" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F5E6A8"/>
      <stop offset="1" stop-color="#D4A017"/>
    </linearGradient>
    <radialGradient id="glow2" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#F4D03F" stop-opacity="0.38"/>
      <stop offset="1" stop-color="#F4D03F" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="110" cy="80" r="72" fill="url(#glow2)"/>
  <rect x="40" y="98" width="36" height="32" rx="6" fill="url(#sb1)" opacity="0.45"/>
  <rect x="82" y="78" width="36" height="52" rx="6" fill="url(#sb1)" opacity="0.7"/>
  <rect x="124" y="56" width="36" height="74" rx="6" fill="url(#sb2)" stroke="#8B6914" stroke-width="0.8"/>
  <rect x="124" y="56" width="36" height="3" rx="1.5" fill="#F5E6A8"/>
  <circle cx="172" cy="64" r="15" fill="url(#sb2)" stroke="#8B6914" stroke-width="0.8"/>
  <path d="M165 64 L170 69 L179 59" stroke="#1A1308" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="38" cy="42" r="2" fill="#F4D03F"/>
  <circle cx="196" cy="100" r="1.5" fill="#F4D03F"/>
  <circle cx="48" cy="120" r="1" fill="#F4D03F"/>
</svg>`;

const BUILDING_SVG = `<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1F1F2A"/>
      <stop offset="1" stop-color="#0A0A0F"/>
    </linearGradient>
    <linearGradient id="rr" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F5E6A8"/>
      <stop offset="1" stop-color="#D4A017"/>
    </linearGradient>
    <linearGradient id="ww" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F4D03F"/>
      <stop offset="1" stop-color="#D4A017"/>
    </linearGradient>
    <radialGradient id="glow3" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#F4D03F" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#F4D03F" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="110" cy="80" r="72" fill="url(#glow3)"/>
  <polygon points="60,52 110,30 160,52" fill="url(#rr)" stroke="#8B6914" stroke-width="1"/>
  <polygon points="60,52 110,30 110,38 70,54" fill="#F5E6A8" opacity="0.55"/>
  <rect x="62" y="52" width="96" height="78" rx="4" fill="url(#bb)" stroke="#8B6914" stroke-width="0.8"/>
  <rect x="74" y="62" width="22" height="18" rx="2" fill="url(#ww)" opacity="0.95"/>
  <rect x="124" y="62" width="22" height="18" rx="2" fill="url(#ww)" opacity="0.95"/>
  <rect x="74" y="88" width="22" height="18" rx="2" fill="url(#ww)" opacity="0.7"/>
  <rect x="124" y="88" width="22" height="18" rx="2" fill="url(#ww)" opacity="0.7"/>
  <rect x="100" y="102" width="20" height="28" rx="2" fill="url(#rr)" opacity="0.75"/>
  <rect x="62" y="52" width="96" height="2" fill="#F5E6A8"/>
  <rect x="109" y="18" width="2" height="14" fill="#8B6914"/>
  <polygon points="111,18 126,22 111,26" fill="url(#rr)"/>
  <rect x="40" y="132" width="140" height="3" rx="1.5" fill="#D4A017" opacity="0.5"/>
  <circle cx="38" cy="40" r="1.5" fill="#F4D03F"/>
  <circle cx="182" cy="46" r="2" fill="#F4D03F"/>
  <circle cx="190" cy="100" r="1" fill="#F4D03F"/>
</svg>`;

const TROPHY_SVG = `<svg viewBox="0 0 220 160" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="tc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F5E6A8"/>
      <stop offset="0.5" stop-color="#F4D03F"/>
      <stop offset="1" stop-color="#D4A017"/>
    </linearGradient>
    <linearGradient id="tb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#D4A017"/>
      <stop offset="1" stop-color="#8B6914"/>
    </linearGradient>
    <radialGradient id="glow4" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#F4D03F" stop-opacity="0.48"/>
      <stop offset="1" stop-color="#F4D03F" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <circle cx="110" cy="72" r="72" fill="url(#glow4)"/>
  <rect x="85" y="122" width="50" height="9" rx="2" fill="url(#tb)"/>
  <rect x="90" y="112" width="40" height="11" rx="2" fill="url(#tc)" stroke="#8B6914" stroke-width="0.6"/>
  <rect x="105" y="92" width="10" height="22" fill="url(#tb)"/>
  <path d="M75 50 L145 50 L140 92 Q140 96 135 96 L85 96 Q80 96 80 92 Z" fill="url(#tc)" stroke="#8B6914" stroke-width="1"/>
  <ellipse cx="110" cy="50" rx="35" ry="5" fill="#F5E6A8"/>
  <ellipse cx="110" cy="50" rx="35" ry="3" fill="url(#tc)"/>
  <path d="M75 55 C60 55 55 65 55 75 C55 85 60 90 70 90" stroke="url(#tc)" stroke-width="4" fill="none" stroke-linecap="round"/>
  <path d="M145 55 C160 55 165 65 165 75 C165 85 160 90 150 90" stroke="url(#tc)" stroke-width="4" fill="none" stroke-linecap="round"/>
  <polygon points="110,62 113,70 121,70 115,75 117,83 110,78 103,83 105,75 99,70 107,70" fill="#1A1308" opacity="0.45"/>
  <ellipse cx="95" cy="68" rx="6" ry="10" fill="#FFFAF0" opacity="0.25"/>
  <circle cx="40" cy="42" r="2" fill="#F4D03F"/>
  <circle cx="182" cy="42" r="1.5" fill="#F4D03F"/>
  <circle cx="48" cy="98" r="1.5" fill="#F4D03F"/>
  <circle cx="176" cy="98" r="2" fill="#F4D03F"/>
</svg>`;

const SLIDES = ['language', 'welcome', 'howItWorks', 'forOwners', 'forBidders'] as const;
type SlideKey = (typeof SLIDES)[number];

type GoldButtonVariant = 'primary' | 'outline';

function GoldButton({
  label,
  onPress,
  variant = 'primary',
  marginTop = 0,
}: {
  label: string;
  onPress: () => void;
  variant?: GoldButtonVariant;
  marginTop?: number;
}) {
  const styles = useOnboardingStyles();
  const scale = useRef(new Animated.Value(1)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const shimmerTx = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 360],
  });

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.96,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();

  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();

  const isFilled = variant === 'primary';
  const shellStyle = [
    styles.navButtonShell,
    !isFilled && styles.navButtonOutline,
  ];

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={{ width: '100%', marginTop, alignSelf: 'stretch' }}
    >
      <Animated.View style={{ transform: [{ scale }], width: '100%' }}>
        <View style={shellStyle}>
          {isFilled ? (
            <>
              <LinearGradient
                colors={['#8B6914', '#F4D03F', '#D4A017', '#8B6914']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: 'rgba(255, 250, 240, 0.55)',
                }}
              />
              <Animated.View
                style={[styles.shimmerOverlay, { transform: [{ translateX: shimmerTx }, { skewX: '-20deg' }] }]}
              />
            </>
          ) : null}
          <View style={styles.navButtonInner}>
            <Text style={[styles.navButtonText, !isFilled && styles.navButtonTextOutline]}>{label}</Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function FloatingIllustration({ svg, a11yLabel }: { svg: string; a11yLabel: string }) {
  const styles = useOnboardingStyles();
  const { width, height } = useWindowDimensions();
  const illustrationWidth = width * 0.74;
  const illustrationHeight = Math.min(width * 0.45, height * 0.2);
  const glowSize = Math.min(width * 0.7, illustrationHeight * 1.4);
  const float = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0,
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoop.start();
    glowLoop.start();
    return () => {
      floatLoop.stop();
      glowLoop.stop();
    };
  }, [float, glow]);

  const ty = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const glowScale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.1] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] });

  return (
    <View style={[styles.illustrationArea, { width: illustrationWidth, height: illustrationHeight }]}>
      <Animated.View
        style={[
          styles.illustrationGlow,
          { width: glowSize, height: glowSize, transform: [{ scale: glowScale }], opacity: glowOpacity },
        ]}
      />
      <Animated.View style={{ flex: 1, width: '100%', height: '100%', transform: [{ translateY: ty }] }}>
        <SvgXml
          xml={svg}
          width="100%"
          height="100%"
          accessibilityLabel={a11yLabel}
        />
      </Animated.View>
    </View>
  );
}

function SlideScroll({
  width,
  children,
}: {
  width: number;
  children: ReactNode;
}) {
  const styles = useOnboardingStyles();
  return (
    <View style={[styles.slide, { width }]}>
      <ScrollView
        style={styles.slideScroll}
        contentContainerStyle={styles.slideScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </View>
  );
}

function PaginationDot({ active, delay }: { active: boolean; delay: number }) {
  const styles = useOnboardingStyles();
  const w = useRef(new Animated.Value(active ? 26 : 6)).current;
  useEffect(() => {
    Animated.timing(w, {
      toValue: active ? 26 : 6,
      duration: 280,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [active, delay, w]);

  return (
    <Animated.View
      style={[
        styles.dot,
        active && styles.dotActive,
        { width: w },
      ]}
    />
  );
}

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const styles = useOnboardingStyles();
  const { width: SCREEN_WIDTH } = useWindowDimensions();
  const flatListRef = useRef<FlatList<SlideKey>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [language, setLanguage] = useState<SupportedLanguage>('en');

  const slideEntrance = useRef(new Animated.Value(0)).current;
  const stepAnims = useRef([1, 2, 3, 4].map(() => new Animated.Value(0))).current;
  const stepAnimationPlayed = useRef(false);

  useEffect(() => {
    slideEntrance.setValue(0);
    Animated.timing(slideEntrance, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [slideEntrance]);

  useEffect(() => {
    if (currentIndex === 2 && !stepAnimationPlayed.current) {
      stepAnimationPlayed.current = true;
      stepAnims.forEach((a) => a.setValue(0));
      Animated.stagger(
        110,
        stepAnims.map((a) =>
          Animated.timing(a, {
            toValue: 1,
            duration: 420,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ).start();
    }
  }, [currentIndex, stepAnims]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      if (viewableItems[0]?.index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  const viewabilityConfig = { itemVisiblePercentThreshold: 50 };

  const scrollToIndex = (index: number) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
  };

  const handleSkip = () => scrollToIndex(4);
  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) scrollToIndex(currentIndex + 1);
  };
  const handleBack = () => {
    if (currentIndex > 0) scrollToIndex(currentIndex - 1);
  };

  const handleGetStarted = () => {
    useAppStore.getState().setOnboardingComplete(true);
    router.replace('/(tabs)/dashboard');
  };

  const entranceOpacity = slideEntrance;
  const entranceY = slideEntrance.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  const svgMap: Record<string, { svg: string; a11yKey: string }> = {
    welcome: { svg: GAVEL_SVG, a11yKey: 'welcomeA11y' },
    howItWorks: { svg: STEPS_SVG, a11yKey: 'howItWorksA11y' },
    forOwners: { svg: BUILDING_SVG, a11yKey: 'forOwnersA11y' },
    forBidders: { svg: TROPHY_SVG, a11yKey: 'forBiddersA11y' },
  };

  const renderLanguageSlide = () => (
    <View style={[styles.languageSlide, { width: SCREEN_WIDTH }]}>
      <ScrollView
        style={styles.slideScroll}
        contentContainerStyle={styles.languageScrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View
          style={{
            opacity: entranceOpacity,
            transform: [{ translateY: entranceY }],
          }}
        >
          <View style={styles.titleAccent}>
            <View style={styles.titleAccentLine} />
            <View style={styles.titleAccentDiamond} />
            <View style={styles.titleAccentLine} />
          </View>
          <Text style={styles.languageTitle}>{t('onboarding.languageTitle')}</Text>
          <Text style={styles.languageSubtitle}>{t('onboarding.selectLanguage')}</Text>

          {(SUPPORTED_LANGUAGES as readonly SupportedLanguage[]).map((lang) => {
            const active = language === lang;
            const label = lang === 'en' ? t('onboarding.english') : t('onboarding.amharic');
            return (
              <TouchableOpacity
                key={lang}
                style={styles.languageCardShell}
                onPress={() => { setLanguage(lang); i18n.changeLanguage(lang); }}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                activeOpacity={0.92}
              >
                <GlassSurface
                  active={active}
                  borderRadius={GLASS_RADIUS.pill}
                  padding={0}
                  contentStyle={styles.languageCardInner}
                >
                  <Text style={[styles.languageCardText, active && styles.languageCardTextActive]}>
                    {label}
                  </Text>
                  {active && (
                    <View style={styles.languageCheckBadge}>
                      <View style={styles.languageCheckBadgeCircle}>
                        <Text style={styles.languageCheckBadgeText}>✓</Text>
                      </View>
                    </View>
                  )}
                </GlassSurface>
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </ScrollView>
    </View>
  );

  const renderWelcomeSlide = () => (
    <SlideScroll width={SCREEN_WIDTH}>
      <Animated.View
        style={[
          styles.slideContent,
          { opacity: entranceOpacity, transform: [{ translateY: entranceY }] },
        ]}
      >
        <FloatingIllustration
          svg={svgMap.welcome.svg}
          a11yLabel={t(`onboarding.illustrations.${svgMap.welcome.a11yKey}`)}
        />
        <View style={styles.textArea}>
          <View style={styles.titleAccent}>
            <View style={styles.titleAccentLine} />
            <View style={styles.titleAccentDiamond} />
            <View style={styles.titleAccentLine} />
          </View>
          <Text style={styles.subtitle}>{t('onboarding.welcome.subtitle')}</Text>
          <Text style={styles.title}>{t('onboarding.welcome.title')}</Text>
          <Text style={styles.bodyText}>{t('onboarding.welcome.body')}</Text>
        </View>
      </Animated.View>
    </SlideScroll>
  );

  const renderHowItWorksSlide = () => (
    <SlideScroll width={SCREEN_WIDTH}>
      <Animated.View
        style={[
          styles.slideContent,
          { opacity: entranceOpacity, transform: [{ translateY: entranceY }] },
        ]}
      >
        <FloatingIllustration
          svg={svgMap.howItWorks.svg}
          a11yLabel={t(`onboarding.illustrations.${svgMap.howItWorks.a11yKey}`)}
        />
        <View style={styles.textArea}>
          <Text style={styles.title}>{t('onboarding.howItWorks.title')}</Text>
          <View style={{ width: '100%', marginTop: 8 }}>
            {[1, 2, 3, 4].map((step, idx) => {
              const a = stepAnims[idx];
              const opacity = a;
              const ty = a.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
              return (
                <Animated.View
                  key={step}
                  style={[styles.stepCardShell, { opacity, transform: [{ translateY: ty }] }]}
                >
                  <GlassSurface borderRadius={GLASS_RADIUS.input} padding={0} contentStyle={styles.stepCardInner}>
                    <View style={styles.stepNumber}>
                      <LinearGradient
                        colors={['#F5E6A8', '#F4D03F', '#D4A017']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          borderRadius: 19,
                        }}
                      />
                      <Text style={styles.stepNumberText}>{step}</Text>
                    </View>
                    <View style={styles.stepTextArea}>
                      <Text style={styles.stepTitle}>
                        {t(`onboarding.howItWorks.step${step}Title`)}
                      </Text>
                      <Text style={styles.stepDesc}>
                        {t(`onboarding.howItWorks.step${step}Desc`)}
                      </Text>
                    </View>
                  </GlassSurface>
                </Animated.View>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </SlideScroll>
  );

  const renderOwnersSlide = () => (
    <SlideScroll width={SCREEN_WIDTH}>
      <Animated.View
        style={[
          styles.slideContent,
          { opacity: entranceOpacity, transform: [{ translateY: entranceY }] },
        ]}
      >
        <FloatingIllustration
          svg={svgMap.forOwners.svg}
          a11yLabel={t(`onboarding.illustrations.${svgMap.forOwners.a11yKey}`)}
        />
        <View style={styles.textArea}>
          <View style={styles.titleAccent}>
            <View style={styles.titleAccentLine} />
            <View style={styles.titleAccentDiamond} />
            <View style={styles.titleAccentLine} />
          </View>
          <Text style={styles.title}>{t('onboarding.forOwners.title')}</Text>
          <View style={{ width: '100%', marginTop: 12, alignItems: 'flex-start' }}>
            {[1, 2, 3].map((f) => (
              <View key={f} style={styles.featureItem}>
                <View style={styles.featureBulletOuter}>
                  <View style={styles.featureBullet} />
                </View>
                <Text style={styles.featureText}>
                  {t(`onboarding.forOwners.feature${f}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </SlideScroll>
  );

  const renderBiddersSlide = () => (
    <SlideScroll width={SCREEN_WIDTH}>
      <Animated.View
        style={[
          styles.slideContent,
          { opacity: entranceOpacity, transform: [{ translateY: entranceY }] },
        ]}
      >
        <FloatingIllustration
          svg={svgMap.forBidders.svg}
          a11yLabel={t(`onboarding.illustrations.${svgMap.forBidders.a11yKey}`)}
        />
        <View style={styles.textArea}>
          <View style={styles.titleAccent}>
            <View style={styles.titleAccentLine} />
            <View style={styles.titleAccentDiamond} />
            <View style={styles.titleAccentLine} />
          </View>
          <Text style={styles.title}>{t('onboarding.forBidders.title')}</Text>
          <View style={{ width: '100%', marginTop: 12, alignItems: 'flex-start' }}>
            {[1, 2, 3].map((f) => (
              <View key={f} style={styles.featureItem}>
                <View style={styles.featureBulletOuter}>
                  <View style={styles.featureBullet} />
                </View>
                <Text style={styles.featureText}>
                  {t(`onboarding.forBidders.feature${f}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </Animated.View>
    </SlideScroll>
  );

  const renderSlide = (key: SlideKey) => {
    switch (key) {
      case 'language':
        return renderLanguageSlide();
      case 'welcome':
        return renderWelcomeSlide();
      case 'howItWorks':
        return renderHowItWorksSlide();
      case 'forOwners':
        return renderOwnersSlide();
      case 'forBidders':
        return renderBiddersSlide();
    }
  };

  const getItemLayout = (
    _: ArrayLike<SlideKey> | null | undefined,
    index: number,
  ) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  });

  const onScrollToIndexFailed = (info: { index: number }) => {
    flatListRef.current?.scrollToOffset({
      offset: info.index * SCREEN_WIDTH,
      animated: true,
    });
  };

  const showSkip = currentIndex >= 0 && currentIndex <= 3;
  const isLastSlide = currentIndex === 4;
  const isFirstSlide = currentIndex === 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <BackgroundOrbs />

        <View style={styles.topBar}>
          {showSkip ? (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.skip')}
              activeOpacity={0.8}
            >
              <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={({ item }) => renderSlide(item)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={getItemLayout}
          onScrollToIndexFailed={onScrollToIndexFailed}
          keyExtractor={(item) => item}
          style={{ flex: 1 }}
          scrollEventThrottle={16}
        />

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {SLIDES.map((_, index) => (
              <PaginationDot key={index} active={index === currentIndex} delay={index * 30} />
            ))}
          </View>

          {isLastSlide ? (
            <GoldButton label={t('onboarding.getStarted')} onPress={handleGetStarted} variant="primary" />
          ) : (
            <View style={styles.navRow}>
              {isFirstSlide ? (
                <View style={styles.navRowSlot} />
              ) : (
                <View style={styles.navRowSlot}>
                  <GoldButton label={t('onboarding.back')} onPress={handleBack} variant="outline" />
                </View>
              )}
              <View style={styles.navRowSlot}>
                <GoldButton
                  label={currentIndex === 0 ? t('onboarding.continue') : t('onboarding.next')}
                  onPress={handleNext}
                  variant="primary"
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

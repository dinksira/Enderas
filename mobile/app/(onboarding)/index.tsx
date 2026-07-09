import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Animated,
  Easing,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { SvgXml } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import i18n from '@/lib/i18n';
import { useAppStore, useTheme } from '@/lib/appStore';
import { GoldButton } from '@/components/auth';
import { BackgroundOrbs } from '@/components/shell/BackgroundOrbs';
import { GlassSurface } from '@/components/shell/GlassSurface';
import { GLASS_RADIUS } from '@/lib/glassStyles';
import { useOnboardingStyles } from '@/components/onboarding/onboardingStyles';
import { createOnboardingIllustrations } from '@/components/onboarding/onboardingIllustrations';

const SUPPORTED_LANGUAGES = ['en', 'am'] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const SLIDES = ['language', 'welcome', 'howItWorks', 'forOwners', 'forBidders'] as const;
type SlideKey = (typeof SLIDES)[number];

function FloatingGavelIllustration({ a11yLabel }: { a11yLabel: string }) {
  const styles = useOnboardingStyles();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const illustrationWidth = width * 0.74;
  const illustrationHeight = Math.min(width * 0.45, height * 0.2);
  const glowSize = Math.min(width * 0.55, illustrationHeight * 1.1);
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
    <View
      style={[styles.illustrationArea, { width: illustrationWidth, height: illustrationHeight }]}
      accessibilityLabel={a11yLabel}
    >
      <Animated.View
        style={[
          styles.gavelGlow,
          { width: glowSize, height: glowSize, transform: [{ scale: glowScale }], opacity: glowOpacity },
        ]}
      />
      <Animated.View style={[styles.gavelIconWrapper, { transform: [{ translateY: ty }] }]}>
        <MaterialCommunityIcons name="gavel" size={72} color={colors.goldBright} />
      </Animated.View>
    </View>
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
  const { colors } = useTheme();
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

  const illustrations = useMemo(() => createOnboardingIllustrations(colors), [colors]);

  const svgMap: Record<string, { svg: string; a11yKey: string }> = useMemo(
    () => ({
      howItWorks: { svg: illustrations.steps, a11yKey: 'howItWorksA11y' },
      forOwners: { svg: illustrations.building, a11yKey: 'forOwnersA11y' },
      forBidders: { svg: illustrations.trophy, a11yKey: 'forBiddersA11y' },
    }),
    [illustrations],
  );

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
        <FloatingGavelIllustration
          a11yLabel={t('onboarding.illustrations.welcomeA11y')}
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
                        colors={[colors.goldChampagne, colors.goldBright, colors.gold]}
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
            <GoldButton label={t('onboarding.getStarted')} onPress={handleGetStarted} variant="primary" compact />
          ) : (
            <View style={styles.navRow}>
              {isFirstSlide ? (
                <View style={styles.navRowSlot} />
              ) : (
                <View style={styles.navRowSlot}>
                  <GoldButton label={t('onboarding.back')} onPress={handleBack} variant="outline" compact />
                </View>
              )}
              <View style={styles.navRowSlot}>
                <GoldButton
                  label={currentIndex === 0 ? t('onboarding.continue') : t('onboarding.next')}
                  onPress={handleNext}
                  variant="primary"
                  compact
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

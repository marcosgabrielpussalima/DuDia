import { useMemo } from "react";
import { Image, StyleSheet, View, type ViewProps } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type Tokens } from "@/src/theme";
import { Text } from "@/src/components/ui/Text";

export interface ScreenHeaderProps extends ViewProps {
  title: string;
  subtitle?: string;
  brand?: string;
  trailing?: React.ReactNode;
  compact?: boolean;
}

export function ScreenHeader({
  title,
  subtitle,
  brand,
  trailing,
  compact = false,
  style,
  children,
  ...rest
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const styles = useMemo(() => makeStyles(tokens), [tokens]);
  const isCompact = compact;
  const headerStyles = isCompact ? styles.headerCompact : styles.header;
  const topRowStyles = isCompact ? styles.topRowCompact : styles.topRow;
  const titleStyles = isCompact ? styles.titleCompact : styles.title;
  const subtitleStyles = isCompact ? styles.subtitleCompact : styles.subtitle;
  const verticalInset = isCompact ? tokens.spacing.sm : tokens.spacing.md;

  return (
    <View
      {...rest}
      style={[headerStyles, { paddingTop: insets.top + verticalInset }, style]}
    >
      <View style={topRowStyles}>
        <View style={styles.brandLockup}>
          <Image
            source={require("@/assets/branding/DudiaL.png")}
            resizeMode="contain"
            style={[styles.logo, isCompact && styles.logoCompact]}
            accessibilityRole="image"
            accessibilityLabel="Logo do DuDia"
          />
          <Text variant="heading" style={styles.wordmark}>
            DuDia
          </Text>
        </View>
        {trailing}
      </View>
      {brand ? (
        <Text variant="overline" style={styles.brand}>
          {brand}
        </Text>
      ) : null}
      {children}
      <Text variant="title" tone="inverse" style={titleStyles}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="caption" style={subtitleStyles}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function makeStyles(t: Tokens) {
  return StyleSheet.create({
    header: {
      backgroundColor: t.palette.primary,
      paddingHorizontal: t.spacing.xxl,
      paddingBottom: t.spacing.xxl,
      borderBottomLeftRadius: t.radius.xl,
      borderBottomRightRadius: t.radius.xl,
    },
    headerCompact: {
      backgroundColor: t.palette.primary,
      paddingHorizontal: t.spacing.lg,
      paddingBottom: t.spacing.lg,
      borderBottomLeftRadius: t.radius.xl,
      borderBottomRightRadius: t.radius.xl,
    },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: t.spacing.md,
    },
    topRowCompact: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: t.spacing.xs,
    },
    brandLockup: { flexDirection: "row", alignItems: "center", gap: t.spacing.sm, flexShrink: 1 },
    logo: { width: 44, height: 44, flexShrink: 0 },
    logoCompact: { width: 36, height: 36 },
    wordmark: { color: t.palette.primaryForeground, fontWeight: "900", flexShrink: 1 },
    brand: { color: t.palette.primaryForeground, marginBottom: t.spacing.xxs },
    title: {
      color: t.palette.primaryForeground,
      fontSize: 30,
      fontWeight: "900",
    },
    titleCompact: {
      color: t.palette.primaryForeground,
      fontSize: 22,
      lineHeight: 26,
      fontWeight: "800",
    },
    subtitle: {
      marginTop: t.spacing.xs,
      color: t.palette.primaryForeground,
      fontSize: 14,
      fontWeight: "600",
    },
    subtitleCompact: {
      marginTop: t.spacing.xxs,
      color: t.palette.primaryForeground,
      fontSize: 12,
      fontWeight: "600",
    },
  });
}

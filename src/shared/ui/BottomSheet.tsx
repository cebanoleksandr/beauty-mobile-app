/**
 * Modal bottom sheet in the app's style (Settings "Edit profile" / Switch
 * Mode sheets): dimmed backdrop, rounded card with a handle, optional title
 * + subtitle, keyboard-aware. Content scrolls when it outgrows the screen.
 */
import React, { useEffect, useRef, type ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { makeStyles } from '../../theme';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  /** Fixed area under the scrollable content (primary actions). */
  footer?: ReactNode;
  /** Runs each time the sheet opens — seed form state here. */
  onShow?: () => void;
  children: ReactNode;
}

export function BottomSheet({ visible, onClose, title, subtitle, footer, onShow, children }: BottomSheetProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const onShowRef = useRef(onShow);
  onShowRef.current = onShow;
  // Not Modal's onShow: that fires after the open animation (a frame of stale
  // content) and not at all in some environments.
  useEffect(() => {
    if (visible) onShowRef.current?.();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          {(title || subtitle) && (
            <View style={styles.header}>
              {!!title && (
                <Text style={styles.title} accessibilityRole="header">
                  {title}
                </Text>
              )}
              {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          )}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = makeStyles(t => ({
  flex: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: t.colors.overlay,
  },
  sheet: {
    paddingTop: 9,
    paddingHorizontal: t.spacing.xl,
    borderTopLeftRadius: t.radii.xxl,
    borderTopRightRadius: t.radii.xxl,
    borderTopWidth: t.borderWidth.thin,
    borderColor: t.colors.glassBorderStrong,
    backgroundColor: t.colors.card,
    boxShadow: '0px -12px 20px 0px rgba(0, 0, 0, 0.6)',
    maxHeight: '88%',
  },
  handle: {
    alignSelf: 'center',
    width: 48,
    height: 4,
    borderRadius: t.radii.full,
    backgroundColor: 'rgba(53, 52, 56, 0.8)',
  },
  header: {
    marginTop: t.spacing.lg,
    gap: 2,
  },
  title: {
    fontFamily: t.fontFamily.semibold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: t.colors.text,
  },
  subtitle: {
    ...t.typography.bodySmall,
    color: t.colors.textSecondary,
  },
  body: { flexGrow: 0 },
  bodyContent: { paddingTop: t.spacing.md },
  footer: { paddingTop: t.spacing.lg, gap: t.spacing.sm },
}));

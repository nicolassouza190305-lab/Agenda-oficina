// ============================================================
// LoginScreen - Tela 1 (Login / Cadastro)
// Desenvolvido em conjunto pela dupla (Nicolas + Luiz)
// Toggle entre perfil "Cliente" e "Oficina" + navegação para Tabs
// ============================================================

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius } from "../theme";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1762604462421-fff920b0c418?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbW9kZXJuJTIwZ2FyYWdlJTIwd29ya3Nob3AlMjBpbnRlcmlvciUyMG1vb2R5fGVufDB8fHx8MTc5MTU1NzEyMnww&ixlib=rb-4.1.0&q=85";

export default function LoginScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [perfil, setPerfil] = useState("Cliente"); // "Cliente" | "Oficina"
  const [modo, setModo] = useState("Entrar"); // "Entrar" | "Cadastrar"
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");

  const entrar = () => {
    if (!email.trim() || !senha.trim()) {
      setErro("Preencha email e senha para continuar.");
      return;
    }
    setErro("");
    // Navega para o grupo de abas (Veículos / Agenda / IA)
    navigation.replace("Tabs", { perfil });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* HERO IMAGE */}
            <View style={styles.heroWrap}>
              <Image source={{ uri: HERO_IMAGE }} style={styles.hero} contentFit="cover" />
              <LinearGradient
                colors={["rgba(17,17,19,0)", "rgba(17,17,19,0.6)", colors.surface]}
                style={styles.heroScrim}
              />
              <View style={[styles.heroText, { top: insets.top + spacing.lg }]}>
                <View style={styles.marcaRow}>
                  <View style={styles.marcaIcone} />
                  <Text style={styles.marcaTexto}>OFICINA SERVICE</Text>
                </View>
                <Text style={styles.heroTitulo}>Agenda de{"\n"}Serviços</Text>
                <Text style={styles.heroSub}>
                  Agende, confirme e gerencie seus serviços automotivos.
                </Text>
              </View>
            </View>

            {/* FORM */}
            <View style={styles.form}>
              {/* Toggle Cliente / Oficina */}
              <View style={styles.toggle} testID="perfil-toggle">
                <Pressable
                  onPress={() => setPerfil("Cliente")}
                  style={[styles.toggleItem, perfil === "Cliente" && styles.toggleItemAtivo]}
                  testID="perfil-cliente"
                >
                  <Text
                    style={[
                      styles.toggleTexto,
                      perfil === "Cliente" && styles.toggleTextoAtivo,
                    ]}
                  >
                    Sou Cliente
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => setPerfil("Oficina")}
                  style={[styles.toggleItem, perfil === "Oficina" && styles.toggleItemAtivo]}
                  testID="perfil-oficina"
                >
                  <Text
                    style={[
                      styles.toggleTexto,
                      perfil === "Oficina" && styles.toggleTextoAtivo,
                    ]}
                  >
                    Sou Oficina
                  </Text>
                </Pressable>
              </View>

              {/* Inputs */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="voce@exemplo.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                  testID="login-email-input"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <TextInput
                  value={senha}
                  onChangeText={setSenha}
                  placeholder="••••••••"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  style={styles.input}
                  testID="login-senha-input"
                />
              </View>

              {erro ? (
                <Text style={styles.erro} testID="login-erro">
                  {erro}
                </Text>
              ) : null}

              {/* CTA */}
              <Pressable
                onPress={entrar}
                style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
                testID="login-submit-button"
              >
                <Text style={styles.ctaTexto}>
                  {modo === "Entrar" ? "Entrar" : "Cadastrar"} como {perfil}
                </Text>
              </Pressable>

              {/* Alternar modo */}
              <Pressable
                onPress={() => setModo(modo === "Entrar" ? "Cadastrar" : "Entrar")}
                style={styles.alternar}
                testID="login-toggle-modo"
              >
                <Text style={styles.alternarTexto}>
                  {modo === "Entrar"
                    ? "Novo por aqui? Criar conta"
                    : "Já tem conta? Fazer login"}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    paddingBottom: spacing.xl,
  },
  heroWrap: {
    width: "100%",
    height: 340,
    position: "relative",
  },
  hero: {
    width: "100%",
    height: "100%",
  },
  heroScrim: {
    ...StyleSheet.absoluteFillObject,
  },
  heroText: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
  },
  marcaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  marcaIcone: {
    width: 10,
    height: 10,
    backgroundColor: colors.brandPrimary,
    marginRight: spacing.sm,
  },
  marcaTexto: {
    color: colors.brandPrimary,
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "700",
  },
  heroTitulo: {
    color: colors.onSurface,
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 42,
  },
  heroSub: {
    color: colors.onSurfaceSecondary,
    fontSize: 14,
    marginTop: spacing.sm,
    maxWidth: 280,
  },
  form: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  toggle: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleItem: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: "center",
    borderRadius: radius.pill,
  },
  toggleItemAtivo: {
    backgroundColor: colors.brandPrimary,
  },
  toggleTexto: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
  },
  toggleTextoAtivo: {
    color: colors.onBrandPrimary,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: spacing.xs + 2,
  },
  input: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: Platform.OS === "ios" ? spacing.md : spacing.sm + 2,
    color: colors.onSurface,
    fontSize: 15,
  },
  erro: {
    color: colors.error,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  cta: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  ctaPressed: {
    opacity: 0.8,
  },
  ctaTexto: {
    color: colors.onBrandPrimary,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  alternar: {
    marginTop: spacing.lg,
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  alternarTexto: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600",
  },
});

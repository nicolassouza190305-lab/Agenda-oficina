// ============================================================
// Header - componente compartilhado entre as telas da oficina
// Desenvolvido em conjunto pela dupla (Nicolas + Luiz)
// ============================================================

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../theme";
import { useAuth } from "../context/AuthContext";

export default function Header({ titulo, subtitulo, acao, onAcao, testID }) {
  const { usuario, sair } = useAuth();
  return (
    <View style={styles.container} testID={testID ?? "app-header"}>
      <View style={styles.textos}>
        <View style={styles.marca}>
          <View style={styles.marcaIcone} />
          <Text style={styles.marcaTexto}>OFICINA</Text>
          {usuario ? (
            <Pressable onPress={sair} hitSlop={10} style={styles.sair} testID="btn-sair">
              <Text style={styles.sairTexto} numberOfLines={1}>
                {usuario.nome.split(" ")[0]} · <Text style={styles.sairLink}>Sair</Text>
              </Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={styles.titulo} testID="header-title">
          {titulo}
        </Text>
        {subtitulo ? (
          <Text style={styles.subtitulo} testID="header-subtitle">
            {subtitulo}
          </Text>
        ) : null}
      </View>

      {acao ? (
        <Pressable
          onPress={onAcao}
          style={({ pressed }) => [styles.botaoAcao, pressed && styles.botaoAcaoPressed]}
          testID="header-action-button"
        >
          <Text style={styles.botaoAcaoTexto}>{acao}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  textos: {
    flex: 1,
  },
  marca: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sair: {
    marginLeft: "auto",
    maxWidth: 160,
  },
  sairTexto: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "600",
  },
  sairLink: {
    color: colors.onSurface,
    textDecorationLine: "underline",
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
  titulo: {
    color: colors.onSurface,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitulo: {
    color: colors.muted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  botaoAcao: {
    backgroundColor: colors.brandPrimary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.pill,
    marginLeft: spacing.md,
  },
  botaoAcaoPressed: {
    opacity: 0.75,
  },
  botaoAcaoTexto: {
    color: colors.onBrandPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
});

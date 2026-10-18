// ============================================================
// DiaSelector - chips horizontais com os próximos dias
// Usado na Agenda (oficina) e em Horários (cliente)
// ============================================================

import React from "react";
import { ScrollView, Pressable, Text, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../theme";

export default function DiaSelector({ dias, selecionado, onSelecionar }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.conteudo}
      style={styles.scroll}
      testID="dia-selector"
    >
      {dias.map((d) => {
        const ativo = d.iso === selecionado;
        return (
          <Pressable
            key={d.iso}
            onPress={() => onSelecionar(d.iso)}
            style={[styles.chip, ativo && styles.chipAtivo]}
            testID={`dia-${d.iso}`}
          >
            <Text style={[styles.rotulo, ativo && styles.textoAtivo]}>{d.rotulo}</Text>
            <Text style={[styles.sub, ativo && styles.textoAtivo]}>{d.sub}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0, marginTop: spacing.lg },
  conteudo: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  chip: {
    minWidth: 68,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  chipAtivo: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  rotulo: { color: colors.onSurface, fontSize: 13, fontWeight: "800" },
  sub: { color: colors.muted, fontSize: 11, marginTop: 2, fontWeight: "600" },
  textoAtivo: { color: colors.onBrandPrimary },
});

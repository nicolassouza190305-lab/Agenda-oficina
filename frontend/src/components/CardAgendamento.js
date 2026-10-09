// ============================================================
// CardAgendamento - card de um agendamento na Agenda do Dia
// Desenvolvido por Luiz: manipulação de status da agenda
// ============================================================

import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors, spacing, radius } from "../theme";

// Mapeia o status ao estilo da badge (cor de fundo + cor do texto)
function corDoStatus(status) {
  switch (status) {
    case "Confirmado":
      return { bg: colors.success, fg: colors.onSuccess };
    case "Em Andamento":
      return { bg: colors.brandSecondary, fg: colors.onBrandSecondary };
    case "Recusado":
      return { bg: colors.error, fg: colors.onError };
    case "Agendado":
    default:
      return { bg: colors.warning, fg: colors.onWarning };
  }
}

export default function CardAgendamento({ item, onConfirmar, onRecusar }) {
  const cores = corDoStatus(item.status);
  const podeAgir = item.status === "Agendado";

  return (
    <View style={styles.linha} testID={`agendamento-${item.id}`}>
      {/* Coluna do horário (lado esquerdo) */}
      <View style={styles.horarioCol}>
        <Text style={styles.horarioTexto}>{item.horario}</Text>
        <View style={styles.timelineDot} />
        <View style={styles.timelineLinha} />
      </View>

      {/* Card principal */}
      <View style={styles.card}>
        <View style={styles.cardTopo}>
          <Text style={styles.cliente} numberOfLines={1}>
            {item.cliente}
          </Text>
          <View style={[styles.badge, { backgroundColor: cores.bg }]} testID={`badge-${item.id}`}>
            <Text style={[styles.badgeTexto, { color: cores.fg }]}>{item.status}</Text>
          </View>
        </View>

        <Text style={styles.servico} numberOfLines={2}>
          {item.servico}
        </Text>

        <View style={styles.veiculoLinha}>
          <Text style={styles.veiculo} numberOfLines={1}>
            {item.veiculo}
          </Text>
          <View style={styles.placaBox}>
            <Text style={styles.placaTexto}>{item.placa}</Text>
          </View>
        </View>

        {podeAgir ? (
          <View style={styles.acoes}>
            <Pressable
              onPress={() => onRecusar?.(item.id)}
              style={({ pressed }) => [styles.btnRecusar, pressed && styles.btnPressed]}
              testID={`btn-recusar-${item.id}`}
            >
              <Text style={styles.btnRecusarTexto}>Recusar</Text>
            </Pressable>
            <Pressable
              onPress={() => onConfirmar?.(item.id)}
              style={({ pressed }) => [styles.btnConfirmar, pressed && styles.btnPressed]}
              testID={`btn-confirmar-${item.id}`}
            >
              <Text style={styles.btnConfirmarTexto}>Confirmar</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: "row",
    marginBottom: spacing.lg,
  },
  horarioCol: {
    width: 60,
    alignItems: "center",
    paddingTop: spacing.md,
  },
  horarioTexto: {
    color: colors.onSurfaceTertiary,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brandPrimary,
    marginTop: spacing.sm,
  },
  timelineLinha: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginTop: spacing.xs,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  cliente: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
    marginRight: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  badgeTexto: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  servico: {
    color: colors.onSurfaceSecondary,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  veiculoLinha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  veiculo: {
    color: colors.muted,
    fontSize: 13,
    flex: 1,
    marginRight: spacing.sm,
  },
  placaBox: {
    backgroundColor: colors.surfaceTertiary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  placaTexto: {
    color: colors.onSurfaceTertiary,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  acoes: {
    flexDirection: "row",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  btnRecusar: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  btnRecusarTexto: {
    color: colors.onSurfaceSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  btnConfirmar: {
    flex: 1,
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.sm,
    alignItems: "center",
  },
  btnConfirmarTexto: {
    color: colors.onBrandPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  btnPressed: {
    opacity: 0.75,
  },
});

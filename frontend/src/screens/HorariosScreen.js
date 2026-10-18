// ============================================================
// HorariosScreen - Tela do CLIENTE: dias e horários para agendamento
// Somente consulta: mostra apenas se cada horário está disponível
// ou ocupado. Nenhum dado de outros clientes (nome, veículo, serviço)
// chega até esta tela.
// ============================================================

import React, { useCallback, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";
import DiaSelector from "../components/DiaSelector";
import { listarHorariosOcupados } from "../database/db";
import { HORARIOS_ATENDIMENTO } from "../mocks/data";
import { proximosDias, descreverDia, hojeISO, horaAgora } from "../utils/datas";
import { colors, spacing, radius } from "../theme";

export default function HorariosScreen() {
  const insets = useSafeAreaInsets();
  const dias = useMemo(() => proximosDias(7), []);
  const [dia, setDia] = useState(dias[0].iso);
  const [ocupados, setOcupados] = useState([]);
  const [erro, setErro] = useState("");

  // Recarrega ao trocar de dia e sempre que a aba ganha foco
  useFocusEffect(
    useCallback(() => {
      let ativo = true;
      listarHorariosOcupados(dia)
        .then((lista) => {
          if (!ativo) return;
          setOcupados(lista);
          setErro("");
        })
        .catch((e) => ativo && setErro("Não foi possível carregar os horários."));
      return () => {
        ativo = false;
      };
    }, [dia])
  );

  const agora = horaAgora();
  const ehHoje = dia === hojeISO();

  const slots = HORARIOS_ATENDIMENTO.map((hora) => {
    let estado = "livre";
    if (ocupados.includes(hora)) estado = "ocupado";
    else if (ehHoje && hora <= agora) estado = "encerrado";
    return { hora, estado };
  });
  const livres = slots.filter((s) => s.estado === "livre").length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        titulo="Horários"
        subtitulo="Dias e horários para agendamento"
        testID="horarios-header"
      />

      <DiaSelector dias={dias} selecionado={dia} onSelecionar={setDia} />

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={styles.diaTitulo} testID="horarios-dia">
          {descreverDia(dia)}
        </Text>
        <Text style={styles.resumo} testID="horarios-resumo">
          {livres === 0
            ? "Nenhum horário disponível neste dia"
            : `${livres} de ${slots.length} horários disponíveis`}
        </Text>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}

        <View style={styles.grade}>
          {slots.map(({ hora, estado }) => (
            <View
              key={hora}
              style={[
                styles.slot,
                estado === "livre" && styles.slotLivre,
                estado !== "livre" && styles.slotIndisponivel,
              ]}
              testID={`slot-${hora}`}
            >
              <Text style={[styles.hora, estado === "livre" ? styles.horaLivre : styles.horaOff]}>
                {hora}
              </Text>
              <Text style={[styles.estado, estado === "livre" ? styles.estadoLivre : styles.estadoOff]}>
                {estado === "livre" ? "Disponível" : estado === "ocupado" ? "Ocupado" : "Encerrado"}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.aviso}>
          Esta tela é apenas para consulta. Para reservar um horário disponível, entre em
          contato com a oficina; a confirmação é feita pelo dono da oficina.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  conteudo: { padding: spacing.lg, paddingBottom: 120 },
  diaTitulo: { color: colors.onSurface, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  resumo: { color: colors.muted, fontSize: 13, marginTop: spacing.xs, marginBottom: spacing.lg },
  erro: { color: colors.error, fontSize: 13, marginBottom: spacing.md },
  grade: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  slot: {
    width: "31.5%",
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
  },
  slotLivre: { backgroundColor: colors.surfaceSecondary, borderColor: colors.success },
  slotIndisponivel: { backgroundColor: colors.surface, borderColor: colors.border },
  hora: { fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },
  horaLivre: { color: colors.onSurface },
  horaOff: { color: colors.muted, textDecorationLine: "line-through" },
  estado: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginTop: 4, textTransform: "uppercase" },
  estadoLivre: { color: colors.success },
  estadoOff: { color: colors.muted },
  aviso: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing.xl },
});

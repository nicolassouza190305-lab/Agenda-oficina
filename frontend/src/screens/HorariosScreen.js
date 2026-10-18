// ============================================================
// HorariosScreen - Tela do CLIENTE: horários e solicitação de agendamento
//
// - Consulta dias e horários: cada horário aparece como Disponível,
//   Ocupado ou Encerrado (nenhum dado de outros clientes chega aqui).
// - O cliente escolhe um horário livre e toca em "Solicitar horário":
//   o pedido entra na agenda da oficina como "Agendado" e só vale depois
//   que o dono da oficina confirmar.
// - "Minhas solicitações" mostra o status dos pedidos do próprio cliente.
// ============================================================

import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  StyleSheet,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Header from "../components/Header";
import DiaSelector from "../components/DiaSelector";
import {
  listarHorariosOcupados,
  listarMeusAgendamentos,
  listarVeiculos,
  solicitarAgendamento,
} from "../database/db";
import { useAuth, mensagemDeErro } from "../context/AuthContext";
import { HORARIOS_ATENDIMENTO } from "../mocks/data";
import { proximosDias, descreverDia, hojeISO, horaAgora } from "../utils/datas";
import { colors, spacing, radius } from "../theme";

const SUGESTOES = ["Troca de óleo", "Revisão", "Freios", "Diagnóstico eletrônico", "Alinhamento"];

// Texto amigável do status para o cliente
const ROTULO_STATUS = {
  Agendado: "Aguardando confirmação",
  Confirmado: "Confirmado",
  "Em Andamento": "Em andamento",
  Cancelado: "Cancelado",
};
function corStatus(status) {
  if (status === "Confirmado") return colors.success;
  if (status === "Cancelado") return colors.error;
  if (status === "Em Andamento") return colors.brandSecondary;
  return colors.warning;
}

export default function HorariosScreen() {
  const insets = useSafeAreaInsets();
  const { usuario } = useAuth();
  const dias = useMemo(() => proximosDias(7), []);
  const [dia, setDia] = useState(dias[0].iso);
  const [ocupados, setOcupados] = useState([]);
  const [meus, setMeus] = useState([]);
  const [selecionado, setSelecionado] = useState(null); // horário "HH:MM" escolhido
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  // Modal de solicitação
  const [modalAberto, setModalAberto] = useState(false);
  const [veiculos, setVeiculos] = useState([]);
  const [veiculoId, setVeiculoId] = useState(null);
  const [servico, setServico] = useState("");
  const [erroModal, setErroModal] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Evita que uma resposta antiga (de outro dia) sobrescreva a mais recente
  const pedido = useRef(0);
  const carregar = useCallback(async () => {
    const id = ++pedido.current;
    try {
      const [oc, mine] = await Promise.all([
        listarHorariosOcupados(dia),
        listarMeusAgendamentos(usuario.id),
      ]);
      if (id !== pedido.current) return;
      setOcupados(oc);
      setMeus(mine);
      setErro("");
    } catch (e) {
      if (id === pedido.current) setErro("Não foi possível carregar os horários.");
    }
  }, [dia, usuario.id]);

  // Recarrega ao trocar de dia e sempre que a aba ganha foco
  useFocusEffect(
    useCallback(() => {
      carregar();
    }, [carregar])
  );

  const trocarDia = (iso) => {
    setDia(iso);
    setSelecionado(null);
    setAviso("");
  };

  const agora = horaAgora();
  const ehHoje = dia === hojeISO();
  const slots = HORARIOS_ATENDIMENTO.map((hora) => {
    let estado = "livre";
    if (ocupados.includes(hora)) estado = "ocupado";
    else if (ehHoje && hora <= agora) estado = "encerrado";
    return { hora, estado };
  });
  const livres = slots.filter((s) => s.estado === "livre").length;

  const abrirModal = async () => {
    if (!selecionado) return;
    setErroModal("");
    setServico("");
    setAviso("");
    setModalAberto(true);
    try {
      const lista = await listarVeiculos(usuario.id);
      setVeiculos(lista);
      setVeiculoId(lista[0]?.id ?? null);
    } catch (e) {
      setErroModal(mensagemDeErro(e, "Não foi possível carregar seus veículos."));
    }
  };

  const fecharModal = () => {
    if (enviando) return;
    setModalAberto(false);
    setErroModal("");
  };

  const enviar = async () => {
    if (!veiculoId) return setErroModal("Cadastre um veículo na aba Veículos antes de solicitar.");
    if (servico.trim().length < 3) return setErroModal("Descreva o serviço desejado.");
    setEnviando(true);
    setErroModal("");
    try {
      await solicitarAgendamento(usuario.id, {
        data: dia,
        horario: selecionado,
        veiculoId,
        servico,
      });
      setModalAberto(false);
      setSelecionado(null);
      setAviso("Solicitação enviada! Aguarde a confirmação da oficina.");
      await carregar();
    } catch (e) {
      setErroModal(mensagemDeErro(e, "Não foi possível enviar a solicitação"));
      carregar(); // o horário pode ter sido ocupado nesse meio tempo
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Header
        titulo="Horários"
        subtitulo="Escolha um dia e solicite seu horário"
        testID="horarios-header"
      />

      <DiaSelector dias={dias} selecionado={dia} onSelecionar={trocarDia} />

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <Text style={styles.diaTitulo} testID="horarios-dia">
          {descreverDia(dia)}
        </Text>
        <Text style={styles.resumo} testID="horarios-resumo">
          {livres === 0
            ? "Nenhum horário disponível neste dia"
            : `${livres} de ${slots.length} horários disponíveis · toque em um para escolher`}
        </Text>

        {erro ? <Text style={styles.erro}>{erro}</Text> : null}
        {aviso ? (
          <Text style={styles.sucesso} testID="horarios-aviso">
            {aviso}
          </Text>
        ) : null}

        <View style={styles.grade}>
          {slots.map(({ hora, estado }) => {
            const livre = estado === "livre";
            const ativo = livre && selecionado === hora;
            return (
              <Pressable
                key={hora}
                disabled={!livre}
                onPress={() => {
                  setSelecionado(ativo ? null : hora);
                  setAviso("");
                }}
                style={[
                  styles.slot,
                  livre && styles.slotLivre,
                  !livre && styles.slotIndisponivel,
                  ativo && styles.slotAtivo,
                ]}
                testID={`slot-${hora}`}
              >
                <Text
                  style={[
                    styles.hora,
                    livre ? styles.horaLivre : styles.horaOff,
                    ativo && styles.textoAtivo,
                  ]}
                >
                  {hora}
                </Text>
                <Text
                  style={[
                    styles.estado,
                    livre ? styles.estadoLivre : styles.estadoOff,
                    ativo && styles.textoAtivo,
                  ]}
                >
                  {ativo
                    ? "Selecionado"
                    : livre
                    ? "Disponível"
                    : estado === "ocupado"
                    ? "Ocupado"
                    : "Encerrado"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Minhas solicitações */}
        <Text style={styles.secao}>MINHAS SOLICITAÇÕES</Text>
        {meus.length === 0 ? (
          <Text style={styles.vazio} testID="minhas-vazio">
            Você ainda não solicitou nenhum horário.
          </Text>
        ) : (
          meus.map((a) => (
            <View key={a.id} style={styles.pedido} testID={`pedido-${a.id}`}>
              <View style={styles.pedidoTopo}>
                <Text style={styles.pedidoQuando}>
                  {descreverDia(a.data)} · {a.horario}
                </Text>
                <Text style={[styles.pedidoStatus, { color: corStatus(a.status) }]}>
                  {ROTULO_STATUS[a.status] ?? a.status}
                </Text>
              </View>
              <Text style={styles.pedidoServico}>{a.servico}</Text>
              <Text style={styles.pedidoVeiculo}>
                {a.veiculo} · {a.placa}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Botão principal */}
      <View style={[styles.rodape, { paddingBottom: spacing.md }]}>
        <Pressable
          onPress={abrirModal}
          disabled={!selecionado}
          style={({ pressed }) => [
            styles.cta,
            !selecionado && styles.ctaOff,
            pressed && selecionado && { opacity: 0.85 },
          ]}
          testID="btn-solicitar-horario"
        >
          <Text style={[styles.ctaTexto, !selecionado && styles.ctaTextoOff]}>
            {selecionado ? `Solicitar horário das ${selecionado}` : "Escolha um horário disponível"}
          </Text>
        </Pressable>
      </View>

      {/* Modal de solicitação */}
      <Modal visible={modalAberto} transparent animationType="slide" onRequestClose={fecharModal}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.modalFundo}>
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={styles.modalWrap}
            >
              <View style={[styles.modalConteudo, { paddingBottom: insets.bottom + spacing.lg }]}>
                <View style={styles.modalHandle} />
                <Text style={styles.modalTitulo}>Solicitar horário</Text>
                <Text style={styles.modalSub} testID="modal-quando">
                  {descreverDia(dia)} · {selecionado}
                </Text>

                <Text style={styles.label}>VEÍCULO *</Text>
                {veiculos.length === 0 ? (
                  <Text style={styles.semVeiculo}>
                    Você ainda não tem veículos. Cadastre um na aba Veículos.
                  </Text>
                ) : (
                  <View style={styles.chips}>
                    {veiculos.map((v) => {
                      const ativo = v.id === veiculoId;
                      return (
                        <Pressable
                          key={v.id}
                          onPress={() => setVeiculoId(v.id)}
                          style={[styles.chip, ativo && styles.chipAtivo]}
                          testID={`escolher-veiculo-${v.id}`}
                        >
                          <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>
                            {v.modelo} · {v.placa}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                )}

                <Text style={[styles.label, { marginTop: spacing.md }]}>SERVIÇO *</Text>
                <TextInput
                  value={servico}
                  onChangeText={setServico}
                  placeholder="Ex: Troca de óleo e filtro"
                  placeholderTextColor={colors.muted}
                  maxLength={120}
                  style={styles.input}
                  testID="input-servico"
                />
                <View style={[styles.chips, { marginTop: spacing.sm }]}>
                  {SUGESTOES.map((s) => (
                    <Pressable
                      key={s}
                      onPress={() => setServico(s)}
                      style={styles.sugestao}
                      testID={`sugestao-${s}`}
                    >
                      <Text style={styles.sugestaoTexto}>{s}</Text>
                    </Pressable>
                  ))}
                </View>

                {erroModal ? (
                  <Text style={styles.erro} testID="modal-erro">
                    {erroModal}
                  </Text>
                ) : null}

                <View style={styles.modalAcoes}>
                  <Pressable
                    onPress={fecharModal}
                    style={({ pressed }) => [styles.btnCancelar, pressed && { opacity: 0.7 }]}
                    testID="modal-cancelar"
                  >
                    <Text style={styles.btnCancelarTexto}>Voltar</Text>
                  </Pressable>
                  <Pressable
                    onPress={enviar}
                    disabled={enviando}
                    style={({ pressed }) => [
                      styles.btnEnviar,
                      (pressed || enviando) && { opacity: 0.8 },
                    ]}
                    testID="modal-enviar"
                  >
                    <Text style={styles.btnEnviarTexto}>
                      {enviando ? "Enviando..." : "Enviar solicitação"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  conteudo: { padding: spacing.lg, paddingBottom: 24 },
  diaTitulo: { color: colors.onSurface, fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  resumo: { color: colors.muted, fontSize: 13, marginTop: spacing.xs, marginBottom: spacing.lg },
  erro: { color: colors.error, fontSize: 13, marginTop: spacing.sm, marginBottom: spacing.sm },
  sucesso: { color: colors.success, fontSize: 13, fontWeight: "700", marginBottom: spacing.md },
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
  slotAtivo: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  hora: { fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },
  horaLivre: { color: colors.onSurface },
  horaOff: { color: colors.muted, textDecorationLine: "line-through" },
  estado: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginTop: 4, textTransform: "uppercase" },
  estadoLivre: { color: colors.success },
  estadoOff: { color: colors.muted },
  textoAtivo: { color: colors.onBrandPrimary },

  secao: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  vazio: { color: colors.muted, fontSize: 13 },
  pedido: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  pedidoTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  pedidoQuando: { color: colors.onSurface, fontSize: 14, fontWeight: "800", flex: 1, marginRight: spacing.sm },
  pedidoStatus: { fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 },
  pedidoServico: { color: colors.onSurfaceSecondary, fontSize: 14, marginTop: spacing.xs },
  pedidoVeiculo: { color: colors.muted, fontSize: 12, marginTop: 2 },

  rodape: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cta: {
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
    alignItems: "center",
  },
  ctaOff: { backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border },
  ctaTexto: { color: colors.onBrandPrimary, fontSize: 15, fontWeight: "800", letterSpacing: 0.3 },
  ctaTextoOff: { color: colors.muted },

  // Modal
  modalFundo: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalWrap: { width: "100%" },
  modalConteudo: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  modalHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
  modalTitulo: { color: colors.onSurface, fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  modalSub: {
    color: colors.brandPrimary,
    fontSize: 14,
    fontWeight: "700",
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.muted,
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: spacing.xs + 2,
  },
  semVeiculo: { color: colors.warning, fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: { backgroundColor: colors.brandPrimary, borderColor: colors.brandPrimary },
  chipTexto: { color: colors.onSurfaceSecondary, fontSize: 13, fontWeight: "700" },
  chipTextoAtivo: { color: colors.onBrandPrimary },
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
  sugestao: {
    paddingVertical: 5,
    paddingHorizontal: spacing.sm + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sugestaoTexto: { color: colors.muted, fontSize: 12, fontWeight: "600" },
  modalAcoes: { flexDirection: "row", marginTop: spacing.lg, gap: spacing.md },
  btnCancelar: {
    flex: 1,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  btnCancelarTexto: { color: colors.onSurfaceSecondary, fontSize: 14, fontWeight: "700" },
  btnEnviar: {
    flex: 1.5,
    backgroundColor: colors.brandPrimary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.md,
    alignItems: "center",
  },
  btnEnviarTexto: { color: colors.onBrandPrimary, fontSize: 14, fontWeight: "800", letterSpacing: 0.5 },
});

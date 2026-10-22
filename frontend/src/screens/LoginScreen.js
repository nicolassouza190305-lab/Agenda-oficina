// ============================================================
// LoginScreen - Tela 1 (Login / Cadastro)
// Desenvolvido em conjunto pela dupla (Nicolas + Luiz)
// Login real (SQLite). Cliente cria conta escolhendo a SUA oficina (só agenda nela);
// a Oficina pode cadastrar a própria oficina e administra só os seus clientes.
// ============================================================

import React, { useEffect, useState } from "react";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing, radius } from "../theme";
import { useAuth, mensagemDeErro } from "../context/AuthContext";
import { listarOficinas } from "../database/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1762604462421-fff920b0c418?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbW9kZXJuJTIwZ2FyYWdlJTIwd29ya3Nob3AlMjBpbnRlcmlvciUyMG1vb2R5fGVufDB8fHx8MTc5MTU1NzEyMnww&ixlib=rb-4.1.0&q=85";

export default function LoginScreen() {
  const { entrar: entrarNaConta, cadastrar, cadastrarOficina } = useAuth();
  const insets = useSafeAreaInsets();

  const [perfil, setPerfil] = useState("Cliente"); // "Cliente" | "Oficina"
  const [modo, setModo] = useState("Entrar"); // "Entrar" | "Cadastrar"
  const [nome, setNome] = useState("");
  const [nomeOficina, setNomeOficina] = useState("");
  const [oficinas, setOficinas] = useState([]);
  const [oficinaId, setOficinaId] = useState(null);
  const [carregandoOficinas, setCarregandoOficinas] = useState(false);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cadastrando = modo === "Cadastrar";
  const clienteNovo = cadastrando && perfil === "Cliente";
  const oficinaNova = cadastrando && perfil === "Oficina";

  const trocarPerfil = (novo) => {
    setPerfil(novo);
    setErro("");
  };

  // Cliente novo escolhe a oficina na lista de oficinas cadastradas
  useEffect(() => {
    if (!clienteNovo) return;
    let ativo = true;
    setCarregandoOficinas(true);
    listarOficinas()
      .then((lista) => ativo && setOficinas(lista))
      .catch(() => ativo && setErro("Não foi possível carregar as oficinas."))
      .finally(() => ativo && setCarregandoOficinas(false));
    return () => {
      ativo = false;
    };
  }, [clienteNovo]);

  const enviar = async () => {
    if (!email.trim() || !senha.trim()) {
      setErro("Preencha email e senha para continuar.");
      return;
    }
    if (cadastrando) {
      if (oficinaNova && nomeOficina.trim().length < 3) {
        return setErro("Informe o nome da oficina (mínimo 3 letras).");
      }
      if (nome.trim().length < 2) return setErro("Informe seu nome.");
      if (clienteNovo && !oficinaId) return setErro("Escolha a sua oficina.");
      if (!EMAIL_RE.test(email.trim())) return setErro("Informe um e-mail válido.");
      if (senha.length < 6) return setErro("A senha deve ter pelo menos 6 caracteres.");
      if (senha !== confirmar) return setErro("As senhas não coincidem.");
    }
    setErro("");
    setEnviando(true);
    try {
      // Ao autenticar, a navegação troca sozinha para as abas do perfil
      if (oficinaNova) await cadastrarOficina({ nomeOficina, nome, email, senha });
      else if (clienteNovo) await cadastrar({ nome, email, senha, oficinaId });
      else await entrarNaConta(email, senha, perfil);
    } catch (e) {
      setErro(mensagemDeErro(e, "Não foi possível continuar."));
      setEnviando(false);
    }
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
                  onPress={() => trocarPerfil("Cliente")}
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
                  onPress={() => trocarPerfil("Oficina")}
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
              {oficinaNova ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nome da oficina</Text>
                  <TextInput
                    value={nomeOficina}
                    onChangeText={setNomeOficina}
                    placeholder="Ex: Oficina GS"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="words"
                    style={styles.input}
                    testID="cadastro-oficina-input"
                  />
                </View>
              ) : null}

              {cadastrando ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{oficinaNova ? "Seu nome" : "Nome"}</Text>
                  <TextInput
                    value={nome}
                    onChangeText={setNome}
                    placeholder="Seu nome"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="words"
                    style={styles.input}
                    testID="cadastro-nome-input"
                  />
                </View>
              ) : null}

              {clienteNovo ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Sua oficina</Text>
                  {oficinas.length === 0 ? (
                    <Text style={styles.ajuda}>
                      {carregandoOficinas ? "Carregando oficinas..." : "Nenhuma oficina cadastrada ainda."}
                    </Text>
                  ) : (
                    <View style={styles.chips} testID="oficinas-lista">
                      {oficinas.map((o) => {
                        const ativo = o.id === oficinaId;
                        return (
                          <Pressable
                            key={o.id}
                            onPress={() => setOficinaId(o.id)}
                            style={[styles.chip, ativo && styles.chipAtivo]}
                            testID={`oficina-${o.id}`}
                          >
                            <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{o.nome}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  )}
                  <Text style={styles.ajuda}>Você só poderá agendar na oficina escolhida.</Text>
                </View>
              ) : null}

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

              {cadastrando ? (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Confirmar senha</Text>
                  <TextInput
                    value={confirmar}
                    onChangeText={setConfirmar}
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    style={styles.input}
                    testID="cadastro-confirmar-input"
                  />
                </View>
              ) : null}

              {erro ? (
                <Text style={styles.erro} testID="login-erro">
                  {erro}
                </Text>
              ) : null}

              {/* CTA */}
              <Pressable
                onPress={enviar}
                disabled={enviando}
                style={({ pressed }) => [styles.cta, (pressed || enviando) && styles.ctaPressed]}
                testID="login-submit-button"
              >
                <Text style={styles.ctaTexto}>
                  {enviando
                    ? "Aguarde..."
                    : oficinaNova
                    ? "Cadastrar minha oficina"
                    : clienteNovo
                    ? "Criar conta de Cliente"
                    : `Entrar como ${perfil}`}
                </Text>
              </Pressable>

              {/* Alternar entre entrar e criar conta */}
              <Pressable
                onPress={() => {
                  setModo(modo === "Entrar" ? "Cadastrar" : "Entrar");
                  setErro("");
                }}
                style={styles.alternar}
                testID="login-toggle-modo"
              >
                <Text style={styles.alternarTexto}>
                  {modo === "Entrar"
                    ? perfil === "Oficina"
                      ? "Sua oficina ainda não está aqui? Cadastrar oficina"
                      : "Novo por aqui? Criar conta"
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
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipAtivo: {
    backgroundColor: colors.brandPrimary,
    borderColor: colors.brandPrimary,
  },
  chipTexto: {
    color: colors.onSurfaceSecondary,
    fontSize: 13,
    fontWeight: "700",
  },
  chipTextoAtivo: {
    color: colors.onBrandPrimary,
  },
  ajuda: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.sm,
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

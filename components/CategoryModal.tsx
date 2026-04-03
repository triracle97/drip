import AnimatedPressable from "@/components/AnimatedPressable";
import ProBadge from "@/components/ProBadge";
import ProSheet, { ProFeatureKey } from "@/components/ProSheet";
import { C, R } from "@/constants/design";
import { useStore } from "@/store";
import { useSettings } from "@/store/settings";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Lock, Pencil } from "lucide-react-native";
import Svg, { Path } from "react-native-svg";

const PRESET_COLORS = [
  "#577E89",
  "#5BA4A4",
  "#7BA38F",
  "#8A9A5B",
  "#E1A36F",
  "#DEC484",
  "#C4A882",
  "#C07F5A",
  "#B8907A",
  "#C98B8B",
  "#8B7BA3",
  "#A3889B",
  "#E2D8A5",
  "#A6887B",
  "#8E8E93",
  "#636366",
  "#3A3A3C",
  "#1C1C1E",
];

interface Props {
  visible: boolean;
  selectedId?: string;
  onSelect?: (categoryId: string) => void;
  onClose: () => void;
}

export default function CategoryModal({
  visible,
  selectedId,
  onSelect,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { categories, addCategory, updateCategory } = useStore();
  const isPro = useSettings((s) => s.isPro);

  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [proFeature, setProFeature] = useState<ProFeatureKey | null>(null);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const canSave = newName.trim().length > 0;

  const handleClose = () => {
    setAdding(false);
    setEditingId(null);
    setNewName("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={s.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={handleClose}
          activeOpacity={1}
        />
        <View style={s.sheet}>
          {/* Header */}
          <View style={s.header}>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              {(adding || editingId) && (
                <TouchableOpacity
                  onPress={() => {
                    setAdding(false);
                    setEditingId(null);
                    setNewName("");
                  }}
                  activeOpacity={0.7}
                  style={{ padding: 4, marginLeft: -4 }}
                >
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                    <Path
                      d="M15 18l-6-6 6-6"
                      stroke={C.t1}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </TouchableOpacity>
              )}
              <Text style={s.title}>
                {adding ? t("categories.addCategory") : editingId ? "Edit Category" : t("addSub.category")}
              </Text>
            </View>
            <TouchableOpacity
              style={s.closeBtn}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={s.closeTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.listContainer}>
              {adding || editingId ? (
                <View style={{ paddingBottom: 16 }}>
                  <Text style={s.fieldLabel}>{t("addSub.name")}</Text>
                  <TextInput
                    style={s.inp}
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="Category name"
                    placeholderTextColor={C.t3}
                    autoFocus
                  />

                  <Text style={[s.fieldLabel, { marginTop: 16 }]}>
                    {t("appearance.color")}
                  </Text>
                  <View style={s.grid}>
                    {PRESET_COLORS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => setNewColor(c)}
                        style={[
                          s.colorCell,
                          { backgroundColor: c },
                          newColor === c && {
                            borderWidth: 2.5,
                            borderColor: C.t1,
                          },
                        ]}
                        activeOpacity={0.7}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <>
                  {categories && categories.length > 0 ? (
                    categories.map((cat) => {
                      const selected = selectedId === cat.id;
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          onPress={() => {
                            if (onSelect) {
                              onSelect(cat.id);
                            }
                          }}
                          style={[
                            s.row,
                            selected && { backgroundColor: C.bgSub },
                          ]}
                          activeOpacity={0.75}
                        >
                          <View
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: 7,
                              backgroundColor: cat.color,
                            }}
                          />
                          <Text
                            style={{
                              flex: 1,
                              fontSize: 15,
                              color: selected ? C.t1 : C.t2,
                              fontWeight: selected ? "600" : "500",
                            }}
                          >
                            {cat.name}
                          </Text>
                          {selected && (
                            <Text style={{ color: C.t1, fontSize: 14 }}>✓</Text>
                          )}
                          <TouchableOpacity
                            onPress={() => {
                              setEditingId(cat.id);
                              setNewName(cat.name);
                              setNewColor(cat.color);
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={{ padding: 4, marginLeft: 8 }}
                          >
                            <Pencil size={15} color={C.t3} />
                          </TouchableOpacity>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={{ padding: 20, alignItems: "center" }}>
                      <Text style={{ color: C.t3 }}>No categories found</Text>
                    </View>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      if (!isPro) {
                        setProFeature("categories");
                        return;
                      }
                      setAdding(true);
                      setEditingId(null);
                      setNewName("");
                    }}
                    style={s.addRow}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Text style={s.addLabel}>
                        {t("categories.addCategory")}
                      </Text>
                    </View>
                    {!isPro && <Lock size={16} color={C.gold} strokeWidth={2.5} />}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>

          {/* Bottom Action buttons */}
          {adding || editingId ? (
            <View
              style={{
                flexDirection: "row",
                gap: 8,
                marginTop: 12,
                marginBottom: 8,
              }}
            >
              <AnimatedPressable
                onPress={() => {
                  if (!canSave) return;
                  if (editingId) {
                      const existing = categories.find((c) => c.id === editingId);
                      if (existing) {
                          updateCategory({ ...existing, name: newName.trim(), color: newColor });
                      }
                      setEditingId(null);
                  } else {
                      const newId = `cat_${Date.now()}`;
                      addCategory({
                        name: newName.trim(),
                        color: newColor,
                        icon: "📦", 
                        id: newId,
                        sortOrder: categories.length,
                        isDefault: false,
                      });
                      if (onSelect) onSelect(newId);
                  }
                  setAdding(false);
                  setNewName("");
                }}
                style={[
                  s.btn,
                  {
                    flex: 2,
                    backgroundColor: canSave ? C.black : C.bgSub,
                    opacity: canSave ? 1 : 0.5,
                  },
                ]}
                disabled={!canSave}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: canSave ? "#fff" : C.t3,
                  }}
                >
                  {adding ? t("categories.addCategory") : "Save Changes"}
                </Text>
              </AnimatedPressable>

              <AnimatedPressable
                onPress={() => {
                  setAdding(false);
                  setEditingId(null);
                  setNewName("");
                }}
                style={[
                  s.btn,
                  {
                    flex: 1,
                    backgroundColor: C.bgSub,
                  },
                ]}
              >
                <Text style={{ fontSize: 14, fontWeight: "600", color: C.t2 }}>
                  {t("common.cancel")}
                </Text>
              </AnimatedPressable>
            </View>
          ) : (
            <TouchableOpacity
              style={s.doneBtn}
              onPress={handleClose}
              activeOpacity={0.85}
            >
              <Text style={s.doneTxt}>{t("common.done")}</Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
      <ProSheet feature={proFeature} onClose={() => setProFeature(null)} />
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: C.bg,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: C.t1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.bgSub,
    alignItems: "center",
    justifyContent: "center",
  },
  closeTxt: {
    fontSize: 12,
    color: C.t2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: R.md,
    marginBottom: 2,
  },
  doneBtn: {
    backgroundColor: C.black,
    borderRadius: R.pill,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  doneTxt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  listContainer: {
    width: "100%",
    minHeight: 220,
    marginTop: 8,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: R.md,
    marginTop: 8,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.04)",
    borderStyle: "dashed",
  },
  addCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: C.bgSub,
    alignItems: "center",
    justifyContent: "center",
  },
  addLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: C.t1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: C.t3,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inp: {
    backgroundColor: C.bgSub,
    borderRadius: R.md,
    padding: 14,
    fontSize: 16,
    fontWeight: "500",
    color: C.t1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  colorCell: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  preview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: R.md,
    marginTop: 24,
  },
  btn: {
    borderRadius: R.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});

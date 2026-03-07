import { StyleSheet, Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <View style={s.container}>
      <Text style={s.text}>Modal</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  text: { fontSize: 18, color: '#000' },
});

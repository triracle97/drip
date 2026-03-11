import { C } from '@/constants/design';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { router } from 'expo-router';
import React, { useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export default function SheetTestPage() {
    const insets = useSafeAreaInsets();
    const sheetRef = useRef<TrueSheet>(null);


    return (
        <View style={{ flex: 1, backgroundColor: C.bg }}>
            {/* Header */}
            <View style={[st.header, { paddingTop: insets.top + 8 }]}>
                <TouchableOpacity onPress={() => router.back()} style={st.backBtn} activeOpacity={0.7}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path d="M15 18l-6-6 6-6" stroke={C.t1} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: C.t1 }}>Back</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 16, fontWeight: '700', color: C.t1 }}>Sheet Test</Text>
                <View style={{ width: 60 }} />
            </View>

            {/* Body */}
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20, paddingHorizontal: 24 }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: C.t1, textAlign: 'center' }}>TrueSheet v3 Test</Text>
                <Text style={{ fontSize: 14, color: C.t3, textAlign: 'center' }}>Tap the button below to present a simple TrueSheet modal.</Text>

                <TouchableOpacity
                    onPress={() => sheetRef.current?.present()}
                    style={st.presentBtn}
                    activeOpacity={0.8}
                >
                    <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>Open Sheet</Text>
                </TouchableOpacity>
            </View>

            {/* TrueSheet — following reference repo pattern exactly */}
            <TrueSheet
                ref={sheetRef}
                detents={[1]}
                grabber={false}
                cornerRadius={24}
                dismissible={false}
                dimmed={true}
                dimmedDetentIndex={0}
                initialDetentIndex={-1}
                initialDetentAnimated={true}
                scrollable
                backgroundColor="#FFFFFF"
            >
                {/* Custom grabber */}
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ backgroundColor: 'rgba(0,0,0,0.2)', width: 40, height: 4, borderRadius: 99, marginTop: 8, marginBottom: 4 }} />
                </View>

                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
                    <Text style={{ fontSize: 22, fontWeight: '800', color: C.t1, letterSpacing: -0.5 }}>Hello TrueSheet</Text>
                    <TouchableOpacity
                        onPress={() => sheetRef.current?.dismiss()}
                        style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: C.bgSub, alignItems: 'center', justifyContent: 'center' }}
                        activeOpacity={0.7}
                    >
                        <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                            <Path d="M4 4l8 8M12 4l-8 8" stroke={C.t3} strokeWidth={1.8} strokeLinecap="round" />
                        </Svg>
                    </TouchableOpacity>
                </View>

                {/* Scrollable content via scrollRef */}
                <ScrollView
                    nestedScrollEnabled
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                    showsVerticalScrollIndicator={false}
                >
                    {Array.from({ length: 20 }, (_, i) => (
                        <View key={i} style={{ paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.06)' }}>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: C.t1 }}>Item {i + 1}</Text>
                            <Text style={{ fontSize: 13, color: C.t3, marginTop: 4 }}>This is a test row to verify scrolling works inside the sheet.</Text>
                        </View>
                    ))}
                </ScrollView>
            </TrueSheet>
        </View>
    );
}

const st = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        width: 60,
    },
    presentBtn: {
        backgroundColor: '#000',
        borderRadius: 14,
        paddingVertical: 16,
        paddingHorizontal: 40,
        marginTop: 12,
    },
});

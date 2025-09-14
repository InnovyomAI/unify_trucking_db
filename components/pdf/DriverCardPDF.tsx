/* eslint-disable jsx-a11y/alt-text */
"use client";
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 20, fontSize: 10, color: "#0A0F1F" },
  card: { borderWidth: 1, borderColor: "#e5e7eb", padding: 12, borderRadius: 6 },
  row: { flexDirection: "row", gap: 10 },
  col: { flexGrow: 1 },
  title: { fontSize: 14, marginBottom: 6 },
  label: { color: "#6b7280" },
});

export default function DriverCardPDF({
  name,
  qrPng,
}: {
  name: string;
  qrPng: string;
}) {
  return (
    <Document>
      <Page size="A6" style={styles.page}>
        <View style={styles.card}>
          <Text style={styles.title}>Driver Identity Card</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text>
                <Text style={styles.label}>Name: </Text>{name}
              </Text>
            </View>
            <Image src={qrPng} style={{ width: 120, height: 120 }} />
          </View>
          <Text style={{ marginTop: 8, color: "#6b7280" }}>
            Scan for live verification. QR encodes only a random ID; no personal details.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

# Panduan Download PDF Sederhana

## Ringkasan Perubahan

Saya telah menyederhanakan logika download PDF di aplikasi Surat Kuasa Khusus menjadi lebih mudah dipahami dan maintainable.

## 3 Fungsi Download PDF

### 1. `handleDownloadPDFFromEditor()`

**Download langsung dari rich editor**

```javascript
// 12 langkah sederhana:
1. Validasi data klien dan hutang
2. Ambil konten dari editor atau template
3. Proses variabel template
4. Buat container HTML sementara
5. Styling CSS sederhana
6. Tunggu loading 500ms
7. Convert HTML ke canvas (html2canvas)
8. Hapus container sementara
9. Buat PDF dengan jsPDF
10. Handle multi-page jika perlu
11. Generate nama file dengan timestamp
12. Download PDF
```

### 2. `handleDownloadExistingPDF(document)`

**Download PDF dari dokumen yang sudah tersimpan**

```javascript
// 10 langkah:
1. Validasi konten dokumen
2. Buat container HTML sementara
3. CSS sederhana
4. Tunggu loading 500ms
5. Convert ke canvas
6. Hapus container
7. Buat PDF
8. Handle multi-page
9. Generate nama file
10. Download
```

### 3. `handleDownloadPDF()`

**Download PDF dari proses generate dokumen**

```javascript
// 11 langkah:
1. Validasi data lengkap
2. Proses template final
3. Buat container sementara
4. CSS sederhana
5. Tunggu loading
6. Convert ke canvas
7. Hapus container
8. Buat PDF
9. Multi-page handling
10. Generate filename
11. Download
```

## Penyederhanaan yang Dilakukan

### Sebelumnya (Kompleks):

- CSS styling yang terlalu rumit dengan banyak `!important`
- Banyak konfigurasi html2canvas yang tidak perlu
- Error handling yang kompleks
- Kode berulang dan sulit dibaca

### Sekarang (Sederhana):

- **CSS minimal** - hanya elemen penting
- **html2canvas basic** - konfigurasi minimal yang stable
- **Error handling konsisten** - TypeScript-friendly
- **Kode DRY** - menghindari pengulangan
- **Penamaan file konsisten** - format timestamp yang sama

## Konfigurasi Utama

### Container HTML:

```css
position: absolute;
left: -9999px; /* Sembunyikan dari user */
width: 794px; /* A4 width in pixels */
padding: 40px; /* Margin dokumen */
font-family: Arial; /* Font yang reliable */
font-size: 14px; /* Ukuran terbaca */
color: #000; /* Warna hitam untuk PDF */
background: #fff; /* Background putih */
```

### CSS PDF Styling:

```css
h1,
h2,
h3 {
  text-align: center;
  margin-bottom: 20px;
}
p {
  margin-bottom: 15px;
  text-align: justify;
}
table {
  width: 100%;
  margin-bottom: 20px;
}
td {
  padding: 8px;
  vertical-align: top;
}
strong {
  font-weight: bold;
}
```

### HTML2Canvas:

```javascript
{
  useCORS: true,           // Handle external resources
  background: "#ffffff",   // White background
  width: 794,              // A4 width
  height: container.scrollHeight  // Dynamic height
}
```

### jsPDF:

```javascript
const doc = new jsPDF("portrait", "mm", "a4");
const imgData = canvas.toDataURL("image/jpeg", 0.9); // 90% quality
```

## Format Nama File

**Pattern:** `surat-kuasa-{clientName}-{docNumber}-{timestamp}.pdf`

**Contoh:** `surat-kuasa-john-doe-001-docs-cc-2024-08-01T10-30.pdf`

## Error Handling

```javascript
try {
  // PDF generation logic
} catch (error) {
  console.error("Error:", error);
  const errorMessage =
    error instanceof Error
      ? error.message
      : "Terjadi kesalahan tidak diketahui";
  toast.error(`Gagal membuat PDF: ${errorMessage}`);
} finally {
  setIsDownloading(false);
}
```

## Testing

1. **Download dari editor** - Test dengan konten rich editor
2. **Download existing** - Test dari history dokumen
3. **Download generate** - Test dari step 6 wizard
4. **Multi-page** - Test dengan konten panjang
5. **Error cases** - Test dengan data kosong/invalid

## Maintenance Tips

1. **Jangan ubah CSS container** - sudah optimal untuk A4
2. **html2canvas config minimal** - lebih stable
3. **Consistent naming** - gunakan pattern yang sama
4. **Error handling** - selalu check instanceof Error
5. **Loading time** - 500ms cukup untuk most cases

Logika PDF download sekarang lebih **sederhana**, **reliable**, dan **mudah di-maintain**! 🎉

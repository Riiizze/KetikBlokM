# Ketik Blok M

Game arcade mengetik untuk satu pemain dengan suasana Blok M, Jakarta Selatan. Lindungi burungmu dari elang yang mendekat dengan mengetik kata atau frasa secara cepat dan tepat. Kosakatanya terinspirasi dari tempat, transportasi, kuliner, dan aktivitas di sekitar Blok M, seperti `Melawai`, `MRT`, dan `kopi susu`.

**[Mainkan Ketik Blok M](https://riiizze.github.io/KetikBlokM/)**

## Cara bermain

1. Buka link game, lalu tekan **Gas, mulai main**.
2. Perhatikan kata atau frasa di atas elang.
3. Ketik teks tersebut di kolom input, persis termasuk huruf besar, huruf kecil, dan spasinya. Di ponsel, ketuk kolom input untuk membuka keyboard.
4. Jawaban diperiksa otomatis saat mengetik, tanpa perlu menekan Enter. Setelah cocok seluruhnya, skor bertambah, elang terdorong mundur, dan teks berikutnya muncul.
5. Perbaiki kesalahan dengan Backspace sebelum elang mencapai burungmu.
6. Bertahan selama mungkin dan pecahkan rekor pribadimu. Setelah nyawa habis, pilih **Main lagi** untuk memulai sesi baru.

## Aturan permainan

- Setiap sesi dimulai dengan **0 poin dan 3 nyawa**.
- Setiap teks yang selesai diketik dengan benar bernilai **1 poin**, baik satu kata maupun frasa beberapa kata.
- Jawaban harus sama persis. Contoh: `Blok M` berbeda dari `blok m`.
- Salah mengetik tidak langsung mengurangi nyawa, tetapi elang tetap mendekat selama kamu memperbaiki jawaban.
- Setiap jawaban benar mendorong elang mundur sejauh 15% lebar area permainan, maksimal sampai posisi awalnya.
- Jika elang mencapai burungmu, nyawa berkurang **1**. Jika masih ada nyawa, elang kembali ke posisi awal dan teks diganti; skor tetap.
- Permainan berakhir ketika nyawa mencapai **0**. Tidak ada target skor akhir; tujuannya meraih skor setinggi mungkin.
- Kembali ke menu mengakhiri sesi berjalan. Memulai atau mengulang permainan selalu mereset skor dan nyawa.
- Rekor diperbarui ketika permainan selesai atau pemain kembali ke menu. Rekor disimpan di browser menggunakan `localStorage`, sehingga tidak dibagikan antarperangkat atau browser. Jika penyimpanan browser tidak tersedia, rekor hanya bertahan selama halaman masih terbuka.

### Petunjuk warna ketikan

| Indikator | Arti |
| --- | --- |
| Huruf hijau | Karakter yang diketik sudah sesuai. |
| Huruf merah bergaris bawah | Karakter salah; perbaiki dengan Backspace. |
| Tanda `+` beserta angka | Jumlah karakter yang diketik melebihi panjang teks target. |

### Tahap kesulitan

| Tahap | Skor | Peluang teks | Kecepatan elang |
| --- | --- | --- | --- |
| Pemanasan | 0–9 | 75% satu kata, 20% dua kata, 5% tiga kata | 8% lebar area permainan per detik |
| Tantangan | 10 ke atas | 20% satu kata, 75% dua kata, 5% tiga kata | 10% lebar area permainan per detik, atau 25% lebih cepat dari Pemanasan |

Teks dipilih secara acak dan tidak langsung mengulang teks sebelumnya. Tahap Tantangan aktif begitu skor mencapai 10.

## State permainan

Game memiliki empat kondisi utama. Di kode, kondisi ini diatur melalui layar aktif serta variabel `running` dan `paused`.

| State | Kondisi | Perilaku dan transisi |
| --- | --- | --- |
| **Menu** | `running = false`, `paused = false`; layar `menu` | Menampilkan pengantar, cara bermain, dan rekor. Tombol **Gas, mulai main** membuka Playing. |
| **Playing** | `running = true`, `paused = false`; layar `game-ui` | Elang bergerak dan input ketikan aktif. Bisa menuju Paused, kembali ke Menu, atau menuju Result saat nyawa habis. |
| **Paused** | `running = true`, `paused = true`; dialog `pause-dialog` di atas layar permainan | Gerakan permainan berhenti dan input dinonaktifkan; skor, nyawa, teks, dan posisi elang dipertahankan. **Lanjut bermain** atau Esc kembali ke Playing; **Kembali ke menu** mengakhiri sesi. |
| **Result / Game Over** | `running = false`, `paused = false`; layar `result` | Menampilkan skor akhir dan informasi rekor. **Main lagi** membuka sesi Playing baru; **Kembali ke menu** membuka Menu. |

Saat tab game disembunyikan, misalnya ketika berpindah tab, sesi yang sedang berjalan otomatis masuk ke Paused. Setelah kembali, tekan **Lanjut bermain** atau Esc untuk melanjutkan.

### State pendukung

- **Tahap kesulitan:** `warmup` atau `challenge`, ditentukan oleh skor.
- **Suara:** `muted` mengatur mute musik dan efek suara. Pilihan mute disimpan di browser jika penyimpanan tersedia.
- **Animasi:** `animationsEnabled` mengatur animasi visual karakter. Menonaktifkannya tidak menghentikan gerakan elang atau menjeda permainan.
- **Data sesi:** `score` untuk poin, `hp` untuk nyawa, `currentWord` untuk teks target, dan `enemyX` untuk posisi elang.
- **Rekor:** `bestScore` menyimpan skor tertinggi yang sudah dicatat.

## Kontrol

| Kontrol | Fungsi |
| --- | --- |
| Keyboard / kolom input | Mengetik teks target. |
| Backspace | Menghapus karakter yang salah. |
| **Pause** / Esc saat bermain | Menjeda permainan. |
| **Lanjut bermain** / Esc saat jeda | Melanjutkan sesi yang dijeda. |
| **Menu** / **Kembali ke menu** | Mengakhiri sesi dan kembali ke menu. |
| **Main lagi** | Memulai ulang dengan 0 poin dan 3 nyawa. |
| **Mute suara** / **Aktifkan suara** | Mengubah pengaturan suara. |
| **Animasi: aktif / nonaktif** | Mengubah pengaturan animasi visual. |

## Struktur proyek

- `index.html` — halaman utama dan elemen antarmuka game; dibuka otomatis dari URL utama GitHub Pages.
- `game.css` — tampilan, tata letak responsif, dan efek visual.
- `game.js` — aturan, pemilihan kata, state, input, skor, dan kontrol permainan.
- `assets/` — gambar latar dan karakter.
- `audio/` — berkas audio proyek.

Game dibuat menggunakan HTML, CSS, dan JavaScript tanpa proses build. Untuk menjalankannya secara lokal, sajikan folder proyek melalui server statis, misalnya Live Server di VS Code, lalu buka `index.html`.


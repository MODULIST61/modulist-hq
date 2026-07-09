# Modulist HQ

Modulist yönetim ekibinin kapalı iç workspace'i. **hq.modulist.net**

Frontend-only prototip: React + Vite + Tailwind. Veriler `localStorage`'da saklanır; backend yoktur.

## Kurulum

```bash
npm install
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın.

## İlk Adımlar (Patron)

1. **Kurulum** — İlk açılışta patron hesabı oluşturun (ad, e-posta, şifre).
2. **Ekip** — Ekip ekranından farklı rollerde üyeler ekleyin: Yazılım, Pazarlama, Satış, Operasyon.
3. **Mesajlar** — Odalarda iş konuşmalarını başlatın; @mention, görev ve karar oluşturun.
4. **Kayıtlar** — Firmalar, bug'lar ve kampanyaları yönetin.
5. **Finans** — Yalnızca Patron rolü finans menüsünü ve verilerini görür.

## Roller

| Rol | Finans | Ekip Yönetimi |
|-----|--------|---------------|
| Patron | ✅ | ✅ |
| Yazılım / Pazarlama / Satış / Operasyon | ❌ | ❌ |

## V2 Özellikler

- **Haftalık Özet** (`/haftalik-ozet`) — Patron: rapor önizleme, .txt indir, mock e-posta
- **CSV Export** — Finans ve Günlük Metrik sayfalarında
- **Demo Takvimi** (`/takvim`) — Firma demo_tarihi takvimi
- **Meta/Google API Mock** — Reklam sayfasında senkron simülasyonu
- **Performans Skorları** (`/performans`) — Kişi başı dönüşüm ve ekip puanı

- **Komuta Merkezi** — Patron için aktivite akışı, ekip yükü, oda nabzı, pipeline hunisi
- **Reklam Dashboard** — Kampanya KPI, kanal kırılımı, CPA; Pazarlama girer, Satış salt okuma
- **Gider Onay Akışı** — Pazarlama/ops talep eder, Patron onaylar/reddeder
- **Geri Dönüşler** — Müşteri şikayet/öneri takibi (manuel HQ)
- **Günlük Metrik** — Arama, ulaşılan, demo (Satış/Ops/Patron)
- **Direkt Mesaj** — Çalışanlar arası özel sohbet
- **Patron Duyuru** — Tüm odalara ayrı + Genel @ekip
- **Bug Workflow** — Açık → Devam → Test → Kapalı + çözüm notu

- Kurulum + giriş/çıkış
- Rol bazlı sidebar ve route guard
- 6 oda mesajlaşma (tip, mention, pin, yanıt, mock dosya)
- Görevler, firmalar, bug'lar, kampanyalar
- Finans (sadece patron)
- Kararlar arşivi
- Bugün dashboard (rol bazlı kartlar)
- Bildirimler (mention, görev ataması)
- Koyu mod + veri sıfırlama

## localStorage Anahtarları

- `hq_users`, `hq_session`, `hq_rooms`, `hq_messages`
- `hq_tasks`, `hq_companies`, `hq_bugs`, `hq_campaigns`, `hq_contents`
- `hq_finance`, `hq_notifications`, `hq_settings`, `hq_initialized`

## Build

```bash
npm run build
npm run preview
```

---

Modulist HQ v0.1 · Frontend prototip · Backend eklenmemiştir.

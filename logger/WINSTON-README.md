# Winston Logger Stres Testi ve MongoDB Entegrasyonu

Bu proje winston paketi kullanarak dummy loglar oluşturur ve winston-mongodb ile bu logları MongoDB'ye aktarır.

## 📋 Özellikler

- **5 farklı log kategorisi**: auth, cloud, microphone, system, user
- **Dosya tabanlı logging**: Her kategori kendi klasörüne log yazar
- **MongoDB entegrasyonu**: winston-mongodb ile veritabanı desteği
- **Stres testi**: Binlerce dummy log üretebilme
- **NestJS framework**: Modüler ve ölçeklenebilir yapı

## 🚀 Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Projeyi derle
npm run build
```

## 📝 Kullanım

### 1. Dummy Log Üretimi (Stres Testi)

```bash
# Test suite'leri çalıştır - logs klasörüne loglar yazılacak
npm test

# Alternatif olarak
npm run logs:generate
```

Bu komut çalıştırdığında:
- 500+ dummy log üretilir
- Her kategoriye özel loglar oluşur
- `../logs/` klasöründe JSON formatında dosyalar oluşur

### 2. MongoDB'ye Log Aktarımı

```bash
# MongoDB'nin çalıştığından emin ol
# mongodb://localhost:27017

# Logları MongoDB'ye aktar
npm run logs:mongo
```

## 📁 Log Yapısı

```
logs/
├── auth/
│   ├── auth-2025-10-03.log
│   └── auth-error-2025-10-03.log
├── cloud/
│   ├── cloud-2025-10-03.log
│   └── cloud-error-2025-10-03.log
├── microphone/
│   ├── microphone-2025-10-03.log
│   └── microphone-error-2025-10-03.log
├── system/
│   ├── system-2025-10-03.log
│   └── system-error-2025-10-03.log
└── user/
    ├── user-2025-10-03.log
    └── user-error-2025-10-03.log
```

## 🍃 MongoDB Koleksiyonları

MongoDB'ye aktarılan loglar şu koleksiyonlarda saklanır:
- `logs_auth`
- `logs_cloud`
- `logs_microphone`
- `logs_system`
- `logs_user

## 📊 Test Örnekleri

### Auth Logları
```typescript
await logService.generateAuthLogs(100);
```

### Cloud Logları
```typescript
await logService.generateCloudLogs(100);
```

### Mixed Kategori Stres Testi
```typescript
await logService.generateDummyLogs(1000);
```

## 🛠️ API Kullanımı

```typescript
import { LogService, LogCategory } from './logger/log.service';

// Tekil log yazma
logService.logAuth('info', {
  message: 'User login successful',
  userId: 'user_001',
  action: 'login',
  metadata: {
    ip: '192.168.1.1',
    userAgent: 'Browser'
  }
});

// MongoDB'yi etkinleştir
logService.enableMongoDB('mongodb://localhost:27017/logs');

// Bulk log üretimi
await logService.generateDummyLogs(1000);
```

## 📈 Performans

- **1000 log**: ~10 saniye
- **Dosya boyutu**: ~1MB per 1000 log
- **MongoDB yazma**: Paralel işlem
- **Bellek kullanımı**: Optimize edilmiş

## 🔧 Konfigürasyon

### Winston Logger Settings
- **Log Level**: debug
- **Format**: JSON
- **Rotation**: Günlük dosyalar
- **Max Size**: 10MB
- **Max Files**: 30

### MongoDB Settings
- **Default URI**: `mongodb://localhost:27017/logs`
- **Collection Pattern**: `logs_{category}`
- **Connection**: Auto-retry enabled

## 🧪 Test Coverage

```bash
# Unit testler
npm run test

# Coverage raporu
npm run test:cov

# Watch mode
npm run test:watch
```

## 🐛 Troubleshooting

### MongoDB Bağlantı Hatası
```bash
# MongoDB'nin çalıştığını kontrol et
brew services start mongodb-community
# veya
sudo systemctl start mongod
```

### Log Klasörü İzinleri
```bash
# Logs klasörü izinlerini kontrol et
chmod -R 755 ../logs/
```

## 📦 Ana Paketler

- **winston**: ^3.x - Ana logging kütüphanesi
- **winston-mongodb**: ^5.x - MongoDB transport
- **@nestjs/core**: ^11.x - NestJS framework
- **typescript**: ^5.x - TypeScript desteği

## 🎯 Proje Amacı

Bu proje asıl projen için hazırlık amaçlı geliştirildi:
1. ✅ Winston ile dummy log üretimi
2. ✅ Stres testi capability
3. ✅ MongoDB entegrasyonu
4. ✅ Kategori bazlı log yönetimi
5. ✅ NestJS modüler yapısı

Artık ana projende bu yapıyı kullanabilirsin! 🚀
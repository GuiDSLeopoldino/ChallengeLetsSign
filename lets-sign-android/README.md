# LetsSign Android - Native Kotlin App

Aplicativo nativo Android para assinatura digital de documentos, construído com **Jetpack Compose**, **Hilt**, **Retrofit**, **Room** e **Navigation Compose**.

## 🚀 Tecnologias

- **Kotlin** 1.9+
- **Jetpack Compose** (Material 3)
- **Hilt** (Dependency Injection)
- **Retrofit + OkHttp** (Networking)
- **Kotlinx Serialization** (JSON)
- **Room** (Local Database)
- **DataStore** (Preferences)
- **Navigation Compose** (Navigation)
- **Coil** (Image Loading)
- **PDF Viewer** (android-pdf-viewer)
- **Kotlinx Coroutines** (Async)

## 📱 Funcionalidades

- ✅ **Autenticação**: Login, registro, JWT tokens
- ✅ **Dashboard**: Lista de documentos com filtros
- ✅ **Criação de Documentos**: Wizard em 4 passos (Upload → Participantes → Campos → Enviar)
- ✅ **Visualização de Documentos**: PDF viewer nativo
- ✅ **Assinatura Digital**: Canvas para desenhar assinatura com metadados biométricos
- ✅ **Gerenciamento de Signatários**: CRUD completo
- ✅ **Assinatura/Recusa**: Fluxo completo para signatários
- ✅ **PDF Final**: Download do documento assinado
- ✅ **Tema**: Material 3 com suporte a modo escuro

## 🏗️ Arquitetura

```
com.letsign.mobile/
├── data/
│   ├── api/           # Retrofit services
│   ├── local/         # TokenManager, DataStore
│   └── repository/    # Repository implementations
├── domain/
│   ├── model/         # Data models (User, Document, etc.)
│   └── repository/    # Repository interfaces
├── presentation/
│   ├── navigation/    # NavHost, routes
│   ├── ui/
│   │   ├── components/    # Reusable UI components
│   │   └── screens/       # Screen composables
│   │       ├── auth/      # Login/Register
│   │       ├── documents/ # Document list/detail/wizard
│   │       └── signers/   # Signer management
│   └── viewmodel/     # ViewModels with Hilt
└── di/                # Hilt modules
```

## 🛠️ Configuração

### Pré-requisitos
- Android Studio Hedgehog (2023.1.1) ou superior
- JDK 17+
- Android SDK 34+

### Backend
O app conecta à API NestJS em `http://10.0.2.2:3000` (emulador) ou IP da máquina.
Configure em `ApiClient.kt`:

```kotlin
private const val BASE_URL = "http://SEU_IP:3000/"
```

### Build
```bash
# Debug APK
./gradlew assembleDebug

# Release APK
./gradlew assembleRelease

# Install no dispositivo
./gradlew installDebug
```

## 📦 Dependências Principais

```kotlin
// Compose BOM
implementation(platform("androidx.compose:compose-bom:2024.04.01"))

// Hilt
implementation("com.google.dagger:hilt-android:2.51")
ksp("com.google.dagger:hilt-compiler:2.51")

// Retrofit
implementation("com.squareup.retrofit2:retrofit:2.11.0")
implementation("com.squareup.retrofit2:converter-kotlinx-serialization:2.11.0")

// Room
implementation("androidx.room:room-runtime:2.6.1")
ksp("androidx.room:room-compiler:2.6.1")

// Navigation
implementation("androidx.navigation:navigation-compose:2.7.7")

// Coil
implementation("io.coil-kt:coil-compose:2.6.0")

// PDF Viewer
implementation("com.github.barteksc:android-pdf-viewer:3.2.0-beta.1")
```

## 🔐 Configuração de Assinatura (Release)

Crie `keystore.properties` na raiz:
```properties
KEYSTORE_PATH=../keystore.jks
KEYSTORE_PASSWORD=sua_senha
KEY_ALIAS=seu_alias
KEY_PASSWORD=sua_senha
```

## 📋 Próximos Passos

- [ ] Testes unitários (JUnit + MockK)
- [ ] Testes de UI (Compose Testing)
- [ ] CI/CD com GitHub Actions
- [ ] Push notifications (FCM)
- [ ] Sincronização offline
- [ ] Múltiplos idiomas (i18n)

## 📄 Licença

Proprietário - LetsSign
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Android: la app se cierra al abrir (build release / APK)

Si la app funciona en desarrollo pero al instalar el APK se cierra al iniciar:

1. **Ver el motivo del crash** (recomendado): conecta el dispositivo por USB, activa "Depuración USB" y ejecuta:
   ```bash
   adb logcat *:E | findstr -i "ReactNative\|Expo\|FATAL\|AndroidRuntime"
   ```
   Luego abre la app; en la terminal aparecerá el error. En macOS/Linux usa `grep` en lugar de `findstr`.

2. **Cambios que suelen ayudar** (ya aplicados en este proyecto):
   - Splash screen: se usa `SplashScreen.preventAutoHideAsync()` y `hideAsync()` cuando el layout está listo.
   - ErrorBoundary en la raíz: si el fallo es en JavaScript/React, verás "Algo salió mal" en lugar de cierre brusco.

3. **Si el crash es nativo** (no aparece pantalla "Algo salió mal"): el log de `adb logcat` indicará el módulo (p. ej. Reanimated, Maps, SecureStore). Revisa que en EAS Build uses el mismo `node_modules` y que las variables de entorno (`EXPO_PUBLIC_*`) estén definidas en el perfil de build.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

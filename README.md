# Install the latest eas cli

`sudo npm install -g eas-cli`

# Checks to perform before building

`npm update`
This will update your project dependencies to the latest versions.

`npm outdated`
This will list any outdated dependencies in your project.

`sudo npm outdated -g -depth=0`
This will list any globally installed outdated dependencies.

`sudo npm update -g`
This will update all globally installed packages to their latest versions.

`npx -y expo-doctor --verbose`
This will check for common issues in your project setup.

`npx expo install --check`
This will check for any outdated dependencies and install the latest compatible versions.

`npx expo install --fix`
This will fix any issues with your dependencies.

`npm audit fix`
This will fix any known vulnerabilities in your dependencies.

`npx expo prebuild` 
This will ensure that your native code is up to date with your current Expo configuration. (`npm install expo-system-ui` needs to be installed first)

# Building to send to expo dashboard

## Preview Build (Recommended for testing)

Includes debugging info and good for testing

`eas build --platform android --profile preview`

## Production Build (For final distrution)

Fully optimized, app store ready

`eas build --platform android --profile production`
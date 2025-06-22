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


# Expo <-> Google Play Store

## First Time Setup

Build a AAB file for Google Play Store
`eas build --platform android --profile production-aab` 

Step 1: Download Your Build
First, you need to get your AAB file:

Go to your EAS dashboard or use the link from your build
Download the AAB file (not APK) - this is what Google Play prefers
Save it somewhere easy to find

Step 2: Manual Upload to Play Console
1. Go to Internal Testing

In your Google Play Console, go to Testing → Internal testing
Click Create new release

2. Set Up App Signing

Choose Google-generated key (this is recommended)
This lets Google manage your app signing

3. Upload Your AAB

Click Upload under "App bundles"
Select your downloaded AAB file
Wait for it to process

4. Add Release Notes

Enter a release name like "Initial Release v1.0.0"
Add some release notes describing your app
Click Next

5. Review and Publish

Review the details
Click Save and publish

Step 3: Set Up Internal Testers

Create Tester List:

Go to Testers tab
Click Create email list
Add your email and any team members
Save the list


Get Test Link:

Click Copy link to get the testing URL
Share this with your testers



Step 4: Complete App Information
Before you can go to production, you need to complete these sections in the Dashboard:

App content - Content rating, target audience
Store listing - Description, screenshots, app icon
Privacy policy - Required URL to your privacy policy
Data safety - What data your app collects

Quick Start - Just for Testing
For now, to get the subscription setup working, you can:

Upload the AAB manually (steps above)
Add yourself as an internal tester
Test the subscription flow with your test account
Complete the store listing later when ready for production

Once you've done this manual upload once, all future updates can use:
eas submit --platform android --latest

## Every other time

Perfect! This is the detailed guide from Expo. Let me break down the key steps you need to follow:
Step-by-Step Process:
1. Create Google Cloud Project (if needed)

Go to [Google Cloud Console](https://console.cloud.google.com/projectcreate)
Create a new project or use existing one

2. Create Service Account

Go to https://console.cloud.google.com/iam-admin/serviceaccounts
Click Create Service Account
Name it something like carbie-play-store
Click Done

3. Create and Download JSON Key

From the service accounts list, click on your new service account
Click Keys → Add Key → Create new key
Select JSON format
Click Create - this downloads the JSON file

4. Enable Google Play API

Go to [Google Play Android Developer API](https://console.cloud.google.com/apis/library/androidpublisher.googleapis.com)
Click Enable

5. Invite Service Account to Play Console

In Google Play Console, go to Users and permissions
Click Invite new users
Enter the service account email (from step 2)
Give it these permissions:

View app information and download bulk reports
Manage production releases
Manage testing releases



6. Set Up Your File

Rename the downloaded JSON file to google-play-service-account.json
Move it to your Carbie project root folder
Add it to .gitignore:

echo "google-play-service-account.json" >> .gitignore
7. Try EAS Submit Again
eas submit --platform android --latest
The most important parts are:

Creating the service account in Google Cloud Console
Enabling the Google Play Android Developer API
Inviting the service account to your Play Console with proper permissions
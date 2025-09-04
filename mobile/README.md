# NSO Mobile Application

An online-activation React Native application for NSO. This app now supports online-only activation with 12-digit keys, user onboarding/registration, and a seamless data capture experience.

## Key Features
- Online-only device activation with 12-digit activation keys
- Registration/Profile submission connected to backend
- Sync-ready architecture (API service, device info, location metadata)

## Activation (Online Only)
- Keys must be 12 numeric digits (e.g., 123456789012)
- Mobile formats the input visually, but sends 12 digits to backend
- Requires internet connectivity to activate

Backend endpoint used:
- POST /api/v1/auth/activate

Expected response (simplified):
- success, token, refreshToken, data.user, keyExpiresAt, remainingDays

## Registration/Profile
After activation, user completes registration. The app updates profile server-side.

Backend endpoint used:
- PUT /api/v1/users/profile

Payload (simplified):
- firstName, lastName, facility, state, contactInfo

Note: User role is assigned by the activation key and not changed by profile update.

## Project Structure (mobile/)
- app/                    (entry and navigation)
- components/             (UI screens/components)
- services/apiService.ts  (HTTP client, activation, profile submission)
- assets/                 (images/fonts)

## Configuration
Set the API base URL and environment in `mobile/services/apiService.ts` (or your env manager) as needed for your deployment.

Typical environment variables:
- API_BASE_URL (e.g., https://api.example.com/api/v1)

## Development
- Install dependencies: `npm install` or `yarn`
- iOS: `npx pod-install` (inside ios/) then `npm run ios`
- Android: `npm run android`

## Testing
- Unit tests: `npm test`
- Lint: `npm run lint`

## Build
- Android Release: `cd android && ./gradlew assembleRelease`
- iOS Release: Xcode archive or `fastlane`

## Notes
- Activation requires internet connection
- Keys are validated online and marked used by the backend
- Admin console manages keys (userDetails, expiresAt)

## License
Proprietary. All rights reserved.

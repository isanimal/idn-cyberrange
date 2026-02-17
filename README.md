<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/16jNED1dMmdNssrg1SfYCu2GL9mtgLkC8

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

### Static Assets

Add images or other static files to the `public/assets` directory (create it if it
doesn't already exist). Anything placed there will be served from the root of the
development server, e.g. an image at
`public/assets/logo.png` can be referenced in JSX as `"/assets/logo.png"` or in
`index.html` as `<img src="/assets/logo.png" />`. This keeps non‑code assets
outside of the `src/` tree and ensures they are copied verbatim during build.

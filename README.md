# Solstice Solar Savings Dashboard

A responsive Next.js App Router demo for clean-energy sales teams. It includes a live savings estimate, ten-year projection chart, scenario presets, local lead capture, downloadable HTML report, theme switch, and configurable iframe snippet.

## Run locally

Requires Node.js 20 or later and npm.

```sh
npm install
npm run dev
```

Open `http://localhost:3000`. Use `npm run lint` and `npm run build` before deployment.

## Embed

Choose **Embed on your site**, set an accent color, and copy the iframe snippet. It opens this app with `?embed=1&accent=%23...` so the chosen accent is applied. Deploy the app first; the generated URL uses the current origin. Adjust the iframe height for the host page.

## Demo data and estimates

The calculator uses illustrative assumptions, not a site survey or proposal. Monthly savings are calculated as bill × roof exposure factor × 0.75. Estimated system cost is 80× the monthly bill for residential and 74× for commercial; the estimate then applies a 30% federal credit. Ten-year utility inflation uses the selected location profile. Carbon, property value, and ROI are approximate. Actual savings, system costs, incentives, tax eligibility, utility rates, and project economics vary. Verify all figures with a qualified installer and tax professional before making a decision.

Lead submissions are stored in the visitor's browser under `solstice-leads`; there is no remote API, authentication, or cross-device lead management in this demo. Replace this adapter with a secured CRM or server-side endpoint before collecting real customer data. The downloadable report is an HTML summary that can be opened in a browser and printed to PDF.
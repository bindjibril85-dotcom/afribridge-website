# AfriBridge Secure Website + PostgreSQL Enquiry Database

This package keeps the existing AfriBridge navy-and-gold website, official logo and founder portrait, and adds a server-side enquiry API backed by PostgreSQL. The portrait and logo image files are copied unchanged.

## What security is included
- Server-side validation with Zod; no database credentials in browser code.
- PostgreSQL parameterized query for saving form submissions.
- Helmet security headers and a Content Security Policy.
- Per-IP rate limiting on the enquiry endpoint, request-size limit and honeypot field.
- Consent is required and saved with each enquiry.
- Secrets are configured as hosting environment variables; `.env` is git-ignored.
- Health endpoint at `/health`; `/api/` is excluded from crawling.

This is a solid baseline, not a guarantee that any website is invulnerable. Keep dependencies updated, use MFA on hosting/database accounts, restrict database access, and configure backups/retention. Do not store payment card details, identity documents, or sensitive financial records in this enquiry form.

## Run locally (Node.js 20+ and PostgreSQL required)
1. Install Node.js 20 or newer.
2. Create a PostgreSQL database and copy its connection URL. The server creates the initial `enquiries` table and indexes on first boot; `schema.sql` is also provided for review or manual setup.
3. Copy `.env.example` to `.env`, then set `DATABASE_URL` to your local database connection string. Do not share or commit the real `.env` file.
4. In this folder run `npm install`, then `npm start`.
5. Open `http://localhost:3000`. Check `http://localhost:3000/health`.
6. Submit a test enquiry, then check the `enquiries` table in PostgreSQL.

## Deploy to Render (steps you must complete)
1. Create a GitHub account/repository and upload these files. Do not upload `.env` or credentials.
2. In Render, choose **New + → Blueprint**, connect your repository, and let it read `render.yaml`. Review the current service/database pricing before confirming; paid plans may incur charges.
3. The blueprint provisions a web service and PostgreSQL database. Verify the `DATABASE_URL` environment variable is connected. On first successful boot, the server creates the initial table and indexes automatically.
4. Confirm the deployment is healthy at `/health`; test a real enquiry and confirm it appears in PostgreSQL.
5. Add your custom domain in Render. DNS settings depend on your registrar; follow the exact values Render shows. HTTPS is normally provisioned by Render after DNS verification.
6. Before public launch, replace `DOMAIN_NAME_REQUIRED` in `robots.txt` and `sitemap.xml` with the actual domain. Add canonical and Open Graph URLs to HTML using that exact domain. Do not use a domain you have not purchased/connected.

## Google discovery
1. Verify the site in Google Search Console after the domain is live.
2. Submit `https://YOUR-REAL-DOMAIN/sitemap.xml`.
3. Use URL Inspection to request indexing for the homepage and main pages. Google decides whether/when to index and rank them; nobody can guarantee a first-place result or instant appearance.
4. Create/complete the official business profile if eligible, link official social accounts, and publish truthful company information consistently. Do not buy fake reviews or keyword-stuff pages.

## Database management
Enquiries are stored in `enquiries` with a status (`new`, `reviewing`, `replied`, `closed`, `spam`) and timestamp. The package does not expose a public admin dashboard. View/manage records through the authenticated PostgreSQL dashboard or client only; never create a public endpoint that dumps all enquiries. Create a separate authenticated admin workflow if you want an inbox inside the website.

## Important before launch
- Purchase/choose a domain and confirm the exact company public contact details.
- Replace placeholder social URLs with your real official profiles.
- Review the privacy notice and retention/deletion process for the countries you serve.
- Enable automated database backups and test restoration.
- Test mobile layout, contact form, 404, all links, and Google Search Console after deployment.
- Gold wording describes sourcing enquiries and introductions, not a claim that AfriBridge owns inventory or is licensed in every jurisdiction. Verify counterparties, licences and export/import compliance before any transaction.

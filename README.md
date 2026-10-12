# College portal

## Run locally

Use Node.js 20.19+ or 22.12+ and run:

```sh
npm install
npm run dev
```

The development command starts both the Vite web app and the Node API. The API writes college and account records to `data/portal-data.json`; that file is local server data and is excluded from Git.

## Create the first accounts

1. Open the site and choose **Admin Login → Principal → Set up a new college**.
2. The principal creates the college and receives its generated college access code on the principal dashboard.
3. Share that code with the HOD, staff, and students. They choose their role, select **Create account**, and register with the code.
4. Sign in with the registered email and password.

### Development demo logins

When started with `npm run dev`, the login form shows development-only **Fill demo login** buttons. Demo accounts are seeded in server memory only and are not written to the database. The shared demo password is `DemoPortal!2026`. Select the corresponding role first; staff has separate In-Charge and Staff demo accounts. These accounts are disabled when running the production server.

Passwords are hashed on the server, and login state uses an HTTP-only cookie. The JSON-file store and in-memory sessions are suitable for a single-server demonstration. For multi-server/production deployment, use a managed database and shared session store, serve over HTTPS, and configure account verification and password recovery.

## Production build

```sh
npm run build
npm start
```

The production server serves the built frontend and API on port `3001` by default. Set `API_PORT` and `PORTAL_DATA_FILE` to customize the port and database file.

## Public pages and search indexing

The public routes are `/`, `/privacy`, and `/faq`. Role dashboards require a signed-in account and are intentionally excluded from the sitemap and blocked from indexing. Unknown paths return the custom not-found page with an HTTP 404 response.

Set `PUBLIC_SITE_URL` to the canonical HTTPS origin in production (for example, `https://portal.your-college.edu`). The server uses it for `robots.txt` and `sitemap.xml`, and redirects production HTTP requests to HTTPS. TLS certificates and proxy HTTPS forwarding must be configured by the deployment host. After deployment, verify `/robots.txt` and `/sitemap.xml`, add the verified domain in Google Search Console, then submit `https://portal.your-college.edu/sitemap.xml` there.

For optional Google Analytics, set the Vite build variable `VITE_GA_MEASUREMENT_ID` to the college-owned GA4 measurement ID. Analytics is not loaded until a visitor opts in; advertising storage remains denied. Rebuild after changing the variable. No Analytics account or measurement ID is included in this repository.

## Account safety and privacy

Login and registration requests are validated by the server, limited by source address, and include a honeypot field. Successful registration shows a confirmation step before entering the portal. The privacy notice and FAQ are public at `/privacy` and `/faq`.

The portal currently has no testimonials. Do not add endorsements unless the college can verify the source and has permission to publish them.

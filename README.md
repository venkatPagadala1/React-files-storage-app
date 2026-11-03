# VSR Group of Companies Workspace

A React and Vite UI prototype for a shared company overview and employee preparation workspace. Its responsive interface uses grouped, role-aware navigation, a consistent typography and spacing system, and rounded palette-aware animated gradient frames with subtle depth. The outer landing and workspace borders have a multicolor gradient and a bright moving highlight that travels around the frame continuously and responds to page scroll, while prominent cards respond to their own scroll position. Edge animations respect the operating system's reduced-motion preference. The prototype includes a dimensional V/R brand mark, sample company-resource and training views with expandable learning paths and locally saved course links (including full-view details and edit/save controls), a visual-only role preview, employee documents and notes, a preparation calendar with event comments, a local demo profile with an optional profile photo, preparation boards, and an interactive whiteboard with drawing and shape tools, image placement, object layers, undo/redo, and SVG/PNG export.

## Development

- `npm run dev` starts the local development server.
- `npm run build` creates the production bundle.
- `npm run lint` checks the source code.

## Local and cloud behavior

Without Firebase environment values, the app stays in local preview mode and keeps folders, notes, files, and sticky tasks in this browser. With Firebase configured, sign-up and sign-in use Firebase Authentication. Folders, notes, files, and sticky tasks then use the authenticated API and are private to the signed-in Firebase UID. Existing local folders, notes, files, and tasks can be imported once after sign-in; the import prompt leaves the browser copy intact.

The calendar, whiteboard, demo profile, theme, palette, and illustrative company data remain browser-local. The role selector is still only a visual preview; cloud API authorization is per user, not role-based. This is a private prototype, not a production employee portal. Do not store confidential company or employee information.

## Deploy to Firebase Hosting, Cloud Run, and Neon

The frontend is a Vite static site on Firebase Hosting. The Node API runs on Cloud Run. PostgreSQL and private file objects use a Neon project. The Cloud Run service is publicly reachable so the browser can call it, but every `/api` route requires a verified Firebase ID token and scopes database queries to that token's UID.

### 1. Create Firebase and GCP resources

1. Create a GCP project and attach billing. Cloud Run requires a billing account; the Firebase project will use the Blaze plan, with applicable Firebase Hosting free quotas. In **Billing → Budgets & alerts**, create a small monthly budget and alert thresholds (for example, 50%, 90%, and 100%). Budget alerts notify you but do not stop charges.
2. In Firebase Hosting, create the default Hosting site before adding the Firebase Web App. New Firebase projects no longer automatically create a Hosting site. Record its `web.app` domain.
3. In Firebase Authentication, enable Email/Password sign-in. Add the Hosting domain and `localhost` to authorized domains.
4. Enable Cloud Run, Cloud Build, Artifact Registry, and Secret Manager APIs for the GCP project.

### 2. Create Neon PostgreSQL and file storage

1. Create a Neon project in Singapore and copy the pooled PostgreSQL connection string. Use the string with its TLS requirement (`sslmode=require`).
2. Create a private Object Storage bucket and record its endpoint, region, bucket name, access key, and secret key. These values are server secrets; never put them in a `VITE_` variable.
3. Neon currently includes 1 GB of PostgreSQL storage, 100 compute hours per project per month, and 5 GB of Object Storage on its free plan. Monitor those limits and keep an independent export of data you need to retain.

### 3. Configure the frontend and API

1. Copy `.env.example` to `.env.production.local`. Fill in the public Firebase Web App values and the Cloud Run API URL. These Firebase web configuration values are public; do not put database or storage credentials here.
2. Create Secret Manager secrets named `neon-database-url`, `neon-object-access-key-id`, and `neon-object-secret-access-key`, and add their values. Use the database URL and object credentials from Neon.
3. Grant the Cloud Run runtime service account `Secret Manager Secret Accessor` on those three secrets. Cloud Run uses its service identity for Firebase Admin authentication; do not upload a service-account key.
4. Deploy the API from the `server` directory, setting `FIREBASE_PROJECT_ID`, `ALLOWED_ORIGINS` (the Hosting domain plus local development origin), `OBJECT_STORAGE_ENDPOINT`, `OBJECT_STORAGE_BUCKET`, and `OBJECT_STORAGE_REGION`. Map `DATABASE_URL`, `OBJECT_STORAGE_ACCESS_KEY_ID`, and `OBJECT_STORAGE_SECRET_ACCESS_KEY` to the Secret Manager secrets. Use region `asia-south1`, minimum instances `0`, and a low maximum instance count such as `2`.

Example deployment command after setting those values in your shell or Cloud Shell:

```sh
gcloud run deploy vsr-workspace-api \
  --source server \
  --region asia-south1 \
  --allow-unauthenticated \
  --min 0 \
  --max 2 \
  --set-env-vars FIREBASE_PROJECT_ID=YOUR_PROJECT_ID,ALLOWED_ORIGINS=https://YOUR_SITE.web.app,OBJECT_STORAGE_ENDPOINT=YOUR_NEON_S3_ENDPOINT,OBJECT_STORAGE_BUCKET=workspace-files,OBJECT_STORAGE_REGION=YOUR_STORAGE_REGION \
  --set-secrets DATABASE_URL=neon-database-url:latest,OBJECT_STORAGE_ACCESS_KEY_ID=neon-object-access-key-id:latest,OBJECT_STORAGE_SECRET_ACCESS_KEY=neon-object-secret-access-key:latest
```

4. Copy the returned Cloud Run URL into `VITE_API_BASE_URL` in `.env.production.local`. The API allows uploads up to 25 MB per file.

### 4. Build and deploy the frontend

1. Copy the exact Firebase Web App configuration values from the Firebase console into `.env.production.local`; set `VITE_API_BASE_URL` to the Cloud Run URL. Install dependencies and build: `npm install` then `npm run build`.
2. Copy `.firebaserc.example` to `.firebaserc` and replace the project ID, or run `firebase use YOUR_PROJECT_ID`.
3. Install the Firebase CLI (`npm install --global firebase-tools`) and deploy Hosting: `firebase deploy --only hosting --project YOUR_PROJECT_ID`.
4. Open the `web.app` site, create an account, and verify the browser import prompt. Smoke-test folder/note/task/file create, update, delete, and retrieval from another browser. Create a second account and verify it cannot access the first account's records by changing IDs in requests.

### Free quota and billing notes

Firebase Hosting includes up to 10 GB of stored releases and 10 GB of monthly data transfer at no cost. Cloud Run request-based billing includes monthly free allowances of 2 million requests, 180,000 vCPU-seconds, and 360,000 GiB-seconds. Its 1 GiB free outbound transfer applies within North America, so calls from the Mumbai Cloud Run region to Neon can incur a small network charge. Cloud Run overages and other GCP usage can also be billed. This setup is designed to stay within free quotas for a small prototype but does not guarantee a $0 bill. Review current limits before deployment:

- [Firebase Hosting quotas](https://firebase.google.com/docs/hosting/usage-quotas-pricing)
- [Cloud Run pricing](https://cloud.google.com/run/pricing)
- [Neon pricing](https://neon.com/pricing)
- [Neon regions](https://neon.com/docs/introduction/regions)

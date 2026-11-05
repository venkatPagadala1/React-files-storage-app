# VSR Group of Companies Workspace

A React and Vite workspace with Firebase Authentication, a UID-scoped Node API on Cloud Run, Neon PostgreSQL, and private object storage. Folders, notes, uploaded files, tasks, profile details, calendar events, and whiteboards are stored for the signed-in account. The interface includes document management, learning notes, a preparation calendar, profile settings, sticky tasks, and a whiteboard.

## Development

- Install the frontend and API dependencies from the repository root: `npm ci` and `npm ci --prefix server`. Restart any running frontend or API processes after installing dependencies so they use the updated packages.
- For a local sign-in walkthrough before creating a Firebase project, install a JDK (11 or newer), copy `.env.local.example` to `.env.local`, then open three terminals in the repository:
  1. `npm run dev:auth-emulator` starts Firebase Authentication Emulator with the fake project `demo-vsr-workspace`.
  2. `npm run dev:local-api` starts an in-memory API that accepts only emulator ID tokens and keeps users isolated by UID.
  3. `npm run dev` starts Vite. Sign up with any test email and password.
- Emulator accounts and workspace data are temporary and are cleared when the emulator/API processes stop. This local setup cannot connect to production Firebase or Cloud Run and must not be deployed.
- For the real deployment, use `.env.example` as the template for `.env.production.local`, enter the Firebase Web App values and deployed Cloud Run URL, enable **Email/Password** in Firebase Console, then rebuild and deploy Hosting. Never use `.env.local.example` for a production build.
- `npm run build` creates the production bundle. Build environments must install development dependencies (for example, run `npm ci --include=dev` before the build); Vite, Tailwind CSS, and PostCSS are build-time tools.
- `npm run lint` checks the source code.

## Local and cloud behavior

Firebase Authentication and API configuration are required to use the workspace. Without both, sign-in is disabled. The API verifies Firebase ID tokens on every data request and scopes database rows and object storage keys to the token UID. Existing local folders, notes, files, tasks, profile, calendar, and whiteboard data can be imported once after sign-in; the import prompt leaves the browser copy intact.

Profile, calendar, and whiteboard data are stored in PostgreSQL under the account UID. Theme and palette preferences are cosmetic and remain on the current device. Accounts are isolated from one another; organization membership, shared company resources, invitations, and role-based administration are not implemented. The current authorization model is suitable only for individual account workspaces, not a shared company portal.

## Deploy to Firebase Hosting, Cloud Run, and Neon

The frontend is a Vite static site on Firebase Hosting. The Node API runs on Cloud Run. PostgreSQL and private file objects use a Neon project. The Cloud Run service is publicly reachable so the browser can call it, but every `/api` route requires a verified Firebase ID token and scopes database queries to that token's UID.

### 1. Create Firebase and GCP resources

1. Create a GCP project and attach billing. Cloud Run requires a billing account; the Firebase project will use the Blaze plan, with applicable Firebase Hosting free quotas. In **Billing → Budgets & alerts**, create a small monthly budget and alert thresholds (for example, 50%, 90%, and 100%). Budget alerts notify you but do not stop charges.
2. In Firebase Hosting, create the default Hosting site before adding the Firebase Web App. New Firebase projects no longer automatically create a Hosting site. Record its `web.app` domain.
3. In Firebase Authentication, enable Email/Password sign-in. Add the Hosting domain and `localhost` to authorized domains.
4. Enable Cloud Run, Cloud Build, Artifact Registry, and Secret Manager APIs for the GCP project.

### 2. Create Neon PostgreSQL and file storage

1. Create a Neon project in Singapore and copy the pooled PostgreSQL connection string. Use the string with its TLS requirement (`sslmode=require`).
2. Create a private Object Storage bucket. In Neon, use the bucket's branch endpoint and region, and create a credential for that branch (or an ancestor) with both `storage:read` and `storage:write` scopes. For S3 credentials, use `token_id` as the access key ID and `s3_secret_access_key` as the secret access key; do not use `token_id_short` or `api_token`. These values are server secrets; never put them in a `VITE_` variable.
3. Neon currently includes 1 GB of PostgreSQL storage, 100 compute hours per project per month, and 5 GB of Object Storage on its free plan. Monitor those limits and keep an independent export of data you need to retain.

### 3. Configure the frontend and API

1. Copy `.env.example` to `.env.production.local`. Fill in the public Firebase Web App values and the Cloud Run API URL. These Firebase web configuration values are public; do not put database or storage credentials here.
2. Create Secret Manager secrets named `neon-database-url`, `neon-object-access-key-id`, and `neon-object-secret-access-key`, and add their values. Use the database URL and correctly scoped object credentials from Neon.
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

If file downloads fail with `403 AccessDenied`, create a fresh Neon credential with `storage:read` and `storage:write` on the branch used by `OBJECT_STORAGE_ENDPOINT` (or one of its ancestors), add its `token_id` and `s3_secret_access_key` as new Secret Manager versions, and redeploy the API. Confirm that `OBJECT_STORAGE_ENDPOINT` and `OBJECT_STORAGE_REGION` match that branch's storage endpoint and region. Neon credentials are branch-scoped, and a credential from an unrelated branch cannot read the bucket.

### 4. Build and deploy the frontend

1. Copy the exact Firebase Web App configuration values from the Firebase console into `.env.production.local`; set `VITE_API_BASE_URL` to the Cloud Run URL. Install all dependencies, including development dependencies, and build: `npm ci --include=dev` then `npm run build`. Configure any CI/deployment build to use the same install command; do not omit development dependencies before building.
2. Copy `.firebaserc.example` to `.firebaserc` and replace the project ID, or run `firebase use YOUR_PROJECT_ID`.
3. Install the Firebase CLI (`npm install --global firebase-tools`) and deploy Hosting: `firebase deploy --only hosting --project YOUR_PROJECT_ID`.
4. Open the `web.app` site, create an account, and verify the browser import prompt. Smoke-test folder/note/task/file create, update, delete, and retrieval from another browser. Create a second account and verify it cannot access the first account's records by changing IDs in requests.

### Free quota and billing notes

Firebase Hosting includes up to 10 GB of stored releases and 10 GB of monthly data transfer at no cost. Cloud Run request-based billing includes monthly free allowances of 2 million requests, 180,000 vCPU-seconds, and 360,000 GiB-seconds. Its 1 GiB free outbound transfer applies within North America, so calls from the Mumbai Cloud Run region to Neon can incur a small network charge. Cloud Run overages and other GCP usage can also be billed. This setup does not guarantee a $0 bill. Review current limits before deployment:

- [Firebase Hosting quotas](https://firebase.google.com/docs/hosting/usage-quotas-pricing)
- [Cloud Run pricing](https://cloud.google.com/run/pricing)
- [Neon pricing](https://neon.com/pricing)
- [Neon regions](https://neon.com/docs/introduction/regions)

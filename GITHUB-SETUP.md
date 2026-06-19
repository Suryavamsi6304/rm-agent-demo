# Push RM Agent Demo to GitHub

## Quick Start (3 Steps)

### Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create new repository:
   - **Repository name**: `rm-agent-demo`
   - **Description**: "Demo project for RM Agent Jenkins pipeline testing"
   - **Visibility**: Private (or Public if sharing with team)
   - **Do NOT initialize** with README (we have one)
3. Click **Create repository**
4. Copy the repository URL (HTTPS or SSH)

### Step 2: Add Remote & Push

```bash
# Navigate to project directory
cd c:\Users\smarrapu\Desktop\CWC\ESB\rm-agent-demo

# Add GitHub as remote
git remote add origin https://github.com/YOUR_ORG/rm-agent-demo.git

# Push to GitHub
git branch -M main
git push -u origin main
```

Replace `YOUR_ORG` with your GitHub organization/username.

### Step 3: Verify in Jenkins

1. Go to Jenkins Dashboard
2. Create new Pipeline job
3. In **Pipeline** section:
   - Select **Pipeline script from SCM**
   - Choose **Git**
   - Repository URL: `https://github.com/YOUR_ORG/rm-agent-demo.git`
   - Branch: `*/main`
4. Point to **Jenkinsfile-build** in the pipeline setup folder

---

## Using SSH (Optional - More Secure)

If you have SSH keys configured:

```bash
# Add SSH remote instead
git remote add origin git@github.com:YOUR_ORG/rm-agent-demo.git

# Push
git branch -M main
git push -u origin main
```

---

## What's in the Demo Project

| File | Purpose |
|------|---------|
| `package.json` | npm workspaces configuration |
| `packages/api-server/` | Lambda function code (TypeScript) |
| `packages/api-server/src/lambda.ts` | Handler entry point |
| `packages/api-server/src/handlers/` | API endpoints (calendar, validate-date, submit-request) |
| `apps/release-planner-ui/` | UI assets folder |
| `generated-calendar-2026.json` | Mock calendar data (132+ entries) |
| `.gitignore` | Excludes node_modules, build artifacts |

---

## Testing Jenkins Pipeline with This Project

### 1. Build Stage (Jenkinsfile-build)
```bash
# Will:
✓ Checkout code from GitHub
✓ Install dependencies (npm install)
✓ TypeCheck (npm run typecheck)
✓ Bundle Lambda (npm --workspace @rm/api-server run bundle)
✓ Prepare Lambda package (add calendar, UI)
✓ Create zip artifact
✓ Upload to S3: s3://rm-planner-artifacts/builds/{BUILD_NUMBER}/
```

**Expected output**: `lambda-build-{BUILD_NUMBER}.zip` in S3

### 2. Deploy to Non-Prod (Jenkinsfile-deploy-nonprod)
```bash
# Parameters:
- BUILD_NUMBER_TO_DEPLOY: (from build stage)
- ENVIRONMENT: dev or staging

# Will:
✓ Download artifact from S3
✓ Deploy to Lambda
✓ Run 12 validation checks
✓ Generate deployment report
```

**Expected output**: All 12 checks pass ✓

### 3. Deploy to Production (Jenkinsfile-deploy-prod)
```bash
# Parameters:
- BUILD_NUMBER_TO_DEPLOY: (from build stage)
- SKIP_APPROVAL: false (requires approval)

# Will:
✓ Strict pre-deployment validation
✓ Require approval gate (24-hour timeout)
✓ Deploy to production Lambda
✓ Run 15 validation checks
✓ Review CloudWatch logs
```

**Expected output**: 15/15 checks pass, no ERROR logs

---

## Continuous Integration Setup

### Auto-Build on Push

1. Go to GitHub repo settings
2. **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `https://your-jenkins-url/github-webhook/`
   - **Content type**: `application/json`
   - **Events**: Push events
4. Save

Now every push triggers Jenkins build automatically.

---

## Troubleshooting

### "Repository not found" error
```bash
# Verify you added the correct remote
git remote -v

# Should show:
# origin  https://github.com/YOUR_ORG/rm-agent-demo.git (fetch)
# origin  https://github.com/YOUR_ORG/rm-agent-demo.git (push)
```

### "Permission denied" error
```bash
# If using SSH, verify key is added
ssh-keygen -t ed25519 -C "your-email@example.com"
cat ~/.ssh/id_ed25519.pub  # Copy and add to GitHub Settings > SSH Keys

# If using HTTPS, you may need to use Personal Access Token
# Go to GitHub Settings > Developer settings > Personal access tokens
# Generate token with 'repo' scope
# Use token as password when pushing
```

### "Cannot push to repository" error
```bash
# Verify you have write access
# Go to GitHub repo Settings > Collaborators

# Or check if it's a fork - you need write access to your own repo
git remote set-url origin https://github.com/YOUR_USERNAME/rm-agent-demo.git
```

---

## Next Steps

After pushing to GitHub:

1. ✅ **Create Jenkins Job**
   - Point to the GitHub repository
   - Use `Jenkinsfile-build` from pipeline setup

2. ✅ **Test Build Pipeline**
   - Jenkins → rm-agent-build → Build Now
   - Check S3 for artifacts: `s3://rm-planner-artifacts/builds/`

3. ✅ **Test Non-Prod Deploy**
   - Jenkins → rm-agent-deploy-nonprod
   - BUILD_NUMBER_TO_DEPLOY: `<build_number>`
   - ENVIRONMENT: `dev`

4. ✅ **Validate Endpoints**
   ```bash
   curl https://rm-dev.planner.lla.digital/
   curl https://rm-dev.planner.lla.digital/api/calendar
   curl -X POST https://rm-dev.planner.lla.digital/api/validate-date \
     -H "Content-Type: application/json" \
     -d '{"date":"2026-06-02"}'
   ```

5. ✅ **Deploy to Production**
   - After staging validation passes
   - Jenkins → rm-agent-deploy-prod
   - Approve the deployment gate

---

## Project Structure After Push

```
GitHub: YOUR_ORG/rm-agent-demo
├── .git/
├── .gitignore
├── README.md
├── package.json (root with workspaces)
├── generated-calendar-2026.json
├── packages/
│   └── api-server/
│       ├── package.json
│       ├── tsconfig.json
│       ├── build-bundle.js
│       └── src/
│           ├── lambda.ts
│           └── handlers/
│               ├── calendar.ts
│               ├── validate-date.ts
│               └── submit-request.ts
└── apps/
    └── release-planner-ui/
        ├── package.json
        └── build/
            └── index.html
```

---

## Support Resources

- **Jenkins Pipeline Details**: `../README.md` in pipeline setup folder
- **API Endpoint Info**: `README.md` in this project
- **AWS CLI**: `aws s3 ls s3://rm-planner-artifacts/builds/`
- **Lambda Logs**: CloudWatch → Log Groups → `/aws/lambda/release-planner-api-dev`

Happy deploying! 🚀

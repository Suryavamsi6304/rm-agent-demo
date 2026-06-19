# RM Agent Demo Project

Demo project for testing the Jenkins CI/CD pipeline infrastructure for RM Agent Lambda function deployments.

## Project Structure

```
rm-agent-demo/
├── packages/
│   └── api-server/                    # @rm/api-server workspace
│       ├── src/
│       │   ├── lambda.ts             # Lambda handler entry point
│       │   └── handlers/
│       │       ├── calendar.ts       # Calendar data endpoint
│       │       ├── validate-date.ts  # Date validation endpoint
│       │       └── submit-request.ts # Jira integration endpoint
│       ├── dist/                     # Compiled JavaScript
│       ├── package.json
│       ├── tsconfig.json
│       └── build-bundle.js
├── apps/
│   └── release-planner-ui/           # UI assets
│       ├── build/
│       │   └── index.html            # Web interface
│       └── package.json
├── generated-calendar-2026.json      # Mock calendar data (132+ entries)
├── package.json                      # Root workspace configuration
├── .gitignore
└── README.md
```

## Features

- ✅ TypeScript Lambda function with 3 API endpoints
- ✅ AWS API Gateway routing simulation
- ✅ Jira integration support (with fallback)
- ✅ Calendar data validation
- ✅ Health check endpoint
- ✅ npm workspaces for multi-package management
- ✅ Production-ready structure for Jenkins testing

## API Endpoints

### 1. Health Check
```bash
GET /
Response: { "status": "ok", "timestamp": "..." }
```

### 2. Get Calendar
```bash
GET /api/calendar
Response: {
  "success": true,
  "data": { "year": 2026, "entries": [...], "count": 132 },
  "count": 132
}
```

### 3. Validate Date
```bash
POST /api/validate-date
Body: { "date": "2026-06-02" }
Response: {
  "success": true,
  "date": "2026-06-02",
  "feasible": true,
  "reason": "Available for deployment"
}
```

### 4. Submit Request (Jira)
```bash
POST /api/submit-request
Body: {
  "title": "Release v1.0",
  "description": "Production release",
  "date": "2026-06-15",
  "team": "Platform"
}
Response: {
  "success": true,
  "issueKey": "PROJ-123",
  "message": "Request submitted successfully",
  "issueUrl": "https://jira.example.com/browse/PROJ-123"
}
```

## Setup & Installation

### Prerequisites
- Node.js 22.x
- npm 10.x or higher
- Git

### Local Development

```bash
# Clone the repository
git clone https://github.com/your-org/rm-agent-demo.git
cd rm-agent-demo

# Install dependencies
npm install

# TypeCheck (validate TypeScript)
npm run typecheck

# Build
npm --workspace @rm/api-server run build

# Bundle for Lambda
npm --workspace @rm/api-server run bundle
```

### Verify Build Artifacts

```bash
# Check if artifacts were created
ls -la build-artifacts/

# Verify zip file
unzip -l build-artifacts/lambda-build-*.zip
```

## Jenkins Pipeline Integration

### Build Pipeline Usage

1. **Trigger Jenkins Build Job**
   ```
   Jenkins → rm-agent-build → Build Now
   ```

2. **Check Artifacts in S3**
   ```bash
   aws s3 ls s3://rm-planner-artifacts/builds/
   ```

3. **Deployment**
   ```
   Jenkins → rm-agent-deploy-nonprod
   - BUILD_NUMBER_TO_DEPLOY: <build_number>
   - ENVIRONMENT: dev or staging
   ```

### Validation Checks

The Jenkins pipeline validates:
- ✅ Lambda bundle integrity
- ✅ API health check (10 retries)
- ✅ Calendar data (132+ entries)
- ✅ Date validation endpoint
- ✅ Jira integration
- ✅ UI loads successfully

## Environment Variables

For Jira integration in Lambda:

```bash
export JIRA_BASE_URL=https://api.atlassian.com/ex/jira/818a5421-bb83-49a9-b1ab-c1a4d9283112/rest/api/3
export JIRA_AUTH_HEADER=Basic <token>
export JIRA_PROJECT_ID=11303
export JIRA_ISSUETYPE_ID=15268
export JIRA_PRIORITY_ID=10003
export JIRA_TEAM_ID=065a8977-fc61-44b9-984b-f68055effe59
export JIRA_MARKET_OPTION_ID=25297
export JIRA_BROWSE_BASE_URL=https://lla-sandbox-801.atlassian.net
```

## Testing Locally

### 1. Build the project
```bash
npm install
npm run typecheck
npm --workspace @rm/api-server run bundle
```

### 2. Verify artifacts
```bash
# Windows PowerShell
Get-Item build-artifacts/lambda-build-*.zip | Select-Object FullName, Length

# Linux/Mac
ls -lh build-artifacts/lambda-build-*.zip
```

### 3. Test API endpoints locally
```bash
# Install curl or use npm packages like httpie

# Health check
curl http://localhost:3000/

# Calendar
curl http://localhost:3000/api/calendar

# Validate date
curl -X POST http://localhost:3000/api/validate-date \
  -H "Content-Type: application/json" \
  -d '{"date":"2026-06-02"}'

# Submit request
curl -X POST http://localhost:3000/api/submit-request \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","description":"Demo release"}'
```

## Troubleshooting

### TypeScript Compilation Errors
```bash
# Verify TypeScript is installed
npm list typescript

# Reinstall if needed
npm install --save-dev typescript
```

### Bundle Creation Issues
```bash
# Ensure dist directory exists
npm --workspace @rm/api-server run build

# Manually verify bundle
ls -la build-artifacts/
```

### AWS Lambda Deployment
```bash
# Verify AWS credentials
aws sts get-caller-identity

# Check S3 bucket access
aws s3 ls s3://rm-planner-artifacts/

# Upload test artifact
aws s3 cp build-artifacts/lambda-build-test.zip s3://rm-planner-artifacts/builds/test/
```

## Git Workflow

### Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit: RM Agent demo project"
```

### Push to GitHub

1. **Create GitHub repository**
   - Go to https://github.com/new
   - Create repository `rm-agent-demo`
   - Copy the repository URL

2. **Add remote and push**
   ```bash
   git remote add origin https://github.com/your-org/rm-agent-demo.git
   git branch -M main
   git push -u origin main
   ```

3. **Configure Jenkins with GitHub**
   - Go to Jenkins → New Item → Pipeline
   - Add repository URL: `https://github.com/your-org/rm-agent-demo.git`
   - Configure branch: `*/main`
   - Set up webhook for auto-trigger (optional)

## Next Steps

1. ✅ Push this project to GitHub
2. ✅ Create Jenkins build job pointing to this repo
3. ✅ Run build pipeline
4. ✅ Deploy to dev/staging
5. ✅ Validate all endpoints
6. ✅ Deploy to production

## Support

For issues with:
- **Jenkins Pipelines**: See `README-JENKINS.md` in the pipeline setup folder
- **AWS Lambda**: Check CloudWatch Logs
- **Jira Integration**: Verify environment variables and API token
- **API Endpoints**: Enable Lambda debug logging

## License

Internal use only - LLA Technologies

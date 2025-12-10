# Publishing to npm

This guide explains how to publish `@taskingagency/mcp-duffel-travels` to npm.

## Prerequisites

1. **npm Account**
   - Sign up at [npmjs.com](https://www.npmjs.com/signup)
   - Verify your email

2. **Organization (Optional but Recommended)**
   - Create organization: https://www.npmjs.com/org/create
   - Name it `taskingagency`
   - Or use your existing organization

3. **Login to npm**
   ```bash
   npm login
   ```
   Enter your username, password, and email.

## Pre-Publication Checklist

### 1. Update package.json
✅ Already configured with:
- Package name: `@taskingagency/mcp-duffel-travels`
- Version: `1.0.0`
- Repository URLs
- Public access configured

### 2. Verify .npmignore or files field
✅ The `files` field in package.json specifies what gets published:
- `dist/` (compiled code)
- `README.md`
- `LICENSE`
- `.env.example`

**Not published:** `src/`, `node_modules/`, tests, `.env`

### 3. Test the build
```bash
npm run build
npm test
```

### 4. Test local installation
```bash
# Pack the package locally
npm pack

# This creates: taskingagency-mcp-duffel-travels-1.0.0.tgz
# Test install it:
npm install -g ./taskingagency-mcp-duffel-travels-1.0.0.tgz

# Verify it works:
mcp-duffel-travels --version
```

## Publishing Steps

### First-Time Publishing

1. **Login to npm**
   ```bash
   npm login
   ```

2. **Publish the package**
   ```bash
   npm publish
   ```

   For scoped packages on first publish, you may need:
   ```bash
   npm publish --access public
   ```

3. **Verify publication**
   Visit: https://www.npmjs.com/package/@taskingagency/mcp-duffel-travels

### Updating the Package

1. **Update version in package.json**
   ```bash
   # Patch version (1.0.0 -> 1.0.1)
   npm version patch

   # Minor version (1.0.0 -> 1.1.0)
   npm version minor

   # Major version (1.0.0 -> 2.0.0)
   npm version major
   ```

2. **Publish the update**
   ```bash
   npm publish
   ```

3. **Push git tags**
   ```bash
   git push --tags
   git push
   ```

## Installation for Users

Once published, users can install with:

```bash
# Global installation
npm install -g @taskingagency/mcp-duffel-travels

# Local installation
npm install @taskingagency/mcp-duffel-travels
```

### Claude Desktop Configuration

After installation, users configure Claude Desktop:

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "duffel-travels": {
      "command": "npx",
      "args": [
        "-y",
        "@taskingagency/mcp-duffel-travels"
      ],
      "env": {
        "SERPAPI_API_KEY": "your_serpapi_key_here"
      }
    }
  }
}
```

**Or with global installation:**

```json
{
  "mcpServers": {
    "duffel-travels": {
      "command": "mcp-duffel-travels",
      "env": {
        "SERPAPI_API_KEY": "your_serpapi_key_here"
      }
    }
  }
}
```

## Troubleshooting

### "You do not have permission to publish"
- Make sure you're logged in: `npm whoami`
- Check organization membership
- Ensure `publishConfig.access` is set to `public`

### "Package name already exists"
- The package name might be taken
- Use a different scope or package name

### Build fails before publish
- Run `npm run build` to check for errors
- Fix any TypeScript compilation errors
- Run `npm test` to verify tests pass

## Automation (Optional)

### GitHub Actions for Auto-Publishing

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to npm

on:
  release:
    types: [created]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm test
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Add `NPM_TOKEN` to GitHub Secrets:
1. Generate token at https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Add to GitHub: Settings → Secrets → New repository secret

## Version Strategy

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **PATCH** (1.0.0 → 1.0.1): Bug fixes

## Support

After publishing, monitor:
- npm downloads: https://www.npmjs.com/package/@taskingagency/mcp-duffel-travels
- GitHub issues: https://github.com/modellers/mcp-duffel-travels/issues
- User feedback

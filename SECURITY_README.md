# 🔒 Project Security Notice

## Important Security Information

This project contains proprietary source code and assets that are protected from unauthorized copying or distribution.

### 🚫 What is Protected

- **Source Code**: All React components, TypeScript files, and backend code
- **Configuration Files**: Build configurations, environment settings
- **Assets**: Game assets, proprietary content
- **Documentation**: Internal development documentation

### 📁 Git Ignore Configuration

The project uses comprehensive `.gitignore` files to prevent accidental commits of sensitive files:

- **Root `.gitignore`**: Protects all source code and sensitive configurations
- **Client `.gitignore`**: Protects frontend source code and build outputs
- **Backend `.gitignore`**: Protects backend source code and configurations

### ⚠️ Important Notes

1. **Do Not Commit Source Code**: The `.gitignore` files are configured to exclude all source files
2. **Environment Variables**: Never commit `.env` files or API keys
3. **Build Outputs**: `dist/`, `build/`, and `node_modules/` are ignored
4. **Sensitive Files**: Database files, certificates, and private keys are protected

### 🔐 How to Use

1. **Development**: Work locally with full access to source code
2. **Version Control**: Only commit essential files (README, package.json, etc.)
3. **Deployment**: Build and deploy using protected build processes
4. **Sharing**: Never share source code or sensitive configuration files

### 🚨 Security Measures

- All source code is excluded from version control
- Sensitive configurations are protected
- Build outputs are not committed
- Environment variables are secured

---

**This project is proprietary and confidential. Unauthorized copying or distribution is prohibited.**
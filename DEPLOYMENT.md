# Deployment Guide for ExamHub

## 🌍 Digital Public Good Deployment

This guide helps educational institutions worldwide deploy ExamHub as a free, accessible exam timetable management system. ExamHub is designed to work in various environments and resource constraints.

## 📋 Pre-Deployment Checklist

### System Requirements
- **Web Server**: Any modern web server (Apache, Nginx, etc.)
- **Domain**: Custom domain or subdomain
- **HTTPS**: SSL certificate recommended
- **Storage**: Minimal storage requirements for static files

### Institutional Requirements
- **Technical Contact**: IT administrator or webmaster
- **Domain Control**: Ability to create subdomains or directories
- **Backup Strategy**: Regular backups recommended
- **Maintenance Plan**: Ongoing maintenance and updates

## 🚀 Quick Deployment Options

### Option 1: Simple Web Hosting

#### 1. Build the Application
```bash
# Clone or download the repository
git clone https://github.com/RashidLansah/examhub.git
cd examhub

# Install dependencies
npm install

# Build for production
npm run build
```

#### 2. Upload Files
- Upload the contents of `/dist` folder to your web server
- Ensure `index.html` is in the root directory
- Configure server to serve `index.html` for all routes (SPA routing)

#### Server Configuration Example (Apache)
```apache
<Directory "/path/to/examhub">
    RewriteEngine On
    RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</Directory>
```

#### Server Configuration Example (Nginx)
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

### Option 2: GitHub Pages

#### 1. Enable GitHub Pages
1. Go to repository Settings
2. Scroll to "Pages" section
3. Select source as "GitHub Actions"

#### 2. Create GitHub Actions Workflow
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Option 3: Netlify Deployment

#### 1. Connect to Netlify
1. Push code to GitHub repository
2. Connect Netlify account to GitHub
3. Select the ExamHub repository

#### 2. Configure Build Settings
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Node Version**: 18 (specify in netlify.toml)

#### 3. Create netlify.toml
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.environment]
  NODE_VERSION = "18"
```

## 🏫 Institutional Customization

### Domain Setup
```
Recommended URLs:
- examhub.university.edu
- timetable.university.edu
- exams.university.edu
- Schedule.university.edu
```

### Branding Customization
1. Update `src/App.jsx` for institutional branding
2. Modify colors in `src/index.css`
3. Update favicon in `public/` directory
4. Customize title in `index.html`

### Configuration Files
```javascript
// src/config/institution.js
export const INSTITUTION_CONFIG = {
  name: "Your University",
  logo: "/university-logo.png",
  favicon: "/favicon.ico",
  primaryColor: "#your-color",
  secondaryColor: "#your-secondary",
  contactEmail: "registrar@university.edu",
  adminCredentials: {
    username: "admin",
    password: "secure-password-here"
  }
}
```

## 🔐 Security Considerations

### HTTPS Setup
- Obtain SSL certificate (Let's Encrypt recommended)
- Redirect HTTP to HTTPS
- Configure security headers

### Admin Security
- Change default admin credentials immediately
- Consider implementing university SSO integration
- Regular credential updates
- Access logging

### Content Security
- Configure CSP headers
- Regular security updates
- Monitor for vulnerabilities

## 📊 Performance Optimization

### Compression Setup
```nginx
# Nginx compression
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

# Apache compression
LoadModule deflate_module modules/mod_deflate.so
<Location />
    SetOutputFilter DEFLATE
    SetEnvIfNoCase Request_URI \
        \.(?:gif|jpe?g|png)$ no-gzip dont-vary
    SetEnvIfNoCase Request_URI \
        \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
</Location>
```

### Caching Configuration
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🌐 Global Deployment Considerations

### Multi-Region Deployment
- Use CDN for global access
- Consider regional hosting for compliance
- Optimize for various internet speeds

### Language Support
- Implement i18n for local languages
- Provide documentation in multiple languages
- Consider RTL language support

### Accessibility Standards
- Follow WCAG 2.1 guidelines
- Test with assistive technologies
- Provide keyboard navigation
- Include screen reader support

## 🔧 Maintenance and Updates

### Regular Updates
- Monitor for security updates
- Update dependencies regularly
- Test compatibility with new browsers
- Regular backup verification

### Backup Strategy
- File system backups
- Configuration backups
- Regular recovery testing
- Automated backup scheduling

### Monitoring Setup
- Basic uptime monitoring
- Error tracking
- Performance monitoring
- User feedback collection

## 📚 Institutional Integration

### Learning Management Systems
- Provide embeddable widgets
- API endpoints for integration
- SSO integration guides
- Calendar feed generation

### Student Information Systems
- Data import/export capabilities
- Integration documentation
- Automated schedule updates
- Conflict detection

### Communication Systems
- Email notifications
- SMS integration
- Push notifications
- Social media sharing

## 📞 Support and Documentation

### User Documentation
- Student user guides
- Admin documentation
- Troubleshooting guides
- Video tutorials

### Technical Support
- Installation assistance
- Customization help
- Integration support
- Maintenance guidance

### Community Resources
- User forums
- Documentation wikis
- Best practices sharing
- Case studies

## 🛠️ Troubleshooting Common Issues

### Build Failures
- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify all dependencies are available
- Check for memory issues during build

### Deployment Issues
- Verify server configuration
- Check file permissions
- Confirm HTTPS setup
- Validate redirect rules

### Performance Issues
- Enable compression
- Configure caching
- Optimize images
- Minify assets

### Accessibility Issues
- Test with screen readers
- Verify keyboard navigation
- Check color contrast
- Test with different browsers

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Build successful without errors
- [ ] All customizations applied
- [ ] Security credentials updated
- [ ] Domain and SSL configured
- [ ] Content reviewed for accuracy

### Post-Deployment
- [ ] HTTPS working properly
- [ ] All pages loading correctly
- [ ] Admin login functional
- [ ] Mobile responsiveness verified
- [ ] Accessibility tested
- [ ] Performance metrics acceptable
- [ ] Backup system configured

### Ongoing Maintenance
- [ ] Regular security updates
- [ ] Performance monitoring
- [ ] User feedback collection
- [ ] Documentation updates
- [ ] Backup verification

---

**Need help with deployment? Visit our [GitHub Issues](https://github.com/RashidLansah/examhub/issues) or contribute to our deployment documentation!**

For institutional deployment assistance, contact support@examhub.edu

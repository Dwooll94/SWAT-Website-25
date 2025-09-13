# Frontend HTTPS Configuration

This document covers HTTPS configuration for the React frontend application.

## Environment Variables

The frontend uses environment variables to configure API endpoints and HTTPS settings.

### Required Configuration

Update your `.env` file with the appropriate API URL:

**Development (HTTP):**
```bash
REACT_APP_API_URL=http://localhost:3001/api
```

**Development (HTTPS):**
```bash
REACT_APP_API_URL=https://localhost:3001/api
```

**Production:**
```bash
REACT_APP_API_URL=https://yourdomain.com/api
```

## HTTPS Development Server

To run the React development server with HTTPS support:

### 1. Generate SSL Certificates

From the project root directory:
```bash
mkdir certs
openssl req -x509 -newkey rsa:4096 -keyout certs/private-key.pem -out certs/certificate.pem -days 365 -nodes
```

### 2. Configure Environment Variables

Add to your frontend `.env` file:
```bash
# Enable HTTPS for development server
HTTPS=true
SSL_CRT_FILE=../certs/certificate.pem
SSL_KEY_FILE=../certs/private-key.pem

# Update API URL to use HTTPS
REACT_APP_API_URL=https://localhost:3001/api
```

### 3. Start Development Server

```bash
npm start
```

The development server will now run on `https://localhost:3000`

## Browser Security Warnings

When using self-signed certificates in development:

1. Your browser will show a security warning
2. Click "Advanced" → "Proceed to localhost (unsafe)"
3. This is safe for development purposes

## Production Deployment

For production deployment with HTTPS:

### 1. Build the Application

```bash
npm run build
```

### 2. Serve with HTTPS

The built files should be served by a web server (like Nginx) configured with proper SSL certificates.

### 3. Update API URL

Ensure the production environment uses HTTPS for API calls:
```bash
REACT_APP_API_URL=https://yourdomain.com/api
```

## Security Considerations

### Mixed Content Prevention

The application automatically uses the configured API URL from environment variables, preventing mixed content issues.

### Content Security Policy

Consider adding Content Security Policy headers to your web server configuration:

```nginx
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.yourdomain.com;" always;
```

### HSTS Headers

Enable HTTP Strict Transport Security in your web server:

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
```

## Troubleshooting

### Common Issues

1. **Mixed Content Errors**
   - Ensure `REACT_APP_API_URL` uses HTTPS in production
   - Check that all external resources use HTTPS

2. **Certificate Errors in Development**
   - Verify certificate paths in `.env` file
   - Ensure certificates exist and are readable

3. **API Connection Failed**
   - Verify backend is running with HTTPS on the correct port
   - Check that API URL matches backend configuration

### Environment-Specific Configuration

The application automatically adapts to different environments based on the `REACT_APP_API_URL` environment variable. No code changes are required for HTTPS support.

## Additional Security Headers

Consider implementing these security headers in your web server:

```nginx
# Security headers
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## Testing HTTPS Configuration

Test your HTTPS setup:

1. **Development:**
   ```bash
   curl -k https://localhost:3000
   ```

2. **Production:**
   ```bash
   curl https://yourdomain.com
   ```

3. **SSL Testing Tools:**
   - [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)
   - Browser Developer Tools → Security tab
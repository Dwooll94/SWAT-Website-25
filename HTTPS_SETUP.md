# HTTPS Setup Guide

This guide will help you configure HTTPS (SSL/TLS) for the SWAT Website to ensure secure communication between the client and server.

## Prerequisites

- Node.js backend server configured and running
- Domain name (for production certificates) or localhost (for development)

## Development Setup (Self-Signed Certificates)

For development and testing purposes, you can use self-signed certificates:

### 1. Generate Self-Signed Certificates

Navigate to your project root and run:

```bash
# Create a certs directory
mkdir certs

# Generate private key and certificate
openssl req -x509 -newkey rsa:4096 -keyout certs/private-key.pem -out certs/certificate.pem -days 365 -nodes

# When prompted, fill in the certificate details:
# Country Name: US
# State: MO
# City: Smithville
# Organization: SWAT Team 1806
# Organizational Unit: IT Department
# Common Name: localhost (IMPORTANT: Use your domain or "localhost")
# Email Address: admin@smithville.k12.mo.us
```

### 2. Update Environment Variables

Add the following to your `.env` file in the backend directory:

```bash
SSL_KEY_PATH=./certs/private-key.pem
SSL_CERT_PATH=./certs/certificate.pem
```

### 3. Start the Server

The server will automatically detect the SSL certificates and start in HTTPS mode:

```bash
cd backend
npm start
```

You should see:
```
🚀 HTTPS Server running on port 3001
🔒 SSL/TLS encryption enabled
```

### 4. Update Frontend Configuration

If your frontend is configured to connect to `http://localhost:3001`, update it to `https://localhost:3001`.

**Note:** Your browser will show a security warning for self-signed certificates. In development, you can safely proceed by clicking "Advanced" → "Proceed to localhost (unsafe)".

## Production Setup (Let's Encrypt)

For production deployment, use certificates from a trusted Certificate Authority like Let's Encrypt:

### 1. Install Certbot

On Ubuntu/Debian:
```bash
sudo apt update
sudo apt install certbot
```

On CentOS/RHEL:
```bash
sudo yum install certbot
```

### 2. Generate Let's Encrypt Certificates

Replace `yourdomain.com` with your actual domain:

```bash
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
```

Certificates will be generated in `/etc/letsencrypt/live/yourdomain.com/`

### 3. Update Environment Variables

Add the following to your production `.env` file:

```bash
SSL_KEY_PATH=/etc/letsencrypt/live/yourdomain.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
```

### 4. Set Up Certificate Renewal

Let's Encrypt certificates expire every 90 days. Set up automatic renewal:

```bash
# Add to crontab
sudo crontab -e

# Add this line to run renewal twice daily
0 0,12 * * * /usr/bin/certbot renew --quiet
```

### 5. Update Firewall Rules

Ensure your server allows HTTPS traffic:

```bash
# UFW (Ubuntu)
sudo ufw allow 443

# Or iptables
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

## Frontend HTTPS Configuration

### 1. Development with HTTPS

For React development with HTTPS, create or update `.env` in your frontend directory:

```bash
HTTPS=true
SSL_CRT_FILE=../certs/certificate.pem
SSL_KEY_FILE=../certs/private-key.pem
```

### 2. Update API Base URL

Ensure your frontend API calls use HTTPS:

```javascript
// In your AuthContext or API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://yourdomain.com/api' 
  : 'https://localhost:3001/api';
```

## Reverse Proxy Setup (Recommended for Production)

For production, it's recommended to use a reverse proxy like Nginx:

### 1. Install Nginx

```bash
sudo apt update
sudo apt install nginx
```

### 2. Configure Nginx

Create `/etc/nginx/sites-available/swat-website`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Serve static files
    location / {
        root /var/www/swat-website/build;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Handle uploads
    location /uploads/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/swat-website /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## Testing HTTPS Setup

### 1. Test SSL Certificate

```bash
# Test SSL certificate
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com

# Test with curl
curl -I https://yourdomain.com
```

### 2. Online SSL Testing

- [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)
- [SSL Checker](https://www.sslchecker.com/sslchecker)

## Security Best Practices

1. **Use Strong SSL Configuration**: Disable older protocols (SSLv2, SSLv3, TLSv1.0, TLSv1.1)

2. **Enable HSTS**: Add HTTP Strict Transport Security headers:
   ```javascript
   // In your Express app
   app.use(helmet({
     hsts: {
       maxAge: 31536000,
       includeSubDomains: true,
       preload: true
     }
   }));
   ```

3. **Regular Certificate Renewal**: Set up automated renewal for Let's Encrypt certificates

4. **Monitor Certificate Expiration**: Set up alerts for certificate expiration

5. **Use Strong Ciphers**: Configure your server to use only strong cipher suites

## Troubleshooting

### Common Issues

1. **Certificate Not Found Error**:
   - Verify the file paths in your `.env` file
   - Ensure the certificate files have correct permissions

2. **Browser Security Warnings**:
   - For self-signed certificates, this is expected in development
   - For production, ensure certificates are from a trusted CA

3. **Mixed Content Errors**:
   - Ensure all resources (images, scripts, API calls) use HTTPS
   - Update any hardcoded HTTP URLs to HTTPS

4. **Port Already in Use**:
   - Ensure no other service is running on port 443
   - Check if another instance of your app is running

### Getting Help

If you encounter issues:
1. Check server logs for SSL-related errors
2. Verify certificate validity: `openssl x509 -in certificate.pem -text -noout`
3. Test SSL configuration with online tools
4. Consult the [Express.js HTTPS documentation](https://expressjs.com/en/5x/api.html#app.listen)

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `SSL_KEY_PATH` | Path to SSL private key | `./certs/private-key.pem` |
| `SSL_CERT_PATH` | Path to SSL certificate | `./certs/certificate.pem` |
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3001` |

## Additional Security Considerations

- Regularly update your SSL/TLS certificates
- Monitor for security vulnerabilities in your dependencies
- Use environment variables for sensitive configuration
- Implement proper CORS policies
- Enable security headers with Helmet.js
- Consider using a Web Application Firewall (WAF) for additional protection
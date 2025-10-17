# Deployment Guide

This guide covers various deployment options for the Farm Management System.

## 🐳 Docker Deployment (Recommended)

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ RAM
- 20GB+ disk space

### Quick Deployment

1. **Clone and configure**
   ```bash
   git clone https://github.com/your-repo/farm-management-system.git
   cd farm-management-system
   cp .env.example .env
   # Edit .env with your configuration
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Initialize database**
   ```bash
   docker-compose exec backend npm run migrate
   docker-compose exec backend npm run seed
   ```

4. **Access the application**
   - Frontend: http://localhost
   - API: http://localhost/api
   - Grafana: http://localhost:3001 (admin/admin)
   - Prometheus: http://localhost:9090

### Production Configuration

For production deployment, update the following:

1. **Environment Variables**
   ```env
   NODE_ENV=production
   JWT_SECRET=your-secure-random-string-here
   DB_PASSWORD=secure-database-password
   REDIS_PASSWORD=secure-redis-password
   ```

2. **SSL Configuration**
   - Obtain SSL certificates (Let's Encrypt recommended)
   - Update nginx configuration for HTTPS
   - Configure domain names

3. **Security Hardening**
   ```bash
   # Update default passwords
   docker-compose exec postgres psql -U postgres -c "ALTER USER postgres PASSWORD 'new-secure-password';"
   
   # Configure firewall
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw deny 5432  # Block direct database access
   ```

## ☁️ Cloud Deployment

### AWS Deployment

#### Using ECS (Elastic Container Service)

1. **Prerequisites**
   - AWS CLI configured
   - ECS CLI installed
   - RDS PostgreSQL instance
   - ElastiCache Redis cluster

2. **Build and push images**
   ```bash
   # Build images
   docker build -t farm-backend -f docker/backend/Dockerfile .
   docker build -t farm-frontend -f docker/frontend/Dockerfile ./client
   
   # Tag for ECR
   docker tag farm-backend:latest 123456789.dkr.ecr.region.amazonaws.com/farm-backend:latest
   docker tag farm-frontend:latest 123456789.dkr.ecr.region.amazonaws.com/farm-frontend:latest
   
   # Push to ECR
   aws ecr get-login-password --region region | docker login --username AWS --password-stdin 123456789.dkr.ecr.region.amazonaws.com
   docker push 123456789.dkr.ecr.region.amazonaws.com/farm-backend:latest
   docker push 123456789.dkr.ecr.region.amazonaws.com/farm-frontend:latest
   ```

3. **Deploy with ECS**
   ```bash
   # Create ECS cluster
   ecs-cli configure --cluster farm-management --region us-west-2 --default-launch-type EC2
   ecs-cli up --keypair my-key --capability-iam --size 2 --instance-type t3.medium
   
   # Deploy services
   ecs-cli compose --file docker-compose-aws.yml service up
   ```

#### Using Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize and deploy**
   ```bash
   eb init farm-management-system
   eb create production
   eb deploy
   ```

### Google Cloud Platform

#### Using Cloud Run

1. **Build and deploy backend**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT-ID/farm-backend
   gcloud run deploy farm-backend --image gcr.io/PROJECT-ID/farm-backend --platform managed
   ```

2. **Build and deploy frontend**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT-ID/farm-frontend ./client
   gcloud run deploy farm-frontend --image gcr.io/PROJECT-ID/farm-frontend --platform managed
   ```

### Microsoft Azure

#### Using Container Instances

1. **Create resource group**
   ```bash
   az group create --name farm-management --location eastus
   ```

2. **Deploy containers**
   ```bash
   az container create --resource-group farm-management --name farm-backend --image your-registry/farm-backend:latest
   az container create --resource-group farm-management --name farm-frontend --image your-registry/farm-frontend:latest
   ```

## 🖥️ Traditional Server Deployment

### Ubuntu/Debian Server

1. **Install dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib -y
   
   # Install Redis
   sudo apt install redis-server -y
   
   # Install PM2
   sudo npm install -g pm2
   ```

2. **Set up database**
   ```bash
   sudo -u postgres createuser --interactive
   sudo -u postgres createdb farm_management
   ```

3. **Deploy application**
   ```bash
   # Clone repository
   git clone https://github.com/your-repo/farm-management-system.git
   cd farm-management-system
   
   # Install dependencies
   npm install
   cd client && npm install && npm run build
   cd ..
   
   # Set up environment
   cp .env.example .env
   # Edit .env file
   
   # Run migrations
   npm run migrate
   
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

### CentOS/RHEL Server

1. **Install dependencies**
   ```bash
   # Install Node.js
   sudo dnf module install nodejs:18/common -y
   
   # Install PostgreSQL
   sudo dnf install postgresql postgresql-server -y
   sudo postgresql-setup --initdb
   sudo systemctl enable postgresql
   sudo systemctl start postgresql
   
   # Install Redis
   sudo dnf install redis -y
   sudo systemctl enable redis
   sudo systemctl start redis
   ```

2. **Follow similar steps as Ubuntu deployment**

## 🔧 Configuration Management

### Environment-Specific Configurations

#### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
RATE_LIMIT_MAX_REQUESTS=1000
```

#### Staging
```env
NODE_ENV=staging
LOG_LEVEL=info
RATE_LIMIT_MAX_REQUESTS=500
```

#### Production
```env
NODE_ENV=production
LOG_LEVEL=warn
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Configuration

#### Connection Pooling
```javascript
// knexfile.js
pool: {
  min: 2,
  max: 10,
  acquireTimeoutMillis: 60000,
  idleTimeoutMillis: 600000
}
```

#### Read Replicas
```javascript
// For high-availability setups
connection: {
  master: {
    host: 'master-db-host',
    // ... other config
  },
  slaves: [
    {
      host: 'replica-1-host',
      // ... other config
    },
    {
      host: 'replica-2-host',
      // ... other config
    }
  ]
}
```

## 📊 Monitoring and Logging

### Application Monitoring

1. **PM2 Monitoring**
   ```bash
   pm2 monit
   pm2 logs
   pm2 status
   ```

2. **Custom Health Checks**
   ```bash
   # Check application health
   curl http://localhost:5000/health
   
   # Check database connectivity
   curl http://localhost:5000/api/health/database
   ```

### Log Management

1. **Centralized Logging with ELK Stack**
   ```yaml
   # docker-compose-logging.yml
   elasticsearch:
     image: docker.elastic.co/elasticsearch/elasticsearch:7.15.0
   
   logstash:
     image: docker.elastic.co/logstash/logstash:7.15.0
   
   kibana:
     image: docker.elastic.co/kibana/kibana:7.15.0
   ```

2. **Log Rotation**
   ```bash
   # Configure logrotate
   sudo nano /etc/logrotate.d/farm-management
   ```

### Performance Monitoring

1. **Prometheus Metrics**
   - Application metrics: `/metrics`
   - Database metrics: PostgreSQL exporter
   - System metrics: Node exporter

2. **Grafana Dashboards**
   - Pre-configured dashboards in `docker/grafana/`
   - Custom dashboards for farm-specific KPIs

## 🔐 Security Considerations

### SSL/TLS Configuration

1. **Let's Encrypt with Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

2. **Manual Certificate Installation**
   ```nginx
   ssl_certificate /path/to/certificate.crt;
   ssl_certificate_key /path/to/private.key;
   ```

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 5432/tcp   # PostgreSQL (internal only)
sudo ufw deny 6379/tcp   # Redis (internal only)
sudo ufw enable

# iptables
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -p tcp --dport 5432 -j DROP
```

### Database Security

```sql
-- Create application user with limited privileges
CREATE USER farm_app WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE farm_management TO farm_app;
GRANT USAGE ON SCHEMA public TO farm_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO farm_app;

-- Revoke unnecessary privileges
REVOKE ALL ON SCHEMA public FROM PUBLIC;
```

## 🚀 Performance Optimization

### Database Optimization

1. **Indexing Strategy**
   ```sql
   -- Add indexes for frequently queried columns
   CREATE INDEX idx_animals_farm_id ON animals(farm_id);
   CREATE INDEX idx_animals_tag_id ON animals(tag_id);
   CREATE INDEX idx_sensor_readings_timestamp ON sensor_readings(reading_timestamp);
   ```

2. **Query Optimization**
   ```javascript
   // Use database-level pagination
   .limit(pageSize)
   .offset(page * pageSize)
   
   // Optimize joins
   .select('table1.column1', 'table2.column2')
   .join('table2', 'table1.id', 'table2.foreign_id')
   ```

### Caching Strategy

1. **Redis Configuration**
   ```javascript
   // Cache frequently accessed data
   const cacheKey = `farm:${farmId}:animals`;
   const cachedData = await redis.get(cacheKey);
   
   if (!cachedData) {
     const data = await db.query();
     await redis.setex(cacheKey, 300, JSON.stringify(data));
   }
   ```

2. **CDN for Static Assets**
   - Use CloudFront, CloudFlare, or similar
   - Cache images, documents, and static files

### Application Scaling

1. **Horizontal Scaling**
   ```bash
   # Scale backend instances
   docker-compose up --scale backend=3
   
   # Load balancer configuration
   upstream backend {
     server backend_1:5000;
     server backend_2:5000;
     server backend_3:5000;
   }
   ```

2. **Vertical Scaling**
   - Increase server resources (CPU, RAM)
   - Optimize Node.js memory usage
   - Database connection pooling

## 🔄 Backup and Recovery

### Database Backups

1. **Automated Backups**
   ```bash
   #!/bin/bash
   # backup-db.sh
   DATE=$(date +%Y%m%d_%H%M%S)
   pg_dump -h localhost -U postgres farm_management > backup_$DATE.sql
   
   # Upload to cloud storage
   aws s3 cp backup_$DATE.sql s3://your-backup-bucket/
   ```

2. **Backup Retention Policy**
   ```bash
   # Keep daily backups for 30 days, weekly for 12 weeks
   find /backup/daily -name "*.sql" -mtime +30 -delete
   find /backup/weekly -name "*.sql" -mtime +84 -delete
   ```

### Disaster Recovery

1. **Multi-Region Setup**
   - Primary region: Main application
   - Secondary region: Standby with data replication
   - Automatic failover configuration

2. **Recovery Procedures**
   ```bash
   # Restore from backup
   psql -h localhost -U postgres -d farm_management < backup_file.sql
   
   # Verify data integrity
   npm run verify-data
   ```

## 📋 Maintenance Tasks

### Regular Maintenance

1. **Weekly Tasks**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Restart services
   pm2 restart all
   
   # Clean up logs
   pm2 flush
   ```

2. **Monthly Tasks**
   ```bash
   # Database maintenance
   psql -c "VACUUM ANALYZE;"
   
   # Clear old cache entries
   redis-cli FLUSHDB
   
   # Update SSL certificates
   sudo certbot renew
   ```

### Troubleshooting

1. **Common Issues**
   ```bash
   # Check service status
   systemctl status postgresql
   systemctl status redis
   pm2 status
   
   # View logs
   journalctl -u postgresql
   pm2 logs
   tail -f /var/log/nginx/error.log
   ```

2. **Performance Issues**
   ```bash
   # Monitor resource usage
   htop
   iotop
   
   # Database performance
   SELECT * FROM pg_stat_activity;
   SELECT * FROM pg_stat_user_tables;
   ```

## 📞 Support and Updates

### Getting Help
- Documentation: https://docs.farm-management-system.com
- Community Forum: https://community.farm-management-system.com
- Issue Tracker: https://github.com/your-repo/farm-management-system/issues

### Updates and Migrations
```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Run migrations
npm run migrate

# Restart application
pm2 restart all
```

---

For additional deployment assistance or custom configurations, please contact our support team or consult the community forums.
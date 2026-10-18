# ==========================================
# Stage 1: Build React 19 Frontend with Vite
# ==========================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend

COPY Frontend/package*.json ./
RUN npm ci

COPY Frontend/ ./
# Use relative /api endpoint so all requests automatically go to the same host
ENV VITE_API_URL=/api
RUN npm run build

# ==========================================
# Stage 2: Install Laravel Composer Dependencies
# ==========================================
FROM composer:2 AS composer-builder
WORKDIR /app/backend

COPY Backend/composer*.json ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader

# ==========================================
# Stage 3: Production Alpine Container with PHP 8.4 & Nginx
# ==========================================
FROM php:8.4-fpm-alpine

# Install system dependencies, Nginx, Supervisor, gettext (for envsubst), and PostgreSQL drivers
RUN apk add --no-cache \
    nginx \
    supervisor \
    gettext \
    curl \
    libpq-dev \
    libzip-dev \
    libpng-dev \
    oniguruma-dev \
    && docker-php-ext-install -j$(nproc) pdo_pgsql pgsql mbstring bcmath opcache zip \
    && rm -rf /var/cache/apk/*

# Production OPcache settings
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.revalidate_freq=2'; \
    echo 'opcache.fast_shutdown=1'; \
} > /usr/local/etc/php/conf.d/opcache-recommended.ini

# Increase upload limits for product photos
RUN { \
    echo 'upload_max_filesize = 25M'; \
    echo 'post_max_size = 25M'; \
    echo 'memory_limit = 256M'; \
} > /usr/local/etc/php/conf.d/custom-uploads.ini

WORKDIR /var/www/html

# Copy Backend codebase and vendor dependencies
COPY Backend/ .
COPY --from=composer-builder /app/backend/vendor ./vendor

# Copy compiled React frontend into Laravel's public directory
COPY --from=frontend-builder /app/frontend/dist/ ./public/

# Copy Nginx and Supervisord configurations
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Setup runtime directory permissions
RUN mkdir -p /var/log/nginx /var/log/supervisor /etc/nginx/http.d /etc/nginx/templates \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80 10000

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

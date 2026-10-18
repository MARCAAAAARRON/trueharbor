#!/bin/sh
set -e

# Default port to 80 if not set by Render (Render sets $PORT dynamically, e.g. 10000)
export PORT="${PORT:-80}"
echo "⚓ Starting TrueHarbor unified container on port ${PORT}..."

# Substitute $PORT into Nginx template
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/http.d/default.conf

# Ensure Laravel storage permissions
chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Run production optimizations if APP_KEY is configured
if [ -n "$APP_KEY" ]; then
    echo "⚡ Warming Laravel cache..."
    php /var/www/html/artisan config:clear || true
    php /var/www/html/artisan route:clear || true
    php /var/www/html/artisan view:clear || true
    php /var/www/html/artisan package:discover --ansi || true

    # Automatically run database migrations if enabled (default true)
    if [ "${AUTO_MIGRATE:-true}" = "true" ]; then
        echo "🗄️ Running database migrations..."
        php /var/www/html/artisan migrate --force || true
    fi
fi

# Hand over to Supervisord to manage PHP-FPM and Nginx
echo "🚀 TrueHarbor online! Launching processes..."
exec /usr/bin/supervisord -c /etc/supervisord.conf

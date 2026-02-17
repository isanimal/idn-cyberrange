FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    bash \
    git \
    curl \
    zip \
    unzip \
    docker-cli \
    oniguruma-dev \
    libzip-dev \
    icu-dev

RUN docker-php-ext-install pdo pdo_mysql bcmath intl zip

COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

CMD ["php-fpm"]

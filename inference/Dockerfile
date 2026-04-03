FROM registry.verystar.net/library/nginx:1.23
WORKDIR /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --chown=nginx .output/public .
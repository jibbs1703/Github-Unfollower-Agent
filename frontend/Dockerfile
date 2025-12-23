FROM nginx:alpine

COPY src/ /usr/share/nginx/html/

COPY nginx.conf /etc/nginx/conf.d/default.conf

RUN apk add --no-cache curl

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]

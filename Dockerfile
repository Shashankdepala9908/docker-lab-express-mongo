FROM node:20-alpine

WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm i --omit=dev

COPY . .
# non-root
RUN adduser -D appuser && chown -R appuser:appuser /usr/src/app
USER appuser

EXPOSE 8080
CMD ["npm","start"]

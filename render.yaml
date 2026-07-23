FROM node:20-slim
WORKDIR /app
COPY . .
RUN npm run build
ENV NODE_ENV=production
# The host provides PORT; the server reads process.env.PORT.
CMD ["npm", "start"]

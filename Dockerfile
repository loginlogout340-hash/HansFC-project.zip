FROM node:20-slim
WORKDIR /app
# the server uses the SAME game files as the Android app, so results are identical
COPY data.js engine.js world.js hansfc-server.js ./
ENV NODE_ENV=production
# the world is saved here. On Railway, attach a Volume and mount it at /data so it survives restarts.
ENV DATA_DIR=/data
CMD ["node", "hansfc-server.js"]

import { createDevApiServer } from './http/dev-api-server';

const host = '127.0.0.1';
const port = 8787;
const server = createDevApiServer();

server.listen(port, host, () => {
  console.log(`Demo API 已啟動：http://${host}:${port}`);
});

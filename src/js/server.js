/* eslint-disable no-unused-vars */
/* eslint-disable no-return-await */
/* eslint-disable consistent-return */
/* eslint-disable no-shadow */

const http = require('http');
const Koa = require('koa');
const Router = require('koa-router');
const { streamEvents } = require('http-event-stream');
const uuid = require('uuid');

const app = new Koa();
const moment = require('moment');

app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }
  const headers = { 'Access-Control-Allow-Origin': '*' };
  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }
  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUD, DELETE, PATCH',
    });
    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set(
        'Access-Control-Allow-Headers',
        ctx.request.get('Access-Control-Request-Headers'),
      );
    }
    ctx.response.status = 204;
  }
});

const router = new Router();
const maxMessages = 50;
const history = [];
let total = 0;

const message = {
  event: 'comment',
  data: JSON.stringify({
    type: 'action',
    mess: 'Итак, матч начался!',
    date: moment(),
  }),
  id: uuid.v4(),
};
history.push(message);

const matchInterval = setInterval(() => {
  const action = { type: 'action', mess: 'Мяч перемещается по полю...' };
  const freekick = {
    type: 'freekick',
    mess: 'Нарушение правил, будет штрафной удар',
  };
  const goal = { type: 'goal', mess: 'Отличный удар! Г-О-Л!' };
  const messages = [action, freekick, goal];

  let i = 0;
  const messageId = uuid.v4();
  const rand = Math.floor(Math.random() * 100);
  if (rand <= 10) {
    i = 2;
  } else if (rand > 10 && rand <= 40) {
    i = 1;
  } else if (rand > 40) {
    i = 0;
  }
  messages[i].date = moment();
  messages[i].id = messageId;

  const mess = {
    event: 'comment',
    data: JSON.stringify(messages[i]),
    id: messageId,
  };

  history.push(mess);

  total += 1;
  if (total > maxMessages) clearInterval(matchInterval);
}, 2000);

router.get('/match', async (ctx) => {
  console.log('begin');
  streamEvents(ctx.req, ctx.res, {
    async fetch() {
      return [];
    },
    stream(match) {
      let total = 0;
      const int = setInterval(() => {
        if (history.length > total) {
          match.sendEvent(history[total]);
          total += 1;
        }
        if (total > maxMessages) {
          clearInterval(int);
        }
      }, 500);
      return () => clearInterval(int);
    },
  });
  ctx.respond = false;
});

app.use(router.routes()).use(router.allowedMethods());

const port = process.env.PORT || 7070;
const server = http.createServer(app.callback());
server.listen(port);

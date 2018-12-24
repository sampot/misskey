/**
 * API Server
 */

import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as multer from 'koa-multer';
import * as bodyParser from 'koa-bodyparser';
const cors = require('@koa/cors');

import endpoints from './endpoints';

const handler = require('./api-handler').default;

// Init app
const app = new Koa();

app.use(cors({
	origin: '*'
}));

// No caching
app.use(async (ctx, next) => {
	ctx.set('Cache-Control', 'private, max-age=0, must-revalidate');
	await next();
});

app.use(bodyParser({
	detectJSON: ctx => !!ctx.is('json')
}));

// Init multer instance
const upload = multer({
	storage: multer.diskStorage({})
});

// Init router
const router = new Router();

/**
 * Register endpoint handlers
 */
for (const endpoint of endpoints) {
	if (endpoint.meta.requireFile) {
		router.post(`/${endpoint.name}`, upload.single('file'), handler.bind(null, endpoint));
	} else {
		router.post(`/${endpoint.name}`, handler.bind(null, endpoint));
	}
}

router.post('/signup', require('./private/signup').default);
router.post('/signin', require('./private/signin').default);

router.use(require('./service/discord').routes());
router.use(require('./service/github').routes());
router.use(require('./service/twitter').routes());

router.use(require('./mastodon').routes());

// Return 404 for unknown API
router.all('*', async ctx => {
	ctx.status = 404;
});

// Register router
app.use(router.routes());

export default app;

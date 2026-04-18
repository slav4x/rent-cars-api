import cors from 'cors';
import express from 'express';
import { ZodError } from 'zod';
import { getDatabasePath } from './db/database.js';
import { env } from './config/env.js';
import { attachAuthContext, requireAuth, requirePanelRole, requireUserId } from './lib/http/auth.js';
import { createRateLimit } from './lib/http/rate-limit.js';
import { getUploadsRoot } from './lib/uploads.js';
import { saveCarMediaFile } from './lib/uploads.js';
import { getAccountProfile, updateAccountAvatar, updateAccountProfile } from './modules/account/account.service.js';
import {
	getVerificationOverview,
	submitVerificationRequest,
	uploadVerificationFile
} from './modules/verification/verification.service.js';
import {
	addFavorite,
	getFavoriteCarIds,
	getFavoriteCars,
	removeFavorite
} from './modules/favorites/favorites.service.js';
import {
	createCar,
	getCarByPublicSlug,
	getCarForPanel,
	getCarOptions,
	getPublicCarCategories,
	getPublicCarCities,
	getCarsForPanel,
	getCarsForPublic,
	updateCar
} from './modules/cars/cars.service.js';
import {
	createUser,
	getAllUsersForPanel,
	getPanelUsers,
	getPanelUserById,
	getUsersForDev,
	loginUser,
	logoutUser,
	refreshUserSession,
	requestPasswordReset,
	updatePanelUser,
	updatePanelUserAvatar,
	type ApiAuthError
} from './modules/auth/auth.service.js';
import { submitContactRequest } from './modules/contact-requests/contact-requests.service.js';

const app = express();
app.disable('x-powered-by');
const port = env.port;

const authRateLimit = createRateLimit({
	windowMs: 15 * 60 * 1000,
	maxRequests: 10,
	message: 'Слишком много попыток. Попробуйте позже.'
});

app.set('trust proxy', 1);

function getRouteParam(request: express.Request, key: string): string | null {
	const value = request.params[key];

	if (typeof value === 'string') {
		return value;
	}

	return null;
}

app.use(
	cors({
		origin(origin, callback) {
			if (!origin) {
				callback(null, true);
				return;
			}

			const normalizedOrigin = origin.replace(/\/+$/, '');

			if (env.clientOrigins.includes(normalizedOrigin)) {
				callback(null, true);
				return;
			}

			callback(new Error('CORS_ORIGIN_NOT_ALLOWED'));
		},
		credentials: true
	})
);
app.use('/uploads', express.static(getUploadsRoot()));
app.use(express.json());
app.use(attachAuthContext);

app.get('/health', (_request, response) => {
	response.json({
		ok: true,
		service: 'rent-cars-api',
		// databaseUrl: getDatabasePath(),
		now: new Date().toISOString()
	});
});

app.get('/api/dev/users', async (_request, response, next) => {
	try {
		if (env.nodeEnv === 'production') {
			response.status(404).json({ message: 'Маршрут не найден' });
			return;
		}

		const users = await getUsersForDev();
		response.json(users);
	} catch (error) {
		next(error);
	}
});

app.get('/api/panel/admins', requirePanelRole, async (_request, response, next) => {
	try {
		const users = await getPanelUsers();
		response.json(users);
	} catch (error) {
		next(error);
	}
});

app.get('/api/panel/users', requirePanelRole, async (_request, response, next) => {
	try {
		const users = await getAllUsersForPanel();
		response.json(users);
	} catch (error) {
		next(error);
	}
});

app.get('/api/panel/users/:id', requirePanelRole, async (request, response, next) => {
	try {
		const userId = getRouteParam(request, 'id');
		if (!userId) {
			response.status(400).json({ message: 'Некорректный идентификатор пользователя' });
			return;
		}

		response.json(await getPanelUserById(userId));
	} catch (error) {
		next(error);
	}
});

app.patch('/api/panel/users/:id', requirePanelRole, async (request, response, next) => {
	try {
		const userId = getRouteParam(request, 'id');
		if (!userId) {
			response.status(400).json({ message: 'Некорректный идентификатор пользователя' });
			return;
		}

		response.json(await updatePanelUser(userId, request.body));
	} catch (error) {
		next(error);
	}
});

app.post('/api/panel/users/:id/avatar', requirePanelRole, async (request, response, next) => {
	try {
		const chunks: Buffer[] = [];

		request.on('data', (chunk) => {
			chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
		});

		request.on('end', async () => {
			try {
				const mimeType = request.headers['content-type'] ?? '';

				if (!mimeType.startsWith('image/')) {
					response.status(400).json({
						message: 'Поддерживаются только изображения'
					});
					return;
				}

				const userId = getRouteParam(request, 'id');
				if (!userId) {
					response.status(400).json({
						message: 'Некорректный идентификатор пользователя'
					});
					return;
				}

				const user = await updatePanelUserAvatar({
					userId,
					body: Buffer.concat(chunks),
					mimeType,
					baseUrl: `${request.protocol}://${request.get('host')}`
				});

				response.json(user);
			} catch (error) {
				next(error);
			}
		});

		request.on('error', next);
	} catch (error) {
		next(error);
	}
});

app.get('/api/panel/car-options', requirePanelRole, async (_request, response, next) => {
	try {
		response.json(await getCarOptions());
	} catch (error) {
		next(error);
	}
});

app.get('/api/panel/cars', requirePanelRole, async (_request, response, next) => {
	try {
		response.json(await getCarsForPanel());
	} catch (error) {
		next(error);
	}
});

app.get('/api/cars', async (_request, response, next) => {
	try {
		response.json(await getCarsForPublic());
	} catch (error) {
		next(error);
	}
});

app.get('/api/cities', async (_request, response, next) => {
	try {
		response.json(await getPublicCarCities());
	} catch (error) {
		next(error);
	}
});

app.post('/api/contact-requests', authRateLimit, async (request, response, next) => {
	try {
		response.status(201).json(await submitContactRequest(request.body));
	} catch (error) {
		next(error);
	}
});

app.get('/api/categories', async (_request, response, next) => {
	try {
		response.json(await getPublicCarCategories());
	} catch (error) {
		next(error);
	}
});

app.get('/api/cars/:slug', async (request, response, next) => {
	try {
		const slug = getRouteParam(request, 'slug');
		if (!slug) {
			response.status(400).json({ message: 'Некорректный slug автомобиля' });
			return;
		}

		response.json(await getCarByPublicSlug(slug));
	} catch (error) {
		next(error);
	}
});

app.get('/api/panel/cars/:id', requirePanelRole, async (request, response, next) => {
	try {
		const carId = getRouteParam(request, 'id');
		if (!carId) {
			response.status(400).json({ message: 'Некорректный идентификатор автомобиля' });
			return;
		}

		response.json(await getCarForPanel(carId));
	} catch (error) {
		next(error);
	}
});

app.post('/api/panel/cars', requirePanelRole, async (request, response, next) => {
	try {
		response.status(201).json(await createCar(request.body));
	} catch (error) {
		next(error);
	}
});

app.patch('/api/panel/cars/:id', requirePanelRole, async (request, response, next) => {
	try {
		const carId = getRouteParam(request, 'id');
		if (!carId) {
			response.status(400).json({ message: 'Некорректный идентификатор автомобиля' });
			return;
		}

		response.json(await updateCar(carId, request.body));
	} catch (error) {
		next(error);
	}
});

app.post(
	'/api/panel/cars/media',
	express.raw({
		type: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'],
		limit: '30mb'
	}),
	requirePanelRole,
	async (request, response, next) => {
		try {
			const mimeType = request.header('content-type');

			if (!mimeType || !Buffer.isBuffer(request.body) || request.body.length === 0) {
				response.status(400).json({ message: 'Файл не передан' });
				return;
			}

			const relativeUrl = await saveCarMediaFile({
				body: request.body,
				mimeType
			});
			const baseUrl = `${request.protocol}://${request.get('host')}`;

			response.status(201).json({
				url: relativeUrl.startsWith('http') ? relativeUrl : `${baseUrl}${relativeUrl}`
			});
		} catch (error) {
			next(error);
		}
	}
);

app.get('/api/account/favorites', requireAuth, async (request, response, next) => {
	try {
		const userId = requireUserId(request, response);
		if (!userId) return;
		response.json(await getFavoriteCars(userId));
	} catch (error) {
		next(error);
	}
});

app.get('/api/account/favorite-ids', requireAuth, async (request, response, next) => {
	try {
		const userId = requireUserId(request, response);
		if (!userId) return;
		response.json(await getFavoriteCarIds(userId));
	} catch (error) {
		next(error);
	}
});

app.post('/api/account/favorites/:carId', requireAuth, async (request, response, next) => {
	try {
		const userId = requireUserId(request, response);
		if (!userId) return;
		const carId = getRouteParam(request, 'carId');
		if (!carId) {
			response.status(400).json({ message: 'Некорректный идентификатор автомобиля' });
			return;
		}

		response.status(201).json(await addFavorite(userId, carId));
	} catch (error) {
		next(error);
	}
});

app.delete('/api/account/favorites/:carId', requireAuth, async (request, response, next) => {
	try {
		const userId = requireUserId(request, response);
		if (!userId) return;
		const carId = getRouteParam(request, 'carId');
		if (!carId) {
			response.status(400).json({ message: 'Некорректный идентификатор автомобиля' });
			return;
		}

		response.json(await removeFavorite(userId, carId));
	} catch (error) {
		next(error);
	}
});

app.get('/api/account/me', requireAuth, async (request, response, next) => {
	try {
		const userId = requireUserId(request, response);
		if (!userId) return;
		const user = await getAccountProfile(userId);
		response.json(user);
	} catch (error) {
		next(error);
	}
});

app.patch('/api/account/me', requireAuth, async (request, response, next) => {
	try {
		const userId = requireUserId(request, response);
		if (!userId) return;
		const user = await updateAccountProfile(userId, request.body);
		response.json(user);
	} catch (error) {
		next(error);
	}
});

app.post(
	'/api/account/avatar',
	express.raw({
		type: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
		limit: '6mb'
	}),
	requireAuth,
	async (request, response, next) => {
		try {
			const userId = requireUserId(request, response);
			if (!userId) return;
			const mimeType = request.header('content-type');

			if (!mimeType || !Buffer.isBuffer(request.body) || request.body.length === 0) {
				response.status(400).json({ message: 'Файл аватара не передан' });
				return;
			}

			const baseUrl = `${request.protocol}://${request.get('host')}`;
			const user = await updateAccountAvatar({
				userId,
				body: request.body,
				mimeType,
				baseUrl
			});

			response.json(user);
		} catch (error) {
			next(error);
		}
	}
);

app.get('/api/account/verification', requireAuth, async (request, response, next) => {
	try {
		const userId = requireUserId(request, response);
		if (!userId) return;
		const result = await getVerificationOverview(userId);
		response.json(result);
	} catch (error) {
		next(error);
	}
});

app.post(
	'/api/account/verification/files/:documentType',
	express.raw({
		type: ['image/jpeg', 'image/png', 'application/pdf'],
		limit: '12mb'
	}),
	requireAuth,
	async (request, response, next) => {
		try {
			const userId = requireUserId(request, response);
			if (!userId) return;
			const mimeType = request.header('content-type');
			const originalName = request.header('x-file-name') ?? 'document';

			if (!mimeType || !Buffer.isBuffer(request.body) || request.body.length === 0) {
				response.status(400).json({ message: 'Файл документа не передан' });
				return;
			}

			const result = await uploadVerificationFile({
				userId,
				documentType: request.params.documentType as
					| 'passport_main'
					| 'passport_registration'
					| 'license_front'
					| 'license_back',
				body: request.body,
				mimeType,
				originalName
			});

			response.json(result);
		} catch (error) {
			next(error);
		}
	}
);

app.post('/api/account/verification/submit', requireAuth, async (request, response, next) => {
	try {
		const userId = requireUserId(request, response);
		if (!userId) return;
		const result = await submitVerificationRequest(userId, request.body);
		response.json(result);
	} catch (error) {
		next(error);
	}
});

app.post('/api/auth/register', authRateLimit, async (request, response, next) => {
	try {
		const result = await createUser(request.body);
		response.status(201).json(result);
	} catch (error) {
		next(error);
	}
});

app.post('/api/auth/login', authRateLimit, async (request, response, next) => {
	try {
		const result = await loginUser(request.body);
		response.json(result);
	} catch (error) {
		next(error);
	}
});

app.post('/api/auth/reset-password', authRateLimit, async (request, response, next) => {
	try {
		const result = await requestPasswordReset(request.body);
		response.json(result);
	} catch (error) {
		next(error);
	}
});

app.post('/api/auth/refresh', async (request, response, next) => {
	try {
		const result = await refreshUserSession(request.body);
		response.json(result);
	} catch (error) {
		next(error);
	}
});

app.post('/api/auth/logout', async (request, response, next) => {
	try {
		const result = await logoutUser(request.body);
		response.json(result);
	} catch (error) {
		next(error);
	}
});

app.use(
	(
		error: Error | ApiAuthError | ZodError,
		_request: express.Request,
		response: express.Response,
		_next: express.NextFunction
	) => {
		if (error instanceof ZodError) {
			response.status(400).json({
				message: 'Некорректные данные запроса',
				issues: error.issues
			});
			return;
		}

		if ('status' in error) {
			response.status(error.status).json({
				message: error.message
			});
			return;
		}

		if ('type' in error && error.type === 'entity.too.large') {
			response.status(413).json({
				message: 'Файл слишком большой. Максимум 6 МБ.'
			});
			return;
		}

		if (error instanceof Error && error.message === 'CORS_ORIGIN_NOT_ALLOWED') {
			response.status(403).json({
				message: 'Origin не разрешён политикой CORS'
			});
			return;
		}

		if (error instanceof Error && error.message.startsWith('ENV_VALIDATION_FAILED:')) {
			response.status(500).json({
				message: 'Сервер запущен с некорректной конфигурацией окружения'
			});
			return;
		}

		if (error instanceof Error && error.message === 'UNSUPPORTED_AVATAR_TYPE') {
			response.status(400).json({
				message: 'Поддерживаются только JPG, PNG, WEBP и GIF.'
			});
			return;
		}

		if (error instanceof Error && error.message === 'UNSUPPORTED_VERIFICATION_TYPE') {
			response.status(400).json({
				message: 'Для верификации поддерживаются только PDF, JPG и PNG.'
			});
			return;
		}

		response.status(500).json({
			message: 'Внутренняя ошибка сервера'
		});
	}
);

app.listen(port, () => {
	console.log(`rent-cars-api listening on http://localhost:${port}`);
});

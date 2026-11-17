import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import type {
  AdminStats,
  CreateOrderPayload,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductInput,
  UserProfile,
  UserRole,
} from './src/types.ts';

interface StoredUser extends UserProfile {
  password_hash: string;
}

interface SessionRecord {
  token: string;
  userId: string;
  createdAt: number;
}

interface DatabaseStore {
  users: StoredUser[];
  products: Product[];
  orders: Order[];
  sessions: SessionRecord[];
}

interface AuthenticatedRequest extends Request {
  authUser?: StoredUser;
  authToken?: string;
}

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

function hashPassword(password: string, existingSalt?: string): string {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  const keyBuffer = Buffer.from(key, 'hex');
  const derived = crypto.scryptSync(password, salt, 64);
  if (keyBuffer.length !== derived.length) return false;
  return crypto.timingSafeEqual(keyBuffer, derived);
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function sanitizeUser(user: StoredUser): UserProfile {
  const { password_hash: _removed, ...profile } = user;
  return profile;
}

function createInitialStore(): DatabaseStore {
  const now = new Date().toISOString();
  const adminId = 'usr-admin-001';
  const customerId = 'usr-cust-001';

  const users: StoredUser[] = [
    {
      id: adminId,
      email: 'admin@chikisel.id',
      full_name: 'Alya Putri (Store Owner)',
      phone: '0812-8800-1122',
      address: 'Jl. Kemang Selatan VIII No. 14',
      city: 'Jakarta Selatan',
      postal_code: '12730',
      role: 'admin',
      created_at: now,
      password_hash: hashPassword('Admin123!'),
    },
    {
      id: customerId,
      email: 'nadia@chikisel.id',
      full_name: 'Nadia Maharani',
      phone: '0856-9123-4455',
      address: 'Jl. Dago Pakar Barat No. 27',
      city: 'Bandung',
      postal_code: '40198',
      role: 'user',
      created_at: now,
      password_hash: hashPassword('Snack123!'),
    },
  ];

  const products: Product[] = [
    {
      id: 'prd-001',
      name: "Garuda Crunchy O'Corn Sea Salt",
      slug: 'garuda-crunchy-ocorn-sea-salt',
      category: 'Chiki & Puffs',
      description:
        'Light and airy crunchy corn puffs seasoned with crisp sea salt. Classic chiki texture that stays crunchy for movie nights and study breaks.',
      price: 8000,
      weight: '75g',
      stock: 40,
      image_url: '/assets/aistudio/WhatsApp_Imag_2026-11-17_at_13.09.59_64a9d300.jpeg',
      flavor_notes: 'Savory sea salt, toasted corn, airy crunch',
      is_featured: true,
      created_at: now,
    },
    {
      id: 'prd-002',
      name: 'Kusuka Keripik Singkong Original',
      slug: 'kusuka-keripik-singkong-original',
      category: 'Chips & Savory',
      description:
        'Thinly sliced Indonesian cassava chips fried golden and lightly salted for a clean, satisfyingly crisp local snack.',
      price: 17500,
      weight: '180g',
      stock: 35,
      image_url: '/assets/aistudio/WhatsApp_Imge_2026-11-17_at_13.09.59_706b40cd.jpeg',
      flavor_notes: 'Natural cassava, light sea salt, thin crunch',
      is_featured: false,
      created_at: now,
    },
    {
      id: 'prd-003',
      name: 'Doritos Roasted Corn',
      slug: 'doritos-roasted-corn',
      category: 'Chips & Savory',
      description:
        'Bold triangular tortilla chips coated in sweet-savory Indonesian jagung bakar (roasted corn) seasoning.',
      price: 19500,
      weight: '160g',
      stock: 28,
      image_url: '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.09.59_66dac5c6.jpeg',
      flavor_notes: 'Smoky roasted corn, buttery spice, crisp tortilla',
      is_featured: true,
      created_at: now,
    },
    {
      id: 'prd-004',
      name: 'Chitato Lite Rumput Laut',
      slug: 'chitato-lite-rumput-laut',
      category: 'Chips & Savory',
      description:
        'Wafer-thin flat potato chips dusted with umami nori seaweed seasoning. Light, crisp, and easy to snack on all afternoon.',
      price: 11500,
      weight: '55g',
      stock: 44,
      image_url: '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.09.58_651d355d.jpeg',
      flavor_notes: 'Savory nori seaweed, thin potato slice, umami',
      is_featured: true,
      created_at: now,
    },
    {
      id: 'prd-005',
      name: 'Nescafe Cappuccino Can',
      slug: 'nescafe-cappuccino-can',
      category: 'Drinks & Milk',
      description:
        'Ready-to-drink chilled cappuccino crafted with smooth espresso and creamy milk foam in a sleek grab-and-go can.',
      price: 8500,
      weight: '220ml',
      stock: 50,
      image_url: '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.11.09__1__bcfdc7c2.jpeg',
      flavor_notes: 'Smooth espresso, creamy milk foam, lightly sweet',
      is_featured: false,
      created_at: now,
    },
    {
      id: 'prd-006',
      name: 'Oatside Oat Milk Chocolate',
      slug: 'oatside-oat-milk-chocolate',
      category: 'Drinks & Milk',
      description:
        'Rich plant-based roasted oat milk blended with dark cacao. Creamy, dairy-free, and pairs effortlessly with sweet or salty snacks.',
      price: 9500,
      weight: '200ml',
      stock: 36,
      image_url: '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.11.09_4dde3e8e.jpeg',
      flavor_notes: 'Velvety dark chocolate, roasted oats, creamy',
      is_featured: true,
      created_at: now,
    },
    {
      id: 'prd-007',
      name: 'Nutriboost Milk Strawberry',
      slug: 'nutriboost-milk-strawberry',
      category: 'Drinks & Milk',
      description:
        'Refreshing blend of fresh milk and sweet strawberry juice enriched with vitamins B3, B6, E, and zinc.',
      price: 7500,
      weight: '300ml',
      stock: 48,
      image_url: '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.11.10__1__1546fcd8.jpeg',
      flavor_notes: 'Sweet strawberry, smooth milk, fruity finish',
      is_featured: true,
      created_at: now,
    },
    {
      id: 'prd-008',
      name: 'Good Day Originalé Cappuccino',
      slug: 'good-day-originale-cappuccino',
      category: 'Drinks & Milk',
      description:
        'Chilled bottled cappuccino coffee with balanced sweetness and rich roasted coffee aroma for busy campus or study days.',
      price: 7000,
      weight: '250ml',
      stock: 42,
      image_url: '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.11.10_bb9ccb17.jpeg',
      flavor_notes: 'Creamy coffee, subtle caramel, chilled delight',
      is_featured: false,
      created_at: now,
    },
    {
      id: 'prd-009',
      name: 'Nabati SiiP Richeese Bite Size',
      slug: 'nabati-siip-richeese-bite-size',
      category: 'Chiki & Puffs',
      description:
        'Crunchy bite-sized extruded corn snacks generously coated in signature Nabati Richeese cheddar cheese powder.',
      price: 5500,
      weight: '50g',
      stock: 60,
      image_url: '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.10.00_2b98f803.jpeg',
      flavor_notes: 'Rich cheddar cheese, airy bite, sweet-savory',
      is_featured: true,
      created_at: now,
    },
    {
      id: 'prd-010',
      name: 'Oishi Chocolate Popcorn',
      slug: 'oishi-chocolate-popcorn',
      category: 'Sweet Snacks',
      description:
        'Crisp caramel-glazed popcorn kernels wrapped in smooth dark chocolate coating for the ultimate sweet movie-night treat.',
      price: 13500,
      weight: '100g',
      stock: 32,
      image_url: '/assets/aistudio/WhatsApp_Ige_2026-11-17_at_13.10.00_26e0537c.jpeg',
      flavor_notes: 'Sweet cocoa glaze, crisp popcorn, rich aroma',
      is_featured: true,
      created_at: now,
    },
    {
      id: 'prd-011',
      name: 'Tic Tic Crunchy Stick Bawang',
      slug: 'tic-tic-crunchy-stick-bawang',
      category: 'Chiki & Puffs',
      description:
        'Iconic crunchy potato-and-wheat snack sticks seasoned with savory Indonesian garlic (bawang asli) spice.',
      price: 7500,
      weight: '70g',
      stock: 55,
      image_url: '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.10.01_1198f666.jpeg',
      flavor_notes: 'Savory garlic, crisp stick crunch, addictive',
      is_featured: false,
      created_at: now,
    },
    {
      id: 'prd-012',
      name: 'Taro Net Potato BBQ',
      slug: 'taro-net-potato-bbq',
      category: 'Chiki & Puffs',
      description:
        "Beloved crispy net-shaped potato puffs with smoky-sweet barbecue seasoning—everyone's favorite nostalgic Indonesian chiki.",
      price: 9000,
      weight: '70g',
      stock: 46,
      image_url: '/assets/aistudio/WhatsAp_Image_2026-11-17_at_13.10.00_3fc2fd98.jpeg',
      flavor_notes: 'Smoky BBQ, airy net crunch, nostalgic',
      is_featured: true,
      created_at: now,
    },
  ];

  const yesterday = new Date(Date.now() - 86400000 * 2).toISOString();
  const earlierToday = new Date(Date.now() - 3600000 * 5).toISOString();

  const orders: Order[] = [
    {
      id: 'ord-1001',
      order_number: 'CB-2026-1001',
      user_id: customerId,
      customer_name: 'Nadia Maharani',
      customer_phone: '0856-9123-4455',
      shipping_address: 'Jl. Dago Pakar Barat No. 27',
      shipping_city: 'Bandung',
      postal_code: '40198',
      payment_method: 'QRIS',
      notes: 'Please include extra bubble wrap for the chips.',
      total_amount: 25500,
      status: 'Delivered',
      created_at: yesterday,
      items: [
        {
          id: 'oi-1001-1',
          order_id: 'ord-1001',
          product_id: 'prd-001',
          product_name: "Garuda Crunchy O'Corn Sea Salt",
          product_image: products[0].image_url,
          unit_price: 8000,
          quantity: 2,
          subtotal: 16000,
        },
        {
          id: 'oi-1001-2',
          order_id: 'ord-1001',
          product_id: 'prd-006',
          product_name: 'Oatside Oat Milk Chocolate',
          product_image: products[5].image_url,
          unit_price: 9500,
          quantity: 1,
          subtotal: 9500,
        },
      ],
    },
    {
      id: 'ord-1002',
      order_number: 'CB-2026-1002',
      user_id: customerId,
      customer_name: 'Nadia Maharani',
      customer_phone: '0856-9123-4455',
      shipping_address: 'Jl. Dago Pakar Barat No. 27',
      shipping_city: 'Bandung',
      postal_code: '40198',
      payment_method: 'COD',
      notes: 'Leave at reception desk if unavailable.',
      total_amount: 30000,
      status: 'Processing',
      created_at: earlierToday,
      items: [
        {
          id: 'oi-1002-1',
          order_id: 'ord-1002',
          product_id: 'prd-010',
          product_name: 'Oishi Chocolate Popcorn',
          product_image: products[9].image_url,
          unit_price: 13500,
          quantity: 1,
          subtotal: 13500,
        },
        {
          id: 'oi-1002-2',
          order_id: 'ord-1002',
          product_id: 'prd-012',
          product_name: 'Taro Net Potato BBQ',
          product_image: products[11].image_url,
          unit_price: 9000,
          quantity: 1,
          subtotal: 9000,
        },
        {
          id: 'oi-1002-3',
          order_id: 'ord-1002',
          product_id: 'prd-007',
          product_name: 'Nutriboost Milk Strawberry',
          product_image: products[6].image_url,
          unit_price: 7500,
          quantity: 1,
          subtotal: 7500,
        },
      ],
    },
  ];

  return {
    users,
    products,
    orders,
    sessions: [],
  };
}

function readDb(): DatabaseStore {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial = createInitialStore();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseStore;
  } catch {
    const initial = createInitialStore();
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
}

function writeDb(db: DatabaseStore): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('chikisel_token='));
    if (match) {
      return decodeURIComponent(match.split('=')[1] || '');
    }
  }
  return null;
}

function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  const db = readDb();
  const session = db.sessions.find((s) => s.token === token);
  if (!session) {
    res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    return;
  }
  const user = db.users.find((u) => u.id === session.userId);
  if (!user) {
    res.status(401).json({ error: 'Account not found.' });
    return;
  }
  req.authUser = user;
  req.authToken = token;
  next();
}

function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  if (!req.authUser) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (req.authUser.role !== 'admin') {
    res.status(403).json({
      error: 'Access denied. Administrator privileges are required for this action.',
    });
    return;
  }
  next();
}

async function startServer(): Promise<void> {
  // Initialize local DB file on startup
  readDb();

  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // =========================================================================
  // AUTH ROUTES
  // =========================================================================

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { email, password, full_name } = req.body as {
      email?: string;
      password?: string;
      full_name?: string;
    };

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (full_name || '').trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      res.status(400).json({ error: 'Please enter a valid email address.' });
      return;
    }
    if (!password || password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long.' });
      return;
    }
    if (!cleanName) {
      res.status(400).json({ error: 'Full name is required.' });
      return;
    }

    const db = readDb();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const newUser: StoredUser = {
      id: `usr-${crypto.randomUUID().slice(0, 8)}`,
      email: cleanEmail,
      full_name: cleanName,
      phone: '',
      address: '',
      city: '',
      postal_code: '',
      role: 'user', // Strictly enforce default 'user' role on registration
      created_at: new Date().toISOString(),
      password_hash: hashPassword(password),
    };

    const token = crypto.randomBytes(32).toString('hex');
    db.users.push(newUser);
    db.sessions.push({ token, userId: newUser.id, createdAt: Date.now() });
    writeDb(db);

    res.cookie('chikisel_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      user: sanitizeUser(newUser),
      token,
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body as { email?: string; password?: string };
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const db = readDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || !verifyPassword(password, user.password_hash)) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    db.sessions.push({ token, userId: user.id, createdAt: Date.now() });
    writeDb(db);

    res.cookie('chikisel_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      user: sanitizeUser(user),
      token,
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const token = extractToken(req);
    if (token) {
      const db = readDb();
      db.sessions = db.sessions.filter((s) => s.token !== token);
      writeDb(db);
    }
    res.clearCookie('chikisel_token', { path: '/' });
    res.json({ ok: true });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: sanitizeUser(req.authUser!) });
  });

  app.put('/api/profiles/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const { full_name, phone, address, city, postal_code } = req.body as Partial<UserProfile>;
    const db = readDb();
    const index = db.users.findIndex((u) => u.id === req.authUser!.id);
    if (index === -1) {
      res.status(404).json({ error: 'Profile not found.' });
      return;
    }

    const current = db.users[index];
    db.users[index] = {
      ...current,
      full_name: typeof full_name === 'string' && full_name.trim() ? full_name.trim() : current.full_name,
      phone: typeof phone === 'string' ? phone.trim() : current.phone,
      address: typeof address === 'string' ? address.trim() : current.address,
      city: typeof city === 'string' ? city.trim() : current.city,
      postal_code: typeof postal_code === 'string' ? postal_code.trim() : current.postal_code,
    };

    writeDb(db);
    res.json({ user: sanitizeUser(db.users[index]) });
  });

  // =========================================================================
  // PRODUCTS ROUTES (Public Read, Admin Write)
  // =========================================================================

  app.get('/api/products', (_req: Request, res: Response) => {
    const db = readDb();
    res.json({ products: db.products });
  });

  app.post(
    '/api/products',
    requireAuth,
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const body = req.body as Partial<ProductInput>;
      if (!body.name?.trim() || !body.category || typeof body.price !== 'number') {
        res.status(400).json({ error: 'Name, category, and valid price are required.' });
        return;
      }

      const db = readDb();
      const baseSlug = createSlug(body.name);
      const uniqueSlug = db.products.some((p) => p.slug === baseSlug)
        ? `${baseSlug}-${Date.now().toString().slice(-4)}`
        : baseSlug;

      const newProduct: Product = {
        id: `prd-${crypto.randomUUID().slice(0, 8)}`,
        name: body.name.trim(),
        slug: uniqueSlug,
        category: body.category,
        description: (body.description || '').trim() || 'Freshly packed artisanal local snack.',
        price: Math.max(0, Math.round(body.price)),
        weight: (body.weight || '85g').trim(),
        stock: Math.max(0, Math.round(Number(body.stock ?? 0))),
        image_url:
          (body.image_url || '').trim() ||
          '/src/assets/images/snack_strawberry_puff_1794893460642.jpg',
        flavor_notes: (body.flavor_notes || '').trim(),
        is_featured: Boolean(body.is_featured),
        created_at: new Date().toISOString(),
      };

      db.products.unshift(newProduct);
      writeDb(db);
      res.status(201).json({ product: newProduct });
    },
  );

  app.put(
    '/api/products/:id',
    requireAuth,
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const body = req.body as Partial<ProductInput>;
      const db = readDb();
      const idx = db.products.findIndex((p) => p.id === id);
      if (idx === -1) {
        res.status(404).json({ error: 'Product not found.' });
        return;
      }

      const existing = db.products[idx];
      db.products[idx] = {
        ...existing,
        name: body.name !== undefined ? body.name.trim() : existing.name,
        category: body.category !== undefined ? body.category : existing.category,
        description: body.description !== undefined ? body.description.trim() : existing.description,
        price: body.price !== undefined ? Math.max(0, Math.round(Number(body.price))) : existing.price,
        weight: body.weight !== undefined ? body.weight.trim() : existing.weight,
        stock: body.stock !== undefined ? Math.max(0, Math.round(Number(body.stock))) : existing.stock,
        image_url: body.image_url !== undefined ? body.image_url.trim() : existing.image_url,
        flavor_notes: body.flavor_notes !== undefined ? body.flavor_notes.trim() : existing.flavor_notes,
        is_featured: body.is_featured !== undefined ? Boolean(body.is_featured) : existing.is_featured,
      };

      writeDb(db);
      res.json({ product: db.products[idx] });
    },
  );

  app.delete(
    '/api/products/:id',
    requireAuth,
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const db = readDb();
      const exists = db.products.some((p) => p.id === id);
      if (!exists) {
        res.status(404).json({ error: 'Product not found.' });
        return;
      }
      db.products = db.products.filter((p) => p.id !== id);
      writeDb(db);
      res.json({ ok: true });
    },
  );

  // =========================================================================
  // CUSTOMER ORDERS ROUTES
  // =========================================================================

  app.get('/api/orders/mine', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const db = readDb();
    const myOrders = db.orders
      .filter((o) => o.user_id === req.authUser!.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    res.json({ orders: myOrders });
  });

  app.post('/api/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const payload = req.body as Partial<CreateOrderPayload>;

    if (
      !payload.customer_name?.trim() ||
      !payload.customer_phone?.trim() ||
      !payload.shipping_address?.trim() ||
      !payload.shipping_city?.trim() ||
      (payload.payment_method !== 'QRIS' && payload.payment_method !== 'COD') ||
      !Array.isArray(payload.items) ||
      payload.items.length === 0
    ) {
      res.status(400).json({ error: 'Please complete all shipping fields, choose QRIS or COD, and include at least one snack.' });
      return;
    }

    const db = readDb();
    const orderId = `ord-${crypto.randomUUID().slice(0, 8)}`;
    const orderNumber = `CB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderItems: OrderItem[] = [];
    let totalAmount = 0;

    for (const itemReq of payload.items) {
      const product = db.products.find((p) => p.id === itemReq.product_id);
      if (!product) {
        res.status(404).json({ error: 'One of the selected snacks is no longer available.' });
        return;
      }
      const qty = Math.max(1, Math.floor(Number(itemReq.quantity)));
      if (product.stock < qty) {
        res.status(409).json({
          error: `Insufficient stock for ${product.name}. Only ${product.stock} left.`,
        });
        return;
      }

      const subtotal = product.price * qty;
      totalAmount += subtotal;
      orderItems.push({
        id: `oi-${crypto.randomUUID().slice(0, 8)}`,
        order_id: orderId,
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url,
        unit_price: product.price,
        quantity: qty,
        subtotal,
      });
    }

    // Decrement product stocks
    for (const oi of orderItems) {
      const prod = db.products.find((p) => p.id === oi.product_id);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - oi.quantity);
      }
    }

    const newOrder: Order = {
      id: orderId,
      order_number: orderNumber,
      user_id: req.authUser!.id,
      customer_name: payload.customer_name.trim(),
      customer_phone: payload.customer_phone.trim(),
      shipping_address: payload.shipping_address.trim(),
      shipping_city: payload.shipping_city.trim(),
      postal_code: (payload.postal_code || '').trim(),
      payment_method: payload.payment_method,
      notes: (payload.notes || '').trim(),
      total_amount: totalAmount,
      status: 'Pending',
      created_at: new Date().toISOString(),
      items: orderItems,
    };

    db.orders.unshift(newOrder);
    writeDb(db);

    res.status(201).json({ order: newOrder });
  });

  // =========================================================================
  // ADMIN ROUTES (Strictly Protected)
  // =========================================================================

  app.get(
    '/api/admin/stats',
    requireAuth,
    requireAdmin,
    (_req: AuthenticatedRequest, res: Response) => {
      const db = readDb();
      const nonCancelled = db.orders.filter((o) => o.status !== 'Cancelled');
      const stats: AdminStats = {
        totalRevenue: nonCancelled.reduce((sum, o) => sum + o.total_amount, 0),
        totalOrders: db.orders.length,
        pendingOrders: db.orders.filter((o) => o.status === 'Pending' || o.status === 'Processing').length,
        totalProducts: db.products.length,
        lowStockProducts: db.products.filter((p) => p.stock <= 10).length,
        totalUsers: db.users.length,
      };
      res.json({ stats });
    },
  );

  app.get(
    '/api/admin/orders',
    requireAuth,
    requireAdmin,
    (_req: AuthenticatedRequest, res: Response) => {
      const db = readDb();
      const sorted = [...db.orders].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      res.json({ orders: sorted });
    },
  );

  app.patch(
    '/api/admin/orders/:id/status',
    requireAuth,
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const { status } = req.body as { status?: OrderStatus };
      const allowed: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
      if (!status || !allowed.includes(status)) {
        res.status(400).json({ error: 'Invalid order status.' });
        return;
      }

      const db = readDb();
      const order = db.orders.find((o) => o.id === id);
      if (!order) {
        res.status(404).json({ error: 'Order not found.' });
        return;
      }
      order.status = status;
      writeDb(db);
      res.json({ order });
    },
  );

  app.get(
    '/api/admin/users',
    requireAuth,
    requireAdmin,
    (_req: AuthenticatedRequest, res: Response) => {
      const db = readDb();
      res.json({ users: db.users.map(sanitizeUser) });
    },
  );

  app.patch(
    '/api/admin/users/:id/role',
    requireAuth,
    requireAdmin,
    (req: AuthenticatedRequest, res: Response) => {
      const { id } = req.params;
      const { role } = req.body as { role?: UserRole };
      if (role !== 'admin' && role !== 'user') {
        res.status(400).json({ error: 'Invalid role.' });
        return;
      }
      if (id === req.authUser!.id && role !== 'admin') {
        res.status(400).json({ error: 'You cannot demote your own active admin account.' });
        return;
      }

      const db = readDb();
      const user = db.users.find((u) => u.id === id);
      if (!user) {
        res.status(404).json({ error: 'User not found.' });
        return;
      }
      user.role = role;
      writeDb(db);
      res.json({ user: sanitizeUser(user) });
    },
  );

  // =========================================================================
  // VITE / STATIC SERVING
  // =========================================================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChikiSel server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

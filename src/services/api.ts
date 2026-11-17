import { isSupabaseConfigured, supabase } from '../lib/supabase.ts';
import type {
  AdminStats,
  CreateOrderPayload,
  Order,
  OrderStatus,
  Product,
  ProductInput,
  UserProfile,
  UserRole,
} from '../types.ts';

const TOKEN_STORAGE_KEY = 'chikisel_session_token';

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${response.status})`);
  }
  return data as T;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function formatSupabaseError(message: string): string {
  if (/infinite recursion detected in policy/i.test(message)) {
    return 'Supabase RLS policy error: please run supabase/reset_and_setup.sql in your Supabase SQL Editor to reset legacy policies on profiles & orders.';
  }
  if (/Could not find the table/i.test(message) || /does not exist/i.test(message)) {
    return `Supabase table mismatch: ${message}. Please run supabase/reset_and_setup.sql in your Supabase SQL Editor.`;
  }
  return message;
}

const LEGACY_IMAGE_MAP: Record<string, string> = {
  '/images/garuda.jpg': '/assets/aistudio/WhatsApp_Imag_2026-11-17_at_13.09.59_64a9d300.jpeg',
  '/images/kusuka.jpg': '/assets/aistudio/WhatsApp_Imge_2026-11-17_at_13.09.59_706b40cd.jpeg',
  '/images/doritos.jpg': '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.09.59_66dac5c6.jpeg',
  '/images/chitato.jpg': '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.09.58_651d355d.jpeg',
  '/images/nescafe.jpg': '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.11.09__1__bcfdc7c2.jpeg',
  '/images/oatside.jpg': '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.11.09_4dde3e8e.jpeg',
  '/images/nutriboost.jpg': '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.11.10__1__1546fcd8.jpeg',
  '/images/goodday.jpg': '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.11.10_bb9ccb17.jpeg',
  '/images/siip.jpg': '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.10.00_2b98f803.jpeg',
  '/images/oishi.jpg': '/assets/aistudio/WhatsApp_Ige_2026-11-17_at_13.10.00_26e0537c.jpeg',
  '/images/tictic.jpg': '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.10.01_1198f666.jpeg',
  '/images/taro.jpg': '/assets/aistudio/WhatsAp_Image_2026-11-17_at_13.10.00_3fc2fd98.jpeg',
};

function resolveProductImage(rawUrl: string, productName: string): string {
  const trimmed = rawUrl.trim();
  if (trimmed.startsWith('/assets/aistudio/') || trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }
  const mapped = LEGACY_IMAGE_MAP[trimmed.toLowerCase()];
  if (mapped) return mapped;

  const lower = productName.toLowerCase();
  if (lower.includes('garuda') || lower.includes("o'corn") || lower.includes('ocorn')) {
    return LEGACY_IMAGE_MAP['/images/garuda.jpg'];
  }
  if (lower.includes('kusuka')) return LEGACY_IMAGE_MAP['/images/kusuka.jpg'];
  if (lower.includes('doritos')) return LEGACY_IMAGE_MAP['/images/doritos.jpg'];
  if (lower.includes('chitato')) return LEGACY_IMAGE_MAP['/images/chitato.jpg'];
  if (lower.includes('nescafe')) return LEGACY_IMAGE_MAP['/images/nescafe.jpg'];
  if (lower.includes('oatside')) return LEGACY_IMAGE_MAP['/images/oatside.jpg'];
  if (lower.includes('nutriboost')) return LEGACY_IMAGE_MAP['/images/nutriboost.jpg'];
  if (lower.includes('good day')) return LEGACY_IMAGE_MAP['/images/goodday.jpg'];
  if (lower.includes('siip') || lower.includes('nabati')) return LEGACY_IMAGE_MAP['/images/siip.jpg'];
  if (lower.includes('oishi') || lower.includes('popcorn')) return LEGACY_IMAGE_MAP['/images/oishi.jpg'];
  if (lower.includes('tic tic') || lower.includes('tictic')) return LEGACY_IMAGE_MAP['/images/tictic.jpg'];
  if (lower.includes('taro')) return LEGACY_IMAGE_MAP['/images/taro.jpg'];
  return trimmed;
}

function normalizeCategory(rawCategory: unknown, productName: string): Product['category'] {
  const valid: Product['category'][] = [
    'Chiki & Puffs',
    'Chips & Savory',
    'Sweet Snacks',
    'Drinks & Milk',
  ];
  const cat = String(rawCategory || '').trim();
  if (valid.includes(cat as Product['category'])) {
    return cat as Product['category'];
  }
  const lower = cat.toLowerCase();
  const nameLower = productName.toLowerCase();
  if (lower.includes('minuman') || lower.includes('drink') || lower.includes('milk')) {
    return 'Drinks & Milk';
  }
  if (nameLower.includes('popcorn') || nameLower.includes('chocolate') || lower.includes('sweet')) {
    return 'Sweet Snacks';
  }
  if (lower.includes('keripik') || lower.includes('chip') || lower.includes('tortilla')) {
    return 'Chips & Savory';
  }
  return 'Chiki & Puffs';
}

function normalizeProduct(raw: Record<string, unknown>): Product {
  const name = String(raw.name || 'ChikiSel Snack');
  const id = String(raw.id || '');
  const rawImg = typeof raw.image_url === 'string' ? raw.image_url : '';
  return {
    id,
    name,
    slug: typeof raw.slug === 'string' && raw.slug ? raw.slug : `${slugify(name)}-${id}`,
    category: normalizeCategory(raw.category, name),
    description: typeof raw.description === 'string' ? raw.description : '',
    price: Number(raw.price || 0),
    weight: typeof raw.weight === 'string' && raw.weight ? raw.weight : '75g',
    stock: Number(raw.stock || 0),
    image_url: resolveProductImage(rawImg, name),
    flavor_notes: typeof raw.flavor_notes === 'string' ? raw.flavor_notes : '',
    is_featured: Boolean(raw.is_featured),
    created_at: typeof raw.created_at === 'string' ? raw.created_at : new Date().toISOString(),
  };
}

export const api = {
  // =========================================================================
  // AUTHENTICATION & PROFILE
  // =========================================================================

  async getCurrentUser(): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !profile) return null;
      return profile as UserProfile;
    }

    const token = getStoredToken();
    if (!token) return null;

    try {
      const data = await apiFetch<{ user: UserProfile }>('/api/auth/me');
      return data.user;
    } catch {
      setStoredToken(null);
      return null;
    }
  },

  async register(email: string, password: string, fullName: string): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { full_name: cleanName },
        },
      });
      if (error) throw new Error(formatSupabaseError(error.message));
      if (!data.user) throw new Error('Registration did not return a user.');

      // If Supabase "Confirm email" is enabled, session is null until verified
      if (!data.session) {
        throw new Error(
          'Akun berhasil dibuat di Supabase Auth! Silakan cek inbox email untuk verifikasi, atau matikan "Confirm email" di Supabase Dashboard -> Authentication -> Providers -> Email.',
        );
      }

      const { data: existingProfile, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (fetchErr) {
        throw new Error(formatSupabaseError(fetchErr.message));
      }

      if (existingProfile) {
        return existingProfile as UserProfile;
      }

      const fallbackProfile: Omit<UserProfile, 'created_at'> = {
        id: data.user.id,
        email: cleanEmail,
        full_name: cleanName,
        phone: '',
        address: '',
        city: '',
        postal_code: '',
        role: 'user',
      };
      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .upsert(fallbackProfile)
        .select()
        .single();

      if (insertErr) throw new Error(formatSupabaseError(insertErr.message));
      return inserted as UserProfile;
    }

    const res = await apiFetch<{ user: UserProfile; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, full_name: fullName }),
    });
    setStoredToken(res.token);
    return res.user;
  },

  async login(email: string, password: string): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      const cleanEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (error) throw new Error(formatSupabaseError(error.message));
      if (!data.user) throw new Error('Login failed.');

      const { data: existingProfile, error: fetchErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (fetchErr) {
        throw new Error(formatSupabaseError(fetchErr.message));
      }

      if (existingProfile) {
        return existingProfile as UserProfile;
      }

      // Auto-create profile row if the user existed in auth.users before trigger setup
      const { data: createdProfile, error: createErr } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email || cleanEmail,
          full_name:
            (data.user.user_metadata?.full_name as string | undefined) ||
            cleanEmail.split('@')[0],
          phone: '',
          address: '',
          city: '',
          postal_code: '',
          role: 'user',
        })
        .select()
        .single();

      if (createErr || !createdProfile) {
        throw new Error(
          formatSupabaseError(createErr?.message || 'User profile could not be loaded.'),
        );
      }
      return createdProfile as UserProfile;
    }

    const res = await apiFetch<{ user: UserProfile; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res.user;
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
      return;
    }
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to update your profile.');

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.full_name,
          phone: updates.phone,
          address: updates.address,
          city: updates.city,
          postal_code: updates.postal_code,
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw new Error(formatSupabaseError(error.message));
      return data as UserProfile;
    }

    const res = await apiFetch<{ user: UserProfile }>('/api/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return res.user;
  },

  // =========================================================================
  // PRODUCTS
  // =========================================================================

  async getProducts(): Promise<Product[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(formatSupabaseError(error.message));
      return (data || []).map((row) => normalizeProduct(row as Record<string, unknown>));
    }

    const res = await apiFetch<{ products: Product[] }>('/api/products');
    return res.products;
  },

  async createProduct(input: ProductInput): Promise<Product> {
    if (isSupabaseConfigured && supabase) {
      const slug = `${slugify(input.name)}-${Date.now().toString().slice(-4)}`;
      const { data, error } = await supabase
        .from('products')
        .insert({ ...input, slug })
        .select()
        .single();

      if (error) throw new Error(formatSupabaseError(error.message));
      return normalizeProduct(data as Record<string, unknown>);
    }

    const res = await apiFetch<{ product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return res.product;
  },

  async updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('products')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw new Error(formatSupabaseError(error.message));
      return normalizeProduct(data as Record<string, unknown>);
    }

    const res = await apiFetch<{ product: Product }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
    return res.product;
  },

  async deleteProduct(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw new Error(formatSupabaseError(error.message));
      return;
    }

    await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
  },

  // =========================================================================
  // ORDERS (Customer & Checkout)
  // =========================================================================

  async createOrder(payload: CreateOrderPayload): Promise<Order> {
    if (isSupabaseConfigured && supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Please sign in to place an order.');

      // Fetch authoritative prices from products table
      const productIds = payload.items.map((i) => i.product_id);
      const { data: dbProducts, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (prodErr || !dbProducts) {
        throw new Error(formatSupabaseError(prodErr?.message || 'Unable to verify product pricing.'));
      }

      const normalizedProducts = dbProducts.map((p) =>
        normalizeProduct(p as Record<string, unknown>),
      );

      let totalAmount = 0;
      const lineItems = payload.items.map((item) => {
        const prod = normalizedProducts.find((p) => p.id === item.product_id);
        if (!prod) throw new Error('One of the items in your bag is no longer available.');
        if (prod.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${prod.name}. Only ${prod.stock} left.`);
        }
        const subtotal = prod.price * item.quantity;
        totalAmount += subtotal;
        return {
          product: prod,
          quantity: item.quantity,
          subtotal,
        };
      });

      const orderNumber = `CB-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { data: insertedOrder, error: orderErr } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          user_id: user.id,
          customer_name: payload.customer_name,
          customer_phone: payload.customer_phone,
          shipping_address: payload.shipping_address,
          shipping_city: payload.shipping_city,
          postal_code: payload.postal_code,
          payment_method: payload.payment_method,
          notes: payload.notes,
          total_amount: totalAmount,
          status: 'Pending',
        })
        .select()
        .single();

      if (orderErr || !insertedOrder) {
        throw new Error(formatSupabaseError(orderErr?.message || 'Failed to create order.'));
      }

      const itemsToInsert = lineItems.map((li) => ({
        order_id: insertedOrder.id,
        product_id: li.product.id,
        product_name: li.product.name,
        product_image: li.product.image_url,
        unit_price: li.product.price,
        quantity: li.quantity,
        subtotal: li.subtotal,
      }));

      const { data: insertedItems, error: itemsErr } = await supabase
        .from('order_items')
        .insert(itemsToInsert)
        .select();

      if (itemsErr) throw new Error(formatSupabaseError(itemsErr.message));

      // Update product stock counts
      for (const li of lineItems) {
        await supabase
          .from('products')
          .update({ stock: Math.max(0, li.product.stock - li.quantity) })
          .eq('id', li.product.id);
      }

      return {
        ...(insertedOrder as Omit<Order, 'items'>),
        items: (insertedItems || []) as Order['items'],
      };
    }

    const res = await apiFetch<{ order: Order }>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.order;
  },

  async getMyOrders(): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw new Error(formatSupabaseError(error.message));
      return (data || []) as Order[];
    }

    const res = await apiFetch<{ orders: Order[] }>('/api/orders/mine');
    return res.orders;
  },

  // =========================================================================
  // ADMIN OPERATIONS (Protected)
  // =========================================================================

  async getAdminStats(): Promise<AdminStats> {
    if (isSupabaseConfigured && supabase) {
      const [{ data: orders }, { data: products }, { data: users }] = await Promise.all([
        supabase.from('orders').select('total_amount, status'),
        supabase.from('products').select('stock'),
        supabase.from('profiles').select('id'),
      ]);

      const orderList = orders || [];
      const productList = products || [];
      const userList = users || [];

      const nonCancelled = orderList.filter((o) => o.status !== 'Cancelled');
      return {
        totalRevenue: nonCancelled.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
        totalOrders: orderList.length,
        pendingOrders: orderList.filter((o) => o.status === 'Pending' || o.status === 'Processing').length,
        totalProducts: productList.length,
        lowStockProducts: productList.filter((p) => Number(p.stock) <= 10).length,
        totalUsers: userList.length,
      };
    }

    const res = await apiFetch<{ stats: AdminStats }>('/api/admin/stats');
    return res.stats;
  },

  async getAllOrders(): Promise<Order[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, items:order_items(*)')
        .order('created_at', { ascending: false });

      if (error) throw new Error(formatSupabaseError(error.message));
      return (data || []) as Order[];
    }

    const res = await apiFetch<{ orders: Order[] }>('/api/admin/orders');
    return res.orders;
  },

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select('*, items:order_items(*)')
        .single();

      if (error) throw new Error(formatSupabaseError(error.message));
      return data as Order;
    }

    const res = await apiFetch<{ order: Order }>(`/api/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.order;
  },

  async getAllUsers(): Promise<UserProfile[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw new Error(formatSupabaseError(error.message));
      return (data || []) as UserProfile[];
    }

    const res = await apiFetch<{ users: UserProfile[] }>('/api/admin/users');
    return res.users;
  },

  async updateUserRole(userId: string, role: UserRole): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw new Error(formatSupabaseError(error.message));
      return data as UserProfile;
    }

    const res = await apiFetch<{ user: UserProfile }>(`/api/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
    return res.user;
  },
};

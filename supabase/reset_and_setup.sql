-- ============================================================================
-- ChikiSel E-Commerce — Clean Reset & Setup Script (Supabase)
-- Jalankan script ini di Supabase Dashboard -> SQL Editor jika sebelumnya
-- sudah ada tabel lama (profiles/products/orders) dengan struktur/RLS berbeda.
-- ============================================================================

-- 1. Hapus tabel & trigger lama agar struktur dan RLS benar-benar bersih
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. PROFILES TABLE (terhubung ke auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  postal_code TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Chiki & Puffs', 'Chips & Savory', 'Sweet Snacks', 'Drinks & Milk')),
  description TEXT NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  weight TEXT NOT NULL DEFAULT '75g',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_url TEXT NOT NULL,
  flavor_notes TEXT NOT NULL DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  postal_code TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('COD', 'QRIS')),
  notes TEXT NOT NULL DEFAULT '',
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ORDER ITEMS TABLE
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT NOT NULL,
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  subtotal INTEGER NOT NULL CHECK (subtotal >= 0)
);

-- ============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER agar bebas infinite recursion RLS)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sinkronkan akun yang sudah terlanjur terdaftar di auth.users ke public.profiles
INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  id,
  COALESCE(email, ''),
  COALESCE(raw_user_meta_data->>'full_name', split_part(COALESCE(email, 'user'), '@', 1)),
  'user'
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id AND role = 'user');

CREATE POLICY "Users can update own profile without changing role"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = public.current_user_role()
  );

CREATE POLICY "Admins can update any profile role"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- Products
CREATE POLICY "Anyone can view products"
  ON public.products FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can insert products"
  ON public.products FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update products"
  ON public.products FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete products"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- Orders
CREATE POLICY "Users can read own orders and admins read all"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Authenticated users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update order status"
  ON public.orders FOR UPDATE
  USING (public.is_admin());

-- Order Items
CREATE POLICY "Users can read own order items and admins read all"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Users can insert items into their own orders"
  ON public.order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================================================
-- SEED DATA: 12 PRODUK CHIKISEL (GAMBAR & HARGA PASARAN INDONESIA)
-- ============================================================================

INSERT INTO public.products (name, slug, category, description, price, weight, stock, image_url, flavor_notes, is_featured)
VALUES
  (
    'Garuda Crunchy O''Corn Sea Salt',
    'garuda-crunchy-ocorn-sea-salt',
    'Chiki & Puffs',
    'Light and airy crunchy corn puffs seasoned with crisp sea salt. Classic chiki texture that stays crunchy for movie nights and study breaks.',
    8000,
    '75g',
    40,
    '/assets/aistudio/WhatsApp_Imag_2026-11-17_at_13.09.59_64a9d300.jpeg',
    'Savory sea salt, toasted corn, airy crunch',
    TRUE
  ),
  (
    'Kusuka Keripik Singkong Original',
    'kusuka-keripik-singkong-original',
    'Chips & Savory',
    'Thinly sliced Indonesian cassava chips fried golden and lightly salted for a clean, satisfyingly crisp local snack.',
    17500,
    '180g',
    35,
    '/assets/aistudio/WhatsApp_Imge_2026-11-17_at_13.09.59_706b40cd.jpeg',
    'Natural cassava, light sea salt, thin crunch',
    FALSE
  ),
  (
    'Doritos Roasted Corn',
    'doritos-roasted-corn',
    'Chips & Savory',
    'Bold triangular tortilla chips coated in sweet-savory Indonesian jagung bakar (roasted corn) seasoning.',
    19500,
    '160g',
    28,
    '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.09.59_66dac5c6.jpeg',
    'Smoky roasted corn, buttery spice, crisp tortilla',
    TRUE
  ),
  (
    'Chitato Lite Rumput Laut',
    'chitato-lite-rumput-laut',
    'Chips & Savory',
    'Wafer-thin flat potato chips dusted with umami nori seaweed seasoning. Light, crisp, and easy to snack on all afternoon.',
    11500,
    '55g',
    44,
    '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.09.58_651d355d.jpeg',
    'Savory nori seaweed, thin potato slice, umami',
    TRUE
  ),
  (
    'Nescafe Cappuccino Can',
    'nescafe-cappuccino-can',
    'Drinks & Milk',
    'Ready-to-drink chilled cappuccino crafted with smooth espresso and creamy milk foam in a sleek grab-and-go can.',
    8500,
    '220ml',
    50,
    '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.11.09__1__bcfdc7c2.jpeg',
    'Smooth espresso, creamy milk foam, lightly sweet',
    FALSE
  ),
  (
    'Oatside Oat Milk Chocolate',
    'oatside-oat-milk-chocolate',
    'Drinks & Milk',
    'Rich plant-based roasted oat milk blended with dark cacao. Creamy, dairy-free, and pairs effortlessly with sweet or salty snacks.',
    9500,
    '200ml',
    36,
    '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.11.09_4dde3e8e.jpeg',
    'Velvety dark chocolate, roasted oats, creamy',
    TRUE
  ),
  (
    'Nutriboost Milk Strawberry',
    'nutriboost-milk-strawberry',
    'Drinks & Milk',
    'Refreshing blend of fresh milk and sweet strawberry juice enriched with vitamins B3, B6, E, and zinc.',
    7500,
    '300ml',
    48,
    '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.11.10__1__1546fcd8.jpeg',
    'Sweet strawberry, smooth milk, fruity finish',
    TRUE
  ),
  (
    'Good Day Originalé Cappuccino',
    'good-day-originale-cappuccino',
    'Drinks & Milk',
    'Chilled bottled cappuccino coffee with balanced sweetness and rich roasted coffee aroma for busy campus or study days.',
    7000,
    '250ml',
    42,
    '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.11.10_bb9ccb17.jpeg',
    'Creamy coffee, subtle caramel, chilled delight',
    FALSE
  ),
  (
    'Nabati SiiP Richeese Bite Size',
    'nabati-siip-richeese-bite-size',
    'Chiki & Puffs',
    'Crunchy bite-sized extruded corn snacks generously coated in signature Nabati Richeese cheddar cheese powder.',
    5500,
    '50g',
    60,
    '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.10.00_2b98f803.jpeg',
    'Rich cheddar cheese, airy bite, sweet-savory',
    TRUE
  ),
  (
    'Oishi Chocolate Popcorn',
    'oishi-chocolate-popcorn',
    'Sweet Snacks',
    'Crisp caramel-glazed popcorn kernels wrapped in smooth dark chocolate coating for the ultimate sweet movie-night treat.',
    13500,
    '100g',
    32,
    '/assets/aistudio/WhatsApp_Ige_2026-11-17_at_13.10.00_26e0537c.jpeg',
    'Sweet cocoa glaze, crisp popcorn, rich aroma',
    TRUE
  ),
  (
    'Tic Tic Crunchy Stick Bawang',
    'tic-tic-crunchy-stick-bawang',
    'Chiki & Puffs',
    'Iconic crunchy potato-and-wheat snack sticks seasoned with savory Indonesian garlic (bawang asli) spice.',
    7500,
    '70g',
    55,
    '/assets/aistudio/WhatsApp_Image_2026-11-17_at_13.10.01_1198f666.jpeg',
    'Savory garlic, crisp stick crunch, addictive',
    FALSE
  ),
  (
    'Taro Net Potato BBQ',
    'taro-net-potato-bbq',
    'Chiki & Puffs',
    'Beloved crispy net-shaped potato puffs with smoky-sweet barbecue seasoning—everyone''s favorite nostalgic Indonesian chiki.',
    9000,
    '70g',
    46,
    '/assets/aistudio/WhatsAp_Image_2026-11-17_at_13.10.00_3fc2fd98.jpeg',
    'Smoky BBQ, airy net crunch, nostalgic',
    TRUE
  );

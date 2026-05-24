import { randomUUID } from 'crypto';
import {
  createRouter,
  String,
  Boolean,
  Optional,
  Int,
  Positive,
  Array as Arr,
  createSchema,
} from '../../src/index';
import { authRequired, adminRequired } from '../middleware/auth';
import { requestLogger } from '../middleware/requestLogger';
import { NotFoundError } from '../lib/errors';
import { parsePagination, paginate } from '../lib/pagination';
import { Store } from '../lib/store';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  stock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const productStore = new Store<Product>();

const createProductSchema = createSchema({
  name: String(),
  description: Optional(String()),
  price: Positive(),
  category: String(),
  tags: Optional(Arr(String())),
  stock: Optional(Int(0)),
  active: Optional(Boolean()),
});

const updateProductSchema = createSchema({
  name: Optional(String()),
  description: Optional(String()),
  price: Optional(Positive()),
  category: Optional(String()),
  tags: Optional(Arr(String())),
  stock: Optional(Int(0)),
  active: Optional(Boolean()),
});

const updateStockSchema = createSchema({
  stock: Int(0),
});

const listProductsQuery = createSchema({
  page: Optional(String()),
  limit: Optional(String()),
  sort: Optional(String()),
  order: Optional(String()),
  category: Optional(String()),
  active: Optional(String()),
  search: Optional(String()),
});

const router = createRouter({
  info: { title: 'Products API', version: '1.0.0' },
});

router.get(
  '/',
  {
    query: listProductsQuery,
    meta: {
      summary: 'List all products',
      tags: ['products'],
      responses: { '200': { description: 'Paginated list of products' } },
    },
  },
  (req, res) => {
    const pag = parsePagination(req.query as any);
    let products = productStore.all();
    const { category, active, search } = req.query as any;

    if (active !== undefined) {
      products = products.filter(p => p.active === (active === 'true'));
    }
    if (category) {
      products = products.filter(p => p.category === category);
    }
    if (search) {
      const q = String(search).toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    const categories = [...new Set(productStore.all().map(p => p.category))];

    const result = paginate(products, pag, 'createdAt' as any);
    res.json({ ...result, categories });
  }
);

router.get(
  '/:id',
  {
    params: createSchema({ id: String() }),
    meta: {
      summary: 'Get product by ID',
      tags: ['products'],
      responses: {
        '200': { description: 'Product found' },
        '404': { description: 'Product not found' },
      },
    },
  },
  (req, res) => {
    const product = productStore.find(req.params.id);
    if (!product) throw new NotFoundError('Product', req.params.id);
    res.json(product);
  }
);

router.post(
  '/',
  {
    before: [authRequired, adminRequired],
    after: [requestLogger],
    body: createProductSchema,
    meta: {
      summary: 'Create a product (admin)',
      tags: ['products'],
      responses: {
        '201': { description: 'Product created' },
        '401': { description: 'Authentication required' },
        '403': { description: 'Admin only' },
      },
    },
  },
  (req, res) => {
    const now = new Date().toISOString();
    const product = productStore.create({
      id: randomUUID(),
      name: req.body.name,
      description: req.body.description || '',
      price: req.body.price,
      category: req.body.category,
      tags: req.body.tags || [],
      stock: req.body.stock ?? 0,
      active: req.body.active ?? true,
      createdAt: now,
      updatedAt: now,
    });
    res.status(201).json(product);
  }
);

router.put(
  '/:id',
  {
    before: [authRequired, adminRequired],
    after: [requestLogger],
    params: createSchema({ id: String() }),
    body: updateProductSchema,
    meta: {
      summary: 'Update a product (admin)',
      tags: ['products'],
      responses: {
        '200': { description: 'Product updated' },
        '404': { description: 'Product not found' },
      },
    },
  },
  (req, res) => {
    const updated = productStore.update(req.params.id, {
      ...req.body,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw new NotFoundError('Product', req.params.id);
    res.json(updated);
  }
);

router.patch(
  '/:id/stock',
  {
    before: [authRequired, adminRequired],
    after: [requestLogger],
    params: createSchema({ id: String() }),
    body: updateStockSchema,
    meta: {
      summary: 'Update product stock (admin)',
      tags: ['products'],
      responses: {
        '200': { description: 'Stock updated' },
        '404': { description: 'Product not found' },
      },
    },
  },
  (req, res) => {
    const updated = productStore.update(req.params.id, {
      stock: req.body.stock,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw new NotFoundError('Product', req.params.id);
    res.json(updated);
  }
);

router.delete(
  '/:id',
  {
    before: [authRequired, adminRequired],
    after: [requestLogger],
    params: createSchema({ id: String() }),
    meta: {
      summary: 'Delete a product (admin)',
      tags: ['products'],
      responses: {
        '204': { description: 'Product deleted' },
        '404': { description: 'Product not found' },
      },
    },
  },
  (req, res) => {
    const deleted = productStore.delete(req.params.id);
    if (!deleted) throw new NotFoundError('Product', req.params.id);
    res.status(204).send();
  }
);

export default router;

import { randomUUID } from 'crypto';
import {
  createRouter,
  String,
  Positive,
  Optional,
  Literal,
  Union,
  Array,
  Obj,
  createSchema,
} from '../../src/index';
import { authRequired, adminRequired } from '../middleware/auth';
import { requestLogger } from '../middleware/requestLogger';
import { NotFoundError, ForbiddenError } from '../lib/errors';
import { parsePagination, paginate } from '../lib/pagination';
import { Store } from '../lib/store';
import { productStore } from './products';

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface ShippingAddress {
  street: string;
  city: string;
  zip: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  shippingAddress: ShippingAddress;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export const orderStore = new Store<Order>();

const createOrderSchema = createSchema({
  items: Array(Obj({
    productId: String(),
    quantity: Positive(),
  })),
  shippingAddress: {
    street: String(),
    city: String(),
    zip: String(),
    country: String(),
  },
  notes: Optional(String()),
});

const updateStatusSchema = createSchema({
  status: Union([
    Literal('confirmed'),
    Literal('shipped'),
    Literal('delivered'),
    Literal('cancelled'),
  ]),
});

const listOrdersQuery = createSchema({
  page: Optional(String()),
  limit: Optional(String()),
  sort: Optional(String()),
  order: Optional(String()),
  status: Optional(String()),
});

const router = createRouter({
  info: { title: 'Orders API', version: '1.0.0' },
});

router.get(
  '/',
  {
    before: [authRequired],
    after: [requestLogger],
    query: listOrdersQuery,
    meta: {
      summary: 'List my orders',
      tags: ['orders'],
      responses: { '200': { description: 'Paginated list of orders' } },
    },
  },
  (req, res) => {
    const pag = parsePagination(req.query as any);
    let orders = orderStore.findWhere(o => o.userId === req.user!.sub);
    const { status } = req.query as any;
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    const result = paginate(orders, pag, 'createdAt' as any);
    res.json(result);
  }
);

router.get(
  '/:id',
  {
    before: [authRequired],
    after: [requestLogger],
    params: createSchema({ id: String() }),
    meta: {
      summary: 'Get order by ID',
      tags: ['orders'],
      responses: {
        '200': { description: 'Order found' },
        '404': { description: 'Order not found' },
      },
    },
  },
  (req, res) => {
    const order = orderStore.find(req.params.id);
    if (!order) throw new NotFoundError('Order', req.params.id);
    if (order.userId !== req.user!.sub && req.user!.role !== 'admin') {
      throw new ForbiddenError();
    }
    res.json(order);
  }
);

router.post(
  '/',
  {
    before: [authRequired],
    after: [requestLogger],
    body: createOrderSchema,
    meta: {
      summary: 'Create a new order',
      tags: ['orders'],
      responses: {
        '201': { description: 'Order created' },
        '400': { description: 'Validation error or insufficient stock' },
      },
    },
  },
  (req, res) => {
    const items: OrderItem[] = [];
    for (const item of req.body.items) {
      const product = productStore.find(item.productId);
      if (!product) throw new NotFoundError('Product', item.productId);
      if (product.stock < item.quantity) {
        throw new NotFoundError(`Insufficient stock for '${product.name}' (available: ${product.stock})`);
      }
      productStore.update(product.id, { stock: product.stock - item.quantity });
      items.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.price,
      });
    }

    const total = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const now = new Date().toISOString();

    const order = orderStore.create({
      id: randomUUID(),
      userId: req.user!.sub,
      status: 'pending',
      items,
      total: Math.round(total * 100) / 100,
      shippingAddress: req.body.shippingAddress,
      notes: req.body.notes || '',
      createdAt: now,
      updatedAt: now,
    });

    res.status(201).json(order);
  }
);

router.patch(
  '/:id/status',
  {
    before: [authRequired, adminRequired],
    after: [requestLogger],
    params: createSchema({ id: String() }),
    body: updateStatusSchema,
    meta: {
      summary: 'Update order status (admin)',
      tags: ['orders'],
      responses: {
        '200': { description: 'Order status updated' },
        '404': { description: 'Order not found' },
      },
    },
  },
  (req, res) => {
    const order = orderStore.find(req.params.id);
    if (!order) throw new NotFoundError('Order', req.params.id);

    const updated = orderStore.update(req.params.id, {
      status: req.body.status,
      updatedAt: new Date().toISOString(),
    });
    res.json(updated);
  }
);

router.delete(
  '/:id',
  {
    before: [authRequired],
    after: [requestLogger],
    params: createSchema({ id: String() }),
    meta: {
      summary: 'Cancel my order',
      tags: ['orders'],
      responses: {
        '204': { description: 'Order cancelled' },
        '404': { description: 'Order not found' },
      },
    },
  },
  (req, res) => {
    const order = orderStore.find(req.params.id);
    if (!order) throw new NotFoundError('Order', req.params.id);
    if (order.userId !== req.user!.sub) throw new ForbiddenError();

    orderStore.update(req.params.id, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });

    for (const item of order.items) {
      const product = productStore.find(item.productId);
      if (product) {
        productStore.update(product.id, { stock: product.stock + item.quantity });
      }
    }

    res.status(204).send();
  }
);

export default router;

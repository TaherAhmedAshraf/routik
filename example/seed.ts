import { User, userStore } from './routes/auth';
import { Product, productStore } from './routes/products';
import { Order, orderStore } from './routes/orders';
import { hashPassword } from './lib/auth';
import { randomUUID } from 'crypto';

export function seed(): void {
  const now = new Date().toISOString();

  const admin = userStore.create({
    id: randomUUID(),
    email: 'admin@example.com',
    name: 'Admin User',
    passwordHash: hashPassword('admin123'),
    role: 'admin',
    createdAt: now,
    updatedAt: now,
  });

  const alice = userStore.create({
    id: randomUUID(),
    email: 'alice@example.com',
    name: 'Alice Johnson',
    passwordHash: hashPassword('password123'),
    role: 'customer',
    createdAt: now,
    updatedAt: now,
  });

  const bob = userStore.create({
    id: randomUUID(),
    email: 'bob@example.com',
    name: 'Bob Smith',
    passwordHash: hashPassword('password123'),
    role: 'customer',
    createdAt: now,
    updatedAt: now,
  });

  const laptop = productStore.create({
    id: randomUUID(),
    name: 'Gaming Laptop',
    description: 'High-performance laptop with RTX 4070',
    price: 1499.99,
    category: 'Electronics',
    tags: ['gaming', 'laptop'],
    stock: 15,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  const phone = productStore.create({
    id: randomUUID(),
    name: 'ProPhone 15',
    description: 'Latest smartphone with 128GB storage',
    price: 999.99,
    category: 'Electronics',
    tags: ['phone', 'mobile'],
    stock: 30,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  const headphones = productStore.create({
    id: randomUUID(),
    name: 'Noise Cancelling Headphones',
    description: 'Wireless headphones with ANC',
    price: 349.99,
    category: 'Audio',
    tags: ['wireless', 'audio'],
    stock: 50,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  const tshirt = productStore.create({
    id: randomUUID(),
    name: 'Cotton T-Shirt',
    description: 'Comfortable 100% cotton t-shirt',
    price: 29.99,
    category: 'Clothing',
    tags: ['cotton', 'casual'],
    stock: 200,
    active: true,
    createdAt: now,
    updatedAt: now,
  });

  const monitor = productStore.create({
    id: randomUUID(),
    name: '4K Monitor 27"',
    description: 'Ultra HD monitor for productivity',
    price: 599.99,
    category: 'Electronics',
    tags: ['monitor', '4k'],
    stock: 0,
    active: false,
    createdAt: now,
    updatedAt: now,
  });

  orderStore.create({
    id: randomUUID(),
    userId: alice.id,
    status: 'delivered',
    items: [
      { productId: laptop.id, productName: laptop.name, quantity: 1, unitPrice: laptop.price },
      { productId: headphones.id, productName: headphones.name, quantity: 1, unitPrice: headphones.price },
    ],
    total: 1849.98,
    shippingAddress: { street: '123 Main St', city: 'New York', zip: '10001', country: 'USA' },
    notes: 'Leave at the door',
    createdAt: now,
    updatedAt: now,
  });

  orderStore.create({
    id: randomUUID(),
    userId: bob.id,
    status: 'pending',
    items: [
      { productId: phone.id, productName: phone.name, quantity: 2, unitPrice: phone.price },
    ],
    total: 1999.98,
    shippingAddress: { street: '456 Oak Ave', city: 'Los Angeles', zip: '90001', country: 'USA' },
    notes: '',
    createdAt: now,
    updatedAt: now,
  });

  console.log('  ✓ Seeded: admin (admin@example.com / admin123)');
  console.log('  ✓ Seeded: alice (alice@example.com / password123)');
  console.log('  ✓ Seeded: bob (bob@example.com / password123)');
  console.log('  ✓ Seeded: 5 products, 2 orders');
}

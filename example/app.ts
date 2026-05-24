import express from "express";
import cors from "cors";
import helmet from "helmet";
import { createRouter } from "../src/index";
import { seed } from "./seed";
import { requestLogger } from "./middleware/requestLogger";
import { errorHandler } from "./middleware/errorHandler";
import authRouter from "./routes/auth";
import usersRouter from "./routes/users";
import productsRouter from "./routes/products";
import ordersRouter from "./routes/orders";

const PORT = parseInt(process.env.PORT || "3000", 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const app = express();

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(requestLogger);

const apiRouter = createRouter({
  info: {
    title: "Enterprise E-Commerce API",
    version: "1.0.0",
    description:
      "Production-grade API demonstrating routik with auth, RBAC, pagination, nested schemas, before/after hooks, sub-routers, and auto-generated OpenAPI docs.",
  },
  servers: [{ url: `http://localhost:${PORT}`, description: "Development" }],
  securitySchemes: [
    {
      id: "bearerAuth",
      type: "http",
      scheme: "bearer",
    },
  ],
});

app.use("/auth", authRouter.getRouter());
apiRouter.use("/users", usersRouter);
apiRouter.use("/products", productsRouter);
apiRouter.use("/orders", ordersRouter);

app.use(apiRouter.getRouter());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/spec", (_req, res) => {
  res.json(apiRouter.getSpec());
});

apiRouter.mountDocs("/docs", app);

app.use(errorHandler);

seed();

app.listen(PORT, () => {
  console.log(`\n  🚀  Server running on http://localhost:${PORT}`);
  console.log(`  📖  API Docs at http://localhost:${PORT}/docs`);
  console.log(`  📋  Spec at http://localhost:${PORT}/spec`);
  console.log(`\n  ┌──────────────────────────────────────────────────────┐`);
  console.log(`  │  Endpoints                                          │`);
  console.log(`  ├──────────────────────────────────────────────────────┤`);
  console.log(`  │  POST /auth/register          Register user         │`);
  console.log(`  │  POST /auth/login              Login                 │`);
  console.log(`  │  GET  /auth/me                 My profile     🔐    │`);
  console.log(`  │                                                      │`);
  console.log(`  │  GET  /users                   List users     🔐👑  │`);
  console.log(`  │  GET  /users/:id               Get user       🔐👑  │`);
  console.log(`  │  PATCH /users/:id              Update user    🔐👑  │`);
  console.log(`  │  DELETE /users/:id             Delete user    🔐👑  │`);
  console.log(`  │                                                      │`);
  console.log(`  │  GET  /products                List products         │`);
  console.log(`  │  GET  /products/:id            Get product           │`);
  console.log(`  │  POST /products                Create product 🔐👑  │`);
  console.log(`  │  PUT  /products/:id            Update product 🔐👑  │`);
  console.log(`  │  PATCH /products/:id/stock     Update stock   🔐👑  │`);
  console.log(`  │  DELETE /products/:id          Delete product 🔐👑  │`);
  console.log(`  │                                                      │`);
  console.log(`  │  GET  /orders                  My orders       🔐   │`);
  console.log(`  │  POST /orders                  Create order    🔐   │`);
  console.log(`  │  GET  /orders/:id              Get order       🔐   │`);
  console.log(`  │  PATCH /orders/:id/status      Update status  🔐👑  │`);
  console.log(`  │  DELETE /orders/:id            Cancel order    🔐   │`);
  console.log(`  │                                                      │`);
  console.log(`  │  GET  /health                  Health check          │`);
  console.log(`  │  GET  /spec                    Raw OpenAPI spec      │`);
  console.log(`  └──────────────────────────────────────────────────────┘`);
  console.log(`\n  🔐 = Auth required   👑 = Admin only`);
  console.log(`\n  Test accounts:`);
  console.log(`    admin:  admin@example.com / admin123`);
  console.log(`    alice:  alice@example.com / password123`);
  console.log(`    bob:    bob@example.com / password123\n`);
});

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// ─── Built-in Olist-style dataset ────────────────────────────────────────────
function getBuiltinData() {
  const CITIES = [
    "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre",
    "Salvador", "Fortaleza", "Manaus", "Recife", "Goiânia", "Florianópolis",
    "Vitória", "Natal", "Campo Grande", "Teresina", "Maceió", "João Pessoa",
    "Aracaju", "Porto Velho", "Macapá",
  ];
  const STATES = [
    "SP", "RJ", "MG", "PR", "RS", "BA", "CE", "AM", "PE", "GO",
    "SC", "ES", "RN", "MS", "PI", "AL", "PB", "SE", "RO", "AP",
  ];
  const CATEGORIES_PT = [
    "cama_mesa_banho", "beleza_saude", "esporte_lazer", "informatica_acessorios",
    "moveis_decoracao", "utilidades_domesticas", "relogios_presentes", "telefonia",
    "automotivo", "brinquedos", "ferramentas_jardim", "perfumaria", "livros_tecnicos",
    "eletronicos", "fashion_bolsas_e_acessorios", "construcao_ferramentas_construcao",
    "papelaria", "pet_shop", "alimentos_bebidas", "casa_construcao",
  ];
  const CATEGORIES_EN: Record<string, string> = {
    cama_mesa_banho: "Bed, Bath & Table",
    beleza_saude: "Health & Beauty",
    esporte_lazer: "Sports & Leisure",
    informatica_acessorios: "Computers & Accessories",
    moveis_decoracao: "Furniture & Decor",
    utilidades_domesticas: "Home Appliances",
    relogios_presentes: "Watches & Gifts",
    telefonia: "Phones",
    automotivo: "Automotive",
    brinquedos: "Toys",
    ferramentas_jardim: "Garden Tools",
    perfumaria: "Perfumery",
    livros_tecnicos: "Technical Books",
    eletronicos: "Electronics",
    fashion_bolsas_e_acessorios: "Fashion Bags & Accessories",
    construcao_ferramentas_construcao: "Construction Tools",
    papelaria: "Stationery",
    pet_shop: "Pet Shop",
    alimentos_bebidas: "Food & Drinks",
    casa_construcao: "Home & Construction",
  };
  const PAYMENT_TYPES = [
    "credit_card", "credit_card", "credit_card", "credit_card",
    "boleto", "boleto", "debit_card", "voucher",
  ];
  const ORDER_STATUSES = [
    "delivered", "delivered", "delivered", "delivered", "delivered",
    "shipped", "processing", "canceled", "invoiced", "approved",
  ];

  // ── 500 customers ──────────────────────────────────────────────────────────
  const customers = Array.from({ length: 500 }, (_, i) => ({
    customer_id: `CUST-${String(i).padStart(5, "0")}`,
    customer_unique_id: `UNIQ-${String(i * 7 + 13).padStart(6, "0")}`,
    customer_zip_code_prefix: String(10001 + (i * 317) % 89998).padStart(5, "0"),
    customer_city: CITIES[i % CITIES.length],
    customer_state: STATES[i % STATES.length],
  }));

  // ── 200 products ───────────────────────────────────────────────────────────
  const products = Array.from({ length: 200 }, (_, i) => ({
    product_id: `PROD-${String(i).padStart(5, "0")}`,
    product_category_name: CATEGORIES_PT[i % CATEGORIES_PT.length],
    product_weight_g: String(100 + (i * 137) % 15000),
    product_length_cm: String(10 + (i * 11) % 80),
    product_height_cm: String(5 + (i * 7) % 50),
    product_width_cm: String(8 + (i * 13) % 60),
  }));

  const translations = CATEGORIES_PT.map((pt) => ({
    product_category_name: pt,
    product_category_name_english: CATEGORIES_EN[pt] ?? pt,
  }));

  // Prices per product (realistic BRL range)
  const productPrices = products.map((_, i) =>
    parseFloat((19.9 + ((i * 97 + 31) % 2480)).toFixed(2))
  );

  // ── 600 orders with items and payments ────────────────────────────────────
  const orders: any[] = [];
  const orderItems: any[] = [];
  const payments: any[] = [];

  for (let o = 0; o < 600; o++) {
    const orderId = `ORD-${String(o).padStart(5, "0")}`;
    const custIdx = (o * 7 + 3) % customers.length;
    const status = ORDER_STATUSES[o % ORDER_STATUSES.length];
    const numItems = ((o * 3 + 1) % 4) + 1; // 1–4 items per order
    const daysAgo = (o * 2) % 365;
    const purchaseDate = new Date(Date.now() - daysAgo * 86400000).toISOString();

    orders.push({
      order_id: orderId,
      customer_id: customers[custIdx].customer_id,
      order_status: status,
      order_purchase_timestamp: purchaseDate,
    });

    let orderTotal = 0;
    for (let it = 0; it < numItems; it++) {
      const prodIdx = ((o * 5) + it * 11) % products.length;
      const price = productPrices[prodIdx];
      const freight = parseFloat((5.9 + (prodIdx % 40)).toFixed(2));
      orderTotal += price + freight;
      orderItems.push({
        order_id: orderId,
        order_item_id: String(it + 1),
        product_id: products[prodIdx].product_id,
        price: String(price),
        freight_value: String(freight),
      });
    }

    payments.push({
      order_id: orderId,
      payment_sequential: "1",
      payment_type: PAYMENT_TYPES[o % PAYMENT_TYPES.length],
      payment_installments: String(1 + (o % 12)),
      payment_value: String(parseFloat(orderTotal.toFixed(2))),
    });
  }

  // ── Inject 10 anomalous orders ─────────────────────────────────────────────
  // Large-value orders (fraud candidates)
  for (let a = 0; a < 5; a++) {
    const orderId = `ORD-ANOM-HV-${a}`;
    orders.push({
      order_id: orderId,
      customer_id: customers[a * 3].customer_id,
      order_status: "delivered",
      order_purchase_timestamp: new Date(Date.now() - a * 3600000).toISOString(),
    });
    orderItems.push({
      order_id: orderId,
      order_item_id: "1",
      product_id: products[a].product_id,
      price: String(9500 + a * 1000), // very high price
      freight_value: "0",
    });
    payments.push({
      order_id: orderId,
      payment_type: "credit_card",
      payment_value: String(9500 + a * 1000),
    });
  }

  // Repeated failures from same customer
  for (let a = 0; a < 5; a++) {
    const orderId = `ORD-ANOM-FAIL-${a}`;
    orders.push({
      order_id: orderId,
      customer_id: customers[10].customer_id, // same customer
      order_status: "canceled",
      order_purchase_timestamp: new Date(Date.now() - a * 600000).toISOString(),
    });
    orderItems.push({
      order_id: orderId,
      order_item_id: "1",
      product_id: products[5].product_id,
      price: "299.90",
      freight_value: "15.00",
    });
    payments.push({
      order_id: orderId,
      payment_type: "credit_card",
      payment_value: "314.90",
    });
  }

  return { customers, products, translations, orders, orderItems, payments, productPrices };
}

// ─── Seed helpers ─────────────────────────────────────────────────────────────
async function seedCustomers(raw: any[]) {
  const BATCH = 50;
  const created: any[] = [];

  for (let i = 0; i < raw.length; i += BATCH) {
    const batch = raw.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((c: any, j: number) =>
        prisma.customer.create({
          data: {
            name: `${c.customer_city} Customer ${i + j + 1}`,
            email: `customer.${i + j + 1}@olist-${c.customer_state.toLowerCase()}.example.com`,
            phone: `+55-${c.customer_state === "SP" ? "11" : c.customer_state === "RJ" ? "21" : "31"}-9${String((i + j) * 7777 % 100000000).padStart(8, "0")}`,
            address: `Rua ${["das Flores", "do Comércio", "da Paz", "Brasil", "XV de Novembro"][j % 5]}, ${100 + (i + j) * 17}`,
            city: c.customer_city,
            country: "Brazil",
          },
        })
      )
    );
    created.push(...results);
    process.stdout.write(`\r   Customers: ${created.length}/${raw.length}`);
  }
  console.log();
  return created;
}

async function seedProducts(raw: any[], translations: any[], orderItems: any[]) {
  const BATCH = 50;
  const created: any[] = [];

  const translationMap = new Map(
    translations.map((t: any) => [t.product_category_name, t.product_category_name_english])
  );

  // Average real price from order items
  const priceAccum = new Map<string, { sum: number; count: number }>();
  for (const oi of orderItems) {
    const price = parseFloat(oi.price ?? "0");
    if (oi.product_id && !isNaN(price) && price > 0) {
      if (!priceAccum.has(oi.product_id)) priceAccum.set(oi.product_id, { sum: 0, count: 0 });
      const acc = priceAccum.get(oi.product_id)!;
      acc.sum += price; acc.count++;
    }
  }

  for (let i = 0; i < raw.length; i += BATCH) {
    const batch = raw.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((p: any, j: number) => {
        const catPt = p.product_category_name ?? "";
        const category = (translationMap.get(catPt) ?? catPt) || "Uncategorized";
        const acc = priceAccum.get(p.product_id);
        const price = acc
          ? parseFloat((acc.sum / acc.count).toFixed(2))
          : parseFloat((29.9 + ((i + j) * 73) % 800).toFixed(2));
        const sku = p.product_id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16).toUpperCase();

        return prisma.product.create({
          data: {
            name: `${category} — Item ${i + j + 1}`,
            description: `High-quality ${category.toLowerCase()} product from Brazilian marketplace.`,
            category,
            price,
            stock: 5 + ((i + j) * 17) % 300,
            sku,
          },
        });
      })
    );
    created.push(...results);
    process.stdout.write(`\r   Products: ${created.length}/${raw.length}`);
  }
  console.log();
  return created;
}

async function seedTransactions(
  rawOrders: any[],
  rawOrderItems: any[],
  rawPayments: any[],
  customerById: Map<string, any>,
  productById: Map<string, any>
) {
  const statusMap: Record<string, string> = {
    delivered: "completed", shipped: "pending", processing: "pending",
    invoiced: "pending", approved: "pending", canceled: "failed",
    unavailable: "failed", created: "pending",
  };
  const paymentMap: Record<string, string> = {
    credit_card: "credit_card", debit_card: "debit_card",
    boleto: "debit_card", voucher: "paypal", not_defined: "credit_card",
  };

  const paymentByOrder = new Map<string, any>();
  for (const p of rawPayments) {
    if (!paymentByOrder.has(p.order_id)) paymentByOrder.set(p.order_id, p);
  }
  const itemsByOrder = new Map<string, any[]>();
  for (const oi of rawOrderItems) {
    if (!itemsByOrder.has(oi.order_id)) itemsByOrder.set(oi.order_id, []);
    itemsByOrder.get(oi.order_id)!.push(oi);
  }

  const BATCH = 25;
  let created = 0, skipped = 0, cancelledCount = 0;
  const failedCounts = new Map<string, number>();

  for (let i = 0; i < rawOrders.length; i += BATCH) {
    const batch = rawOrders.slice(i, i + BATCH);
    for (const order of batch) {
      const customer = customerById.get(order.customer_id);
      if (!customer) { skipped++; continue; }

      const oiList = itemsByOrder.get(order.order_id) ?? [];
      const itemCreates: any[] = [];

      for (const oi of oiList) {
        const product = productById.get(oi.product_id);
        if (!product) continue;
        const price = parseFloat(oi.price ?? "0");
        const qty = Math.max(1, parseInt(oi.order_item_id ?? "1", 10));
        itemCreates.push({
          productId: product.id,
          quantity: isNaN(qty) ? 1 : qty,
          price: isNaN(price) || price <= 0 ? product.price : price,
        });
      }

      if (itemCreates.length === 0) { skipped++; continue; }

      const total = parseFloat(
        itemCreates.reduce((s: number, it: any) => s + it.price * it.quantity, 0).toFixed(2)
      );
      const payment = paymentByOrder.get(order.order_id);
      const status = statusMap[order.order_status ?? ""] ?? "pending";
      const paymentMethod = paymentMap[payment?.payment_type ?? "credit_card"] ?? "credit_card";

      await prisma.transaction.create({
        data: {
          customerId: customer.id,
          total,
          status,
          paymentMethod,
          items: { create: itemCreates },
        },
      });

      created++;
      if (status === "failed") {
        failedCounts.set(customer.id, (failedCounts.get(customer.id) ?? 0) + 1);
      }
      if (order.order_status === "canceled") cancelledCount++;
    }
    process.stdout.write(`\r   Transactions: ${created} created, ${skipped} skipped`);
  }
  console.log();
  return { created, skipped, cancelledCount, failedCounts };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding database with Olist-style E-Commerce data\n");

  // Load built-in dataset
  const { customers: rc, products: rp, translations: rt, orders: ro, orderItems: roi, payments: rpay } = getBuiltinData();
  console.log(`📦 Dataset loaded: ${rc.length} customers, ${rp.length} products, ${ro.length} orders\n`);

  // Clear DB
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.alert.deleteMany();
  console.log("🗑  Cleared existing data\n");

  // Seed
  const createdCustomers = await seedCustomers(rc);
  console.log(`✅ ${createdCustomers.length} customers\n`);
  const customerById = new Map(rc.map((c: any, i: number) => [c.customer_id, createdCustomers[i]]));

  const createdProducts = await seedProducts(rp, rt, roi);
  console.log(`✅ ${createdProducts.length} products\n`);
  const productById = new Map(rp.map((p: any, i: number) => [p.product_id, createdProducts[i]]));

  const { created: txCreated, skipped: txSkipped, cancelledCount, failedCounts } =
    await seedTransactions(ro, roi, rpay, customerById, productById);
  console.log(`✅ ${txCreated} transactions (${txSkipped} skipped)\n`);

  // Alerts
  const highValueTx = await prisma.transaction.findFirst({ orderBy: { total: "desc" } });
  if (highValueTx) {
    await prisma.alert.create({
      data: {
        type: "anomaly", severity: "high",
        title: "Unusually Large Transaction",
        message: `Transaction ${highValueTx.id} has an exceptionally high total of R$${highValueTx.total.toFixed(2)}`,
        metadata: { transactionId: highValueTx.id, amount: highValueTx.total },
      },
    });
  }

  for (const [customerId, count] of failedCounts) {
    if (count >= 2) {
      const c = await prisma.customer.findUnique({ where: { id: customerId } });
      await prisma.alert.create({
        data: {
          type: "anomaly",
          severity: count >= 4 ? "high" : "medium",
          title: "Multiple Failed Transactions",
          message: `Customer "${c?.name}" has ${count} failed/cancelled transactions — possible chargeback risk`,
          metadata: { customerId, failedCount: count },
        },
      });
    }
  }

  if (cancelledCount > 0) {
    await prisma.alert.create({
      data: {
        type: "anomaly", severity: "medium",
        title: "High Cancellation Volume",
        message: `${cancelledCount} orders were cancelled — review for patterns`,
        metadata: { cancelledCount },
      },
    });
  }

  // Low stock alert
  const lowStockProducts = await prisma.product.findMany({ where: { stock: { lt: 20 } }, take: 5 });
  for (const p of lowStockProducts) {
    await prisma.alert.create({
      data: {
        type: "inventory", severity: "low",
        title: "Low Stock Warning",
        message: `Product "${p.name}" has only ${p.stock} units remaining`,
        metadata: { productId: p.id, stock: p.stock },
      },
    });
  }

  const finalAlerts = await prisma.alert.count();

  console.log("─".repeat(44));
  console.log("✨  Seeding complete!");
  console.log(`   Customers    : ${createdCustomers.length}`);
  console.log(`   Products     : ${createdProducts.length}`);
  console.log(`   Transactions : ${txCreated}`);
  console.log(`   Alerts       : ${finalAlerts}`);
  console.log("─".repeat(44));
}

main()
  .catch((e) => {
    console.error("\n❌ Seed failed:", e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
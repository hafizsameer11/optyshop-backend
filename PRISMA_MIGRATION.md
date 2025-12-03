# Prisma Migration Guide

## ✅ Migration Complete

The backend has been migrated from Sequelize to Prisma ORM.

## What's Been Updated

### ✅ Completed
- Prisma schema created (`prisma/schema.prisma`)
- Prisma client configured (`lib/prisma.js`)
- Database config updated (`config/database.js`)
- Auth controller migrated to Prisma
- Auth middleware migrated to Prisma
- Server.js updated to use Prisma
- Package.json updated with Prisma scripts

### 🔄 Remaining Controllers to Update

The following controllers still need to be migrated from Sequelize to Prisma:
- `controllers/productController.js`
- `controllers/cartController.js`
- `controllers/orderController.js`
- `controllers/prescriptionController.js`
- `controllers/categoryController.js`
- `controllers/adminController.js`
- `controllers/simulationController.js` (no DB operations, but check)

## Migration Pattern

### Sequelize → Prisma Query Examples

#### Find One
```javascript
// Sequelize
const user = await User.findOne({ where: { email } });

// Prisma
const user = await prisma.user.findUnique({ where: { email } });
```

#### Find Many with Filters
```javascript
// Sequelize
const products = await Product.findAll({
  where: { is_active: true, price: { [Op.gte]: 100 } },
  include: [{ model: Category, as: 'category' }]
});

// Prisma
const products = await prisma.product.findMany({
  where: { 
    is_active: true, 
    price: { gte: 100 } 
  },
  include: { category: true }
});
```

#### Create
```javascript
// Sequelize
const user = await User.create({ email, password, first_name });

// Prisma
const user = await prisma.user.create({
  data: { email, password, first_name }
});
```

#### Update
```javascript
// Sequelize
await User.update({ is_active: false }, { where: { id } });

// Prisma
await prisma.user.update({
  where: { id },
  data: { is_active: false }
});
```

#### Delete
```javascript
// Sequelize
await User.destroy({ where: { id } });

// Prisma
await prisma.user.delete({ where: { id } });
```

#### Find and Count
```javascript
// Sequelize
const { count, rows } = await Product.findAndCountAll({ where, limit, offset });

// Prisma
const [products, count] = await Promise.all([
  prisma.product.findMany({ where, take: limit, skip: offset }),
  prisma.product.count({ where })
]);
```

#### Complex Queries
```javascript
// Sequelize
const products = await Product.findAll({
  where: {
    [Op.or]: [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ]
  }
});

// Prisma
const products = await prisma.product.findMany({
  where: {
    OR: [
      { name: { contains: search } },
      { description: { contains: search } }
    ]
  }
});
```

## Next Steps

1. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

2. **Create Database Migration**
   ```bash
   npm run prisma:migrate
   ```
   This will:
   - Create the database tables
   - Generate migration files
   - Apply the schema

3. **Update Remaining Controllers**
   - Follow the migration pattern above
   - Replace Sequelize queries with Prisma queries
   - Update all `require('../models')` to `require('../lib/prisma')`

4. **Test the Application**
   - Start server: `npm run dev`
   - Test all endpoints
   - Verify database operations

5. **Optional: Remove Sequelize**
   ```bash
   npm uninstall sequelize mysql2
   ```

## Prisma Commands

- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Create and apply migrations
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npx prisma migrate dev` - Create migration in development
- `npx prisma migrate deploy` - Apply migrations in production
- `npx prisma db push` - Push schema changes without migration (dev only)

## Environment Variables

Make sure your `.env` file includes:
```env
DATABASE_URL=mysql://user:password@localhost:3306/optyshop
```

## Notes

- Prisma uses `camelCase` for model names (User, Product, etc.)
- Relations use lowercase (user, product, etc.)
- Prisma doesn't have hooks like Sequelize - handle password hashing manually
- Use `select` to exclude fields instead of `attributes: { exclude: [...] }`
- Prisma uses `take`/`skip` instead of `limit`/`offset`


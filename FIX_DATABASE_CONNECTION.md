# Fix Database Connection Error

## Problem
```
Error: P1000: Authentication failed against database server, 
the provided database credentials for `root` are not valid.
```

## Solution

### Option 1: Use the Update Script (Recommended)

Run the interactive script to update your DATABASE_URL:

```bash
npm run update-db-url
```

This will prompt you for:
- MySQL Username (default: root)
- MySQL Password (press Enter if no password)
- MySQL Host (default: localhost)
- MySQL Port (default: 3306)
- Database Name (default: optyshop)

### Option 2: Manually Edit .env

1. Open `.env` file
2. Find the `DATABASE_URL` line
3. Update it with your MySQL credentials:

**If you have a password:**
```env
DATABASE_URL=mysql://root:your_actual_password@localhost:3306/optyshop
```

**If you DON'T have a password:**
```env
DATABASE_URL=mysql://root@localhost:3306/optyshop
```

**If password has special characters:**
Special characters in passwords need to be URL-encoded:
- `@` becomes `%40`
- `#` becomes `%23`
- `$` becomes `%24`
- `%` becomes `%25`
- `&` becomes `%26`
- etc.

Or use the update script which handles this automatically.

### Option 3: Quick Fix for No Password

If your MySQL root user has no password, update `.env`:

```env
DATABASE_URL=mysql://root@localhost:3306/optyshop
```

## Verify Database Exists

Make sure the database exists in MySQL:

```sql
-- Connect to MySQL
mysql -u root -p

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS optyshop;

-- Verify
SHOW DATABASES;
```

## Test Connection

After updating DATABASE_URL, test the connection:

```bash
# Generate Prisma Client
npm run prisma:generate

# Try to connect (this will show if credentials work)
npx prisma db pull
```

Or run migrations:

```bash
npm run prisma:migrate
```

## Common Issues

### Issue: "Access denied for user"
- **Solution**: Check username and password are correct
- Verify MySQL user exists: `SELECT user FROM mysql.user;`

### Issue: "Unknown database 'optyshop'"
- **Solution**: Create the database:
  ```sql
  CREATE DATABASE optyshop;
  ```

### Issue: "Can't connect to MySQL server"
- **Solution**: 
  - Check MySQL is running: `mysql -u root -p`
  - Verify host and port are correct
  - Check firewall settings

### Issue: Password with special characters
- **Solution**: Use the update script or URL-encode the password manually

## Example DATABASE_URL Formats

```env
# No password
DATABASE_URL=mysql://root@localhost:3306/optyshop

# With password
DATABASE_URL=mysql://root:mypassword@localhost:3306/optyshop

# Different user
DATABASE_URL=mysql://myuser:mypassword@localhost:3306/optyshop

# Remote server
DATABASE_URL=mysql://user:password@192.168.1.100:3306/optyshop

# With special characters in password (URL encoded)
DATABASE_URL=mysql://root:p%40ssw%23rd@localhost:3306/optyshop
```

## After Fixing

Once DATABASE_URL is correct:

1. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

2. **Create Migration:**
   ```bash
   npm run prisma:migrate
   ```

3. **Start Server:**
   ```bash
   npm run dev
   ```

---

**Quick Command**: `npm run update-db-url` to fix it interactively!


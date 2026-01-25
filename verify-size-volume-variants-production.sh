#!/bin/bash

# Quick Production Verification Script
# Verifies Size/Volume Variants feature is working in production

echo "🔍 Verifying Size/Volume Variants in Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Database Table
echo -n "📊 Checking product_size_volumes table... "
if npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "DESCRIBE product_size_volumes;" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ EXISTS${NC}"
else
    echo -e "${RED}❌ MISSING${NC}"
    echo "💡 Run: ./deploy-size-volume-variants-production.sh"
    exit 1
fi

# Test 2: Table Structure
echo -n "🏗️  Verifying table structure... "
REQUIRED_COLUMNS="id product_id size_volume price stock_quantity is_active"
for col in $REQUIRED_COLUMNS; do
    if ! npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "DESCRIBE product_size_volumes;" | grep -q "$col"; then
        echo -e "${RED}❌ COLUMN '$col' MISSING${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✅ CORRECT${NC}"

# Test 3: Indexes
echo -n "🔍 Checking indexes... "
if npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "SHOW INDEX FROM product_size_volumes;" | grep -q "product_id"; then
    echo -e "${GREEN}✅ EXISTS${NC}"
else
    echo -e "${YELLOW}⚠️  MISSING INDEXES${NC}"
fi

# Test 4: Foreign Key
echo -n "🔗 Checking foreign key... "
if npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'product_size_volumes' AND CONSTRAINT_NAME = 'product_size_volumes_product_id_fkey';" | grep -q "product_size_volumes_product_id_fkey"; then
    echo -e "${GREEN}✅ EXISTS${NC}"
else
    echo -e "${YELLOW}⚠️  MISSING FOREIGN KEY${NC}"
fi

# Test 5: API Endpoint (if server is running)
echo -n "🌐 Testing API endpoint... "
if curl -s "http://localhost:5000/api/products" | head -1 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ RESPONDING${NC}"
else
    echo -e "${YELLOW}⚠️  SERVER NOT RUNNING${NC}"
fi

# Test 6: Sample Data
echo -n "📊 Checking sample data... "
RECORD_COUNT=$(npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "SELECT COUNT(*) as count FROM product_size_volumes;" 2>/dev/null | tail -1)
echo -e "${GREEN}✅ $RECORD_COUNT records${NC}"

echo ""
echo "🎉 Size/Volume Variants verification completed!"
echo ""
echo "📋 Summary:"
echo "   • Database table: ✅"
echo "   • Table structure: ✅"
echo "   • Indexes: $(npx prisma db execute --stdin --schema=prisma/schema.prisma <<< "SHOW INDEX FROM product_size_volumes;" | wc -l) found"
echo "   • Records: $RECORD_COUNT"
echo ""
echo "🚀 Feature is ready for production use!"

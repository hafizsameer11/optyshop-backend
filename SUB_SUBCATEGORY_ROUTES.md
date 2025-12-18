# Sub-Subcategory Routes & Responses

## Public Routes

### 1. Get Sub-Subcategories by Parent ID
**Route:** `GET /api/subcategories/by-parent/:parent_id`  
**Access:** Public  
**Description:** Get all sub-subcategories (children) of a specific parent subcategory

**Request:**
```
GET /api/subcategories/by-parent/5
```

**Response:**
```json
{
  "success": true,
  "message": "Sub-subcategories retrieved successfully",
  "data": {
    "parentSubcategory": {
      "id": 5,
      "name": "Giornaliere",
      "slug": "giornaliere",
      "category": {
        "id": 1,
        "name": "Contact Lenses",
        "slug": "contact-lenses"
      },
      "parent_id": null
    },
    "subcategories": [
      {
        "id": 10,
        "name": "Sferiche",
        "slug": "sferiche",
        "category_id": 1,
        "parent_id": 5,
        "image": "https://example.com/image.jpg",
        "description": "Spherical contact lenses",
        "is_active": true,
        "sort_order": 1,
        "category": {
          "id": 1,
          "name": "Contact Lenses",
          "slug": "contact-lenses"
        }
      },
      {
        "id": 11,
        "name": "Astigmatismo",
        "slug": "astigmatismo",
        "category_id": 1,
        "parent_id": 5,
        "image": "https://example.com/image2.jpg",
        "description": "Astigmatism contact lenses",
        "is_active": true,
        "sort_order": 2,
        "category": {
          "id": 1,
          "name": "Contact Lenses",
          "slug": "contact-lenses"
        }
      }
    ]
  }
}
```

---

### 2. Get All Subcategories (Includes Sub-Subcategories)
**Route:** `GET /api/subcategories`  
**Access:** Public  
**Description:** Get all subcategories with separation of top-level and sub-subcategories

**Request:**
```
GET /api/subcategories?page=1&limit=50&category_id=1
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `category_id` (optional): Filter by category ID
- `search` (optional): Search by name

**Response:**
```json
{
  "success": true,
  "message": "Subcategories retrieved successfully",
  "data": {
    "subcategories": [
      {
        "id": 5,
        "name": "Giornaliere",
        "slug": "giornaliere",
        "category_id": 1,
        "parent_id": null,
        "image": "https://example.com/image.jpg",
        "category": {
          "id": 1,
          "name": "Contact Lenses",
          "slug": "contact-lenses"
        },
        "parent": null,
        "children": [
          {
            "id": 10,
            "name": "Sferiche",
            "slug": "sferiche",
            "image": "https://example.com/image.jpg"
          }
        ]
      },
      {
        "id": 10,
        "name": "Sferiche",
        "slug": "sferiche",
        "category_id": 1,
        "parent_id": 5,
        "image": "https://example.com/image.jpg",
        "category": {
          "id": 1,
          "name": "Contact Lenses",
          "slug": "contact-lenses"
        },
        "parent": {
          "id": 5,
          "name": "Giornaliere",
          "slug": "giornaliere"
        },
        "children": []
      }
    ],
    "topLevelSubcategories": [
      {
        "id": 5,
        "name": "Giornaliere",
        "slug": "giornaliere",
        "category_id": 1,
        "image": "https://example.com/image.jpg"
      }
    ],
    "subSubcategories": [
      {
        "id": 10,
        "name": "Sferiche",
        "slug": "sferiche",
        "category_id": 1,
        "parent_id": 5,
        "image": "https://example.com/image.jpg"
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "limit": 50,
      "pages": 1
    }
  }
}
```

---

### 3. Get Single Subcategory (Shows Parent & Children)
**Route:** `GET /api/subcategories/:id`  
**Access:** Public  
**Description:** Get a single subcategory with parent and children information

**Request:**
```
GET /api/subcategories/10?includeProducts=true
```

**Query Parameters:**
- `includeProducts` (optional): Include products (default: false)

**Response (for sub-subcategory):**
```json
{
  "success": true,
  "message": "Subcategory retrieved successfully",
  "data": {
    "subcategory": {
      "id": 10,
      "name": "Sferiche",
      "slug": "sferiche",
      "category_id": 1,
      "parent_id": 5,
      "description": "Spherical contact lenses",
      "image": "https://example.com/image.jpg",
      "is_active": true,
      "sort_order": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "category": {
        "id": 1,
        "name": "Contact Lenses",
        "slug": "contact-lenses"
      },
      "parent": {
        "id": 5,
        "name": "Giornaliere",
        "slug": "giornaliere"
      },
      "children": [],
      "products": [
        {
          "id": 1,
          "name": "Product Name",
          "slug": "product-name",
          "price": 99.99,
          "images": ["https://example.com/product.jpg"]
        }
      ]
    }
  }
}
```

---

### 4. Get Subcategories by Category (Top-Level with Children)
**Route:** `GET /api/subcategories/by-category/:category_id`  
**Access:** Public  
**Description:** Get top-level subcategories for a category with their sub-subcategories

**Request:**
```
GET /api/subcategories/by-category/1
```

**Response:**
```json
{
  "success": true,
  "message": "Subcategories retrieved successfully",
  "data": {
    "category": {
      "id": 1,
      "name": "Contact Lenses",
      "slug": "contact-lenses"
    },
    "subcategories": [
      {
        "id": 5,
        "name": "Giornaliere",
        "slug": "giornaliere",
        "category_id": 1,
        "image": "https://example.com/image.jpg",
        "children": [
          {
            "id": 10,
            "name": "Sferiche",
            "slug": "sferiche",
            "image": "https://example.com/image.jpg",
            "parent_id": 5
          },
          {
            "id": 11,
            "name": "Astigmatismo",
            "slug": "astigmatismo",
            "image": "https://example.com/image2.jpg",
            "parent_id": 5
          }
        ]
      }
    ]
  }
}
```

---

### 5. Get Products by Subcategory (Includes Sub-Subcategory Products)
**Route:** `GET /api/subcategories/:id/products`  
**Access:** Public  
**Description:** Get products for a subcategory, including products from sub-subcategories if it's a parent

**Request:**
```
GET /api/subcategories/5/products?page=1&limit=12&sortBy=created_at&sortOrder=desc
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 12)
- `sortBy` (optional): Sort field: created_at, price, name, rating, updated_at
- `sortOrder` (optional): Sort order: asc or desc

**Response:**
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": {
    "subcategory": {
      "id": 5,
      "name": "Giornaliere",
      "slug": "giornaliere",
      "parent_id": null,
      "category": {
        "id": 1,
        "name": "Contact Lenses",
        "slug": "contact-lenses"
      },
      "parent": null,
      "children": [
        {
          "id": 10,
          "name": "Sferiche",
          "slug": "sferiche"
        }
      ]
    },
    "products": [
      {
        "id": 1,
        "name": "Product Name",
        "slug": "product-name",
        "price": 99.99,
        "images": ["https://example.com/product.jpg"],
        "image": "https://example.com/product.jpg",
        "category": {
          "id": 1,
          "name": "Contact Lenses",
          "slug": "contact-lenses"
        },
        "subCategory": {
          "id": 10,
          "name": "Sferiche",
          "slug": "sferiche",
          "parent_id": 5,
          "parent": {
            "id": 5,
            "name": "Giornaliere",
            "slug": "giornaliere"
          }
        }
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 12,
      "pages": 1
    }
  }
}
```

---

## Admin Routes

### 6. Get Available Parent Subcategories (For Creating Sub-Subcategories)
**Route:** `GET /api/admin/subcategories/available-parents/:category_id`  
**Access:** Private/Admin  
**Description:** Get all available parent subcategories (top-level) for a category, including "None" option

**Request:**
```
GET /api/admin/subcategories/available-parents/1?exclude_id=5
```

**Query Parameters:**
- `exclude_id` (optional): Exclude a subcategory ID (useful when editing)

**Response:**
```json
{
  "success": true,
  "message": "Available parent subcategories retrieved successfully",
  "data": {
    "category_id": 1,
    "parentSubcategories": [
      {
        "id": null,
        "name": "None (Top-level subcategory)",
        "slug": null,
        "category_id": 1,
        "image": null,
        "description": "Create a top-level subcategory (no parent)",
        "children_count": 0,
        "products_count": 0
      },
      {
        "id": 5,
        "name": "Giornaliere",
        "slug": "giornaliere",
        "category_id": 1,
        "image": "https://example.com/image.jpg",
        "description": "Daily contact lenses",
        "children_count": 2,
        "products_count": 10
      },
      {
        "id": 6,
        "name": "Settimanale",
        "slug": "settimanale",
        "category_id": 1,
        "image": "https://example.com/image2.jpg",
        "description": "Weekly contact lenses",
        "children_count": 0,
        "products_count": 5
      }
    ]
  }
}
```

---

### 7. Get Sub-Subcategories by Parent (Admin)
**Route:** `GET /api/admin/subcategories/by-parent/:parent_id`  
**Access:** Private/Admin  
**Description:** Get sub-subcategories of a specific parent (admin view, includes all statuses)

**Request:**
```
GET /api/admin/subcategories/by-parent/5
```

**Response:**
```json
{
  "success": true,
  "message": "Subcategories retrieved successfully",
  "data": {
    "parentSubcategory": {
      "id": 5,
      "name": "Giornaliere",
      "slug": "giornaliere",
      "parent_id": null,
      "category": {
        "id": 1,
        "name": "Contact Lenses",
        "slug": "contact-lenses"
      }
    },
    "subcategories": [
      {
        "id": 10,
        "name": "Sferiche",
        "slug": "sferiche",
        "category_id": 1,
        "parent_id": 5,
        "description": "Spherical contact lenses",
        "image": "https://example.com/image.jpg",
        "is_active": true,
        "sort_order": 1,
        "category": {
          "id": 1,
          "name": "Contact Lenses",
          "slug": "contact-lenses"
        },
        "parent": {
          "id": 5,
          "name": "Giornaliere",
          "slug": "giornaliere"
        },
        "children": []
      }
    ]
  }
}
```

---

### 8. Get Nested Subcategories (Admin)
**Route:** `GET /api/admin/subcategories/nested`  
**Access:** Private/Admin  
**Description:** Get all sub-subcategories (where parent_id != null) with pagination

**Request:**
```
GET /api/admin/subcategories/nested?page=1&limit=50&category_id=1&parent_id=5
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `category_id` (optional): Filter by category ID
- `parent_id` (optional): Filter by parent subcategory ID
- `search` (optional): Search by name

**Response:**
```json
{
  "success": true,
  "message": "Nested subcategories retrieved successfully",
  "data": {
    "subcategories": [
      {
        "id": 10,
        "name": "Sferiche",
        "slug": "sferiche",
        "category_id": 1,
        "parent_id": 5,
        "description": "Spherical contact lenses",
        "image": "https://example.com/image.jpg",
        "is_active": true,
        "sort_order": 1,
        "category": {
          "id": 1,
          "name": "Contact Lenses",
          "slug": "contact-lenses"
        },
        "parent": {
          "id": 5,
          "name": "Giornaliere",
          "slug": "giornaliere",
          "category": {
            "id": 1,
            "name": "Contact Lenses",
            "slug": "contact-lenses"
          }
        },
        "children": []
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 50,
      "pages": 1
    }
  }
}
```

---

### 9. Create Sub-Subcategory
**Route:** `POST /api/admin/subcategories`  
**Access:** Private/Admin  
**Description:** Create a new subcategory (can be top-level or sub-subcategory)

**Request:**
```json
POST /api/admin/subcategories
Content-Type: application/json
Authorization: Bearer {{admin_token}}

{
  "name": "Sferiche",
  "slug": "sferiche",
  "category_id": 1,
  "parent_id": 5,
  "description": "Spherical contact lenses",
  "is_active": true,
  "sort_order": 1
}
```

**Request Body (for top-level - no parent):**
```json
{
  "name": "Giornaliere",
  "slug": "giornaliere",
  "category_id": 1,
  "parent_id": null,
  "description": "Daily contact lenses",
  "is_active": true,
  "sort_order": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Nested subcategory created successfully",
  "data": {
    "subcategory": {
      "id": 10,
      "name": "Sferiche",
      "slug": "sferiche",
      "category_id": 1,
      "parent_id": 5,
      "description": "Spherical contact lenses",
      "image": null,
      "is_active": true,
      "sort_order": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z",
      "category": {
        "id": 1,
        "name": "Contact Lenses",
        "slug": "contact-lenses"
      },
      "parent": {
        "id": 5,
        "name": "Giornaliere",
        "slug": "giornaliere"
      },
      "children": []
    }
  }
}
```

---

### 10. Update Sub-Subcategory
**Route:** `PUT /api/admin/subcategories/:id`  
**Access:** Private/Admin  
**Description:** Update a subcategory (can change parent or convert to top-level)

**Request:**
```json
PUT /api/admin/subcategories/10
Content-Type: application/json
Authorization: Bearer {{admin_token}}

{
  "name": "Updated Name",
  "parent_id": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subcategory updated successfully",
  "data": {
    "subcategory": {
      "id": 10,
      "name": "Updated Name",
      "slug": "sferiche",
      "category_id": 1,
      "parent_id": null,
      "description": "Spherical contact lenses",
      "image": "https://example.com/image.jpg",
      "is_active": true,
      "sort_order": 1,
      "category": {
        "id": 1,
        "name": "Contact Lenses",
        "slug": "contact-lenses"
      },
      "parent": null,
      "children": []
    }
  }
}
```

---

## Product Options Route (Includes Sub-Subcategories)

### 11. Get Product Form Options
**Route:** `GET /api/products/options`  
**Access:** Public  
**Description:** Get all form options including subcategories grouped by category and parent

**Request:**
```
GET /api/products/options
```

**Response:**
```json
{
  "success": true,
  "message": "Product form options retrieved successfully",
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Contact Lenses",
        "slug": "contact-lenses"
      }
    ],
    "subcategories": [
      {
        "id": 5,
        "name": "Giornaliere",
        "slug": "giornaliere",
        "category_id": 1,
        "parent_id": null,
        "image": "https://example.com/image.jpg",
        "parent": null
      },
      {
        "id": 10,
        "name": "Sferiche",
        "slug": "sferiche",
        "category_id": 1,
        "parent_id": 5,
        "image": "https://example.com/image.jpg",
        "parent": {
          "id": 5,
          "name": "Giornaliere",
          "slug": "giornaliere"
        }
      }
    ],
    "subcategoriesByCategory": {
      "1": [
        {
          "id": 5,
          "name": "Giornaliere",
          "slug": "giornaliere",
          "category_id": 1,
          "parent_id": null,
          "image": "https://example.com/image.jpg",
          "parent": null
        },
        {
          "id": 10,
          "name": "Sferiche",
          "slug": "sferiche",
          "category_id": 1,
          "parent_id": 5,
          "image": "https://example.com/image.jpg",
          "parent": {
            "id": 5,
            "name": "Giornaliere",
            "slug": "giornaliere"
          }
        }
      ]
    },
    "subcategoriesByParent": {
      "5": [
        {
          "id": 10,
          "name": "Sferiche",
          "slug": "sferiche",
          "category_id": 1,
          "parent_id": 5,
          "image": "https://example.com/image.jpg"
        }
      ]
    },
    "topLevelSubcategories": [
      {
        "id": 5,
        "name": "Giornaliere",
        "slug": "giornaliere",
        "category_id": 1,
        "image": "https://example.com/image.jpg"
      }
    ],
    "frameShapes": ["round", "square", "oval", ...],
    "frameMaterials": ["acetate", "metal", ...],
    "genders": ["men", "women", "unisex", "kids"],
    "lensTypes": [...],
    "lensCoatings": [...],
    "lensIndexOptions": [1.56, 1.61, 1.67, 1.74],
    "frameSizes": [...],
    "lensTypeEnums": ["prescription", "sunglasses", ...]
  }
}
```

---

## Summary

### Key Routes for Sub-Subcategories:

1. **Public:**
   - `GET /api/subcategories/by-parent/:parent_id` - Get sub-subcategories by parent
   - `GET /api/subcategories` - Get all (includes subSubcategories array)
   - `GET /api/subcategories/:id` - Get single (shows parent if sub-subcategory)
   - `GET /api/subcategories/by-category/:category_id` - Get top-level with children
   - `GET /api/subcategories/:id/products` - Get products (includes sub-subcategory products)

2. **Admin:**
   - `GET /api/admin/subcategories/available-parents/:category_id` - Get parents (includes "None")
   - `GET /api/admin/subcategories/by-parent/:parent_id` - Get sub-subcategories (admin)
   - `GET /api/admin/subcategories/nested` - Get all sub-subcategories
   - `POST /api/admin/subcategories` - Create (set parent_id for sub-subcategory)
   - `PUT /api/admin/subcategories/:id` - Update (can change parent_id)

### Key Response Fields:

- `parent_id`: `null` for top-level, number for sub-subcategory
- `parent`: Parent subcategory object (null for top-level)
- `children`: Array of sub-subcategories (empty for sub-subcategories)
- `subSubcategories`: Array of all sub-subcategories (in getSubCategories)
- `subcategoriesByParent`: Object keyed by parent_id with arrays of sub-subcategories


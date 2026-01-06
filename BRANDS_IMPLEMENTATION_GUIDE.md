# Brands Implementation Guide

## 📋 Overview
This guide provides step-by-step instructions for implementing the Brands feature in both the Admin Panel and Website. The Brands feature allows admins to manage brand logos that can be displayed on the website.

## ✅ Backend Status
- ✅ Database schema updated (`Brand` model added)
- ✅ Database migration created
- ✅ Upload middleware configured for brands
- ✅ API endpoints created for brands
- ✅ Admin routes configured

---

## 🎯 Implementation Points

### 1. DATABASE MIGRATION

Run the migration to create the brands table:

```bash
npx prisma migrate dev
```

Or if you want to apply it to production:

```bash
npx prisma migrate deploy
```

---

### 2. ADMIN PANEL - Brand Management

#### 2.1 Form Fields to Add

**Brand Name Field:**
```tsx
<div className="form-group">
  <label htmlFor="brand-name">Brand Name *</label>
  <input
    type="text"
    id="brand-name"
    className="form-control"
    placeholder="e.g., ZEISS, ZENNI, Transitions"
    value={brandName}
    onChange={(e) => setBrandName(e.target.value)}
    required
  />
</div>
```

**Brand Slug Field (Optional - auto-generated):**
```tsx
<div className="form-group">
  <label htmlFor="brand-slug">Brand Slug</label>
  <input
    type="text"
    id="brand-slug"
    className="form-control"
    placeholder="zeiss, zenni, transitions"
    value={slug}
    onChange={(e) => setSlug(e.target.value)}
  />
  <small className="text-muted">
    Leave empty to auto-generate from brand name
  </small>
</div>
```

**Description Field (Optional):**
```tsx
<div className="form-group">
  <label htmlFor="brand-description">Description</label>
  <textarea
    id="brand-description"
    className="form-control"
    rows="3"
    placeholder="Brand description..."
    value={description}
    onChange={(e) => setDescription(e.target.value)}
  />
</div>
```

**Logo Upload Field:**
```tsx
<div className="form-group">
  <label htmlFor="brand-logo">Brand Logo</label>
  <input
    type="file"
    id="brand-logo"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) {
        setLogoFile(file);
        // Optional: Preview logo
        const reader = new FileReader();
        reader.onload = (e) => setLogoPreview(e.target.result);
        reader.readAsDataURL(file);
      }
    }}
  />
  {logoPreview && (
    <img 
      src={logoPreview} 
      alt="Logo Preview" 
      style={{ maxWidth: '200px', marginTop: '10px' }}
    />
  )}
  <small className="text-muted">
    Upload brand logo (JPG, PNG, GIF, WEBP - Max 10MB)
  </small>
</div>
```

**Website URL Field (Optional):**
```tsx
<div className="form-group">
  <label htmlFor="website-url">Website URL</label>
  <input
    type="url"
    id="website-url"
    className="form-control"
    placeholder="https://example.com"
    value={websiteUrl}
    onChange={(e) => setWebsiteUrl(e.target.value)}
  />
  <small className="text-muted">
    Optional: Link to brand's official website
  </small>
</div>
```

**Sort Order Field:**
```tsx
<div className="form-group">
  <label htmlFor="sort-order">Sort Order</label>
  <input
    type="number"
    id="sort-order"
    className="form-control"
    placeholder="0"
    value={sortOrder}
    onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
  />
  <small className="text-muted">
    Lower numbers appear first (default: 0)
  </small>
</div>
```

**Active Status Checkbox:**
```tsx
<div className="form-group">
  <div className="form-check">
    <input
      type="checkbox"
      id="is-active"
      className="form-check-input"
      checked={isActive}
      onChange={(e) => setIsActive(e.target.checked)}
    />
    <label className="form-check-label" htmlFor="is-active">
      Active Brand
    </label>
  </div>
  <small className="text-muted">
    Only active brands will be displayed on the website
  </small>
</div>
```

#### 2.2 State Management

```tsx
const [brandName, setBrandName] = useState('');
const [slug, setSlug] = useState('');
const [description, setDescription] = useState('');
const [logoFile, setLogoFile] = useState<File | null>(null);
const [logoPreview, setLogoPreview] = useState<string | null>(null);
const [websiteUrl, setWebsiteUrl] = useState('');
const [sortOrder, setSortOrder] = useState(0);
const [isActive, setIsActive] = useState(true);
```

#### 2.3 Form Submission (Create Brand)

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const formData = new FormData();
  
  // Required fields
  formData.append('name', brandName);
  
  // Optional fields
  if (slug) {
    formData.append('slug', slug);
  }
  if (description) {
    formData.append('description', description);
  }
  if (websiteUrl) {
    formData.append('website_url', websiteUrl);
  }
  formData.append('sort_order', sortOrder.toString());
  formData.append('is_active', isActive.toString());
  
  // Logo upload (optional)
  if (logoFile) {
    formData.append('logo', logoFile);
  }
  
  try {
    const response = await fetch('/api/admin/brands', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        // Don't set Content-Type - browser will set it with boundary
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      // Success - close modal, refresh list, show success message
      onClose();
      onSuccess();
    } else {
      // Error handling
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

#### 2.4 Form Submission (Update Brand)

```tsx
const handleUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const formData = new FormData();
  
  // Only append fields that are being updated
  if (brandName) formData.append('name', brandName);
  if (slug) formData.append('slug', slug);
  if (description) formData.append('description', description);
  if (websiteUrl) formData.append('website_url', websiteUrl);
  formData.append('sort_order', sortOrder.toString());
  formData.append('is_active', isActive.toString());
  
  // Logo upload (only if new logo selected)
  if (logoFile) {
    formData.append('logo', logoFile);
  }
  
  try {
    const response = await fetch(`/api/admin/brands/${brandId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      onClose();
      onSuccess();
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

#### 2.5 Edit Brand - Pre-fill Form

```tsx
useEffect(() => {
  if (brand) {
    setBrandName(brand.name);
    setSlug(brand.slug);
    setDescription(brand.description || '');
    setWebsiteUrl(brand.website_url || '');
    setSortOrder(brand.sort_order || 0);
    setIsActive(brand.is_active);
    
    // Set logo preview if logo exists
    if (brand.logo_url) {
      setLogoPreview(brand.logo_url);
    }
  }
}, [brand]);
```

#### 2.6 Brand List - Display Logo

```tsx
{brands.map(brand => (
  <tr key={brand.id}>
    <td>
      {brand.logo_url ? (
        <img 
          src={brand.logo_url} 
          alt={brand.name}
          style={{ width: '80px', height: 'auto', maxHeight: '50px', objectFit: 'contain' }}
        />
      ) : (
        <span>No Logo</span>
      )}
    </td>
    <td>{brand.name}</td>
    <td>{brand.description || 'N/A'}</td>
    <td>{brand.website_url ? (
      <a href={brand.website_url} target="_blank" rel="noopener noreferrer">
        Visit
      </a>
    ) : 'N/A'}</td>
    <td>{brand.sort_order}</td>
    <td>{brand.is_active ? 'Active' : 'Inactive'}</td>
    <td>
      <button onClick={() => handleEdit(brand)}>Edit</button>
      <button onClick={() => handleDelete(brand.id)}>Delete</button>
    </td>
  </tr>
))}
```

---

### 3. WEBSITE - Brand Display

#### 3.1 Fetch Active Brands

```tsx
import { useEffect, useState } from 'react';

interface Brand {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const BrandsSection = () => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      const response = await fetch('/api/brands?activeOnly=true');
      const data = await response.json();
      
      if (data.success) {
        setBrands(data.data.brands);
      }
    } catch (error) {
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading brands...</div>;
  }

  if (brands.length === 0) {
    return null; // Don't show section if no brands
  }

  return (
    <section className="brands-section">
      <div className="container">
        <h2 className="section-title">Our Trusted Brands</h2>
        <div className="brands-grid">
          {brands.map(brand => (
            <div key={brand.id} className="brand-item">
              {brand.logo_url ? (
                brand.website_url ? (
                  <a 
                    href={brand.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="brand-link"
                  >
                    <img 
                      src={brand.logo_url} 
                      alt={brand.name}
                      className="brand-logo"
                    />
                  </a>
                ) : (
                  <img 
                    src={brand.logo_url} 
                    alt={brand.name}
                    className="brand-logo"
                  />
                )
              ) : (
                <div className="brand-placeholder">
                  <span>{brand.name}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsSection;
```

#### 3.2 CSS Styling Example

```css
/* Brands Section */
.brands-section {
  padding: 4rem 0;
  background: #f8f9fa;
}

.section-title {
  text-align: center;
  font-size: 2rem;
  margin-bottom: 3rem;
  color: #333;
}

.brands-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.brand-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  min-height: 120px;
}

.brand-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.brand-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  text-decoration: none;
}

.brand-logo {
  max-width: 100%;
  max-height: 80px;
  object-fit: contain;
  filter: grayscale(20%);
  transition: filter 0.3s;
}

.brand-item:hover .brand-logo {
  filter: grayscale(0%);
}

.brand-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #999;
  font-size: 0.9rem;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .brands-grid {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 1rem;
  }
  
  .brand-item {
    padding: 1rem;
    min-height: 100px;
  }
  
  .brand-logo {
    max-height: 60px;
  }
}
```

---

## 📡 API Endpoints Reference

### Get Brands (Public)
```
GET /api/brands?activeOnly=true

Response:
{
  "success": true,
  "message": "Brands retrieved successfully",
  "data": {
    "brands": [
      {
        "id": 1,
        "name": "ZEISS",
        "slug": "zeiss",
        "description": "Premium optical lenses",
        "logo_url": "https://example.com/uploads/brands/1234567890-zeiss-logo.png",
        "website_url": "https://www.zeiss.com",
        "sort_order": 0,
        "is_active": true,
        "created_at": "2025-01-05T00:00:00.000Z",
        "updated_at": "2025-01-05T00:00:00.000Z"
      }
    ]
  }
}
```

### Get All Brands (Admin)
```
GET /api/admin/brands
Authorization: Bearer {admin_token}

Response: Same as above but includes inactive brands
```

### Get Single Brand (Admin)
```
GET /api/admin/brands/:id
Authorization: Bearer {admin_token}
```

### Create Brand (Admin)
```
POST /api/admin/brands
Content-Type: multipart/form-data
Authorization: Bearer {admin_token}

Form Data:
- logo: File (optional)
- name: string (required)
- slug: string (optional, auto-generated)
- description: string (optional)
- website_url: string (optional)
- sort_order: number (optional, default: 0)
- is_active: string ("true" or "false", default: "true")
```

### Update Brand (Admin)
```
PUT /api/admin/brands/:id
Content-Type: multipart/form-data
Authorization: Bearer {admin_token}

Form Data:
- logo: File (optional - only if updating logo)
- name: string (optional)
- slug: string (optional)
- description: string (optional)
- website_url: string (optional - empty string to remove)
- sort_order: number (optional)
- is_active: string (optional)
```

### Delete Brand (Admin)
```
DELETE /api/admin/brands/:id
Authorization: Bearer {admin_token}
```

---

## ✅ Checklist

### Backend
- [x] Database schema updated
- [x] Migration file created
- [x] Controller functions created
- [x] Public routes created
- [x] Admin routes created
- [x] Upload middleware updated
- [x] Routes registered in server.js
- [ ] Run database migration

### Admin Panel
- [ ] Add brand management page
- [ ] Add brand list view
- [ ] Add create brand form
- [ ] Add edit brand form
- [ ] Add delete brand functionality
- [ ] Add logo upload with preview
- [ ] Add validation for form fields
- [ ] Add error handling

### Website
- [ ] Create brands section component
- [ ] Fetch active brands on home page
- [ ] Display brand logos
- [ ] Add clickable links if website_url exists
- [ ] Style brand display (grid layout)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Make brands responsive
- [ ] Add hover effects

---

## 🐛 Troubleshooting

### Logo Not Uploading
- Check that FormData is being used (not JSON)
- Verify Content-Type header is NOT manually set (browser sets it automatically)
- Check file size (max 10MB)
- Verify file type (JPG, PNG, GIF, WEBP)

### Logo Not Displaying
- Check logo_url format in response
- Verify image path is accessible
- Check CORS settings if using different domain
- Verify uploads folder permissions

### Website URL Not Working
- Verify website_url is saved correctly
- Check if URL is absolute (starts with http:// or https://)
- Verify target="_blank" and rel="noopener noreferrer" for security

---

## 📝 Notes

1. **Logo Storage**: Logos are stored in `uploads/brands/` folder (or S3 if configured)
2. **Logo URL Format**: `{PUBLIC_URL}/uploads/brands/{timestamp}-{filename}` or S3 URL
3. **File Size Limit**: 10MB per logo
4. **Supported Formats**: JPG, JPEG, PNG, GIF, WEBP
5. **Website URL**: Optional field, can be internal or external URL
6. **Active Brands**: Only brands with `is_active=true` are returned when `activeOnly=true`
7. **Sort Order**: Brands are sorted by `sort_order` (ascending), then by `created_at` (descending)

---

## 🚀 Quick Start

1. **Run Database Migration**: 
   ```bash
   npx prisma migrate dev
   ```

2. **Test API with Postman**: Use the API endpoints to test brand creation

3. **Implement Admin Form**: Add brand management to your admin panel

4. **Update Brand List**: Display brands in the admin brand list

5. **Implement Website Display**: Fetch and display brands on home page

6. **Style & Polish**: Add CSS styling and animations

---

**Last Updated**: January 2025
**API Version**: v1.0


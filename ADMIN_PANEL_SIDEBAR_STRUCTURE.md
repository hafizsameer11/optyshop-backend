# Admin Panel Sidebar Structure

## Complete Sidebar Navigation Structure

```javascript
// Admin Panel Sidebar Menu Structure
const adminSidebarMenu = [
  {
    id: 'dashboard',
    title: 'Dashboard',
    icon: 'dashboard',
    path: '/admin/dashboard',
    component: 'Dashboard'
  },
  {
    id: 'products',
    title: 'Products',
    icon: 'products',
    path: '/admin/products',
    component: 'Products',
    children: [
      {
        id: 'all-products',
        title: 'All Products',
        path: '/admin/products',
        component: 'ProductList'
      },
      {
        id: 'add-product',
        title: 'Add Product',
        path: '/admin/products/new',
        component: 'ProductForm'
      },
      {
        id: 'categories',
        title: 'Categories',
        path: '/admin/products/categories',
        component: 'Categories'
      },
      {
        id: 'frame-sizes',
        title: 'Frame Sizes',
        path: '/admin/products/frame-sizes',
        component: 'FrameSizes'
      }
    ]
  },
  {
    id: 'lens-configuration',
    title: 'Lens Configuration',
    icon: 'lens',
    path: '/admin/lens',
    component: 'LensConfiguration',
    children: [
      {
        id: 'lens-types',
        title: 'Lens Types',
        path: '/admin/lens/types',
        component: 'LensTypes'
      },
      {
        id: 'lens-coatings',
        title: 'Lens Coatings',
        path: '/admin/lens/coatings',
        component: 'LensCoatings'
      },
      {
        id: 'lens-options',
        title: 'Lens Options',
        path: '/admin/lens/options',
        component: 'LensOptions'
      },
      {
        id: 'lens-finishes',
        title: 'Lens Finishes',
        path: '/admin/lens/finishes',
        component: 'LensFinishes'
      },
      {
        id: 'lens-colors',
        title: 'Lens Colors',
        path: '/admin/lens/colors',
        component: 'LensColors'
      },
      {
        id: 'lens-treatments',
        title: 'Lens Treatments',
        path: '/admin/lens/treatments',
        component: 'LensTreatments'
      },
      {
        id: 'lens-thickness-materials',
        title: 'Thickness Materials',
        path: '/admin/lens/thickness-materials',
        component: 'LensThicknessMaterials'
      },
      {
        id: 'lens-thickness-options',
        title: 'Thickness Options',
        path: '/admin/lens/thickness-options',
        component: 'LensThicknessOptions'
      },
      {
        id: 'prescription-lens-types',
        title: 'Prescription Lens Types',
        path: '/admin/lens/prescription-types',
        component: 'PrescriptionLensTypes'
      },
      {
        id: 'prescription-lens-variants',
        title: 'Prescription Variants',
        path: '/admin/lens/prescription-variants',
        component: 'PrescriptionLensVariants'
      }
    ]
  },
  {
    id: 'orders',
    title: 'Orders',
    icon: 'orders',
    path: '/admin/orders',
    component: 'Orders'
  },
  {
    id: 'users',
    title: 'Users',
    icon: 'users',
    path: '/admin/users',
    component: 'Users'
  },
  {
    id: 'marketing',
    title: 'Marketing',
    icon: 'marketing',
    path: '/admin/marketing',
    component: 'Marketing',
    children: [
      {
        id: 'coupons',
        title: 'Coupons',
        path: '/admin/marketing/coupons',
        component: 'Coupons'
      },
      {
        id: 'campaigns',
        title: 'Campaigns',
        path: '/admin/marketing/campaigns',
        component: 'Campaigns'
      },
      {
        id: 'banners',
        title: 'Banners',
        path: '/admin/marketing/banners',
        component: 'Banners'
      }
    ]
  },
  {
    id: 'content',
    title: 'Content',
    icon: 'content',
    path: '/admin/content',
    component: 'Content',
    children: [
      {
        id: 'blog',
        title: 'Blog Posts',
        path: '/admin/content/blog',
        component: 'BlogPosts'
      },
      {
        id: 'pages',
        title: 'Pages',
        path: '/admin/content/pages',
        component: 'Pages'
      },
      {
        id: 'faqs',
        title: 'FAQs',
        path: '/admin/content/faqs',
        component: 'FAQs'
      },
      {
        id: 'testimonials',
        title: 'Testimonials',
        path: '/admin/content/testimonials',
        component: 'Testimonials'
      }
    ]
  },
  {
    id: 'requests',
    title: 'Requests',
    icon: 'requests',
    path: '/admin/requests',
    component: 'Requests',
    children: [
      {
        id: 'contact',
        title: 'Contact Requests',
        path: '/admin/requests/contact',
        component: 'ContactRequests'
      },
      {
        id: 'demo',
        title: 'Demo Requests',
        path: '/admin/requests/demo',
        component: 'DemoRequests'
      },
      {
        id: 'support',
        title: 'Support Requests',
        path: '/admin/requests/support',
        component: 'SupportRequests'
      }
    ]
  },
  {
    id: 'settings',
    title: 'Settings',
    icon: 'settings',
    path: '/admin/settings',
    component: 'Settings',
    children: [
      {
        id: 'shipping',
        title: 'Shipping Methods',
        path: '/admin/settings/shipping',
        component: 'ShippingMethods'
      },
      {
        id: 'simulation',
        title: 'Simulation Config',
        path: '/admin/settings/simulation',
        component: 'SimulationConfig'
      },
      {
        id: 'vto',
        title: 'VTO Settings',
        path: '/admin/settings/vto',
        component: 'VTOSettings'
      }
    ]
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: 'analytics',
    path: '/admin/analytics',
    component: 'Analytics'
  }
];
```

---

## React Component Example

```jsx
// AdminSidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState(['lens-configuration']);

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const isExpanded = (menuId) => {
    return expandedMenus.includes(menuId);
  };

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <h2>Admin Panel</h2>
      </div>
      
      <nav className="sidebar-nav">
        {adminSidebarMenu.map(menuItem => (
          <div key={menuItem.id} className="menu-item">
            {menuItem.children ? (
              <>
                <div 
                  className={`menu-header ${isExpanded(menuItem.id) ? 'expanded' : ''}`}
                  onClick={() => toggleMenu(menuItem.id)}
                >
                  <span className="menu-icon">{menuItem.icon}</span>
                  <span className="menu-title">{menuItem.title}</span>
                  <span className="menu-arrow">
                    {isExpanded(menuItem.id) ? '▼' : '▶'}
                  </span>
                </div>
                {isExpanded(menuItem.id) && (
                  <div className="submenu">
                    {menuItem.children.map(child => (
                      <Link
                        key={child.id}
                        to={child.path}
                        className={`submenu-item ${isActive(child.path) ? 'active' : ''}`}
                      >
                        {child.title}
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                to={menuItem.path}
                className={`menu-link ${isActive(menuItem.path) ? 'active' : ''}`}
              >
                <span className="menu-icon">{menuItem.icon}</span>
                <span className="menu-title">{menuItem.title}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>
    </div>
  );
};

export default AdminSidebar;
```

---

## CSS Styling Example

```css
/* AdminSidebar.css */
.admin-sidebar {
  width: 260px;
  height: 100vh;
  background: #1e293b;
  color: #fff;
  position: fixed;
  left: 0;
  top: 0;
  overflow-y: auto;
  z-index: 1000;
}

.sidebar-header {
  padding: 20px;
  border-bottom: 1px solid #334155;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.sidebar-nav {
  padding: 10px 0;
}

.menu-item {
  margin-bottom: 4px;
}

.menu-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  cursor: pointer;
  transition: background 0.2s;
  user-select: none;
}

.menu-header:hover {
  background: #334155;
}

.menu-header.expanded {
  background: #334155;
}

.menu-link {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #cbd5e1;
  text-decoration: none;
  transition: all 0.2s;
}

.menu-link:hover {
  background: #334155;
  color: #fff;
}

.menu-link.active {
  background: #3b82f6;
  color: #fff;
}

.menu-icon {
  margin-right: 12px;
  width: 20px;
  text-align: center;
}

.menu-title {
  flex: 1;
}

.menu-arrow {
  font-size: 10px;
  color: #94a3b8;
}

.submenu {
  background: #0f172a;
  padding: 4px 0;
}

.submenu-item {
  display: block;
  padding: 10px 20px 10px 52px;
  color: #94a3b8;
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
}

.submenu-item:hover {
  background: #1e293b;
  color: #fff;
}

.submenu-item.active {
  background: #1e40af;
  color: #fff;
  border-left: 3px solid #3b82f6;
}
```

---

## Page Components Structure

### Lens Thickness Materials Page

```jsx
// pages/admin/LensThicknessMaterials.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LensThicknessMaterials = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    is_active: true,
    sort_order: 0
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await axios.get('/api/admin/lens-thickness-materials', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setMaterials(response.data.data.materials);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching materials:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingMaterial
        ? `/api/admin/lens-thickness-materials/${editingMaterial.id}`
        : '/api/admin/lens-thickness-materials';
      const method = editingMaterial ? 'put' : 'post';

      await axios[method](url, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      fetchMaterials();
      resetForm();
    } catch (error) {
      console.error('Error saving material:', error);
    }
  };

  const handleEdit = (material) => {
    setEditingMaterial(material);
    setFormData({
      name: material.name,
      slug: material.slug,
      description: material.description || '',
      price: material.price,
      is_active: material.isActive,
      sort_order: material.sortOrder
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this material?')) return;

    try {
      await axios.delete(`/api/admin/lens-thickness-materials/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      fetchMaterials();
    } catch (error) {
      console.error('Error deleting material:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      is_active: true,
      sort_order: 0
    });
    setEditingMaterial(null);
    setShowForm(false);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-page">
      <div className="page-header">
        <h1>Lens Thickness Materials</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'Cancel' : 'Add New Material'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card">
          <h2>{editingMaterial ? 'Edit' : 'Add'} Material</h2>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>
          <div className="form-group">
            <label>Slug</label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({...formData, slug: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label>Price (€) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
              required
            />
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              />
              Active
            </label>
          </div>
          <div className="form-group">
            <label>Sort Order</label>
            <input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({...formData, sort_order: parseInt(e.target.value)})}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-primary">
              {editingMaterial ? 'Update' : 'Create'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Status</th>
              <th>Sort Order</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map(material => (
              <tr key={material.id}>
                <td>{material.id}</td>
                <td>{material.name}</td>
                <td>€{material.price.toFixed(2)}</td>
                <td>
                  <span className={`badge ${material.isActive ? 'active' : 'inactive'}`}>
                    {material.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{material.sortOrder}</td>
                <td>
                  <button onClick={() => handleEdit(material)} className="btn-edit">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(material.id)} className="btn-delete">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LensThicknessMaterials;
```

---

## Route Configuration

```jsx
// App.jsx or Router.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import LensThicknessMaterials from './pages/admin/LensThicknessMaterials';
import LensThicknessOptions from './pages/admin/LensThicknessOptions';
import LensTreatments from './pages/admin/LensTreatments';
// ... other imports

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="lens/thickness-materials" element={<LensThicknessMaterials />} />
          <Route path="lens/thickness-options" element={<LensThicknessOptions />} />
          <Route path="lens/treatments" element={<LensTreatments />} />
          {/* ... other routes */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
```

---

## API Service Helper

```javascript
// services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Lens Thickness Materials API
export const lensThicknessMaterialsAPI = {
  getAll: (params) => api.get('/admin/lens-thickness-materials', { params }),
  getOne: (id) => api.get(`/admin/lens-thickness-materials/${id}`),
  create: (data) => api.post('/admin/lens-thickness-materials', data),
  update: (id, data) => api.put(`/admin/lens-thickness-materials/${id}`, data),
  delete: (id) => api.delete(`/admin/lens-thickness-materials/${id}`),
};

// Lens Thickness Options API
export const lensThicknessOptionsAPI = {
  getAll: (params) => api.get('/admin/lens-thickness-options', { params }),
  getOne: (id) => api.get(`/admin/lens-thickness-options/${id}`),
  create: (data) => api.post('/admin/lens-thickness-options', data),
  update: (id, data) => api.put(`/admin/lens-thickness-options/${id}`, data),
  delete: (id) => api.delete(`/admin/lens-thickness-options/${id}`),
};

// Lens Treatments API
export const lensTreatmentsAPI = {
  getAll: (params) => api.get('/admin/lens-treatments', { params }),
  getOne: (id) => api.get(`/admin/lens-treatments/${id}`),
  create: (data) => api.post('/admin/lens-treatments', data),
  update: (id, data) => api.put(`/admin/lens-treatments/${id}`, data),
  delete: (id) => api.delete(`/admin/lens-treatments/${id}`),
};

export default api;
```

---

This structure provides:
1. ✅ Complete sidebar navigation
2. ✅ React component examples
3. ✅ CSS styling
4. ✅ Page component template
5. ✅ API service helpers
6. ✅ Route configuration

You can now integrate this into your admin panel!


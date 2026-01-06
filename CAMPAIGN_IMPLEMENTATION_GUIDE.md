# Campaign Image & URL Implementation Guide

## 📋 Overview
This guide provides step-by-step instructions for implementing campaign image upload and URL functionality in both the Admin Panel and Website.

## ✅ Backend Status
- ✅ Database schema updated (`image_url`, `link_url` fields added)
- ✅ Upload middleware configured for campaigns
- ✅ API endpoints updated to handle image uploads
- ✅ Postman collection updated

---

## 🎯 Implementation Points

### 1. ADMIN PANEL - Add Campaign Form

#### 1.1 Form Fields to Add

**Image Upload Field:**
```tsx
// Add after the "Active Campaign" checkbox
<div className="form-group">
  <label htmlFor="campaign-image">Campaign Image</label>
  <input
    type="file"
    id="campaign-image"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) {
        setImageFile(file);
        // Optional: Preview image
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
      }
    }}
  />
  {imagePreview && (
    <img 
      src={imagePreview} 
      alt="Preview" 
      style={{ maxWidth: '200px', marginTop: '10px' }}
    />
  )}
  <small className="text-muted">
    Upload campaign image (JPG, PNG, GIF, WEBP - Max 10MB)
  </small>
</div>
```

**Link URL Field:**
```tsx
// Add after the image upload field
<div className="form-group">
  <label htmlFor="link-url">Campaign Link URL</label>
  <input
    type="url"
    id="link-url"
    className="form-control"
    placeholder="https://example.com/campaign-page"
    value={linkUrl}
    onChange={(e) => setLinkUrl(e.target.value)}
  />
  <small className="text-muted">
    Optional: URL to redirect when campaign is clicked
  </small>
</div>
```

#### 1.2 State Management

```tsx
const [imageFile, setImageFile] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const [linkUrl, setLinkUrl] = useState<string>('');
```

#### 1.3 Form Submission (Create Campaign)

```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const formData = new FormData();
  
  // Required fields
  formData.append('name', campaignName);
  formData.append('description', description);
  formData.append('starts_at', startsAt);
  formData.append('ends_at', endsAt);
  formData.append('is_active', isActive.toString());
  
  // Optional fields
  if (campaignType) {
    formData.append('campaign_type', campaignType);
  }
  
  // Image upload (optional)
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  // Link URL (optional)
  if (linkUrl) {
    formData.append('link_url', linkUrl);
  }
  
  try {
    const response = await fetch('/api/admin/campaigns', {
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

#### 1.4 Form Submission (Update Campaign)

```tsx
const handleUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  
  const formData = new FormData();
  
  // Only append fields that are being updated
  if (campaignName) formData.append('name', campaignName);
  if (description) formData.append('description', description);
  if (campaignType) formData.append('campaign_type', campaignType);
  if (startsAt) formData.append('starts_at', startsAt);
  if (endsAt) formData.append('ends_at', endsAt);
  formData.append('is_active', isActive.toString());
  
  // Image upload (only if new image selected)
  if (imageFile) {
    formData.append('image', imageFile);
  }
  
  // Link URL
  formData.append('link_url', linkUrl || ''); // Empty string to remove URL
  
  try {
    const response = await fetch(`/api/admin/campaigns/${campaignId}`, {
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

#### 1.5 Edit Campaign - Pre-fill Form

```tsx
useEffect(() => {
  if (campaign) {
    setCampaignName(campaign.name);
    setDescription(campaign.description);
    setCampaignType(campaign.campaign_type || '');
    setLinkUrl(campaign.link_url || '');
    setStartsAt(campaign.starts_at ? formatDate(campaign.starts_at) : '');
    setEndsAt(campaign.ends_at ? formatDate(campaign.ends_at) : '');
    setActive(campaign.is_active);
    
    // Set image preview if image exists
    if (campaign.image_url) {
      setImagePreview(campaign.image_url);
    }
  }
}, [campaign]);
```

#### 1.6 Campaign List - Display Image

```tsx
{campaigns.map(campaign => (
  <tr key={campaign.id}>
    <td>
      {campaign.image_url ? (
        <img 
          src={campaign.image_url} 
          alt={campaign.name}
          style={{ width: '50px', height: '50px', objectFit: 'cover' }}
        />
      ) : (
        <span>No Image</span>
      )}
    </td>
    <td>{campaign.name}</td>
    <td>{campaign.description}</td>
    <td>{campaign.link_url || 'N/A'}</td>
    <td>{campaign.is_active ? 'Active' : 'Inactive'}</td>
    <td>
      <button onClick={() => handleEdit(campaign)}>Edit</button>
      <button onClick={() => handleDelete(campaign.id)}>Delete</button>
    </td>
  </tr>
))}
```

---

### 2. WEBSITE - Home Page Campaign Display

#### 2.1 Fetch Active Campaigns

```tsx
import { useEffect, useState } from 'react';

interface Campaign {
  id: number;
  name: string;
  description: string;
  image_url: string | null;
  link_url: string | null;
  campaign_type: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

const HomePage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns?activeOnly=true');
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
};
```

#### 2.2 Campaign Display Component

**Option 1: Hero Banner Style**
```tsx
{campaigns.length > 0 && (
  <section className="campaign-hero">
    {campaigns[0].image_url && (
      <div className="campaign-banner">
        <img 
          src={campaigns[0].image_url} 
          alt={campaigns[0].name}
          className="campaign-image"
        />
        <div className="campaign-overlay">
          <h2>{campaigns[0].name}</h2>
          <p>{campaigns[0].description}</p>
          {campaigns[0].link_url && (
            <a 
              href={campaigns[0].link_url}
              className="btn btn-primary"
              target="_blank"
              rel="noopener noreferrer"
            >
              Shop Now
            </a>
          )}
        </div>
      </div>
    )}
  </section>
)}
```

**Option 2: Grid/Carousel Style**
```tsx
<section className="campaigns-section">
  <h2>Special Campaigns</h2>
  <div className="campaigns-grid">
    {campaigns.map(campaign => (
      <div key={campaign.id} className="campaign-card">
        {campaign.image_url ? (
          <div className="campaign-image-wrapper">
            <img 
              src={campaign.image_url} 
              alt={campaign.name}
              className="campaign-image"
            />
          </div>
        ) : (
          <div className="campaign-placeholder">
            <span>No Image</span>
          </div>
        )}
        <div className="campaign-content">
          <h3>{campaign.name}</h3>
          <p>{campaign.description}</p>
          {campaign.link_url && (
            <a 
              href={campaign.link_url}
              className="campaign-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn More →
            </a>
          )}
        </div>
      </div>
    ))}
  </div>
</section>
```

#### 2.3 CSS Styling Example

```css
/* Campaign Hero Banner */
.campaign-hero {
  position: relative;
  margin: 2rem 0;
}

.campaign-banner {
  position: relative;
  width: 100%;
  height: 400px;
  overflow: hidden;
  border-radius: 8px;
}

.campaign-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.campaign-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7));
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  padding: 2rem;
  text-align: center;
}

.campaign-overlay h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.campaign-overlay p {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
}

/* Campaign Grid */
.campaigns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.campaign-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.3s, box-shadow 0.3s;
}

.campaign-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.campaign-image-wrapper {
  width: 100%;
  height: 200px;
  overflow: hidden;
}

.campaign-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.campaign-placeholder {
  width: 100%;
  height: 200px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.campaign-content {
  padding: 1.5rem;
}

.campaign-content h3 {
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
}

.campaign-content p {
  color: #666;
  margin-bottom: 1rem;
}

.campaign-link {
  color: #007bff;
  text-decoration: none;
  font-weight: 500;
}

.campaign-link:hover {
  text-decoration: underline;
}
```

---

## 📡 API Endpoints Reference

### Create Campaign
```
POST /api/admin/campaigns
Content-Type: multipart/form-data
Authorization: Bearer {admin_token}

Form Data:
- image: File (optional)
- name: string (required)
- slug: string (optional, auto-generated)
- description: string (required)
- campaign_type: string (optional)
- link_url: string (optional)
- starts_at: string (ISO format, optional)
- ends_at: string (ISO format, optional)
- is_active: string ("true" or "false", default: "false")
```

### Update Campaign
```
PUT /api/admin/campaigns/:id
Content-Type: multipart/form-data
Authorization: Bearer {admin_token}

Form Data:
- image: File (optional - only if updating image)
- name: string (optional)
- description: string (optional)
- campaign_type: string (optional)
- link_url: string (optional - empty string to remove)
- starts_at: string (ISO format, optional)
- ends_at: string (ISO format, optional)
- is_active: string (optional)
```

### Get Active Campaigns (Public)
```
GET /api/campaigns?activeOnly=true

Response:
{
  "success": true,
  "message": "Campaigns retrieved successfully",
  "data": {
    "campaigns": [
      {
        "id": 1,
        "name": "Summer Sale 2024",
        "slug": "summer-sale-2024",
        "description": "Big summer discounts",
        "campaign_type": "discount",
        "image_url": "http://localhost:5000/uploads/campaigns/1234567890-image.jpg",
        "link_url": "https://example.com/summer-sale",
        "is_active": true,
        "starts_at": "2024-06-01T00:00:00.000Z",
        "ends_at": "2024-08-31T23:59:59.000Z",
        "created_at": "2024-01-01T00:00:00.000Z",
        "updated_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## ✅ Checklist

### Admin Panel
- [ ] Add image upload field to Add Campaign form
- [ ] Add link URL field to Add Campaign form
- [ ] Add image preview functionality
- [ ] Update form submission to use FormData
- [ ] Handle image upload in create campaign
- [ ] Handle image upload in update campaign
- [ ] Display campaign images in campaign list
- [ ] Pre-fill image preview when editing campaign
- [ ] Add validation for image file types and size
- [ ] Add error handling for upload failures

### Website
- [ ] Fetch active campaigns on home page
- [ ] Display campaign images
- [ ] Add clickable links if link_url exists
- [ ] Style campaign display (hero banner or grid)
- [ ] Add loading states
- [ ] Add error handling
- [ ] Make campaigns responsive
- [ ] Add hover effects and animations

---

## 🐛 Troubleshooting

### Image Not Uploading
- Check that FormData is being used (not JSON)
- Verify Content-Type header is NOT manually set (browser sets it automatically)
- Check file size (max 10MB)
- Verify file type (JPG, PNG, GIF, WEBP)

### Image Not Displaying
- Check image_url format in response
- Verify image path is accessible
- Check CORS settings if using different domain
- Verify uploads folder permissions

### Link URL Not Working
- Verify link_url is saved correctly
- Check if URL is absolute (starts with http:// or https://)
- Verify target="_blank" and rel="noopener noreferrer" for security

---

## 📝 Notes

1. **Image Storage**: Images are stored in `uploads/campaigns/` folder
2. **Image URL Format**: `{PUBLIC_URL}/uploads/campaigns/{timestamp}-{filename}`
3. **File Size Limit**: 10MB per image
4. **Supported Formats**: JPG, JPEG, PNG, GIF, WEBP
5. **Link URL**: Optional field, can be internal or external URL
6. **Active Campaigns**: Only campaigns with `is_active=true` and within date range are returned when `activeOnly=true`

---

## 🚀 Quick Start

1. **Test API with Postman**: Use the updated Postman collection to test image upload
2. **Implement Admin Form**: Add image and URL fields to your campaign form
3. **Update Campaign List**: Display images in the admin campaign list
4. **Implement Website Display**: Fetch and display campaigns on home page
5. **Style & Polish**: Add CSS styling and animations

---

**Last Updated**: January 2025
**API Version**: v1.0


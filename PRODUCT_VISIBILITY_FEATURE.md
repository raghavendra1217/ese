# Vendor Product Visibility Feature

## Overview

This feature allows administrators and coordinators to control whether individual vendors can see and purchase products. When a vendor's `product_visibility` is set to `FALSE`, they will not be able to view any products in the system.

## Database Changes

### New Column
- **Table**: `vendors`
- **Column**: `product_visibility`
- **Type**: `BOOLEAN`
- **Default**: `TRUE`
- **Description**: Controls whether this vendor can view and purchase products

### Migration
Run the SQL migration file to add the column:
```bash
psql -U your_username -d your_database -f add_product_visibility_column.sql
```

Or manually execute:
```sql
ALTER TABLE public.vendors 
ADD COLUMN IF NOT EXISTS product_visibility BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_vendors_product_visibility ON public.vendors(product_visibility);
```

## Backend Implementation

### Modified Controllers

#### 1. `productController.js`
- **`getAvailableProducts`**: Now checks vendor's `product_visibility` before returning products
- **`getAvailableProductCount`**: Now respects the visibility setting and returns 0 when disabled

**Behavior**:
- If `product_visibility = FALSE`, vendors receive:
  - Empty products array
  - `visibilityDisabled: true` flag
  - Message: "Product access has been temporarily disabled for your account. Please contact support."
- Admin and coordinator roles bypass the visibility check (always see products)

#### 2. `adminController.js`
Added three new functions:

- **`toggleVendorProductVisibility`**: Enable/disable product access for a vendor
- **`getVendorProductVisibility`**: Get visibility status for a specific vendor
- **`getAllVendorsVisibility`**: Get all vendors with their visibility status

### New API Endpoints

All endpoints require authentication and admin/coordinator role.

#### 1. Get All Vendors Visibility Status
```
GET /api/admin/vendors-visibility
Authorization: Bearer <token>

Response:
{
  "success": true,
  "count": 150,
  "vendors": [
    {
      "id": "vendor_001",
      "vendor_name": "John Doe",
      "email": "john@example.com",
      "product_visibility": true,
      "is_approved": true,
      "status": "active",
      "created_at": "2025-01-15T10:30:00Z",
      "updated_at": "2025-01-20T14:22:00Z"
    },
    ...
  ]
}
```

#### 2. Get Specific Vendor Visibility
```
GET /api/admin/vendors/:vendorId/product-visibility
Authorization: Bearer <token>

Response:
{
  "success": true,
  "vendor": {
    "id": "vendor_001",
    "vendor_name": "John Doe",
    "email": "john@example.com",
    "product_visibility": true,
    "created_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-20T14:22:00Z"
  }
}
```

#### 3. Toggle Vendor Product Visibility
```
PUT /api/admin/vendors/:vendorId/product-visibility
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "productVisibility": false
}

Response:
{
  "success": true,
  "message": "Product visibility has been disabled for vendor John Doe.",
  "vendor": {
    "id": "vendor_001",
    "vendor_name": "John Doe",
    "email": "john@example.com",
    "product_visibility": false,
    "previous_visibility": true
  }
}
```

## Use Cases

### 1. Temporarily Disable Product Access
When a vendor:
- Has payment issues
- Violates terms of service
- Needs account review
- Has outstanding issues

**Action**: Set `product_visibility = FALSE`

### 2. Enable Product Access
After issues are resolved:

**Action**: Set `product_visibility = TRUE`

### 3. Bulk Management
Fetch all vendors with their visibility status and manage them efficiently:
```javascript
// Example: Get all vendors with disabled visibility
const response = await fetch('/api/admin/vendors-visibility');
const data = await response.json();
const disabledVendors = data.vendors.filter(v => !v.product_visibility);
```

## Testing

### Test Scenarios

#### 1. Test Visibility Disabled (Vendor Side)
1. As admin, disable visibility for a vendor:
   ```bash
   curl -X PUT http://localhost:5000/api/admin/vendors/vendor_123/product-visibility \
     -H "Authorization: Bearer <admin_token>" \
     -H "Content-Type: application/json" \
     -d '{"productVisibility": false}'
   ```

2. As that vendor, try to fetch products:
   ```bash
   curl http://localhost:5000/api/products/available \
     -H "Authorization: Bearer <vendor_token>"
   ```

   Expected response:
   ```json
   {
     "success": false,
     "message": "Product access has been temporarily disabled for your account. Please contact support.",
     "products": [],
     "visibilityDisabled": true
   }
   ```

#### 2. Test Admin Always Sees Products
1. Login as admin
2. Products should always be visible regardless of any vendor-specific settings

#### 3. Test Product Count
1. Disable visibility for a vendor
2. Vendor should see `availableProducts: 0` when checking product count

## Frontend Integration (Optional)

### Vendor Side
The frontend should handle the `visibilityDisabled` flag:

```javascript
// In your product fetching component
const fetchProducts = async () => {
  const response = await fetch(`${API_URL}/api/products/available`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  
  if (data.visibilityDisabled) {
    // Show a specific message to the user
    showAlert({
      title: 'Products Unavailable',
      message: data.message,
      type: 'warning'
    });
    return [];
  }
  
  return data.products || [];
};
```

### Admin Side (Optional Enhancement)
Create an admin panel to manage vendor visibility:

```jsx
// Example React component
const VendorVisibilityManager = () => {
  const [vendors, setVendors] = useState([]);
  
  useEffect(() => {
    fetchVendorsVisibility();
  }, []);
  
  const fetchVendorsVisibility = async () => {
    const response = await fetch('/api/admin/vendors-visibility', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    setVendors(data.vendors);
  };
  
  const toggleVisibility = async (vendorId, currentVisibility) => {
    await fetch(`/api/admin/vendors/${vendorId}/product-visibility`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productVisibility: !currentVisibility })
    });
    fetchVendorsVisibility(); // Refresh list
  };
  
  return (
    <table>
      <thead>
        <tr>
          <th>Vendor Name</th>
          <th>Email</th>
          <th>Product Access</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {vendors.map(vendor => (
          <tr key={vendor.id}>
            <td>{vendor.vendor_name}</td>
            <td>{vendor.email}</td>
            <td>{vendor.product_visibility ? 'Enabled' : 'Disabled'}</td>
            <td>
              <button onClick={() => toggleVisibility(vendor.id, vendor.product_visibility)}>
                {vendor.product_visibility ? 'Disable' : 'Enable'}
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

## Security Notes

1. **Role-Based Access**: Only admins and coordinators can modify visibility settings
2. **Audit Trail**: All visibility changes are logged with admin user ID
3. **Transaction Safety**: Updates use database transactions for data integrity
4. **Vendor Notification**: Consider implementing email notifications when visibility is changed

## Logging

The system logs visibility changes:
```
✅ Product visibility disabled for vendor vendor_123 (John Doe) by admin admin_001
🚫 Product visibility disabled for vendor vendor_123
```

## Performance

- Added index on `product_visibility` column for fast filtering
- Visibility check happens early in the request lifecycle
- No performance impact on admin/coordinator users

## Troubleshooting

### Vendor Can't See Products
1. Check vendor's `product_visibility` in database:
   ```sql
   SELECT id, vendor_name, product_visibility FROM vendors WHERE id = 'vendor_id';
   ```

2. Check if it's a time constraint issue (products have business hours)

3. Verify vendor role in login table

### Admin Can't Toggle Visibility
1. Verify admin has correct role in JWT token
2. Check if vendor ID exists in database
3. Review server logs for specific error messages

## Future Enhancements

1. **Scheduled Visibility**: Auto-enable/disable based on schedule
2. **Visibility Reasons**: Add reason field for audit purposes
3. **Email Notifications**: Notify vendor when visibility changes
4. **Bulk Operations**: Enable/disable visibility for multiple vendors at once
5. **Visibility History**: Track all visibility changes over time
6. **Category-Level Control**: Control visibility per product category


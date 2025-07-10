# Community Announcements API

A dedicated Supabase Edge Function for comprehensive community announcement management with advanced filtering, bulk operations, and real-time support.

## Features

- **CRUD Operations**: Full create, read, update, delete support
- **Bulk Operations**: Efficient bulk update and delete for multiple announcements
- **Advanced Filtering**: Search, type, priority, date range, and status filters
- **Pagination**: Configurable pagination with ordering
- **Publishing Workflow**: Publish/unpublish with automatic timestamp management
- **Featured Content**: Feature/unfeature announcements for priority display
- **Role-based Security**: Admin-only write operations, authenticated read access

## API Endpoints

### Base URL

```
https://your-project.supabase.co/functions/v1/community-announcements
```

## Operations

### 1. List Announcements (GET)

**Endpoint**: `GET /community-announcements`

**Query Parameters**:

- `type[]`: Filter by announcement types (announcement, news, changelog, event)
- `is_published`: Filter by published status (true/false)
- `is_featured`: Filter by featured status (true/false)
- `priority_min`: Minimum priority level
- `priority_max`: Maximum priority level
- `search`: Search in title and content
- `created_after`: Filter announcements created after date (ISO 8601)
- `created_before`: Filter announcements created before date (ISO 8601)
- `expires_after`: Filter by expiration date after (ISO 8601)
- `expires_before`: Filter by expiration date before (ISO 8601)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `order_by`: Sort field (default: created_at)
- `order_direction`: Sort direction (asc/desc, default: desc)

**Example**:

```bash
GET /community-announcements?is_published=true&type[]=announcement&type[]=news&page=1&limit=10
```

**Response**:

```json
{
  "success": true,
  "data": {
    "announcements": [...],
    "pagination": {
      "current_page": 1,
      "per_page": 10,
      "total_items": 25,
      "total_pages": 3,
      "has_next": true,
      "has_previous": false
    }
  }
}
```

### 2. Get Single Announcement (POST)

**Payload**:

```json
{
  "action": "get",
  "id": "announcement-uuid"
}
```

### 3. Create Announcement (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "create",
  "data": {
    "title": "Important Update",
    "content": "Announcement content here...",
    "type": "announcement",
    "priority": 5,
    "is_published": true,
    "is_featured": false,
    "expires_at": "2024-12-31T23:59:59Z",
    "image_url": "https://example.com/image.jpg",
    "link_url": "https://example.com/more-info",
    "link_text": "Read More",
    "tags": ["important", "update"],
    "metadata": {
      "author_note": "Additional context"
    }
  }
}
```

### 4. Update Announcement (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "update",
  "id": "announcement-uuid",
  "data": {
    "title": "Updated Title",
    "priority": 8
  }
}
```

### 5. Delete Announcement (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "delete",
  "id": "announcement-uuid"
}
```

### 6. Bulk Update (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "bulk_update",
  "ids": ["uuid1", "uuid2", "uuid3"],
  "data": {
    "is_published": true,
    "priority": 5
  }
}
```

### 7. Bulk Delete (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "bulk_delete",
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

### 8. Publish Announcement (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "publish",
  "id": "announcement-uuid"
}
```

### 9. Unpublish Announcement (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "unpublish",
  "id": "announcement-uuid"
}
```

### 10. Feature Announcement (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "feature",
  "id": "announcement-uuid"
}
```

### 11. Unfeature Announcement (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "unfeature",
  "id": "announcement-uuid"
}
```

## Data Schema

### AnnouncementData Interface

```typescript
interface AnnouncementData {
  title?: string; // Announcement title (required for create)
  content?: string; // Announcement content (required for create)
  type?: 'announcement' | 'news' | 'changelog' | 'event'; // Default: 'announcement'
  priority?: number; // 0-10 priority level
  is_published?: boolean; // Published status
  is_featured?: boolean; // Featured status
  published_at?: string; // Auto-set on first publish (ISO 8601)
  expires_at?: string; // Optional expiration date (ISO 8601)
  image_url?: string; // Optional header image
  link_url?: string; // Optional external link
  link_text?: string; // Text for external link
  tags?: string[]; // Tags for categorization
  metadata?: Record<string, any>; // Additional metadata
}
```

## Authentication

All requests require authentication via Bearer token:

```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "list"}' \
  https://your-project.supabase.co/functions/v1/community-announcements
```

## Error Handling

The API returns standardized error responses:

```json
{
  "error": {
    "message": "Validation failed: Title is required",
    "code": "VALIDATION_FAILED"
  }
}
```

**Error Codes**:

- `UNAUTHORIZED`: Authentication required or invalid token
- `FORBIDDEN`: Insufficient permissions
- `VALIDATION_FAILED`: Invalid request data
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_ERROR`: Server error

## Rate Limiting

- **Per minute**: 60 requests
- **Per hour**: 1000 requests

## Usage Examples

### Frontend Integration

```typescript
// List published announcements
const response = await fetch('/functions/v1/community-announcements?is_published=true&limit=5', {
  headers: {
    Authorization: `Bearer ${userToken}`,
  },
});

// Create new announcement (admin only)
const newAnnouncement = await fetch('/functions/v1/community-announcements', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'create',
    data: {
      title: 'New Feature Available',
      content: 'We have released exciting new features...',
      type: 'announcement',
      is_published: true,
    },
  }),
});

// Bulk publish multiple announcements
const bulkPublish = await fetch('/functions/v1/community-announcements', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    action: 'bulk_update',
    ids: ['uuid1', 'uuid2'],
    data: { is_published: true },
  }),
});
```

## Security Features

- **JWT Authentication**: All requests require valid authentication
- **Role-based Access**: Admin role required for write operations
- **Input Validation**: Comprehensive validation of all inputs
- **Rate Limiting**: Prevents abuse with configurable limits
- **CORS Support**: Properly configured cross-origin requests

## Database Dependencies

This function operates on the following Supabase tables:

- `CommunityAnnouncements`: Main announcements table
- `Practitioners`: User data for authentication and role checking

Ensure proper RLS (Row Level Security) policies are configured on these tables.

## Deployment

Deploy using Supabase CLI:

```bash
supabase functions deploy community-announcements
```

## Monitoring

The function logs all operations for monitoring:

- Authentication attempts
- Authorization checks
- Operation execution
- Error conditions

Monitor function performance and errors in the Supabase dashboard.

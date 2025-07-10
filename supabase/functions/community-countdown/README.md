# Community Countdown API

A dedicated Supabase Edge Function for comprehensive countdown management with real-time calculations, timezone support, and customizable display formats.

## Features

- **Real-time Countdown Calculations**: Accurate countdown calculations with timezone support
- **CRUD Operations**: Full create, read, update, delete support
- **Bulk Operations**: Efficient bulk updates for multiple countdowns
- **Advanced Display Formats**: Multiple display formats with custom labels
- **Timezone Support**: Proper timezone handling for global users
- **Progress Tracking**: Calculate progress percentage between start and end dates
- **Completion Handling**: Configurable actions when countdown completes
- **Featured Content**: Feature/unfeature countdowns for priority display
- **Role-based Security**: Admin-only write operations, authenticated read access

## API Endpoints

### Base URL

```
https://your-project.supabase.co/functions/v1/community-countdown
```

## Operations

### 1. List Countdowns (GET)

**Endpoint**: `GET /community-countdown`

**Query Parameters**:

- `is_active`: Filter by active status (true/false)
- `is_featured`: Filter by featured status (true/false)
- `is_completed`: Filter by completion status (true/false)
- `target_after`: Filter countdowns targeting after date (ISO 8601)
- `target_before`: Filter countdowns targeting before date (ISO 8601)
- `search`: Search in title and description
- `timezone`: Timezone for calculations (default: UTC)

**Example**:

```bash
GET /community-countdown?is_active=true&timezone=America/New_York
```

**Response**:

```json
{
  "success": true,
  "data": {
    "countdowns": [
      {
        "id": "uuid",
        "title": "Product Launch",
        "target_date": "2024-12-31T23:59:59Z",
        "calculation": {
          "total_seconds": 2592000,
          "days": 30,
          "hours": 0,
          "minutes": 0,
          "seconds": 0,
          "is_completed": false,
          "formatted_display": "30d 0h 0m 0s"
        },
        "formatted_display": "30 days",
        "is_completed": false
      }
    ],
    "total_count": 5,
    "active_count": 3,
    "completed_count": 2
  }
}
```

### 2. Get Single Countdown (GET/POST)

**GET Endpoint**: `GET /community-countdown?action=get&id=uuid&timezone=UTC`

**POST Payload**:

```json
{
  "action": "get",
  "id": "countdown-uuid",
  "timezone": "America/New_York"
}
```

### 3. Create Countdown (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "create",
  "data": {
    "title": "Product Launch Countdown",
    "description": "Countdown to our exciting new product launch",
    "target_date": "2024-12-31T23:59:59Z",
    "timezone": "America/New_York",
    "is_active": true,
    "is_featured": false,
    "display_format": "days_hours_minutes",
    "completed_message": "🎉 Product has launched!",
    "completed_action": "show_message",
    "auto_hide_after_completion": true,
    "show_seconds": false,
    "custom_labels": {
      "days": "days",
      "hours": "hrs",
      "minutes": "mins",
      "seconds": "secs"
    },
    "metadata": {
      "event_type": "product_launch",
      "priority": "high"
    }
  }
}
```

### 4. Update Countdown (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "update",
  "id": "countdown-uuid",
  "data": {
    "title": "Updated Title",
    "target_date": "2024-12-31T23:59:59Z",
    "display_format": "compact"
  }
}
```

### 5. Delete Countdown (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "delete",
  "id": "countdown-uuid"
}
```

### 6. Calculate Countdown (GET/POST)

Real-time countdown calculation for a specific countdown.

**GET Endpoint**: `GET /community-countdown?action=calculate&id=uuid&timezone=UTC&calculation_type=real_time`

**POST Payload**:

```json
{
  "action": "calculate",
  "id": "countdown-uuid",
  "timezone": "America/New_York",
  "calculation_type": "real_time"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "id": "countdown-uuid",
    "calculation": {
      "total_seconds": 86400,
      "days": 1,
      "hours": 0,
      "minutes": 0,
      "seconds": 0,
      "is_completed": false,
      "formatted_display": "1d 0h 0m 0s",
      "progress_percentage": 75.5
    },
    "formatted_display": "1 day",
    "timezone": "America/New_York",
    "calculation_type": "real_time",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### 7. Bulk Update (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "bulk_update",
  "ids": ["uuid1", "uuid2", "uuid3"],
  "data": {
    "is_active": true,
    "display_format": "full"
  }
}
```

### 8. Activate/Deactivate Countdown (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "activate", // or "deactivate"
  "id": "countdown-uuid"
}
```

### 9. Feature/Unfeature Countdown (POST)

**Required Role**: Admin

**Payload**:

```json
{
  "action": "feature", // or "unfeature"
  "id": "countdown-uuid"
}
```

## Data Schema

### CountdownData Interface

```typescript
interface CountdownData {
  title?: string; // Countdown title (required for create)
  description?: string; // Optional description
  target_date?: string; // Target date in ISO 8601 format (required for create)
  timezone?: string; // Timezone (default: UTC)
  is_active?: boolean; // Active status
  is_featured?: boolean; // Featured status
  display_format?: 'days_hours_minutes' | 'days_only' | 'hours_minutes' | 'full' | 'compact';
  completed_message?: string; // Message to show when completed
  completed_action?: 'hide' | 'show_message' | 'redirect' | 'custom';
  redirect_url?: string; // URL to redirect to when completed
  auto_hide_after_completion?: boolean; // Auto-hide countdown after completion
  show_seconds?: boolean; // Show seconds in display
  custom_labels?: {
    // Custom labels for time units
    days?: string;
    hours?: string;
    minutes?: string;
    seconds?: string;
  };
  metadata?: Record<string, any>; // Additional metadata
}
```

### Display Formats

- **`days_hours_minutes`**: "30 days 5 hours 20 minutes"
- **`days_only`**: "30 days"
- **`hours_minutes`**: "725 hours 20 minutes" (converts days to hours)
- **`full`**: "30 days, 5 hours, 20 minutes, 45 seconds"
- **`compact`**: "30:05:20" or "30:05:20:45" (with seconds)

### Completion Actions

- **`hide`**: Hide the countdown when completed
- **`show_message`**: Show the completion message
- **`redirect`**: Redirect to specified URL
- **`custom`**: Trigger custom action (client-side handling)

## Real-time Usage

### WebSocket-like Updates

For real-time countdown updates, you can poll the calculate endpoint:

```javascript
// Real-time countdown update
async function updateCountdown(countdownId, timezone = 'UTC') {
  const response = await fetch(
    `/functions/v1/community-countdown?action=calculate&id=${countdownId}&timezone=${timezone}`,
    {
      headers: { Authorization: `Bearer ${userToken}` },
    }
  );

  const data = await response.json();
  if (data.success) {
    return data.data.calculation;
  }
}

// Update every second
setInterval(() => {
  updateCountdown('countdown-uuid').then(calculation => {
    // Update UI with calculation.formatted_display
    document.getElementById('countdown').textContent = calculation.formatted_display;

    if (calculation.is_completed) {
      // Handle completion
      clearInterval(intervalId);
    }
  });
}, 1000);
```

### Timezone Handling

The API supports full timezone handling:

```javascript
// Get user's timezone
const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Fetch countdown with user's timezone
const response = await fetch(
  `/functions/v1/community-countdown?action=get&id=${countdownId}&timezone=${userTimezone}`
);
```

## Frontend Integration Examples

### React Hook

```typescript
import { useState, useEffect } from 'react';

interface CountdownCalculation {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  is_completed: boolean;
  formatted_display: string;
}

export function useCountdown(countdownId: string, timezone?: string) {
  const [calculation, setCalculation] = useState<CountdownCalculation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const updateCountdown = async () => {
      try {
        const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const response = await fetch(
          `/functions/v1/community-countdown?action=calculate&id=${countdownId}&timezone=${tz}`,
          {
            headers: { Authorization: `Bearer ${userToken}` },
          }
        );

        const data = await response.json();
        if (data.success) {
          setCalculation(data.data.calculation);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error updating countdown:', error);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [countdownId, timezone]);

  return { calculation, loading };
}
```

### Vue Composable

```typescript
import { ref, onMounted, onUnmounted } from 'vue';

export function useCountdown(countdownId: string, timezone?: string) {
  const calculation = ref(null);
  const loading = ref(true);
  let intervalId: number | null = null;

  const updateCountdown = async () => {
    try {
      const tz = timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch(
        `/functions/v1/community-countdown?action=calculate&id=${countdownId}&timezone=${tz}`,
        {
          headers: { Authorization: `Bearer ${userToken}` },
        }
      );

      const data = await response.json();
      if (data.success) {
        calculation.value = data.data.calculation;
        loading.value = false;
      }
    } catch (error) {
      console.error('Error updating countdown:', error);
    }
  };

  onMounted(() => {
    updateCountdown();
    intervalId = setInterval(updateCountdown, 1000);
  });

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId);
  });

  return { calculation, loading };
}
```

## Authentication

All requests require authentication via Bearer token:

```bash
curl -X GET \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "https://your-project.supabase.co/functions/v1/community-countdown?is_active=true"
```

## Error Handling

The API returns standardized error responses:

```json
{
  "error": {
    "message": "Target date must be in the future",
    "code": "VALIDATION_FAILED"
  }
}
```

## Rate Limiting

- **Per minute**: 120 requests (higher for real-time calculations)
- **Per hour**: 2000 requests

## Performance Considerations

- **Caching**: Client-side caching recommended for countdown data
- **Rate Limiting**: Use efficient polling intervals (1-5 seconds)
- **Timezone**: Calculate client-side when possible to reduce API calls
- **Bulk Operations**: Use bulk endpoints for multiple countdowns

## Security Features

- **JWT Authentication**: All requests require valid authentication
- **Role-based Access**: Admin role required for write operations
- **Input Validation**: Comprehensive validation including date validation
- **Rate Limiting**: Prevents abuse with higher limits for real-time use
- **CORS Support**: Properly configured cross-origin requests

## Database Dependencies

This function operates on the following Supabase tables:

- `CommunityCountdowns`: Main countdowns table
- `Practitioners`: User data for authentication and role checking

## Deployment

Deploy using Supabase CLI:

```bash
supabase functions deploy community-countdown
```

## Monitoring

The function logs all operations for monitoring and provides performance metrics for real-time calculations.

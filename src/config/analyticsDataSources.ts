// ABOUTME: Analytics data source registry mapping all production tables to queryable configurations

export type DataType = 'number' | 'string' | 'date' | 'boolean' | 'json';
export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'first' | 'last';

export interface DataField {
  key: string;
  label: string;
  type: DataType;
  aggregatable?: boolean;
  aggregations?: AggregationType[];
  description?: string;
}

export interface DataSource {
  id: string;
  name: string;
  table: string;
  description: string;
  fields: DataField[];
  dateField?: string; // Primary date field for time-based charts
  defaultOrderBy?: string;
  category: 'payments' | 'users' | 'content' | 'community' | 'system';
}

// Define all available data sources from production database
export const analyticsDataSources: DataSource[] = [
  {
    id: 'payment_webhooks',
    name: 'Payment Webhooks',
    table: 'payment_webhooks',
    description: 'Payment transaction events and webhook data',
    category: 'payments',
    dateField: 'created_at',
    defaultOrderBy: 'created_at',
    fields: [
      {
        key: 'id',
        label: 'Webhook ID',
        type: 'string',
        description: 'Unique webhook identifier'
      },
      {
        key: 'payment_id',
        label: 'Payment ID',
        type: 'string',
        description: 'Payment transaction identifier'
      },
      {
        key: 'event_type',
        label: 'Event Type',
        type: 'string',
        description: 'Type of payment event (charge.paid, charge.failed, etc.)'
      },
      {
        key: 'status',
        label: 'Payment Status',
        type: 'string',
        description: 'Current payment status'
      },
      {
        key: 'amount',
        label: 'Amount (cents)',
        type: 'number',
        aggregatable: true,
        aggregations: ['sum', 'avg', 'min', 'max', 'count'],
        description: 'Payment amount in cents'
      },
      {
        key: 'created_at',
        label: 'Created Date',
        type: 'date',
        description: 'When the webhook was received'
      },
      {
        key: 'webhook_data',
        label: 'Webhook Data',
        type: 'json',
        description: 'Full webhook payload data'
      }
    ]
  },
  {
    id: 'practitioners',
    name: 'Practitioners',
    table: 'Practitioners',
    description: 'User profiles and practitioner information',
    category: 'users',
    dateField: 'created_at',
    defaultOrderBy: 'created_at',
    fields: [
      {
        key: 'id',
        label: 'Practitioner ID',
        type: 'string',
        description: 'Unique practitioner identifier'
      },
      {
        key: 'name',
        label: 'Name',
        type: 'string',
        description: 'Practitioner full name'
      },
      {
        key: 'email',
        label: 'Email',
        type: 'string',
        description: 'Practitioner email address'
      },
      {
        key: 'subscription_tier',
        label: 'Subscription Tier',
        type: 'string',
        description: 'Current subscription level'
      },
      {
        key: 'subscription_status',
        label: 'Subscription Status',
        type: 'string',
        description: 'Active, trialing, canceled, etc.'
      },
      {
        key: 'trial_ends_at',
        label: 'Trial End Date',
        type: 'date',
        description: 'When trial period ends'
      },
      {
        key: 'created_at',
        label: 'Registration Date',
        type: 'date',
        description: 'When user registered'
      },
      {
        key: 'updated_at',
        label: 'Last Updated',
        type: 'date',
        description: 'Last profile update'
      }
    ]
  },
  {
    id: 'community_posts',
    name: 'Community Posts',
    table: 'CommunityPosts',
    description: 'Community forum posts and discussions',
    category: 'community',
    dateField: 'created_at',
    defaultOrderBy: 'created_at',
    fields: [
      {
        key: 'id',
        label: 'Post ID',
        type: 'string',
        description: 'Unique post identifier'
      },
      {
        key: 'title',
        label: 'Post Title',
        type: 'string',
        description: 'Post title'
      },
      {
        key: 'author_id',
        label: 'Author ID',
        type: 'string',
        description: 'Post author practitioner ID'
      },
      {
        key: 'post_type',
        label: 'Post Type',
        type: 'string',
        description: 'Type of community post'
      },
      {
        key: 'tags',
        label: 'Tags',
        type: 'json',
        description: 'Post tags array'
      },
      {
        key: 'upvotes',
        label: 'Upvotes',
        type: 'number',
        aggregatable: true,
        aggregations: ['sum', 'avg', 'min', 'max', 'count'],
        description: 'Number of upvotes'
      },
      {
        key: 'created_at',
        label: 'Created Date',
        type: 'date',
        description: 'When post was created'
      },
      {
        key: 'updated_at',
        label: 'Last Updated',
        type: 'date',
        description: 'Last post update'
      }
    ]
  },
  {
    id: 'reviews',
    name: 'Reviews',
    table: 'Reviews',
    description: 'Content reviews and publications',
    category: 'content',
    dateField: 'created_at',
    defaultOrderBy: 'created_at',
    fields: [
      {
        key: 'id',
        label: 'Review ID',
        type: 'string',
        description: 'Unique review identifier'
      },
      {
        key: 'title',
        label: 'Review Title',
        type: 'string',
        description: 'Review title'
      },
      {
        key: 'slug',
        label: 'Review Slug',
        type: 'string',
        description: 'URL slug for review'
      },
      {
        key: 'author_id',
        label: 'Author ID',
        type: 'string',
        description: 'Review author practitioner ID'
      },
      {
        key: 'status',
        label: 'Review Status',
        type: 'string',
        description: 'Published, draft, archived, etc.'
      },
      {
        key: 'view_count',
        label: 'View Count',
        type: 'number',
        aggregatable: true,
        aggregations: ['sum', 'avg', 'min', 'max', 'count'],
        description: 'Number of views'
      },
      {
        key: 'created_at',
        label: 'Created Date',
        type: 'date',
        description: 'When review was created'
      },
      {
        key: 'published_at',
        label: 'Published Date',
        type: 'date',
        description: 'When review was published'
      },
      {
        key: 'updated_at',
        label: 'Last Updated',
        type: 'date',
        description: 'Last review update'
      }
    ]
  },
  {
    id: 'community_post_interactions',
    name: 'Post Interactions',
    table: 'CommunityPostInteractions',
    description: 'User interactions with community posts',
    category: 'community',
    dateField: 'created_at',
    defaultOrderBy: 'created_at',
    fields: [
      {
        key: 'id',
        label: 'Interaction ID',
        type: 'string',
        description: 'Unique interaction identifier'
      },
      {
        key: 'post_id',
        label: 'Post ID',
        type: 'string',
        description: 'Related community post ID'
      },
      {
        key: 'user_id',
        label: 'User ID',
        type: 'string',
        description: 'User who interacted'
      },
      {
        key: 'interaction_type',
        label: 'Interaction Type',
        type: 'string',
        description: 'Type of interaction (upvote, comment, etc.)'
      },
      {
        key: 'created_at',
        label: 'Interaction Date',
        type: 'date',
        description: 'When interaction occurred'
      }
    ]
  },
  {
    id: 'community_comments',
    name: 'Community Comments',
    table: 'CommunityComments',
    description: 'Comments on community posts',
    category: 'community',
    dateField: 'created_at',
    defaultOrderBy: 'created_at',
    fields: [
      {
        key: 'id',
        label: 'Comment ID',
        type: 'string',
        description: 'Unique comment identifier'
      },
      {
        key: 'post_id',
        label: 'Post ID',
        type: 'string',
        description: 'Related community post ID'
      },
      {
        key: 'author_id',
        label: 'Author ID',
        type: 'string',
        description: 'Comment author practitioner ID'
      },
      {
        key: 'parent_comment_id',
        label: 'Parent Comment',
        type: 'string',
        description: 'Parent comment for threaded discussions'
      },
      {
        key: 'content',
        label: 'Comment Content',
        type: 'string',
        description: 'Comment text content'
      },
      {
        key: 'created_at',
        label: 'Created Date',
        type: 'date',
        description: 'When comment was posted'
      },
      {
        key: 'updated_at',
        label: 'Last Updated',
        type: 'date',
        description: 'Last comment update'
      }
    ]
  }
];

// Helper functions for working with data sources
export const getDataSourceById = (id: string): DataSource | undefined => {
  return analyticsDataSources.find(source => source.id === id);
};

export const getDataSourcesByCategory = (category: DataSource['category']): DataSource[] => {
  return analyticsDataSources.filter(source => source.category === category);
};

export const getAvailableFields = (sourceId: string): DataField[] => {
  const source = getDataSourceById(sourceId);
  return source?.fields || [];
};

export const getAggregatableFields = (sourceId: string): DataField[] => {
  const source = getDataSourceById(sourceId);
  return source?.fields.filter(field => field.aggregatable) || [];
};

export const getDateFields = (sourceId: string): DataField[] => {
  const source = getDataSourceById(sourceId);
  return source?.fields.filter(field => field.type === 'date') || [];
};

// Chart configuration types for UI components
export const chartTypes = [
  { value: 'line', label: 'Line Chart', icon: '📈' },
  { value: 'bar', label: 'Bar Chart', icon: '📊' },
  { value: 'area', label: 'Area Chart', icon: '🏔️' },
  { value: 'scatter', label: 'Scatter Plot', icon: '⚪' },
  { value: 'pie', label: 'Pie Chart', icon: '🥧' },
] as const;

export type ChartType = typeof chartTypes[number]['value'];
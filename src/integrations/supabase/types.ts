export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      Communities: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          created_at: string
          description: string | null
          id: string
          member_count: number | null
          name: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number | null
          name: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          member_count?: number | null
          name?: string
        }
        Relationships: []
      }
      CommunityAnnouncements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_featured: boolean
          is_published: boolean
          link_text: string | null
          link_url: string | null
          priority: number
          published_at: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          link_text?: string | null
          link_url?: string | null
          priority?: number
          published_at?: string | null
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean
          is_published?: boolean
          link_text?: string | null
          link_url?: string | null
          priority?: number
          published_at?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "CommunityAnnouncements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      CommunityCategories: {
        Row: {
          background_color: string
          border_color: string
          created_at: string
          created_by: string | null
          description: string | null
          display_order: number
          hidden_from_user_selection: boolean | null
          icon_name: string | null
          id: number
          is_active: boolean
          is_system: boolean
          label: string
          name: string
          text_color: string
          updated_at: string
        }
        Insert: {
          background_color?: string
          border_color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          hidden_from_user_selection?: boolean | null
          icon_name?: string | null
          id?: number
          is_active?: boolean
          is_system?: boolean
          label: string
          name: string
          text_color?: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          border_color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order?: number
          hidden_from_user_selection?: boolean | null
          icon_name?: string | null
          id?: number
          is_active?: boolean
          is_system?: boolean
          label?: string
          name?: string
          text_color?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "CommunityCategories_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      CommunityCountdowns: {
        Row: {
          completed_message: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_format: string
          id: string
          is_active: boolean
          is_featured: boolean
          start_date: string | null
          target_date: string
          timezone: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_message?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_format?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          start_date?: string | null
          target_date: string
          timezone?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_message?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_format?: string
          id?: string
          is_active?: boolean
          is_featured?: boolean
          start_date?: string | null
          target_date?: string
          timezone?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "CommunityCountdowns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      CommunityCustomSections: {
        Row: {
          content_data: Json
          content_type: string
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          is_visible: boolean
          sidebar_section_id: string | null
          updated_at: string
        }
        Insert: {
          content_data?: Json
          content_type: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          sidebar_section_id?: string | null
          updated_at?: string
        }
        Update: {
          content_data?: Json
          content_type?: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          is_visible?: boolean
          sidebar_section_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "CommunityCustomSections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CommunityCustomSections_sidebar_section_id_fkey"
            columns: ["sidebar_section_id"]
            isOneToOne: false
            referencedRelation: "CommunitySidebarSections"
            referencedColumns: ["id"]
          },
        ]
      }
      CommunityModerationActions: {
        Row: {
          action_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          moderator_id: string | null
          post_id: number | null
          reason: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moderator_id?: string | null
          post_id?: number | null
          reason?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          moderator_id?: string | null
          post_id?: number | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "CommunityModerationActions_moderator_id_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CommunityModerationActions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "CommunityPosts"
            referencedColumns: ["id"]
          },
        ]
      }
      CommunityOnlineUsers: {
        Row: {
          created_at: string
          id: string
          is_viewing_community: boolean
          last_seen_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_viewing_community?: boolean
          last_seen_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_viewing_community?: boolean
          last_seen_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "CommunityOnlineUsers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      CommunityPost_Votes: {
        Row: {
          created_at: string | null
          id: string
          post_id: number | null
          practitioner_id: string | null
          vote_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: number | null
          practitioner_id?: string | null
          vote_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: number | null
          practitioner_id?: string | null
          vote_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "CommunityPost_Votes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "CommunityPosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CommunityPost_Votes_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      CommunityPosts: {
        Row: {
          admin_created_by: string | null
          admin_notes: string | null
          author_id: string | null
          category: string
          category_id: number | null
          community_id: string | null
          content: string
          created_at: string | null
          downvotes: number | null
          flair_color: string | null
          flair_text: string | null
          id: number
          image_url: string | null
          is_locked: boolean | null
          is_pinned: boolean | null
          is_rewarded: boolean
          link_preview_data: Json | null
          link_url: string | null
          parent_post_id: number | null
          poll_data: Json | null
          post_status: string | null
          post_type: string
          review_id: number | null
          scheduled_publish_at: string | null
          structured_content: Json | null
          title: string | null
          upvotes: number | null
          video_url: string | null
          visibility_level: string | null
        }
        Insert: {
          admin_created_by?: string | null
          admin_notes?: string | null
          author_id?: string | null
          category?: string
          category_id?: number | null
          community_id?: string | null
          content: string
          created_at?: string | null
          downvotes?: number | null
          flair_color?: string | null
          flair_text?: string | null
          id?: number
          image_url?: string | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          is_rewarded?: boolean
          link_preview_data?: Json | null
          link_url?: string | null
          parent_post_id?: number | null
          poll_data?: Json | null
          post_status?: string | null
          post_type?: string
          review_id?: number | null
          scheduled_publish_at?: string | null
          structured_content?: Json | null
          title?: string | null
          upvotes?: number | null
          video_url?: string | null
          visibility_level?: string | null
        }
        Update: {
          admin_created_by?: string | null
          admin_notes?: string | null
          author_id?: string | null
          category?: string
          category_id?: number | null
          community_id?: string | null
          content?: string
          created_at?: string | null
          downvotes?: number | null
          flair_color?: string | null
          flair_text?: string | null
          id?: number
          image_url?: string | null
          is_locked?: boolean | null
          is_pinned?: boolean | null
          is_rewarded?: boolean
          link_preview_data?: Json | null
          link_url?: string | null
          parent_post_id?: number | null
          poll_data?: Json | null
          post_status?: string | null
          post_type?: string
          review_id?: number | null
          scheduled_publish_at?: string | null
          structured_content?: Json | null
          title?: string | null
          upvotes?: number | null
          video_url?: string | null
          visibility_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "CommunityPosts_admin_created_by_fkey"
            columns: ["admin_created_by"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CommunityPosts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CommunityPosts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "CommunityCategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CommunityPosts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "Communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CommunityPosts_parent_post_id_fkey"
            columns: ["parent_post_id"]
            isOneToOne: false
            referencedRelation: "CommunityPosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "CommunityPosts_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "Reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      CommunitySidebarSections: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          is_system: boolean
          is_visible: boolean
          section_type: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          is_system?: boolean
          is_visible?: boolean
          section_type: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          is_system?: boolean
          is_visible?: boolean
          section_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "CommunitySidebarSections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      CommunityStats: {
        Row: {
          id: string
          stat_key: string
          stat_value: Json
          updated_at: string | null
        }
        Insert: {
          id?: string
          stat_key: string
          stat_value: Json
          updated_at?: string | null
        }
        Update: {
          id?: string
          stat_key?: string
          stat_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      ContentTypes: {
        Row: {
          background_color: string
          border_color: string
          created_at: string
          created_by: string | null
          description: string | null
          id: number
          is_system: boolean
          label: string
          text_color: string
        }
        Insert: {
          background_color?: string
          border_color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_system?: boolean
          label: string
          text_color?: string
        }
        Update: {
          background_color?: string
          border_color?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          is_system?: boolean
          label?: string
          text_color?: string
        }
        Relationships: [
          {
            foreignKeyName: "ContentTypes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      email_dispatch_log: {
        Row: {
          created_at: string
          email_type: string
          id: string
          plan_name: string
          recipient_email: string
          sent_at: string
          status: string
          subject: string
          token_used: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_type: string
          id?: string
          plan_name: string
          recipient_email: string
          sent_at?: string
          status?: string
          subject: string
          token_used: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_type?: string
          id?: string
          plan_name?: string
          recipient_email?: string
          sent_at?: string
          status?: string
          subject?: string
          token_used?: string
          updated_at?: string
        }
        Relationships: []
      }
      Notifications: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string | null
          metadata: Json | null
          practitioner_id: string
          title: string | null
          type: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json | null
          practitioner_id: string
          title?: string | null
          type?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string | null
          metadata?: Json | null
          practitioner_id?: string
          title?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "Notifications_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      OnboardingAnswers: {
        Row: {
          answer: Json
          created_at: string
          id: number
          practitioner_id: string
          question_id: number
        }
        Insert: {
          answer: Json
          created_at?: string
          id?: number
          practitioner_id: string
          question_id: number
        }
        Update: {
          answer?: Json
          created_at?: string
          id?: number
          practitioner_id?: string
          question_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "OnboardingAnswers_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "OnboardingAnswers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "OnboardingQuestions"
            referencedColumns: ["id"]
          },
        ]
      }
      OnboardingQuestions: {
        Row: {
          created_at: string
          id: number
          options: Json | null
          order_index: number
          question_text: string
          question_type: string
        }
        Insert: {
          created_at?: string
          id?: number
          options?: Json | null
          order_index: number
          question_text: string
          question_type: string
        }
        Update: {
          created_at?: string
          id?: number
          options?: Json | null
          order_index?: number
          question_text?: string
          question_type?: string
        }
        Relationships: []
      }
      page_settings: {
        Row: {
          avatar_background_color: string | null
          avatar_icon: string | null
          avatar_icon_color: string | null
          avatar_icon_size: number | null
          avatar_type: string | null
          avatar_url: string | null
          banner_background_color: string | null
          banner_url: string | null
          created_at: string | null
          font_family: string | null
          id: string
          is_active: boolean | null
          page_id: string
          prefix_color: string | null
          prefix_shadow: boolean | null
          prefix_size: string | null
          prefix_size_custom: number | null
          show_avatar: boolean | null
          title: string | null
          title_color: string | null
          title_prefix: string | null
          title_shadow: boolean | null
          title_size: string | null
          title_size_custom: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_background_color?: string | null
          avatar_icon?: string | null
          avatar_icon_color?: string | null
          avatar_icon_size?: number | null
          avatar_type?: string | null
          avatar_url?: string | null
          banner_background_color?: string | null
          banner_url?: string | null
          created_at?: string | null
          font_family?: string | null
          id?: string
          is_active?: boolean | null
          page_id: string
          prefix_color?: string | null
          prefix_shadow?: boolean | null
          prefix_size?: string | null
          prefix_size_custom?: number | null
          show_avatar?: boolean | null
          title?: string | null
          title_color?: string | null
          title_prefix?: string | null
          title_shadow?: boolean | null
          title_size?: string | null
          title_size_custom?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_background_color?: string | null
          avatar_icon?: string | null
          avatar_icon_color?: string | null
          avatar_icon_size?: number | null
          avatar_type?: string | null
          avatar_url?: string | null
          banner_background_color?: string | null
          banner_url?: string | null
          created_at?: string | null
          font_family?: string | null
          id?: string
          is_active?: boolean | null
          page_id?: string
          prefix_color?: string | null
          prefix_shadow?: boolean | null
          prefix_size?: string | null
          prefix_size_custom?: number | null
          show_avatar?: boolean | null
          title?: string | null
          title_color?: string | null
          title_prefix?: string | null
          title_shadow?: boolean | null
          title_size?: string | null
          title_size_custom?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      PageAccessControl: {
        Row: {
          created_at: string
          id: number
          is_active: boolean
          page_path: string
          redirect_url: string
          required_access_level: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          is_active?: boolean
          page_path: string
          redirect_url?: string
          required_access_level: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          is_active?: boolean
          page_path?: string
          redirect_url?: string
          required_access_level?: string
          updated_at?: string
        }
        Relationships: []
      }
      paymentplansv2: {
        Row: {
          base_amount: number
          created_at: string | null
          created_by: string | null
          credit_card_config: Json | null
          custom_link_parameter: string | null
          description: string | null
          discount_config: Json | null
          display_config: Json | null
          duration_days: number | null
          final_amount: number
          id: string
          installment_config: Json | null
          is_active: boolean | null
          name: string
          pix_config: Json | null
          plan_type: string | null
          promotional_config: Json | null
          slug: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          base_amount: number
          created_at?: string | null
          created_by?: string | null
          credit_card_config?: Json | null
          custom_link_parameter?: string | null
          description?: string | null
          discount_config?: Json | null
          display_config?: Json | null
          duration_days?: number | null
          final_amount: number
          id?: string
          installment_config?: Json | null
          is_active?: boolean | null
          name: string
          pix_config?: Json | null
          plan_type?: string | null
          promotional_config?: Json | null
          slug?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          base_amount?: number
          created_at?: string | null
          created_by?: string | null
          credit_card_config?: Json | null
          custom_link_parameter?: string | null
          description?: string | null
          discount_config?: Json | null
          display_config?: Json | null
          duration_days?: number | null
          final_amount?: number
          id?: string
          installment_config?: Json | null
          is_active?: boolean | null
          name?: string
          pix_config?: Json | null
          plan_type?: string | null
          promotional_config?: Json | null
          slug?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      pending_account_links: {
        Row: {
          created_at: string | null
          customer_data: Json
          email: string
          expires_at: string
          id: string
          is_used: boolean | null
          link_type: string
          payment_data: Json
          plan_data: Json
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_data?: Json
          email: string
          expires_at: string
          id?: string
          is_used?: boolean | null
          link_type: string
          payment_data?: Json
          plan_data?: Json
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_data?: Json
          email?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          link_type?: string
          payment_data?: Json
          plan_data?: Json
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      PollOptions: {
        Row: {
          created_at: string | null
          id: number
          option_text: string
          poll_id: number | null
          vote_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          option_text: string
          poll_id?: number | null
          vote_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          option_text?: string
          poll_id?: number | null
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "PollOptions_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "Polls"
            referencedColumns: ["id"]
          },
        ]
      }
      Polls: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: number
          is_featured: boolean | null
          question: string
          total_votes: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: number
          is_featured?: boolean | null
          question: string
          total_votes?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: number
          is_featured?: boolean | null
          question?: string
          total_votes?: number | null
        }
        Relationships: []
      }
      PollVotes: {
        Row: {
          created_at: string
          id: number
          option_index: number
          post_id: number
          practitioner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          option_index: number
          post_id: number
          practitioner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          option_index?: number
          post_id?: number
          practitioner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "PollVotes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "CommunityPosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "PollVotes_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      Practitioners: {
        Row: {
          avatar_url: string | null
          contribution_score: number
          created_at: string
          display_hover_card: boolean
          facebook_url: string | null
          full_name: string | null
          id: string
          instagram_url: string | null
          linkedin_url: string | null
          location: string | null
          phone: string | null
          profession: string | null
          role: string
          subscription_ends_at: string | null
          subscription_starts_at: string | null
          subscription_tier: string
          twitter_url: string | null
          updated_at: string | null
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          contribution_score?: number
          created_at?: string
          display_hover_card?: boolean
          facebook_url?: string | null
          full_name?: string | null
          id: string
          instagram_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          profession?: string | null
          role?: string
          subscription_ends_at?: string | null
          subscription_starts_at?: string | null
          subscription_tier?: string
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          contribution_score?: number
          created_at?: string
          display_hover_card?: boolean
          facebook_url?: string | null
          full_name?: string | null
          id?: string
          instagram_url?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          profession?: string | null
          role?: string
          subscription_ends_at?: string | null
          subscription_starts_at?: string | null
          subscription_tier?: string
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      Publication_History: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          notes: string | null
          performed_by: string
          review_id: number
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          performed_by: string
          review_id: number
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          performed_by?: string
          review_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "Publication_History_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Publication_History_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "Reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_log: {
        Row: {
          created_at: string | null
          id: number
          key: string
          timestamp: number
        }
        Insert: {
          created_at?: string | null
          id?: number
          key: string
          timestamp: number
        }
        Update: {
          created_at?: string | null
          id?: number
          key?: string
          timestamp?: number
        }
        Relationships: []
      }
      review_editor_content: {
        Row: {
          created_at: string
          id: string
          review_id: number
          structured_content: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: number
          structured_content: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: number
          structured_content?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_review_editor_content_review_id"
            columns: ["review_id"]
            isOneToOne: true
            referencedRelation: "Reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_editor_content_backup: {
        Row: {
          created_at: string | null
          id: string | null
          review_id: number | null
          structured_content: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          review_id?: number | null
          structured_content?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          review_id?: number | null
          structured_content?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ReviewContentTypes: {
        Row: {
          content_type_id: number
          created_at: string
          id: number
          review_id: number
        }
        Insert: {
          content_type_id: number
          created_at?: string
          id?: number
          review_id: number
        }
        Update: {
          content_type_id?: number
          created_at?: string
          id?: number
          review_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ReviewContentTypes_content_type_id_fkey"
            columns: ["content_type_id"]
            isOneToOne: false
            referencedRelation: "ContentTypes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ReviewContentTypes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "Reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      Reviews: {
        Row: {
          access_level: string
          archived_at: string | null
          author_id: string | null
          community_post_id: number | null
          cover_image_url: string | null
          created_at: string
          custom_author_avatar_url: string | null
          custom_author_name: string | null
          description: string | null
          edicao: string | null
          id: number
          original_article_authors: string | null
          original_article_publication_date: string | null
          original_article_title: string | null
          publication_notes: string | null
          published_at: string | null
          reading_time_minutes: number | null
          review_requested_at: string | null
          review_status: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          scheduled_publish_at: string | null
          status: string
          structured_content: Json
          study_type: string | null
          title: string
          view_count: number
        }
        Insert: {
          access_level?: string
          archived_at?: string | null
          author_id?: string | null
          community_post_id?: number | null
          cover_image_url?: string | null
          created_at?: string
          custom_author_avatar_url?: string | null
          custom_author_name?: string | null
          description?: string | null
          edicao?: string | null
          id?: number
          original_article_authors?: string | null
          original_article_publication_date?: string | null
          original_article_title?: string | null
          publication_notes?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          review_requested_at?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          scheduled_publish_at?: string | null
          status?: string
          structured_content?: Json
          study_type?: string | null
          title: string
          view_count?: number
        }
        Update: {
          access_level?: string
          archived_at?: string | null
          author_id?: string | null
          community_post_id?: number | null
          cover_image_url?: string | null
          created_at?: string
          custom_author_avatar_url?: string | null
          custom_author_name?: string | null
          description?: string | null
          edicao?: string | null
          id?: number
          original_article_authors?: string | null
          original_article_publication_date?: string | null
          original_article_title?: string | null
          publication_notes?: string | null
          published_at?: string | null
          reading_time_minutes?: number | null
          review_requested_at?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          scheduled_publish_at?: string | null
          status?: string
          structured_content?: Json
          study_type?: string | null
          title?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "Reviews_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      ReviewTags: {
        Row: {
          created_at: string
          id: number
          review_id: number
          tag_id: number
        }
        Insert: {
          created_at?: string
          id?: number
          review_id: number
          tag_id: number
        }
        Update: {
          created_at?: string
          id?: number
          review_id?: number
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ReviewTags_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "Reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ReviewTags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "Tags"
            referencedColumns: ["id"]
          },
        ]
      }
      SavedPosts: {
        Row: {
          created_at: string
          id: string
          post_id: number
          practitioner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: number
          practitioner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: number
          practitioner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "SavedPosts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "CommunityPosts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "SavedPosts_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      SiteSettings: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: number
          is_public: boolean | null
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_public?: boolean | null
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: number
          is_public?: boolean | null
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      Suggestion_Votes: {
        Row: {
          created_at: string
          id: string
          practitioner_id: string
          suggestion_id: number
        }
        Insert: {
          created_at?: string
          id?: string
          practitioner_id: string
          suggestion_id: number
        }
        Update: {
          created_at?: string
          id?: string
          practitioner_id?: string
          suggestion_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_votes_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Suggestion_Votes_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suggestion_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "Suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "Suggestion_Votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "Suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      Suggestions: {
        Row: {
          created_at: string
          description: string | null
          id: number
          status: string
          submitted_by: string | null
          title: string
          upvotes: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          status?: string
          submitted_by?: string | null
          title: string
          upvotes?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          status?: string
          submitted_by?: string | null
          title?: string
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "Suggestions_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      SystemAuditLog: {
        Row: {
          action_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          performed_by: string
          resource_id: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by: string
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          performed_by?: string
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "SystemAuditLog_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      Tags: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: number
          parent_id: number | null
          tag_name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: number
          parent_id?: number | null
          tag_name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: number
          parent_id?: number | null
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "Tags_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "Tags"
            referencedColumns: ["id"]
          },
        ]
      }
      UserRoles: {
        Row: {
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          practitioner_id: string
          role_name: string
        }
        Insert: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          practitioner_id: string
          role_name: string
        }
        Update: {
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          practitioner_id?: string
          role_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "UserRoles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "UserRoles_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "Practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_post_and_auto_vote: {
        Args:
          | {
              p_author_id: string
              p_category: string
              p_content: string
              p_parent_id?: number
              p_title: string
            }
          | {
              p_author_id: string
              p_category: string
              p_content: string
              p_title: string
            }
        Returns: {
          admin_created_by: string | null
          admin_notes: string | null
          author_id: string | null
          category: string
          category_id: number | null
          community_id: string | null
          content: string
          created_at: string | null
          downvotes: number | null
          flair_color: string | null
          flair_text: string | null
          id: number
          image_url: string | null
          is_locked: boolean | null
          is_pinned: boolean | null
          is_rewarded: boolean
          link_preview_data: Json | null
          link_url: string | null
          parent_post_id: number | null
          poll_data: Json | null
          post_status: string | null
          post_type: string
          review_id: number | null
          scheduled_publish_at: string | null
          structured_content: Json | null
          title: string | null
          upvotes: number | null
          video_url: string | null
          visibility_level: string | null
        }
      }
      debug_community_posts: {
        Args: Record<PropertyKey, never>
        Returns: {
          author_id: string
          author_name: string
          id: number
          image_url: string
          poll_data: Json
          post_type: string
          title: string
          video_url: string
        }[]
      }
      export_analytics_data: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      generate_plan_slug: {
        Args: { plan_name: string }
        Returns: string
      }
      get_comments_for_post: {
        Args: { p_post_id: number; p_user_id: string }
        Returns: {
          author: Json
          content: string
          created_at: string
          downvotes: number
          id: number
          is_rewarded: boolean
          nesting_level: number
          parent_post_id: number
          reply_count: number
          upvotes: number
          user_vote: string
        }[]
      }
      get_community_feed_with_details: {
        Args: { p_limit: number; p_offset: number; p_user_id: string }
        Returns: {
          author: Json
          category: string
          content: string
          created_at: string
          downvotes: number
          flair_color: string
          flair_text: string
          id: number
          image_url: string
          is_locked: boolean
          is_pinned: boolean
          link_preview_data: Json
          link_url: string
          poll_data: Json
          post_type: string
          reply_count: number
          title: string
          upvotes: number
          user_vote: string
          video_url: string
        }[]
      }
      get_community_members_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_content_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_engagement_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_evidens_user_subscription: {
        Args: { user_uuid: string }
        Returns: {
          expires_at: string
          is_trial: boolean
          subscription_status: string
          subscription_tier: string
          trial_days_remaining: number
        }[]
      }
      get_homepage_suggestions: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          description: string
          id: number
          Practitioners: Json
          title: string
          upvotes: number
          user_has_voted: boolean
        }[]
      }
      get_multiple_comment_counts: {
        Args: { post_ids: number[] }
        Returns: {
          count: number
          post_id: number
        }[]
      }
      get_my_claim: {
        Args: { claim: string }
        Returns: string
      }
      get_online_users_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_public_page_access_rules: {
        Args: Record<PropertyKey, never>
        Returns: {
          is_active: boolean
          page_path: string
          redirect_url: string
          required_access_level: string
        }[]
      }
      get_recent_online_users: {
        Args: { p_limit?: number }
        Returns: {
          avatar_url: string
          full_name: string
          last_seen_at: string
          user_id: string
        }[]
      }
      get_total_comment_count: {
        Args: { post_id: number }
        Returns: number
      }
      get_user_activity_metrics: {
        Args: { user_ids: string[] }
        Returns: {
          comments_count: number
          last_login_at: string
          posts_count: number
          reviews_count: number
          user_id: string
          votes_given: number
        }[]
      }
      get_user_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_payment_order_id: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_roles: {
        Args: { p_user_id: string }
        Returns: {
          expires_at: string
          granted_at: string
          role_name: string
        }[]
      }
      handle_post_action: {
        Args: { p_action_type: string; p_post_id: number; p_user_id: string }
        Returns: Json
      }
      is_email_setup_completed: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_payment_created_account: {
        Args: { user_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action_type: string
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_performed_by: string
          p_resource_id?: string
          p_resource_type: string
        }
        Returns: string
      }
      sync_user_claims: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_current_jwt_claims: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      update_community_stats: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_evidens_payment_status: {
        Args: { new_status: string; order_id: string; pagarme_data?: Json }
        Returns: boolean
      }
      update_user_jwt_claims: {
        Args: {
          new_role: string
          new_subscription_tier: string
          user_id: string
        }
        Returns: undefined
      }
      update_user_online_status: {
        Args: { p_is_viewing_community?: boolean; p_user_id: string }
        Returns: undefined
      }
      user_has_role: {
        Args: { p_role_name: string; p_user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      access_level_enum: "public" | "free" | "premium" | "editor_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      access_level_enum: ["public", "free", "premium", "editor_admin"],
    },
  },
} as const
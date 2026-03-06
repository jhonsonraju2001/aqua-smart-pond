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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          id: string
          is_active: boolean
          message: string
          pond_id: string
          resolved_at: string | null
          severity: string
          triggered_at: string
          type: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          message: string
          pond_id: string
          resolved_at?: string | null
          severity: string
          triggered_at?: string
          type: string
        }
        Update: {
          id?: string
          is_active?: boolean
          message?: string
          pond_id?: string
          resolved_at?: string | null
          severity?: string
          triggered_at?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "alerts_pond_id_fkey"
            columns: ["pond_id"]
            isOneToOne: false
            referencedRelation: "ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      camera_recordings: {
        Row: {
          camera_id: string
          duration_seconds: number | null
          ended_at: string | null
          file_size_bytes: number | null
          id: string
          recording_type: string
          started_at: string
          status: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          camera_id: string
          duration_seconds?: number | null
          ended_at?: string | null
          file_size_bytes?: number | null
          id?: string
          recording_type?: string
          started_at?: string
          status?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          camera_id?: string
          duration_seconds?: number | null
          ended_at?: string | null
          file_size_bytes?: number | null
          id?: string
          recording_type?: string
          started_at?: string
          status?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "camera_recordings_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
        ]
      }
      camera_snapshots: {
        Row: {
          camera_id: string
          captured_at: string
          id: string
          image_url: string
          is_motion_triggered: boolean
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          camera_id: string
          captured_at?: string
          id?: string
          image_url: string
          is_motion_triggered?: boolean
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          camera_id?: string
          captured_at?: string
          id?: string
          image_url?: string
          is_motion_triggered?: boolean
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "camera_snapshots_camera_id_fkey"
            columns: ["camera_id"]
            isOneToOne: false
            referencedRelation: "cameras"
            referencedColumns: ["id"]
          },
        ]
      }
      cameras: {
        Row: {
          audio_enabled: boolean
          created_at: string
          frame_rate: number | null
          id: string
          ip_address: string
          is_online: boolean
          last_seen: string | null
          motion_alerts_enabled: boolean
          motion_detection_enabled: boolean
          motion_sensitivity: number
          name: string
          password: string | null
          pond_id: string | null
          port: number
          resolution: string | null
          rtsp_url: string | null
          stream_quality: string
          stream_type: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          audio_enabled?: boolean
          created_at?: string
          frame_rate?: number | null
          id?: string
          ip_address: string
          is_online?: boolean
          last_seen?: string | null
          motion_alerts_enabled?: boolean
          motion_detection_enabled?: boolean
          motion_sensitivity?: number
          name: string
          password?: string | null
          pond_id?: string | null
          port?: number
          resolution?: string | null
          rtsp_url?: string | null
          stream_quality?: string
          stream_type?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          audio_enabled?: boolean
          created_at?: string
          frame_rate?: number | null
          id?: string
          ip_address?: string
          is_online?: boolean
          last_seen?: string | null
          motion_alerts_enabled?: boolean
          motion_detection_enabled?: boolean
          motion_sensitivity?: number
          name?: string
          password?: string | null
          pond_id?: string | null
          port?: number
          resolution?: string | null
          rtsp_url?: string | null
          stream_quality?: string
          stream_type?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cameras_pond_id_fkey"
            columns: ["pond_id"]
            isOneToOne: false
            referencedRelation: "ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      device_schedules: {
        Row: {
          created_at: string
          days_of_week: number[]
          device_id: string
          end_time: string
          id: string
          is_active: boolean
          start_time: string
        }
        Insert: {
          created_at?: string
          days_of_week: number[]
          device_id: string
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
        }
        Update: {
          created_at?: string
          days_of_week?: number[]
          device_id?: string
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_schedules_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          auto_mode: boolean
          created_at: string
          id: string
          is_on: boolean
          name: string
          pond_id: string
          type: string
        }
        Insert: {
          auto_mode?: boolean
          created_at?: string
          id?: string
          is_on?: boolean
          name: string
          pond_id: string
          type: string
        }
        Update: {
          auto_mode?: boolean
          created_at?: string
          id?: string
          is_on?: boolean
          name?: string
          pond_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_pond_id_fkey"
            columns: ["pond_id"]
            isOneToOne: false
            referencedRelation: "ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      ponds: {
        Row: {
          created_at: string
          device_ip: string
          id: string
          location: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_ip: string
          id?: string
          location?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_ip?: string
          id?: string
          location?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sensor_readings: {
        Row: {
          dissolved_oxygen: number
          id: string
          ph: number
          pond_id: string
          recorded_at: string
          temperature: number
        }
        Insert: {
          dissolved_oxygen: number
          id?: string
          ph: number
          pond_id: string
          recorded_at?: string
          temperature: number
        }
        Update: {
          dissolved_oxygen?: number
          id?: string
          ph?: number
          pond_id?: string
          recorded_at?: string
          temperature?: number
        }
        Relationships: [
          {
            foreignKeyName: "sensor_readings_pond_id_fkey"
            columns: ["pond_id"]
            isOneToOne: false
            referencedRelation: "ponds"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          alerts_enabled: boolean
          auto_mode_enabled: boolean
          camera_enabled: boolean
          camera_ip: string | null
          camera_rtsp_url: string | null
          created_at: string
          do_min: number
          id: string
          manual_override: boolean
          ph_max: number
          ph_min: number
          temp_max: number
          temp_min: number
          temp_unit: string | null
          updated_at: string
          user_id: string
          weather_location: string | null
          weather_temp_enabled: boolean | null
        }
        Insert: {
          alerts_enabled?: boolean
          auto_mode_enabled?: boolean
          camera_enabled?: boolean
          camera_ip?: string | null
          camera_rtsp_url?: string | null
          created_at?: string
          do_min?: number
          id?: string
          manual_override?: boolean
          ph_max?: number
          ph_min?: number
          temp_max?: number
          temp_min?: number
          temp_unit?: string | null
          updated_at?: string
          user_id: string
          weather_location?: string | null
          weather_temp_enabled?: boolean | null
        }
        Update: {
          alerts_enabled?: boolean
          auto_mode_enabled?: boolean
          camera_enabled?: boolean
          camera_ip?: string | null
          camera_rtsp_url?: string | null
          created_at?: string
          do_min?: number
          id?: string
          manual_override?: boolean
          ph_max?: number
          ph_min?: number
          temp_max?: number
          temp_min?: number
          temp_unit?: string | null
          updated_at?: string
          user_id?: string
          weather_location?: string | null
          weather_temp_enabled?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const

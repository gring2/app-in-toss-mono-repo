export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.15';
  };
  public: {
    Tables: {
      perception_responses: {
        Row: {
          answers: number[];
          created_at: string;
          id: string;
          respondent_user_id: string;
          room_id: string;
          updated_at: string;
        };
        Insert: {
          answers: number[];
          created_at?: string;
          id?: string;
          respondent_user_id: string;
          room_id: string;
          updated_at?: string;
        };
        Update: {
          answers?: number[];
          created_at?: string;
          id?: string;
          respondent_user_id?: string;
          room_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'perception_responses_room_id_fkey';
            columns: ['room_id'];
            isOneToOne: false;
            referencedRelation: 'perception_rooms';
            referencedColumns: ['id'];
          },
        ];
      };
      perception_rooms: {
        Row: {
          created_at: string;
          display_name: string;
          expires_at: string;
          id: string;
          invite_token_hash: string;
          owner_key_hash: string | null;
          owner_user_id: string;
          question_images: (string | null)[];
          questions: string[];
          self_answers: number[];
        };
        Insert: {
          created_at?: string;
          display_name: string;
          expires_at?: string;
          id?: string;
          invite_token_hash: string;
          owner_key_hash?: string | null;
          owner_user_id: string;
          question_images?: (string | null)[];
          questions?: string[];
          self_answers: number[];
        };
        Update: {
          created_at?: string;
          display_name?: string;
          expires_at?: string;
          id?: string;
          invite_token_hash?: string;
          owner_key_hash?: string | null;
          owner_user_id?: string;
          question_images?: (string | null)[];
          questions?: string[];
          self_answers?: number[];
        };
        Relationships: [];
      };
      perception_owner_devices: {
        Row: {
          auth_user_id: string;
          created_at: string;
          owner_key_hash: string;
          updated_at: string;
        };
        Insert: {
          auth_user_id: string;
          created_at?: string;
          owner_key_hash: string;
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string;
          created_at?: string;
          owner_key_hash?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_perception_room: {
        Args: { p_display_name: string; p_self_answers: number[] };
        Returns: {
          expires_at: string;
          invite_token: string;
          room_id: string;
        }[];
      };
      create_perception_room_v2: {
        Args: { p_display_name: string; p_owner_key: string; p_self_answers: number[] };
        Returns: {
          expires_at: string;
          invite_token: string;
          room_id: string;
        }[];
      };
      create_perception_room_v3: {
        Args: {
          p_display_name: string;
          p_owner_key: string;
          p_questions: string[];
          p_self_answers: number[];
        };
        Returns: {
          expires_at: string;
          invite_token: string;
          room_id: string;
        }[];
      };
      create_perception_room_v4: {
        Args: {
          p_display_name: string;
          p_owner_key: string;
          p_question_images: (string | null)[];
          p_questions: string[];
          p_self_answers: number[];
        };
        Returns: {
          expires_at: string;
          invite_token: string;
          room_id: string;
        }[];
      };
      delete_expired_perception_rooms: { Args: never; Returns: number };
      delete_perception_room: { Args: { p_room_id: string }; Returns: boolean };
      delete_perception_room_v2: { Args: { p_owner_key: string; p_room_id: string }; Returns: boolean };
      get_perception_invite: { Args: { p_invite_token: string }; Returns: Json };
      get_perception_invite_v2: {
        Args: { p_invite_token: string; p_owner_key: string };
        Returns: Json;
      };
      get_perception_results: { Args: { p_room_id: string }; Returns: Json };
      get_perception_results_v2: { Args: { p_owner_key: string; p_room_id: string }; Returns: Json };
      list_perception_rooms_v2: {
        Args: { p_owner_key: string };
        Returns: {
          created_at: string;
          display_name: string;
          expires_at: string;
          required_count: number;
          response_count: number;
          revealed: boolean;
          room_id: string;
        }[];
      };
      rotate_perception_invite: {
        Args: { p_room_id: string };
        Returns: {
          expires_at: string;
          invite_token: string;
        }[];
      };
      rotate_perception_invite_v2: {
        Args: { p_owner_key: string; p_room_id: string };
        Returns: {
          expires_at: string;
          invite_token: string;
        }[];
      };
      submit_perception_response: {
        Args: { p_answers: number[]; p_invite_token: string };
        Returns: Json;
      };
      submit_perception_response_v2: {
        Args: { p_answers: number[]; p_invite_token: string; p_owner_key: string };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

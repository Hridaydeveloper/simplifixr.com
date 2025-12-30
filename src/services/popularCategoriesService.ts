import { supabase } from "@/integrations/supabase/client";

export interface PopularCategory {
  id: string;
  title: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  category_link?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const popularCategoriesService = {
  async getActiveCategories(): Promise<PopularCategory[]> {
    const { data, error } = await supabase
      .from('popular_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching popular categories:', error);
      throw error;
    }

    return data || [];
  },

  async getAllCategories(): Promise<PopularCategory[]> {
    const { data, error } = await supabase
      .from('popular_categories')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching all popular categories:', error);
      throw error;
    }

    return data || [];
  },

  async addCategory(category: Omit<PopularCategory, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<PopularCategory> {
    const { data, error } = await supabase
      .from('popular_categories')
      .insert([category])
      .select()
      .single();

    if (error) {
      console.error('Error adding popular category:', error);
      throw error;
    }

    return data;
  },

  async updateCategory(id: string, updates: Partial<Omit<PopularCategory, 'id' | 'created_at' | 'updated_at' | 'created_by'>>): Promise<PopularCategory> {
    const { data, error } = await supabase
      .from('popular_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating popular category:', error);
      throw error;
    }

    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    const { error } = await supabase
      .from('popular_categories')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting popular category:', error);
      throw error;
    }
  },

  async toggleCategoryStatus(id: string, is_active: boolean): Promise<PopularCategory> {
    const { data, error } = await supabase
      .from('popular_categories')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling category status:', error);
      throw error;
    }

    return data;
  }
};

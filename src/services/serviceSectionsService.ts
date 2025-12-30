import { supabase } from "@/integrations/supabase/client";

export interface ServiceSection {
  id: string;
  title: string;
  image_url: string;
  sub_points: string[];
  icon_color?: string;
  gradient?: string;
  display_order: number;
  is_active: boolean;
  category_link?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export const serviceSectionsService = {
  async getActiveSections(): Promise<ServiceSection[]> {
    const { data, error } = await supabase
      .from('service_sections')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching service sections:', error);
      throw error;
    }

    return data || [];
  },

  async getAllSections(): Promise<ServiceSection[]> {
    const { data, error } = await supabase
      .from('service_sections')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching all service sections:', error);
      throw error;
    }

    return data || [];
  },

  async addSection(section: Omit<ServiceSection, 'id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<ServiceSection> {
    const { data, error } = await supabase
      .from('service_sections')
      .insert([section])
      .select()
      .single();

    if (error) {
      console.error('Error adding service section:', error);
      throw error;
    }

    return data;
  },

  async updateSection(id: string, updates: Partial<Omit<ServiceSection, 'id' | 'created_at' | 'updated_at' | 'created_by'>>): Promise<ServiceSection> {
    const { data, error } = await supabase
      .from('service_sections')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating service section:', error);
      throw error;
    }

    return data;
  },

  async deleteSection(id: string): Promise<void> {
    const { error } = await supabase
      .from('service_sections')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service section:', error);
      throw error;
    }
  },

  async toggleSectionStatus(id: string, is_active: boolean): Promise<ServiceSection> {
    const { data, error } = await supabase
      .from('service_sections')
      .update({ is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error toggling section status:', error);
      throw error;
    }

    return data;
  }
};

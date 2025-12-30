import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Edit3, Link, ImageIcon } from 'lucide-react';
import { popularCategoriesService, PopularCategory } from '@/services/popularCategoriesService';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PopularCategoriesManager = () => {
  const [categories, setCategories] = useState<PopularCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<PopularCategory | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadTab, setUploadTab] = useState<'url' | 'file'>('url');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [newCategory, setNewCategory] = useState({
    image_url: '',
    title: '',
    display_order: 0,
    category_link: ''
  });
  const { toast } = useToast();

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await popularCategoriesService.getAllCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch popular categories",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `categories/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const publicUrl = await uploadFile(file);
    if (publicUrl) {
      setNewCategory({ ...newCategory, image_url: publicUrl });
    }
  };

  const handleEditFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingCategory) return;
    const publicUrl = await uploadFile(file);
    if (publicUrl) {
      setEditingCategory({ ...editingCategory, image_url: publicUrl });
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.image_url || !newCategory.title) {
      toast({
        title: "Error",
        description: "Please fill in image and title",
        variant: "destructive",
      });
      return;
    }

    try {
      await popularCategoriesService.addCategory({
        image_url: newCategory.image_url,
        title: newCategory.title,
        display_order: newCategory.display_order,
        is_active: true,
        category_link: newCategory.category_link || undefined
      });
      
      toast({ title: "Success", description: "Category added successfully" });
      setIsAddDialogOpen(false);
      setNewCategory({ image_url: '', title: '', display_order: 0, category_link: '' });
      fetchCategories();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add category", variant: "destructive" });
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory) return;

    try {
      await popularCategoriesService.updateCategory(editingCategory.id, {
        image_url: editingCategory.image_url,
        title: editingCategory.title,
        display_order: editingCategory.display_order,
        category_link: editingCategory.category_link
      });
      
      toast({ title: "Success", description: "Category updated successfully" });
      setIsEditDialogOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update category", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await popularCategoriesService.toggleCategoryStatus(id, !currentStatus);
      toast({ title: "Success", description: `Category ${!currentStatus ? 'activated' : 'deactivated'}` });
      fetchCategories();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await popularCategoriesService.deleteCategory(id);
      toast({ title: "Success", description: "Category deleted" });
      fetchCategories();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    }
  };

  if (loading) return <div className="p-4">Loading popular categories...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Popular Categories</h2>
          <p className="text-muted-foreground">Manage categories shown on home page (image + title)</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add Category</DialogTitle>
              <DialogDescription>Add a new popular category with image and title</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as 'url' | 'file')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url"><Link className="w-4 h-4 mr-2" />URL</TabsTrigger>
                  <TabsTrigger value="file"><ImageIcon className="w-4 h-4 mr-2" />Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="mt-4">
                  <Label>Image URL *</Label>
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={newCategory.image_url}
                    onChange={(e) => setNewCategory({ ...newCategory, image_url: e.target.value })}
                  />
                </TabsContent>
                <TabsContent value="file" className="mt-4">
                  <Label>Upload Image *</Label>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileSelect} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full mt-2" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Choose Image'}
                  </Button>
                  {newCategory.image_url && <p className="text-sm text-muted-foreground mt-2 truncate">{newCategory.image_url}</p>}
                </TabsContent>
              </Tabs>

              {newCategory.image_url && (
                <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden mx-auto">
                  <img src={newCategory.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <Label>Title *</Label>
                <Input placeholder="e.g., Women's Salon" value={newCategory.title} onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })} />
              </div>
              <div>
                <Label>Category Link (optional)</Label>
                <Input placeholder="e.g., salon" value={newCategory.category_link} onChange={(e) => setNewCategory({ ...newCategory, category_link: e.target.value })} />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input type="number" value={newCategory.display_order} onChange={(e) => setNewCategory({ ...newCategory, display_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddCategory} disabled={uploading}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden mx-auto">
                <img src={editingCategory.image_url} alt={editingCategory.title} className="w-full h-full object-cover" />
              </div>
              <Tabs defaultValue="url">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url"><Link className="w-4 h-4 mr-2" />URL</TabsTrigger>
                  <TabsTrigger value="file"><ImageIcon className="w-4 h-4 mr-2" />Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="mt-4">
                  <Label>Image URL *</Label>
                  <Input value={editingCategory.image_url} onChange={(e) => setEditingCategory({ ...editingCategory, image_url: e.target.value })} />
                </TabsContent>
                <TabsContent value="file" className="mt-4">
                  <input type="file" ref={editFileInputRef} accept="image/*" onChange={handleEditFileSelect} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => editFileInputRef.current?.click()} className="w-full" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Choose New Image'}
                  </Button>
                </TabsContent>
              </Tabs>
              <div>
                <Label>Title *</Label>
                <Input value={editingCategory.title} onChange={(e) => setEditingCategory({ ...editingCategory, title: e.target.value })} />
              </div>
              <div>
                <Label>Category Link</Label>
                <Input value={editingCategory.category_link || ''} onChange={(e) => setEditingCategory({ ...editingCategory, category_link: e.target.value })} />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input type="number" value={editingCategory.display_order} onChange={(e) => setEditingCategory({ ...editingCategory, display_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditCategory} disabled={uploading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={category.image_url} alt={category.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{category.title}</h3>
                    <Badge variant={category.is_active ? 'default' : 'secondary'}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Order: {category.display_order}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Switch checked={category.is_active} onCheckedChange={() => handleToggleStatus(category.id, category.is_active)} />
                    <Button size="sm" variant="ghost" onClick={() => { setEditingCategory(category); setIsEditDialogOpen(true); }}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteCategory(category.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PopularCategoriesManager;

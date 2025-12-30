import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Plus, Edit3, Link, ImageIcon, X } from 'lucide-react';
import { serviceSectionsService, ServiceSection } from '@/services/serviceSectionsService';
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

const ServiceSectionsManager = () => {
  const [sections, setSections] = useState<ServiceSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<ServiceSection | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadTab, setUploadTab] = useState<'url' | 'file'>('url');
  const [newSubPoint, setNewSubPoint] = useState('');
  const [editSubPoint, setEditSubPoint] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [newSection, setNewSection] = useState({
    image_url: '',
    title: '',
    sub_points: [] as string[],
    display_order: 0,
    category_link: '',
    icon_color: 'text-primary',
    gradient: 'from-primary/20 to-accent/20'
  });
  const { toast } = useToast();

  const fetchSections = async () => {
    try {
      setLoading(true);
      const data = await serviceSectionsService.getAllSections();
      setSections(data);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({ title: "Error", description: "Failed to fetch service sections", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSections();
  }, []);

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `sections/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('banners').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('banners').getPublicUrl(fileName);
      return publicUrl;
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const publicUrl = await uploadFile(file);
    if (publicUrl) setNewSection({ ...newSection, image_url: publicUrl });
  };

  const handleEditFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingSection) return;
    const publicUrl = await uploadFile(file);
    if (publicUrl) setEditingSection({ ...editingSection, image_url: publicUrl });
  };

  const addSubPoint = () => {
    if (!newSubPoint.trim()) return;
    setNewSection({ ...newSection, sub_points: [...newSection.sub_points, newSubPoint.trim()] });
    setNewSubPoint('');
  };

  const removeSubPoint = (index: number) => {
    setNewSection({ ...newSection, sub_points: newSection.sub_points.filter((_, i) => i !== index) });
  };

  const addEditSubPoint = () => {
    if (!editSubPoint.trim() || !editingSection) return;
    setEditingSection({ ...editingSection, sub_points: [...editingSection.sub_points, editSubPoint.trim()] });
    setEditSubPoint('');
  };

  const removeEditSubPoint = (index: number) => {
    if (!editingSection) return;
    setEditingSection({ ...editingSection, sub_points: editingSection.sub_points.filter((_, i) => i !== index) });
  };

  const handleAddSection = async () => {
    if (!newSection.image_url || !newSection.title) {
      toast({ title: "Error", description: "Please fill in image and title", variant: "destructive" });
      return;
    }

    try {
      await serviceSectionsService.addSection({
        image_url: newSection.image_url,
        title: newSection.title,
        sub_points: newSection.sub_points,
        display_order: newSection.display_order,
        is_active: true,
        category_link: newSection.category_link || undefined,
        icon_color: newSection.icon_color,
        gradient: newSection.gradient
      });
      
      toast({ title: "Success", description: "Service section added" });
      setIsAddDialogOpen(false);
      setNewSection({ image_url: '', title: '', sub_points: [], display_order: 0, category_link: '', icon_color: 'text-primary', gradient: 'from-primary/20 to-accent/20' });
      fetchSections();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add section", variant: "destructive" });
    }
  };

  const handleEditSection = async () => {
    if (!editingSection) return;

    try {
      await serviceSectionsService.updateSection(editingSection.id, {
        image_url: editingSection.image_url,
        title: editingSection.title,
        sub_points: editingSection.sub_points,
        display_order: editingSection.display_order,
        category_link: editingSection.category_link,
        icon_color: editingSection.icon_color,
        gradient: editingSection.gradient
      });
      
      toast({ title: "Success", description: "Section updated" });
      setIsEditDialogOpen(false);
      setEditingSection(null);
      fetchSections();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update section", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await serviceSectionsService.toggleSectionStatus(id, !currentStatus);
      toast({ title: "Success", description: `Section ${!currentStatus ? 'activated' : 'deactivated'}` });
      fetchSections();
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Delete this section?')) return;
    try {
      await serviceSectionsService.deleteSection(id);
      toast({ title: "Success", description: "Section deleted" });
      fetchSections();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete section", variant: "destructive" });
    }
  };

  if (loading) return <div className="p-4">Loading service sections...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">All Services Section</h2>
          <p className="text-muted-foreground">Manage service cards (image + title + sub points)</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Section
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Service Section</DialogTitle>
              <DialogDescription>Add a new service section with image, title and sub points</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Tabs value={uploadTab} onValueChange={(v) => setUploadTab(v as 'url' | 'file')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url"><Link className="w-4 h-4 mr-2" />URL</TabsTrigger>
                  <TabsTrigger value="file"><ImageIcon className="w-4 h-4 mr-2" />Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="mt-4">
                  <Label>Image URL *</Label>
                  <Input placeholder="https://example.com/image.jpg" value={newSection.image_url} onChange={(e) => setNewSection({ ...newSection, image_url: e.target.value })} />
                </TabsContent>
                <TabsContent value="file" className="mt-4">
                  <Label>Upload Image *</Label>
                  <input type="file" ref={fileInputRef} accept="image/*" onChange={handleFileSelect} className="hidden" />
                  <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full mt-2" disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Choose Image'}
                  </Button>
                  {newSection.image_url && <p className="text-sm text-muted-foreground mt-2 truncate">{newSection.image_url}</p>}
                </TabsContent>
              </Tabs>

              {newSection.image_url && (
                <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden mx-auto">
                  <img src={newSection.image_url} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div>
                <Label>Title *</Label>
                <Input placeholder="e.g., Cleaning & Sanitation" value={newSection.title} onChange={(e) => setNewSection({ ...newSection, title: e.target.value })} />
              </div>

              <div>
                <Label>Sub Points (descriptions)</Label>
                <div className="flex gap-2">
                  <Input placeholder="e.g., Deep cleaning, bathroom, kitchen" value={newSubPoint} onChange={(e) => setNewSubPoint(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSubPoint())} />
                  <Button type="button" onClick={addSubPoint} size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newSection.sub_points.map((point, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                      {point}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeSubPoint(idx)} />
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Category Link</Label>
                <Input placeholder="e.g., cleaning" value={newSection.category_link} onChange={(e) => setNewSection({ ...newSection, category_link: e.target.value })} />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input type="number" value={newSection.display_order} onChange={(e) => setNewSection({ ...newSection, display_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddSection} disabled={uploading}>Add</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Service Section</DialogTitle>
          </DialogHeader>
          {editingSection && (
            <div className="space-y-4">
              <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden mx-auto">
                <img src={editingSection.image_url} alt={editingSection.title} className="w-full h-full object-cover" />
              </div>
              <Tabs defaultValue="url">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="url"><Link className="w-4 h-4 mr-2" />URL</TabsTrigger>
                  <TabsTrigger value="file"><ImageIcon className="w-4 h-4 mr-2" />Upload</TabsTrigger>
                </TabsList>
                <TabsContent value="url" className="mt-4">
                  <Label>Image URL *</Label>
                  <Input value={editingSection.image_url} onChange={(e) => setEditingSection({ ...editingSection, image_url: e.target.value })} />
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
                <Input value={editingSection.title} onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })} />
              </div>
              <div>
                <Label>Sub Points</Label>
                <div className="flex gap-2">
                  <Input placeholder="Add sub point" value={editSubPoint} onChange={(e) => setEditSubPoint(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEditSubPoint())} />
                  <Button type="button" onClick={addEditSubPoint} size="sm">Add</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {editingSection.sub_points.map((point, idx) => (
                    <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                      {point}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeEditSubPoint(idx)} />
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <Label>Category Link</Label>
                <Input value={editingSection.category_link || ''} onChange={(e) => setEditingSection({ ...editingSection, category_link: e.target.value })} />
              </div>
              <div>
                <Label>Display Order</Label>
                <Input type="number" value={editingSection.display_order} onChange={(e) => setEditingSection({ ...editingSection, display_order: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSection} disabled={uploading}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.id}>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={section.image_url} alt={section.title} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{section.title}</h3>
                    <Badge variant={section.is_active ? 'default' : 'secondary'}>
                      {section.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {section.sub_points.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">{section.sub_points.join(', ')}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Order: {section.display_order}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Switch checked={section.is_active} onCheckedChange={() => handleToggleStatus(section.id, section.is_active)} />
                    <Button size="sm" variant="ghost" onClick={() => { setEditingSection(section); setIsEditDialogOpen(true); }}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteSection(section.id)}>
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

export default ServiceSectionsManager;

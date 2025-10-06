import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2, Plus, GripVertical, Settings } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface ManageBannersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageBannersModal({ open, onOpenChange }: ManageBannersModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'custom' as const,
    link_url: '',
    image_url: '',
    video_url: '',
    is_active: true,
    display_order: 0,
  });

  const { data: banners = [] } = useQuery({
    queryKey: ['all-promotional-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('promotional_banners')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('promotional_banners')
        .insert({
          ...data,
          created_by: user!.id,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      queryClient.invalidateQueries({ queryKey: ['all-promotional-banners'] });
      toast.success('Banner created successfully');
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create banner');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { error } = await supabase
        .from('promotional_banners')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      queryClient.invalidateQueries({ queryKey: ['all-promotional-banners'] });
      toast.success('Banner updated successfully');
      setEditingId(null);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update banner');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('promotional_banners')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotional-banners'] });
      queryClient.invalidateQueries({ queryKey: ['all-promotional-banners'] });
      toast.success('Banner deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete banner');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      content_type: 'custom',
      link_url: '',
      image_url: '',
      video_url: '',
      is_active: true,
      display_order: 0,
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (banner: any) => {
    setFormData({
      title: banner.title,
      description: banner.description || '',
      content_type: banner.content_type,
      link_url: banner.link_url || '',
      image_url: banner.image_url || '',
      video_url: banner.video_url || '',
      is_active: banner.is_active,
      display_order: banner.display_order,
    });
    setEditingId(banner.id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Manage Promotional Banners</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-4">{editingId ? 'Edit' : 'Add'} Banner</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="content_type">Content Type</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(value: any) => setFormData({ ...formData, content_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="link_url">Link URL</Label>
                <Input
                  id="link_url"
                  type="url"
                  value={formData.link_url}
                  onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>

              <div>
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? 'Update' : 'Create'} Banner
                </Button>
                {editingId && (
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Existing Banners</h3>
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-3">
                {banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="p-3 border rounded-lg hover:bg-accent/50 transition"
                  >
                    <div className="flex items-start gap-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{banner.title}</h4>
                            {banner.description && (
                              <p className="text-xs text-muted-foreground truncate">{banner.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs bg-secondary px-2 py-0.5 rounded">
                                {banner.content_type}
                              </span>
                              {!banner.is_active && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">Inactive</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1 flex-shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(banner)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteMutation.mutate(banner.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

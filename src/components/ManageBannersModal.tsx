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
import { Trash2, Plus, GripVertical, Settings, Upload, X, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface ManageBannersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageBannersModal({ open, onOpenChange }: ManageBannersModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'custom' as 'job' | 'company' | 'service' | 'image' | 'video' | 'custom',
    link_url: '',
    image_url: '',
    video_url: '',
    job_id: '',
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
      const insertData: any = {
        title: data.title,
        description: data.description,
        content_type: data.content_type,
        link_url: data.link_url,
        image_url: data.image_url,
        video_url: data.video_url,
        job_id: data.job_id || null,
        is_active: data.is_active,
        display_order: data.display_order,
        created_by: user!.id,
      };

      const { error } = await supabase
        .from('promotional_banners')
        .insert(insertData);

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
      job_id: '',
      is_active: true,
      display_order: 0,
    });
    setEditingId(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (PNG, JPG, GIF, or WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('banner-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('banner-images')
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploading(false);
    }
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
      job_id: banner.job_id || '',
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

              {formData.content_type === 'job' && (
                <div>
                  <Label htmlFor="job_id">Job ID</Label>
                  <Input
                    id="job_id"
                    value={formData.job_id}
                    onChange={(e) => setFormData({ ...formData, job_id: e.target.value })}
                    placeholder="Enter job UUID or job number"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    This will create a link to /job-detail/{'{job_id}'}
                  </p>
                </div>
              )}

              {formData.content_type !== 'job' && (
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
              )}

              <div>
                <Label htmlFor="image_upload">Upload Image/GIF</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="image_upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      disabled={uploading}
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    </Button>
                  </div>
                  {formData.image_url && (
                    <div className="relative">
                      <img 
                        src={formData.image_url} 
                        alt="Banner preview" 
                        className="w-full h-32 object-cover rounded border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setFormData({ ...formData, image_url: '' })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Or paste URL below (max 5MB, PNG/JPG/GIF/WebP)
                  </p>
                  <Input
                    id="image_url"
                    type="url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="video_url">Video URL</Label>
                <Input
                  id="video_url"
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://youtube.com/... or https://vimeo.com/..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  YouTube, Vimeo, or direct video URLs supported
                </p>
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

import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Trash2, Plus, GripVertical, Settings, Upload, X, Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
interface ManageBannersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
export function ManageBannersModal({
  open,
  onOpenChange
}: ManageBannersModalProps) {
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [localBanners, setLocalBanners] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    content_type: 'job' as 'job' | 'image' | 'video',
    link_url: '',
    image_url: '',
    video_url: '',
    job_id: '',
    is_active: true,
    display_order: 0,
    location: 'home_top'
  });
  const [locationFilter, setLocationFilter] = useState('home_top');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  const {
    data: banners = []
  } = useQuery({
    queryKey: ['all-promotional-banners'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('promotional_banners').select('*').order('display_order', {
        ascending: true
      });
      if (error) throw error;
      return data || [];
    },
    enabled: open
  });

  // Update local banners when data changes
  useEffect(() => {
    setLocalBanners(banners);
  }, [banners]);

  const reorderMutation = useMutation({
    mutationFn: async (reorderedBanners: any[]) => {
      // Update display_order for banners in the same location
      const updates = reorderedBanners.map((banner, index) => 
        supabase
          .from('promotional_banners')
          .update({ display_order: index })
          .eq('id', banner.id)
          .eq('location', locationFilter)
      );
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['promotional-banners']
      });
      queryClient.invalidateQueries({
        queryKey: ['all-promotional-banners']
      });
      toast.success('Banner order updated');
    },
    onError: () => {
      toast.error('Failed to update banner order');
      setLocalBanners(banners); // Reset to original order on error
    }
  });
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      let resolvedJobId = data.job_id || null;

      // If content_type is job and job_id is provided, resolve it
      if (data.content_type === 'job' && data.job_id) {
        // Check if it's a UUID or a job number
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.job_id);
        if (!isUUID) {
          // It's a job number, look up the UUID
          const {
            data: jobData,
            error: jobError
          } = await supabase.from('jobs').select('id').eq('job_id_number', parseInt(data.job_id)).single();
          if (jobError || !jobData) {
            throw new Error(`Job #${data.job_id} not found`);
          }
          resolvedJobId = jobData.id;
        }
      }
      const insertData: any = {
        title: '',
        description: '',
        content_type: data.content_type,
        link_url: data.link_url || '',
        image_url: data.image_url || '',
        video_url: data.video_url || '',
        job_id: resolvedJobId,
        is_active: data.is_active,
        display_order: data.display_order,
        location: data.location || 'home_top',
        created_by: user!.id
      };
      const {
        error
      } = await supabase.from('promotional_banners').insert(insertData);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['promotional-banners']
      });
      queryClient.invalidateQueries({
        queryKey: ['all-promotional-banners']
      });
      toast.success('Banner created successfully');
      resetForm();
    },
    onError: () => {
      toast.error('Failed to create banner');
    }
  });
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data
    }: {
      id: string;
      data: Partial<typeof formData>;
    }) => {
      let updateData: any = {
        ...data
      };

      // Convert empty strings to null for UUID fields
      if (updateData.job_id === '') {
        updateData.job_id = null;
      }

      // If content_type is job and job_id is provided, resolve it
      if (data.content_type === 'job' && data.job_id && data.job_id !== '') {
        // Check if it's a UUID or a job number
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.job_id);
        if (!isUUID) {
          // It's a job number, look up the UUID
          const {
            data: jobData,
            error: jobError
          } = await supabase.from('jobs').select('id').eq('job_id_number', parseInt(data.job_id)).single();
          if (jobError || !jobData) {
            throw new Error(`Job #${data.job_id} not found`);
          }
          updateData.job_id = jobData.id;
        }
      }
      
      const {
        error
      } = await supabase.from('promotional_banners').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['promotional-banners']
      });
      queryClient.invalidateQueries({
        queryKey: ['all-promotional-banners']
      });
      toast.success('Banner updated successfully');
      setEditingId(null);
      resetForm();
    },
    onError: () => {
      toast.error('Failed to update banner');
    }
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const {
        error
      } = await supabase.from('promotional_banners').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['promotional-banners']
      });
      queryClient.invalidateQueries({
        queryKey: ['all-promotional-banners']
      });
      toast.success('Banner deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete banner');
    }
  });
  const resetForm = () => {
    setFormData({
      content_type: 'job',
      link_url: '',
      image_url: '',
      video_url: '',
      job_id: '',
      is_active: true,
      display_order: 0,
      location: locationFilter
    });
    setEditingId(null);
  };
  const resizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 1200;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Draw image scaled to 1200x100
        ctx.drawImage(img, 0, 0, 1200, 100);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create blob'));
            }
          },
          file.type,
          0.95
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (PNG, JPG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    setUploading(true);
    try {
      // Resize image to 1200x400
      const resizedBlob = await resizeImage(file);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const {
        error: uploadError,
        data
      } = await supabase.storage.from('banner-images').upload(filePath, resizedBlob);
      if (uploadError) throw uploadError;
      
      const {
        data: {
          publicUrl
        }
      } = supabase.storage.from('banner-images').getPublicUrl(filePath);
      
      setFormData({
        ...formData,
        image_url: publicUrl
      });
      toast.success('Image resized to 1200×100px and uploaded successfully');
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
      updateMutation.mutate({
        id: editingId,
        data: formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };
  const handleEdit = (banner: any) => {
    setFormData({
      content_type: banner.content_type,
      link_url: banner.link_url || '',
      image_url: banner.image_url || '',
      video_url: banner.video_url || '',
      job_id: banner.job_id || '',
      is_active: banner.is_active,
      display_order: banner.display_order,
      location: banner.location || 'home_top'
    });
    setEditingId(banner.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalBanners((items) => {
        // Filter to only items in current location
        const locationItems = items.filter(item => item.location === locationFilter);
        const otherItems = items.filter(item => item.location !== locationFilter);
        
        const oldIndex = locationItems.findIndex((item) => item.id === active.id);
        const newIndex = locationItems.findIndex((item) => item.id === over.id);
        
        const reordered = arrayMove(locationItems, oldIndex, newIndex);
        
        // Update the database with new order for this location only
        reorderMutation.mutate(reordered);
        
        // Combine reordered location items with other location items
        return [...otherItems, ...reordered].sort((a, b) => {
          if (a.location !== b.location) {
            return a.location.localeCompare(b.location);
          }
          return a.display_order - b.display_order;
        });
      });
    }
  };

  // Sortable Item Component
  const SortableItem = ({ banner }: { banner: any }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: banner.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div 
        ref={setNodeRef}
        style={style}
        className="p-3 border rounded-lg hover:bg-accent/50 transition bg-background"
      >
        <div className="flex items-start gap-3">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing mt-1 flex-shrink-0"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {banner.content_type}
                  </Badge>
                  <Badge variant="outline" className="text-xs bg-primary/10 border-primary/20">
                    {banner.location?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Home Top'}
                  </Badge>
                  {!banner.is_active && (
                    <Badge variant="outline" className="text-xs">
                      Inactive
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    Order: {banner.display_order}
                  </span>
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
                  className="h-8 w-8 text-destructive hover:text-destructive" 
                  onClick={() => deleteMutation.mutate(banner.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">Manage Promotional Banners</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(85vh-8rem)] pr-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-accent/30 p-4 rounded-lg border">
                <h3 className="font-semibold mb-4 text-lg">{editingId ? 'Edit' : 'Add'} Banner</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="content_type" className="text-sm font-medium">Content Type *</Label>
                    <Select value={formData.content_type} onValueChange={(value: any) => setFormData({
                    ...formData,
                    content_type: value
                  })}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="job">Job</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                   </div>

                   <div>
                     <Label htmlFor="location" className="text-sm font-medium">Ad Location *</Label>
                     <Select value={formData.location} onValueChange={(value: string) => setFormData({
                     ...formData,
                     location: value
                   })}>
                       <SelectTrigger className="mt-1.5">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="home_top">Home - Top Banner</SelectItem>
                         <SelectItem value="opportunities_top">Opportunities - Top Banner</SelectItem>
                         <SelectItem value="sidebar">Sidebar</SelectItem>
                         <SelectItem value="footer">Footer</SelectItem>
                       </SelectContent>
                     </Select>
                     <p className="text-xs text-muted-foreground mt-1.5">
                       Choose where this banner will be displayed
                     </p>
                   </div>

                   {formData.content_type === 'job' && <>
                      <div>
                        <Label htmlFor="job_id" className="text-sm font-medium">Job ID *</Label>
                        <Input 
                          id="job_id" 
                          value={formData.job_id} 
                          onChange={e => setFormData({
                          ...formData,
                          job_id: e.target.value
                        })} 
                          placeholder="Enter job UUID or job number" 
                          required 
                          className="mt-1.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          This will link to /job-detail/{'{job_id}'}
                        </p>
                      </div>
                    </>}

                  {formData.content_type === 'image' && <>
                      <div>
                        <Label htmlFor="image_upload" className="text-sm font-medium">Image Upload *</Label>
                        <div className="space-y-2 mt-1.5">
                          <Input 
                            id="image_upload" 
                            type="file" 
                            accept="image/png,image/jpeg,image/jpg,image/gif"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="cursor-pointer"
                          />
                          <div className="bg-muted/50 p-3 rounded border text-xs space-y-1">
                            <p className="font-medium">Upload Requirements:</p>
                            <p>• Formats: JPG, PNG, GIF</p>
                            <p>• Recommended: 1200×100px (12:1 ratio)</p>
                            <p>• Banner displays at 100px height</p>
                            <p>• Max file size: 5MB</p>
                          </div>
                          {uploading && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 p-2 rounded">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading and resizing...
                            </div>
                          )}
                          {formData.image_url && !uploading && (
                            <div className="relative">
                              <img 
                                src={formData.image_url} 
                                alt="Preview" 
                                className="w-full h-24 object-cover rounded border"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6 bg-background/90 hover:bg-background shadow-sm"
                                onClick={() => setFormData({ ...formData, image_url: '' })}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="link_url" className="text-sm font-medium">Link URL (Optional)</Label>
                        <Input 
                          id="link_url" 
                          type="url" 
                          value={formData.link_url} 
                          onChange={e => setFormData({
                          ...formData,
                          link_url: e.target.value
                        })} 
                          placeholder="https://..." 
                          className="mt-1.5"
                        />
                      </div>
                    </>}

                  {formData.content_type === 'video' && <>
                      <div>
                        <Label htmlFor="video_url" className="text-sm font-medium">Video URL *</Label>
                        <Input 
                          id="video_url" 
                          type="url" 
                          value={formData.video_url} 
                          onChange={e => setFormData({
                          ...formData,
                          video_url: e.target.value
                        })} 
                          placeholder="https://youtube.com/... or https://vimeo.com/..." 
                          required 
                          className="mt-1.5"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          YouTube, Vimeo, or direct video URLs supported
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="link_url" className="text-sm font-medium">Link URL (Optional)</Label>
                        <Input 
                          id="link_url" 
                          type="url" 
                          value={formData.link_url} 
                          onChange={e => setFormData({
                          ...formData,
                          link_url: e.target.value
                        })} 
                          placeholder="https://..." 
                          className="mt-1.5"
                        />
                      </div>
                    </>}

                  <div className="flex items-center gap-3 bg-muted/50 p-3 rounded border">
                    <Switch 
                      id="is_active" 
                      checked={formData.is_active} 
                      onCheckedChange={checked => setFormData({
                      ...formData,
                      is_active: checked
                    })} 
                    />
                    <Label htmlFor="is_active" className="text-sm font-medium cursor-pointer">
                      {formData.is_active ? 'Active' : 'Inactive'}
                    </Label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending || updateMutation.isPending}
                      className="flex-1"
                    >
                      {(createMutation.isPending || updateMutation.isPending) && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      {editingId ? 'Update' : 'Create'} Banner
                    </Button>
                    {editingId && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={resetForm}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-accent/30 p-4 rounded-lg border">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">Existing Banners</h3>
                </div>
                
                <div className="mb-4">
                  <Label className="text-sm font-medium mb-2 block">Filter by Location</Label>
                  <Select value={locationFilter} onValueChange={setLocationFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="home_top">Home - Top Banner</SelectItem>
                      <SelectItem value="opportunities_top">Opportunities - Top Banner</SelectItem>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="footer">Footer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="mb-2 text-sm text-muted-foreground">
                  Showing {localBanners.filter(b => b.location === locationFilter).length} banner(s) in this location
                </div>

                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext 
                    items={localBanners.filter(b => b.location === locationFilter).map(b => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                      {localBanners
                        .filter(b => b.location === locationFilter)
                        .map(banner => (
                          <SortableItem key={banner.id} banner={banner} />
                        ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>;
}
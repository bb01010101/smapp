'use client';

import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { toast } from 'sonner';
import { SecureImage } from '@/lib/useSecureImage';
import S3ImageUpload from './S3ImageUpload';
import { X, Plus, Camera, MapPin } from 'lucide-react';

interface PetDatingProfileEditorProps {
  petId: string;
  petName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PetPost {
  id: string;
  image: string;
  createdAt: string;
}

interface DatingProfile {
  datingProfileEnabled: boolean;
  datingProfilePhotos: string[];
  location: string | null;
  posts: PetPost[];
}

export default function PetDatingProfileEditor({ 
  petId, 
  petName, 
  isOpen, 
  onOpenChange 
}: PetDatingProfileEditorProps) {
  const [profile, setProfile] = useState<DatingProfile>({
    datingProfileEnabled: true,
    datingProfilePhotos: [],
    location: '',
    posts: []
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  // Fetch current profile data
  useEffect(() => {
    if (isOpen && petId) {
      fetchProfile();
    }
  }, [isOpen, petId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pets/${petId}/dating-profile`);
      if (response.ok) {
        const data = await response.json();
        const petData = data.pet;
        setProfile({
          datingProfileEnabled: petData.datingProfileEnabled ?? true,
          datingProfilePhotos: petData.datingProfilePhotos || [],
          location: petData.location || '',
          posts: petData.posts || []
        });
        setSelectedPhotos(petData.datingProfilePhotos || []);
      } else {
        toast.error('Failed to load dating profile');
      }
    } catch (error) {
      console.error('Error fetching dating profile:', error);
      toast.error('Failed to load dating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/pets/${petId}/dating-profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          datingProfileEnabled: profile.datingProfileEnabled,
          datingProfilePhotos: selectedPhotos,
          location: profile.location || null,
        }),
      });

      if (response.ok) {
        toast.success('Dating profile updated successfully!');
        onOpenChange(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update dating profile');
      }
    } catch (error) {
      console.error('Error saving dating profile:', error);
      toast.error('Failed to update dating profile');
    } finally {
      setSaving(false);
    }
  };

  const togglePhotoSelection = (photoUrl: string) => {
    setSelectedPhotos(prev => {
      if (prev.includes(photoUrl)) {
        return prev.filter(url => url !== photoUrl);
      } else if (prev.length < 6) {
        return [...prev, photoUrl];
      } else {
        toast.error('You can select up to 6 photos');
        return prev;
      }
    });
  };

  const removeSelectedPhoto = (photoUrl: string) => {
    setSelectedPhotos(prev => prev.filter(url => url !== photoUrl));
  };

  const handleNewPhotoUpload = (newPhotoUrl: string) => {
    if (selectedPhotos.length < 6) {
      setSelectedPhotos(prev => [...prev, newPhotoUrl]);
      toast.success('Photo added to dating profile!');
    } else {
      toast.error('You can select up to 6 photos');
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {petName}'s Dating Profile
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dating-enabled" className="text-base font-medium">
                    Enable Dating Profile
                  </Label>
                  <p className="text-sm text-gray-500">
                    Allow {petName} to appear in SwipeNSave
                  </p>
                </div>
                <Switch
                  id="dating-enabled"
                  checked={profile.datingProfileEnabled}
                  onCheckedChange={(checked) => 
                    setProfile(prev => ({ ...prev, datingProfileEnabled: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          {profile.datingProfileEnabled && (
            <>
              {/* Location */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="location" className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location (Optional)
                    </Label>
                    <Input
                      id="location"
                      value={profile.location || ''}
                      onChange={(e) => 
                        setProfile(prev => ({ ...prev, location: e.target.value }))
                      }
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Selected Photos */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Selected Photos ({selectedPhotos.length}/6)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {selectedPhotos.map((photoUrl, index) => (
                      <div key={index} className="relative group">
                        <SecureImage
                          src={photoUrl}
                          alt={`Selected photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => removeSelectedPhoto(photoUrl)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {selectedPhotos.length < 6 && (
                      <div className="w-full h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                        <Plus className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upload New Photo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Upload New Photo</CardTitle>
                </CardHeader>
                <CardContent>
                  <S3ImageUpload
                    onChange={(img) => {
                      if (img?.url) {
                        handleNewPhotoUpload(img.url);
                      }
                    }}
                    value={null}
                    folder="pets/dating-profiles"
                    accept="image/*"
                    maxSize={16}
                  />
                </CardContent>
              </Card>

              {/* Select from Existing Posts */}
              {profile.posts.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Select from {petName}'s Posts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-4 gap-3">
                      {profile.posts.map((post) => (
                        <div
                          key={post.id}
                          className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                            selectedPhotos.includes(post.image)
                              ? 'border-blue-500 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => togglePhotoSelection(post.image)}
                        >
                          <SecureImage
                            src={post.image}
                            alt="Post image"
                            className="w-full h-20 object-cover"
                          />
                          {selectedPhotos.includes(post.image) && (
                            <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                              <div className="bg-blue-500 text-white rounded-full p-1">
                                <div className="w-3 h-3">✓</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
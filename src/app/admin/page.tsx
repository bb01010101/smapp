"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { TrophyIcon, PlusIcon, EditIcon, TrashIcon, EyeIcon } from "lucide-react";
import toast from "react-hot-toast";

type Challenge = {
  id: string;
  title: string;
  description: string;
  hashtag: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  weekNumber: number;
  year: number;
  creator: {
    username: string;
    name: string;
  };
  challengeOptions: {
    id: string;
    title: string;
    description: string;
    orderIndex: number;
    _count: {
      challengeVotes: number;
    };
  }[];
  _count: {
    challengeVotes: number;
    challengePosts: number;
  };
};

export default function AdminPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    hashtag: "",
    startDate: "",
    endDate: "",
    isActive: false,
    challengeOptions: [
      { title: "", description: "" },
      { title: "", description: "" },
      { title: "", description: "" }
    ]
  });

  // Check if user is admin
  useEffect(() => {
    if (isLoaded && user) {
      // Check if user is @bb7906 (admin)
      const isAdmin = user.username === 'bb7906';
      if (!isAdmin) {
        router.push('/');
        return;
      }
      setIsAuthorized(true);
      fetchChallenges();
    } else if (isLoaded) {
      router.push('/');
    }
  }, [user, isLoaded, router]);

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/admin/weekly-challenges');
      const data = await response.json();
      
      if (response.ok) {
        setChallenges(data.challenges || []);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate form
      if (!formData.title || !formData.description || !formData.hashtag || !formData.startDate || !formData.endDate) {
        throw new Error('Please fill in all required fields');
      }

      // Filter out empty challenge options
      const validOptions = formData.challengeOptions.filter(option => option.title.trim());

      const response = await fetch('/api/admin/weekly-challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          challengeOptions: validOptions.length > 0 ? validOptions : undefined
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Challenge created successfully!');
        setShowCreateForm(false);
        setFormData({
          title: "",
          description: "",
          hashtag: "",
          startDate: "",
          endDate: "",
          isActive: false,
          challengeOptions: [
            { title: "", description: "" },
            { title: "", description: "" },
            { title: "", description: "" }
          ]
        });
        fetchChallenges();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error creating challenge:', error);
      toast.error(error.message || 'Failed to create challenge');
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivateChallenge = async (challengeId: string) => {
    try {
      const response = await fetch('/api/admin/weekly-challenges/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Challenge activated successfully!');
        fetchChallenges();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error activating challenge:', error);
      toast.error(error.message || 'Failed to activate challenge');
    }
  };

  const handleDeleteChallenge = async (challengeId: string) => {
    if (!confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/weekly-challenges/${challengeId}`, {
        method: 'DELETE'
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success('Challenge deleted successfully!');
        fetchChallenges();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Error deleting challenge:', error);
      toast.error(error.message || 'Failed to delete challenge');
    }
  };

  const updateFormField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateChallengeOption = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      challengeOptions: prev.challengeOptions.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  if (!isLoaded || loading || !isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <TrophyIcon className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">Weekly Challenges Admin</h1>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center space-x-2">
          <PlusIcon className="w-4 h-4" />
          <span>Create Challenge</span>
        </Button>
      </div>

      {/* Create Challenge Form */}
      {showCreateForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Weekly Challenge</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateChallenge} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Challenge Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => updateFormField('title', e.target.value)}
                    placeholder="e.g., Best Halloween Costume"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="hashtag">Hashtag *</Label>
                  <Input
                    id="hashtag"
                    value={formData.hashtag}
                    onChange={(e) => updateFormField('hashtag', e.target.value)}
                    placeholder="e.g., halloween2025"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormField('description', e.target.value)}
                  placeholder="Describe the challenge..."
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => updateFormField('startDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => updateFormField('endDate', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => updateFormField('isActive', checked)}
                />
                <Label htmlFor="isActive">Activate immediately</Label>
              </div>

              {/* Future voting options (optional) */}
              <div>
                <Label className="text-base font-semibold">Challenge Options (Optional - for future voting)</Label>
                <p className="text-sm text-gray-500 mb-3">Users can vote on these options for next week's challenge</p>
                {formData.challengeOptions.map((option, index) => (
                  <div key={index} className="border rounded-lg p-4 mb-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor={`option-${index}-title`}>Option {index + 1} Title</Label>
                        <Input
                          id={`option-${index}-title`}
                          value={option.title}
                          onChange={(e) => updateChallengeOption(index, 'title', e.target.value)}
                          placeholder="e.g., Best Pool Video"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`option-${index}-description`}>Description</Label>
                        <Input
                          id={`option-${index}-description`}
                          value={option.description}
                          onChange={(e) => updateChallengeOption(index, 'description', e.target.value)}
                          placeholder="Optional description"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex space-x-3">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create Challenge'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Challenges List */}
      <div className="space-y-4">
        {challenges.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <TrophyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Challenges Yet</h3>
              <p className="text-gray-500">Create your first weekly challenge to get started!</p>
            </CardContent>
          </Card>
        ) : (
          challenges.map((challenge) => (
            <Card key={challenge.id} className="border-l-4 border-l-purple-400">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CardTitle className="text-xl">{challenge.title}</CardTitle>
                    {challenge.isActive && (
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/swipensave')}
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {!challenge.isActive && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleActivateChallenge(challenge.id)}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteChallenge(challenge.id)}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4">{challenge.description}</p>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <Label className="text-sm text-gray-500">Hashtag</Label>
                    <p className="font-mono">#{challenge.hashtag}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Week</Label>
                    <p>Week {challenge.weekNumber}, {challenge.year}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Posts</Label>
                    <p>{challenge._count.challengePosts}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">Votes</Label>
                    <p>{challenge._count.challengeVotes}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label className="text-sm text-gray-500">Start Date</Label>
                    <p>{new Date(challenge.startDate).toLocaleString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-500">End Date</Label>
                    <p>{new Date(challenge.endDate).toLocaleString()}</p>
                  </div>
                </div>

                {/* Challenge Options */}
                {challenge.challengeOptions.length > 0 && (
                  <div>
                    <Label className="text-sm text-gray-500 mb-2 block">Challenge Options</Label>
                    <div className="grid md:grid-cols-3 gap-3">
                      {challenge.challengeOptions.map((option) => (
                        <div key={option.id} className="border rounded-lg p-3">
                          <h4 className="font-semibold">{option.title}</h4>
                          {option.description && (
                            <p className="text-sm text-gray-600">{option.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {option._count.challengeVotes} votes
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 
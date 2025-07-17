'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useXpActions } from '@/lib/useXpTracking';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';

export default function XpTestPage() {
  const { user } = useUser();
  const { trackLogin, trackLike, trackPost, trackFollow, trackComment } = useXpActions();
  const [loading, setLoading] = useState(false);

  const testActions = [
    {
      name: 'Track Login',
      action: trackLogin,
      description: 'Simulate daily login',
    },
    {
      name: 'Track Like',
      action: trackLike,
      description: 'Simulate liking a post',
    },
    {
      name: 'Track Post',
      action: trackPost,
      description: 'Simulate posting a photo',
    },
    {
      name: 'Track Follow',
      action: trackFollow,
      description: 'Simulate gaining a follower',
    },
    {
      name: 'Track Comment',
      action: trackComment,
      description: 'Simulate commenting on a post',
    },
  ];

  const handleTestAction = async (action: () => Promise<any>) => {
    if (!user) {
      toast.error('Please log in to test XP actions');
      return;
    }

    setLoading(true);
    try {
      await action();
      toast.success('Action completed! Check the sidebar for XP updates.');
    } catch (error) {
      toast.error('Failed to complete action');
      console.error('XP test error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>XP System Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please log in to test the XP system.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>XP System Test</CardTitle>
          <p className="text-muted-foreground">
            Test the XP system by triggering various actions. Check the sidebar to see your progress.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {testActions.map((testAction, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{testAction.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {testAction.description}
                  </p>
                  <Button
                    onClick={() => handleTestAction(testAction.action)}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? 'Testing...' : 'Test Action'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">How to test:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click any test action above</li>
              <li>Check the sidebar for XP progress updates</li>
              <li>Complete challenges to earn XP</li>
              <li>XP is awarded to your first pet</li>
              <li>Watch for toast notifications when challenges are completed</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
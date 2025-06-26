"use client";

import { useState, useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  Users, 
  Eye, 
  EyeOff, 
  Navigation, 
  Settings,
  RefreshCw,
  UserCheck,
  UserX,
  ExternalLink
} from 'lucide-react';
import { updateUserLocation, getUsersWithLocation, getUserPets, getUserLocation } from '@/actions/map.action';
import toast from 'react-hot-toast';

interface UserLocation {
  id: string;
  username: string;
  name: string;
  image: string;
  latitude: number;
  longitude: number;
  lastLocationUpdate: string;
  locationSharingEnabled: boolean;
}

interface Pet {
  id: string;
  name: string;
  imageUrl: string | null;
  species: string;
}

export default function MapClient() {
  const { user } = useUser();
  const router = useRouter();
  const [isLocationSharingEnabled, setIsLocationSharingEnabled] = useState(false);
  const [isRestoringLocation, setIsRestoringLocation] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [isLoadingLocationName, setIsLoadingLocationName] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState<UserLocation[]>([]);
  const [userPets, setUserPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default to NYC
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const hasInitialized = useRef(false);

  // Function to get location name from coordinates
  const getLocationName = async (latitude: number, longitude: number): Promise<string> => {
    setIsLoadingLocationName(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        // Parse the display_name to get a cleaner format
        const parts = data.display_name.split(', ');
        if (parts.length >= 2) {
          // Try to get city/town and state/country
          const city = parts[0];
          const state = parts[parts.length - 2] || parts[parts.length - 1];
          return `${city}, ${state}`;
        }
        return data.display_name;
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Error getting location name:', error);
      return 'Unknown location';
    } finally {
      setIsLoadingLocationName(false);
    }
  };

  // Simple initialization - check database state once
  useEffect(() => {
    if (!user || hasInitialized.current) return;
    
    const checkLocationState = async () => {
      try {
        console.log('Checking location sharing state...');
        const data = await getUserLocation() as any;
        console.log('Location data from DB:', data);
        
        if (data?.locationSharingEnabled) {
          console.log('Location sharing was enabled, restoring...');
          setIsLocationSharingEnabled(true);
          // Removed toast for restoration
          
          // If we have stored coordinates, use them
          if (data.latitude && data.longitude) {
            console.log('Using stored coordinates:', data.latitude, data.longitude);
            setUserLocation({ lat: data.latitude, lng: data.longitude });
            setMapCenter({ lat: data.latitude, lng: data.longitude });
            
            // Get location name for stored coordinates
            const name = await getLocationName(data.latitude, data.longitude);
            setLocationName(name);
          }
          
          // Start location tracking
          startLocationTracking();
        } else {
          console.log('Location sharing was disabled');
          setIsLocationSharingEnabled(false);
        }
      } catch (error) {
        console.error('Error checking location state:', error);
        setIsLocationSharingEnabled(false);
        toast.error('Failed to restore location sharing state');
      }
      
      hasInitialized.current = true;
      setIsMapLoading(false);
    };

    checkLocationState();
  }, [user]);

  // Load nearby users and pets
  useEffect(() => {
    if (user) {
      loadNearbyUsers();
      loadUserPets();
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handleLocationPermissionDenied = async () => {
    console.log('Location permission denied, updating database state...');
    setIsLocationSharingEnabled(false);
    setIsRestoringLocation(false);
    
    try {
      // Update database to reflect that location sharing is disabled
      await updateUserLocation({
        latitude: null,
        longitude: null,
        locationSharingEnabled: false
      });
      toast.error('Location access denied. Location sharing has been disabled.');
    } catch (error) {
      console.error('Error updating location state after permission denial:', error);
      toast.error('Failed to update location sharing state');
    }
  };

  const startLocationTracking = () => {
    console.log('Starting location tracking...');
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    // Get current position first
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('Got current position:', position.coords);
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Get location name
        const name = await getLocationName(latitude, longitude);
        setLocationName(name);
        
        // Center the map on user location when they enable sharing
        setMapCenter({ lat: latitude, lng: longitude });
        updateLocationOnServer(latitude, longitude, true);
        setIsRestoringLocation(false);
        toast.success('Location sharing enabled');
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsRestoringLocation(false);
        
        // Handle different types of location errors
        if (error.code === 1) {
          // Permission denied
          toast.error('Location access denied. Please enable location permissions in your browser settings.');
          handleLocationPermissionDenied();
        } else if (error.code === 2) {
          // Position unavailable
          toast.error('Unable to determine your location. Please check your device settings.');
          handleLocationPermissionDenied();
        } else if (error.code === 3) {
          // Timeout
          toast.error('Location request timed out. Please try again.');
          handleLocationPermissionDenied();
        } else {
          // Other errors
          toast.error('Unable to get your location. Please check your browser settings.');
          handleLocationPermissionDenied();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    // Watch for position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        console.log('Position updated:', position.coords);
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        
        // Update location name if it changed significantly
        const name = await getLocationName(latitude, longitude);
        setLocationName(name);
        
        updateLocationOnServer(latitude, longitude, false); // Don't show toast for updates
      },
      (error) => {
        console.error('Error watching location:', error);
        // If location watching fails, try to get a single position
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            setUserLocation({ lat: latitude, lng: longitude });
            
            const name = await getLocationName(latitude, longitude);
            setLocationName(name);
            
            updateLocationOnServer(latitude, longitude, false); // Don't show toast for fallback
          },
          (getError) => {
            console.error('Error getting current position:', getError);
            handleLocationPermissionDenied();
          }
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  };

  const stopLocationTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setUserLocation(null);
  };

  const updateLocationOnServer = async (latitude: number, longitude: number, showToast: boolean = false) => {
    if (!user) return;

    try {
      await updateUserLocation({
        latitude,
        longitude,
        locationSharingEnabled: isLocationSharingEnabled
      });
    } catch (error) {
      console.error('Error updating location on server:', error);
      if (showToast) {
        toast.error('Failed to update location sharing settings. Please try again.');
      }
    }
  };

  const loadNearbyUsers = async () => {
    try {
      const users = await getUsersWithLocation() as any;
      setNearbyUsers(users);
    } catch (error) {
      console.error('Error loading nearby users:', error);
    }
  };

  const loadUserPets = async () => {
    try {
      const pets = await getUserPets();
      setUserPets(pets);
    } catch (error) {
      console.error('Error loading user pets:', error);
    }
  };

  const centerOnUserLocation = () => {
    if (userLocation) {
      setMapCenter({ lat: userLocation.lat, lng: userLocation.lng });
    }
  };

  const toggleLocationSharing = async () => {
    if (!user) return;

    setIsLoading(true);
    const newState = !isLocationSharingEnabled;
    setIsLocationSharingEnabled(newState);

    try {
      if (newState) {
        console.log('Enabling location sharing...');
        startLocationTracking();
        // The location will be saved to database when startLocationTracking gets the position
      } else {
        console.log('Disabling location sharing...');
        stopLocationTracking();
        // Explicitly save the disabled state to database
        await updateUserLocation({
          latitude: null,
          longitude: null,
          locationSharingEnabled: false
        });
        // Removed toast for disabling
      }
    } catch (error) {
      console.error('Error toggling location sharing:', error);
      setIsLocationSharingEnabled(!newState); // Revert on error
      toast.error('Failed to update location sharing settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleViewProfile = (username: string) => {
    setSelectedUser(null);
    router.push(`/profile/${username}`);
  };

  return (
    <div className="relative h-screen">
      {/* Enhanced Map Container with Real Map Background */}
      <div className="w-full h-full relative overflow-hidden">
        {/* Loading overlay for map */}
        {isMapLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading map...</span>
            </div>
          </div>
        )}
        
        {/* Real Map Background using OpenStreetMap */}
        <iframe
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCenter.lng-0.01},${mapCenter.lat-0.01},${mapCenter.lng+0.01},${mapCenter.lat+0.01}&layer=mapnik&marker=${mapCenter.lat},${mapCenter.lng}`}
          className="w-full h-full border-0"
          title="OpenStreetMap"
          onLoad={() => setIsMapLoading(false)}
        />
        
        {/* Overlay for User Markers */}
        <div className="absolute inset-0 pointer-events-none">
          {/* User Markers */}
          {nearbyUsers
            .filter(nearbyUser => nearbyUser.locationSharingEnabled && nearbyUser.id !== user?.id)
            .map((nearbyUser) => {
              if (!userLocation) return null;
              
              const distance = calculateDistance(
                userLocation.lat, 
                userLocation.lng, 
                nearbyUser.latitude, 
                nearbyUser.longitude
              );
              
              // Only show users within 10km for demo purposes
              if (distance > 10) return null;

              // Calculate relative position on the map
              const latDiff = nearbyUser.latitude - mapCenter.lat;
              const lngDiff = nearbyUser.longitude - mapCenter.lng;
              const left = 50 + (lngDiff * 5000); // Scale factor for positioning
              const top = 50 - (latDiff * 5000);

              return (
                <div
                  key={nearbyUser.id}
                  className="absolute transform -translate-x-1/2 -translate-y-full pointer-events-auto cursor-pointer"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                  }}
                  onClick={() => setSelectedUser(nearbyUser)}
                >
                  <div className="relative group">
                    <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Current User Marker */}
          {userLocation && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${50 + ((userLocation.lng - mapCenter.lng) * 5000)}%`,
                top: `${50 - ((userLocation.lat - mapCenter.lat) * 5000)}%`,
              }}
            >
              <div className="relative">
                {/* Main profile picture */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 p-1 shadow-lg">
                  <div className="w-full h-full rounded-full bg-white p-1">
                    <Avatar className="w-full h-full">
                      <AvatarImage src={user?.imageUrl} />
                      <AvatarFallback className="text-xs">
                        {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                
                {/* Pet orbs positioned around the main profile picture */}
                <div className="absolute inset-0">
                  {/* Top pet orb */}
                  {userPets[0] && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 p-0.5 shadow-md">
                        <Avatar className="w-full h-full">
                          <AvatarImage src={userPets[0].imageUrl || "/default-pet.png"} />
                          <AvatarFallback className="text-xs">
                            {userPets[0].species === 'dog' ? '🐕' : userPets[0].species === 'cat' ? '🐱' : '🐾'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  )}
                  
                  {/* Right pet orb */}
                  {userPets[1] && (
                    <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 p-0.5 shadow-md">
                        <Avatar className="w-full h-full">
                          <AvatarImage src={userPets[1].imageUrl || "/default-pet.png"} />
                          <AvatarFallback className="text-xs">
                            {userPets[1].species === 'dog' ? '🐕' : userPets[1].species === 'cat' ? '🐱' : '🐾'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  )}
                  
                  {/* Bottom pet orb */}
                  {userPets[2] && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 p-0.5 shadow-md">
                        <Avatar className="w-full h-full">
                          <AvatarImage src={userPets[2].imageUrl || "/default-pet.png"} />
                          <AvatarFallback className="text-xs">
                            {userPets[2].species === 'dog' ? '🐕' : userPets[2].species === 'cat' ? '🐱' : '🐾'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  )}
                  
                  {/* Left pet orb */}
                  {userPets[3] && (
                    <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-pink-600 p-0.5 shadow-md">
                        <Avatar className="w-full h-full">
                          <AvatarImage src={userPets[3].imageUrl || "/default-pet.png"} />
                          <AvatarFallback className="text-xs">
                            {userPets[3].species === 'dog' ? '🐕' : userPets[3].species === 'cat' ? '🐱' : '🐾'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Subtle pulse animation */}
                <div className="absolute inset-0 rounded-full bg-gold-400 opacity-20 animate-ping"></div>
              </div>
            </div>
          )}
        </div>

        {/* User Popup */}
        {selectedUser && (
          <div className="absolute z-50 pointer-events-auto">
            <Card className="w-48 shadow-lg border-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={selectedUser.image} />
                    <AvatarFallback>{selectedUser.name?.[0] || selectedUser.username[0]}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{selectedUser.name || selectedUser.username}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {userLocation && (
                    <div>{calculateDistance(
                      userLocation.lat, 
                      userLocation.lng, 
                      selectedUser.latitude, 
                      selectedUser.longitude
                    ).toFixed(1)}km away</div>
                  )}
                  <div>{getTimeAgo(selectedUser.lastLocationUpdate)}</div>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="default"
                    className="flex-1"
                    onClick={() => handleViewProfile(selectedUser.username)}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    View Profile
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedUser(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Top Controls */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="bg-background/80 backdrop-blur-sm"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Badge variant={isLocationSharingEnabled ? "default" : "secondary"}>
            {isLocationSharingEnabled ? (
              <>
                <Eye className="w-3 h-3 mr-1" />
                {isRestoringLocation ? "Restoring Location..." : "Sharing Location"}
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3 mr-1" />
                Location Hidden
              </>
            )}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadNearbyUsers}
            className="bg-background/80 backdrop-blur-sm"
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          {userLocation && (
            <Button
              variant="outline"
              size="sm"
              onClick={centerOnUserLocation}
              className="bg-background/80 backdrop-blur-sm"
            >
              <MapPin className="w-4 h-4" />
            </Button>
          )}
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
            <Users className="w-3 h-3 mr-1" />
            {nearbyUsers.filter(u => u.locationSharingEnabled && u.id !== user?.id).length} nearby
          </Badge>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <Card className="absolute top-16 left-4 w-80 bg-background/95 backdrop-blur-sm z-10">
          <CardHeader>
            <CardTitle className="text-lg">Location Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="location-sharing" className="text-sm">
                Share My Location
              </Label>
              <Switch
                id="location-sharing"
                checked={isLocationSharingEnabled}
                onCheckedChange={toggleLocationSharing}
                disabled={isLoading || isRestoringLocation}
              />
            </div>
            
            {isLocationSharingEnabled && (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Status: {isRestoringLocation ? "Restoring previous location..." : "Active"}
                </div>
                {userLocation && (
                  <>
                    <div className="text-sm text-muted-foreground">
                      Current Location:
                    </div>
                    <div className="text-xs font-mono bg-muted p-2 rounded">
                      {isLoadingLocationName ? (
                        <div className="flex items-center gap-2">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Getting location...
                        </div>
                      ) : (
                        locationName || `${userLocation.lat.toFixed(6)}, ${userLocation.lng.toFixed(6)}`
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Your location is only shared with other users who have location sharing enabled.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nearby Users List */}
      <Card className="absolute bottom-4 left-4 w-80 max-h-64 overflow-y-auto bg-background/95 backdrop-blur-sm z-10">
        <CardHeader>
          <CardTitle className="text-lg">Nearby Users</CardTitle>
        </CardHeader>
        <CardContent>
          {nearbyUsers.filter(u => u.locationSharingEnabled && u.id !== user?.id).length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              No nearby users found
            </div>
          ) : (
            <div className="space-y-2">
              {nearbyUsers
                .filter(u => u.locationSharingEnabled && u.id !== user?.id)
                .map((nearbyUser) => {
                  if (!userLocation) return null;
                  
                  const distance = calculateDistance(
                    userLocation.lat, 
                    userLocation.lng, 
                    nearbyUser.latitude, 
                    nearbyUser.longitude
                  );
                  
                  return (
                    <div 
                      key={nearbyUser.id} 
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => {
                        setSelectedUser(nearbyUser);
                        setMapCenter({ lat: nearbyUser.latitude, lng: nearbyUser.longitude });
                      }}
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={nearbyUser.image} />
                        <AvatarFallback>{nearbyUser.name?.[0] || nearbyUser.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {nearbyUser.name || nearbyUser.username}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {distance.toFixed(1)}km away • {getTimeAgo(nearbyUser.lastLocationUpdate)}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Online
                      </Badge>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
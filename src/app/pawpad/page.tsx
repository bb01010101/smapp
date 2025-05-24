"use client";

import { useState, useEffect, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { PawPrintIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import ImageUpload from "@/components/ImageUpload";
import { useAuth } from "@clerk/nextjs";

declare global {
  interface Pet {
    id: string;
    name: string;
    species: string;
    breed?: string;
    age?: string;
    bio?: string;
    imageUrl?: string | { url: string; type: string } | null;
    angle?: number;
  }
}

const speciesOptions = [
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "bird", label: "Bird" },
  { value: "fish", label: "Fish" },
  { value: "reptile", label: "Reptile" },
  { value: "other", label: "Other" },
];

const breedOptions = {
  dog: [
    "German Shepherd",
    "Golden Retriever",
    "Labrador Retriever",
    "Bulldog",
    "Beagle",
    "Poodle",
    "Rottweiler",
    "Dachshund",
    "Chihuahua",
    "Other",
  ],
  cat: [
    "Persian",
    "Maine Coon",
    "Siamese",
    "Ragdoll",
    "Bengal",
    "Sphynx",
    "British Shorthair",
    "Abyssinian",
    "Other",
  ],
  bird: ["Parrot", "Canary", "Cockatiel", "Budgie", "Other"],
  fish: ["Goldfish", "Betta", "Guppy", "Tetra", "Other"],
  reptile: ["Bearded Dragon", "Leopard Gecko", "Ball Python", "Other"],
  other: ["Other"],
};

export default function PawPad() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [newPet, setNewPet] = useState<Partial<Pet> & { imageUrl?: { url: string; type: string } | null }>({
    name: "",
    species: "",
    breed: "",
    age: "",
    bio: "",
    imageUrl: null,
  });
  const [selectedSpecies, setSelectedSpecies] = useState<string>("");
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const requestRef = useRef<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  // Fetch pets from API on mount and after changes
  const fetchPets = async () => {
    setLoading(true);
    const token = await getToken();
    const res = await fetch("/api/pets", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setPets(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPets();
  }, []);

  const addPet = async () => {
    if (newPet.name?.trim() && newPet.species) {
      setLoading(true);
      try {
        const token = await getToken();
        // Only send valid fields to the backend
        const petPayload = {
          name: newPet.name,
          species: newPet.species,
          breed: newPet.breed || undefined,
          age: newPet.age || undefined,
          bio: newPet.bio || undefined,
          imageUrl: newPet.imageUrl?.url || undefined,
        };
        if (editingPetId) {
          await fetch(`/api/pets/${editingPetId}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(petPayload),
          });
          setEditingPetId(null);
        } else {
          await fetch("/api/pets", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(petPayload),
          });
        }
        setNewPet({
          name: "",
          species: "",
          breed: "",
          age: "",
          bio: "",
          imageUrl: null,
        });
        setSelectedSpecies("");
        setShowForm(false);
        await fetchPets();
      } catch (e) {
        // Optionally show an error toast
        console.error("Failed to add/edit pet", e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (pet: Pet) => {
    setNewPet({
      ...pet,
      imageUrl: typeof pet.imageUrl === 'string' ? (pet.imageUrl ? { url: pet.imageUrl, type: "image" } : null) : pet.imageUrl,
    });
    setSelectedSpecies(pet.species);
    setEditingPetId(pet.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const token = await getToken();
    await fetch(`/api/pets/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (editingPetId === id) {
      setNewPet({
        name: "",
        species: "",
        breed: "",
        age: "",
        bio: "",
        imageUrl: null,
      });
      setSelectedSpecies("");
      setEditingPetId(null);
    }
    fetchPets();
  };

  // Orbit animation
  useEffect(() => {
    if (isPaused) {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      return;
    }
    let lastTimestamp = performance.now();
    const animate = (timestamp: number) => {
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      setPets((prevPets) =>
        prevPets.map((pet, i) => ({
          ...pet,
          angle: ((pet.angle ?? 0) + 0.03 * delta) % 360,        }))
      );
      requestRef.current = requestAnimationFrame(animate);
    };
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPaused]);

  // Pause/resume on pointer down/up anywhere
  useEffect(() => {
    const handlePointerDown = () => setIsPaused(true);
    const handlePointerUp = () => setIsPaused(false);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, []);

  return (
    <div className="container mx-auto p-4 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-8">
          <PawPrintIcon className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-center">PawPad</h1>
        </div>
        
        {/* Add New Pet Button & Form */}
        <div className="mb-8">
          <AnimatePresence>
            {!showForm && (
              <motion.button
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg border border-primary text-primary font-semibold bg-background hover:bg-primary/10 transition-colors shadow"
                onClick={() => setShowForm(true)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <PawPrintIcon className="w-6 h-6" /> Add New Pet
              </motion.button>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, height: 0, scale: 0.98 }}
                animate={{ opacity: 1, height: "auto", scale: 1 }}
                exit={{ opacity: 0, height: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <Card className="p-6 mt-2">
                  <div className="space-y-6">
                    <h2 className="text-xl font-semibold">{editingPetId ? "Edit Pet" : "Add a New Pet"}</h2>
                    
                    {/* Image Upload */}
                    <div className="space-y-2">
                      <Label>Profile Picture</Label>
                      <ImageUpload
                        endpoint="petImage"
                        value={newPet.imageUrl || null}
                        onChange={(mediaObj) => setNewPet({ ...newPet, imageUrl: mediaObj })}
                      />
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter pet name..."
                        value={newPet.name}
                        onChange={(e) => setNewPet({ ...newPet, name: e.target.value })}
                      />
                    </div>

                    {/* Species */}
                    <div className="space-y-2">
                      <Label htmlFor="species">Species</Label>
                      <Select
                        value={selectedSpecies}
                        onValueChange={(value) => {
                          setSelectedSpecies(value);
                          setNewPet({ ...newPet, species: value, breed: "" });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select species" />
                        </SelectTrigger>
                        <SelectContent>
                          {speciesOptions.map((species) => (
                            <SelectItem key={species.value} value={species.value}>
                              {species.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Breed */}
                    {selectedSpecies && (
                      <div className="space-y-2">
                        <Label htmlFor="breed">Breed</Label>
                        <Select
                          value={newPet.breed}
                          onValueChange={(value) => setNewPet({ ...newPet, breed: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select breed" />
                          </SelectTrigger>
                          <SelectContent>
                            {breedOptions[selectedSpecies as keyof typeof breedOptions].map((breed) => (
                              <SelectItem key={breed} value={breed}>
                                {breed}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Age */}
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        placeholder="Enter age..."
                        value={newPet.age}
                        onChange={(e) => setNewPet({ ...newPet, age: e.target.value })}
                      />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about your pet..."
                        value={newPet.bio}
                        onChange={(e) => setNewPet({ ...newPet, bio: e.target.value })}
                        className="h-24"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={addPet} className="w-full" disabled={loading}>
                        {loading ? "Saving..." : editingPetId ? "Save Changes" : "Add Pet"}
                      </Button>
                      <Button type="button" variant="outline" className="w-full" onClick={() => { setShowForm(false); setEditingPetId(null); setNewPet({ name: "", species: "", breed: "", age: "", bio: "", imageUrl: null }); setSelectedSpecies(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pet Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-8">
          {[...pets].reverse().map((pet) => (
            <Card key={pet.id} className="p-8 bg-background shadow-lg w-full">
              <div className="text-center space-y-4">
                <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden">
                  {pet.imageUrl && typeof pet.imageUrl === 'string' && !pet.imageUrl.includes('placehold.co') ? (
                    <Image
                      src={pet.imageUrl}
                      alt={pet.name}
                      fill
                      className="object-cover"
                    />
                  ) : pet.imageUrl && typeof pet.imageUrl === 'object' && pet.imageUrl.url && !pet.imageUrl.url.includes('placehold.co') ? (
                    <Image
                      src={pet.imageUrl.url}
                      alt={pet.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <PawPrintIcon className="w-full h-full text-primary" />
                  )}
                </div>
                <div className="font-medium text-lg">{pet.name}</div>
                <div className="text-sm text-muted-foreground">
                  {pet.breed} • {pet.age}
                </div>
                <div className="text-xs text-muted-foreground line-clamp-2">
                  {pet.bio}
                </div>
                <div className="flex justify-center gap-2 mt-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(pet)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(pet.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
} 
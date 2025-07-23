import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import ImageUpload from "@/components/ImageUpload";
import { useAuth } from "@clerk/nextjs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PawPrintIcon } from "lucide-react";

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
    "Collie",
    "French Bulldog",
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

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: string;
  bio?: string;
  imageUrl?: string | { url: string; type: string } | null;
}

interface EditFamilyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pets: Pet[];
  onPetsChange: (pets: Pet[]) => void;
}

export default function EditFamilyModal({
  open,
  onOpenChange,
  pets,
  onPetsChange,
}: EditFamilyModalProps) {
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
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { getToken } = useAuth();

  const fetchPets = async () => {
    setLoading(true);
    const token = await getToken();
    const res = await fetch("/api/pets", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      onPetsChange(data);
    }
    setLoading(false);
  };

  const addPet = async () => {
    if (newPet.name?.trim() && newPet.species) {
      setLoading(true);
      try {
        const token = await getToken();
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Family</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Add New Pet Button & Form */}
          <div>
            {!showForm && (
              <Button
                className="w-full flex items-center justify-center gap-2"
                onClick={() => setShowForm(true)}
              >
                <PawPrintIcon className="w-4 h-4" /> Add New Family Member
              </Button>
            )}
            {showForm && (
              <Card className="p-6 mt-2">
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold">{editingPetId ? "Edit Family Member" : "Add a New Family Member"}</h2>
                  
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
                      placeholder="Enter name..."
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
                      placeholder="Tell us about your family member..."
                      value={newPet.bio}
                      onChange={(e) => setNewPet({ ...newPet, bio: e.target.value })}
                      className="h-24"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={addPet} className="w-full" disabled={loading}>
                      {loading ? "Saving..." : editingPetId ? "Save Changes" : "Add Family Member"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setShowForm(false);
                        setEditingPetId(null);
                        setNewPet({
                          name: "",
                          species: "",
                          breed: "",
                          age: "",
                          bio: "",
                          imageUrl: null,
                        });
                        setSelectedSpecies("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Family Members Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {pets.map((pet) => (
              <Card key={pet.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden">
                    {pet.imageUrl && typeof pet.imageUrl === 'string' && !pet.imageUrl.includes('placehold.co') ? (
                      <img
                        src={pet.imageUrl}
                        alt={pet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <PawPrintIcon className="w-full h-full text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{pet.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {pet.breed} • {pet.age}
                    </div>
                  </div>
                  <div className="flex gap-2">
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
      </DialogContent>
    </Dialog>
  );
} 
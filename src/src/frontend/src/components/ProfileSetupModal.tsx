import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";

interface ProfileSetupModalProps {
  open: boolean;
  onDone: () => void;
}

export function ProfileSetupModal({ open, onDone }: ProfileSetupModalProps) {
  const { actor } = useActor();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!actor) return;
    if (!name.trim() || !restaurantName.trim()) {
      toast.error("Molimo unesite oba polja.");
      return;
    }
    setSaving(true);
    try {
      await actor.saveCallerUserProfile({
        name: name.trim(),
        restaurantName: restaurantName.trim(),
      });
      await qc.invalidateQueries({ queryKey: ["callerProfile"] });
      toast.success("Profil uspješno spremljen.");
      onDone();
    } catch (err) {
      console.error("saveCallerUserProfile error:", err);
      toast.error("Greška pri spremanju profila.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-sm"
        data-ocid="profile_setup.dialog"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Postavljanje profila</DialogTitle>
          <DialogDescription>
            Unesite naziv restorana i vaše ime za nastavak.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Vaše ime</Label>
            <Input
              id="profile-name"
              placeholder="Npr. Ivan Horvat"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-ocid="profile_setup.name_input"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="profile-restaurant">Naziv restorana</Label>
            <Input
              id="profile-restaurant"
              placeholder="Npr. Restoran Dubrovnik"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              data-ocid="profile_setup.restaurant_input"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={saving || !name.trim() || !restaurantName.trim()}
            className="w-full"
            data-ocid="profile_setup.submit_button"
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Spremi i nastavi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

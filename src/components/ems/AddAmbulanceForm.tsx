import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import apiUrl from '@/config/api';

interface AddAmbulanceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAmbulanceAdded: () => void;
}

const AddAmbulanceForm: React.FC<AddAmbulanceFormProps> = ({ open, onOpenChange, onAmbulanceAdded }) => {
  const [vehicleName, setVehicleName] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');

  const handleAddAmbulance = async () => {
    if (!vehicleName || !licensePlate) {
      setError('Vehicle name and license plate are required.');
      return;
    }

    setIsAdding(true);
    setError('');
    try {
      const response = await fetch(apiUrl('/api/ems/ambulances'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vehicle_name: vehicleName, license_plate: licensePlate }),
      });
      const data = await response.json();
      if (data.success) {
        onAmbulanceAdded();
        onOpenChange(false);
        setVehicleName('');
        setLicensePlate('');
      } else {
        setError(data.message || 'Failed to add ambulance.');
      }
    } catch (error) {
      console.error('Error adding ambulance:', error);
      setError('Failed to connect to the server to add ambulance.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Ambulance</DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4">
          <div>
            <label htmlFor="vehicle-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Vehicle Name:
            </label>
            <Input
              id="vehicle-name"
              value={vehicleName}
              onChange={(e) => setVehicleName(e.target.value)}
              placeholder="e.g., Ambulance 1"
            />
          </div>
          <div>
            <label htmlFor="license-plate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              License Plate:
            </label>
            <Input
              id="license-plate"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              placeholder="e.g., KA-01-AB-1234"
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleAddAmbulance} disabled={isAdding}>
            {isAdding ? 'Adding...' : 'Add Ambulance'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddAmbulanceForm;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { BedDouble, UserPlus, X, Wind, Layout, Users } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import apiUrl from '@/config/api';

const wsUrl = import.meta.env.VITE_API_BASE ? new URL(import.meta.env.VITE_API_BASE).hostname : 'localhost:8080';

const Modal = ({ children, onClose }) => (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 font-sans p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                className="glass-panel rounded-3xl p-6 w-full max-w-lg border border-white/10 shadow-2xl relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative z-10">{children}</div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

const DraggablePatient = ({ patient, index }) => (
    <Draggable draggableId={`patient-${patient.id}`} index={index}>
        {(provided, snapshot) => (
            <div
                ref={provided.innerRef}
                {...provided.draggableProps}
                {...provided.dragHandleProps}
                className={`p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center gap-3 cursor-grab active:cursor-grabbing transform transition-all ${snapshot.isDragging ? 'shadow-xl scale-105 ring-2 ring-blue-500' : 'hover:bg-gray-50 dark:hover:bg-white/10'}`}
                style={provided.draggableProps.style}
            >
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <UserPlus size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{patient.firstName} {patient.lastName}</span>
            </div>
        )}
    </Draggable>
);

const DroppableBed = ({ bed, onBedClick }) => {
    const getStatusStyles = (status) => {
        switch (status) {
            case 'occupied': return 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400';
            case 'available': return 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400';
            case 'maintenance': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400';
            case 'cleaning': return 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400';
            case 'reserved': return 'bg-gray-500/10 border-gray-500/20 text-gray-600 dark:text-gray-400';
            default: return 'bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400';
        }
    };

    return (
        <Droppable droppableId={`bed-${bed.id}`}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    onClick={() => onBedClick(bed)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${getStatusStyles(bed.status)} ${snapshot.isDraggingOver ? 'ring-4 ring-blue-500/30 scale-105 bg-blue-500/5' : 'hover:shadow-lg hover:-translate-y-1'}`}
                >
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-black text-sm">{bed.bedNumber}</span>
                        {bed.status === 'cleaning' ? <Wind size={16} /> : <BedDouble size={16} />}
                    </div>
                    <div className="text-xs truncate h-5 font-semibold">
                        {bed.status === 'occupied' ?
                            <span>{bed.firstName} {bed.lastName}</span> :
                            <span className="capitalize opacity-70">{bed.status}</span>
                        }
                    </div>
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
};

export default function BedManagement() {
    const { theme } = useTheme();
    const [wards, setWards] = useState([]);
    const [unassignedPatients, setUnassignedPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedBed, setSelectedBed] = useState(null);

    const formatFloorNumber = (floor) => {
        if (floor % 100 >= 11 && floor % 100 <= 13) return `${floor}th`;
        switch (floor % 10) {
            case 1: return `${floor}st`;
            case 2: return `${floor}nd`;
            case 3: return `${floor}rd`;
            default: return `${floor}th`;
        }
    };

    const fetchData = async () => {
        try {
            if (wards.length === 0) setLoading(true);
            setError(null);
            const [wardsRes, patientsRes] = await Promise.all([fetch(apiUrl('/api/beds')), fetch(apiUrl('/api/patients'))]);
            if (!wardsRes.ok || !patientsRes.ok) throw new Error('Failed to fetch data');
            const wardsData = await wardsRes.json();
            const patientsData = await patientsRes.json();
            const assignedPatientIds = new Set();
            if (Array.isArray(wardsData)) {
                wardsData.forEach(ward => ward.beds.forEach(bed => bed.patientId && assignedPatientIds.add(bed.patientId)));
            }
            const unassigned = patientsData.filter(p => !assignedPatientIds.has(p.id) && p.status === 'active');
            setWards(wardsData || []);
            setUnassignedPatients(unassigned || []);
        } catch (error) {
            console.error("Failed to fetch bed management data:", error);
            setError(`Failed to load layout: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // WebSocket logic commented out as implementation details for pure frontend change
        // Keep checking periodically if WS not fully robust
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    const onDragEnd = (result) => {
        const { source, destination } = result;
        if (!destination || source.droppableId === destination.droppableId) return;

        if (source.droppableId === 'unassigned-patients' && destination.droppableId.startsWith('bed-')) {
            const patientId = parseInt(result.draggableId.split('-')[1]);
            const bedId = parseInt(destination.droppableId.split('-')[1]);
            handleAssignPatientToBed(patientId, bedId);
        }
    };

    const handleAssignPatientToBed = async (patientId, bedId) => {
        const patientToAssign = unassignedPatients.find(p => p.id === patientId);
        if (!patientToAssign) return;

        const originalWards = JSON.parse(JSON.stringify(wards));
        const originalUnassigned = [...unassignedPatients];

        setUnassignedPatients(unassignedPatients.filter(p => p.id !== patientId));
        setWards(wards.map(w => ({
            ...w,
            beds: w.beds.map(b => b.id === bedId ? { ...b, status: 'occupied', patientId, firstName: patientToAssign.firstName, lastName: patientToAssign.lastName } : b)
        })));

        try {
            const response = await fetch(apiUrl('/api/beds/assign'), {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ patientId, bedId })
            });
            if (!response.ok) throw new Error('Assignment failed');
        } catch (error) {
            alert("Error assigning bed. Reverting changes.");
            setWards(originalWards);
            setUnassignedPatients(originalUnassigned);
        }
    };

    const handleUnassign = async (bedId) => {
        if (!bedId) return;
        const originalWards = JSON.parse(JSON.stringify(wards));
        const patientToUnassign = wards.flatMap(w => w.beds).find(b => b.id === bedId);

        setWards(wards.map(w => ({ ...w, beds: w.beds.map(b => b.id === bedId ? { ...b, status: 'available', patientId: null, firstName: null, lastName: null } : b) })));
        if (patientToUnassign) {
            setUnassignedPatients([...unassignedPatients, { id: patientToUnassign.patientId, firstName: patientToUnassign.firstName, lastName: patientToUnassign.lastName, status: 'active' }]);
        }

        try {
            const response = await fetch(apiUrl('/api/beds/unassign'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bedId }) });
            if (!response.ok) throw new Error('Unassignment failed');
            setSelectedBed(null);
        } catch (error) {
            alert(`Failed: ${error.message}`);
            setWards(originalWards);
            if (patientToUnassign) setUnassignedPatients(unassignedPatients.filter(p => p.id !== patientToUnassign.patientId));
        }
    };

    const handleStatusChange = async (bedId, newStatus) => {
        if (!bedId || !newStatus) return;
        const originalWards = JSON.parse(JSON.stringify(wards));
        setWards(wards.map(w => ({ ...w, beds: w.beds.map(b => b.id === bedId ? { ...b, status: newStatus } : b) })));

        try {
            const response = await fetch(apiUrl('/api/beds/status'), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bedId, newStatus }) });
            if (!response.ok) throw new Error('Status update failed');
            setSelectedBed(null);
        } catch (error) {
            alert(`Failed to update status: ${error.message}`);
            setWards(originalWards);
        }
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="p-4 md:p-8 font-sans min-h-full">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                        <div>
                            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-300">Bed Management</h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Drag and drop patients to assign beds.</p>
                        </div>
                    </div>
                </motion.div>

                {loading ? <div className="text-center py-20 text-blue-500 animate-pulse font-bold">Loading Hospital Layout...</div> : error ? <div className="text-center py-20 text-red-500">{error}</div> : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                        <div className="lg:col-span-9 space-y-6">
                            {wards.map(ward => (
                                <motion.div key={ward.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-panel rounded-3xl p-6 border border-white/20 shadow-xl">
                                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 dark:border-white/5 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500"><Layout size={24} /></div>
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{ward.name}</h2>
                                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{formatFloorNumber(ward.floorNumber)} Floor</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-green-500">{ward.beds.filter(b => b.status === 'available').length} <span className="text-sm font-medium text-gray-400">/ {ward.capacity}</span></p>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Available</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                        {ward.beds.map(bed => <DroppableBed key={bed.id} bed={bed} onBedClick={setSelectedBed} />)}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <div className="lg:col-span-3">
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="glass-panel rounded-3xl p-6 border border-white/20 shadow-xl sticky top-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500"><Users size={20} /></div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Unassigned</h3>
                                </div>
                                <Droppable droppableId="unassigned-patients">
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className={`space-y-3 p-3 rounded-2xl transition-colors min-h-[200px] ${snapshot.isDraggingOver ? 'bg-blue-500/5 ring-2 ring-blue-500/20' : 'bg-gray-50/50 dark:bg-black/20'}`}
                                        >
                                            {unassignedPatients.length > 0 ? unassignedPatients.map((patient, index) => <DraggablePatient key={patient.id} patient={patient} index={index} />) : <p className="text-sm text-gray-400 text-center py-10 font-medium">No patients waiting.</p>}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </motion.div>
                        </div>
                    </div>
                )}

                {selectedBed && (
                    <Modal onClose={() => setSelectedBed(null)}>
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gray-500/10 rounded-xl text-gray-500"><BedDouble size={24} /></div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bed {selectedBed.bedNumber}</h2>
                                    <p className="text-sm text-gray-500 capitalize">{selectedBed.status}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedBed(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-500"><X size={20} /></button>
                        </div>

                        {selectedBed.status === 'occupied' && (
                            <div className="mb-6 p-4 bg-blue-500/5 rounded-xl border border-blue-500/10">
                                <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Occupied By</p>
                                <p className="font-bold text-xl text-gray-900 dark:text-white">{selectedBed.firstName} {selectedBed.lastName}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 block uppercase tracking-wider">Change Status</label>
                                <select
                                    defaultValue={selectedBed.status}
                                    onChange={(e) => handleStatusChange(selectedBed.id, e.target.value)}
                                    className="w-full p-4 bg-gray-50 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-blue-500/50"
                                >
                                    <option value="available" className="text-black">Available</option>
                                    <option value="maintenance" className="text-black">Maintenance</option>
                                    <option value="cleaning" className="text-black">Cleaning</option>
                                    <option value="reserved" className="text-black">Reserved</option>
                                </select>
                            </div>
                            {selectedBed.status === 'occupied' && (
                                <button
                                    onClick={() => handleUnassign(selectedBed.id)}
                                    className="w-full py-4 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 rounded-xl font-bold hover:bg-red-500/20 transition-colors"
                                >
                                    Unassign Patient
                                </button>
                            )}
                        </div>
                    </Modal>
                )}
            </div>
        </DragDropContext>
    );
}

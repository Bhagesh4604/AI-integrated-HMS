import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Eye, Video, MessageSquare, Calendar, X, FileText, Pill, User } from 'lucide-react';

import { useTheme } from '../context/ThemeContext';
import PatientHistoryModal from './PatientHistoryModal';

import apiUrl from '../config/api';

const Modal = ({ children, onClose, width = "max-w-lg" }) => (
    <AnimatePresence>
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 font-sans"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20, opacity: 0 }}
                className={`bg-[#1C1C1E] rounded-2xl p-8 w-full ${width} border border-gray-700 shadow-2xl text-white`}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </motion.div>
        </motion.div>
    </AnimatePresence>
);

const StatCard = ({ title, value, icon: Icon, color }) => {
    const { theme } = useTheme();
    return (
        <div className={`p-5 rounded-2xl border ${theme === 'dark' ? 'bg-[#1C1C1E] border-gray-800' : 'bg-white border-gray-200'}`}>
            <div className="flex items-center justify-between">
                <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className={`text-3xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{value}</p>
        </div>
    );
};

export default function TelemedicineModule({ user }) {
    const { theme } = useTheme();
    const [virtualAppointments, setVirtualAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modal, setModal] = useState(null); // 'bookVirtual', 'view', 'join', 'prescribe', 'message', 'history'
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // State for booking virtual appointments
    const [newVirtualAppointment, setNewVirtualAppointment] = useState({ patientId: '', appointmentDate: '', notes: '', consultationType: 'virtual' });
    const [availableSlots, setAvailableSlots] = useState([]);
    const [slotsLoading, setSlotsLoading] = useState(false);

    // State for E-Prescribing
    const [newPrescription, setNewPrescription] = useState({ notes: '' });

    // State for Secure messaging
    const [newMessage, setNewMessage] = useState({ message: '' });

    useEffect(() => {
        fetchVirtualAppointments();
        fetchPatients();
        fetchDoctors();
    }, []);

    // Effect to fetch available slots when the date part of appointmentDate changes
    useEffect(() => {
        const date = newVirtualAppointment.appointmentDate.split('T')[0];
        if (user.id && date) {
            fetchAvailableSlots(user.id, date);
        }
    }, [user.id, newVirtualAppointment.appointmentDate.split('T')[0]]);

    const fetchVirtualAppointments = async () => {
        try {
            const response = await fetch(apiUrl(`/api/appointments/doctor/${user.id}/virtual`));
            const data = await response.json();
            setVirtualAppointments(Array.isArray(data) ? data : []);
        } catch (error) { console.error('Failed to fetch virtual appointments:', error); }
    };

    const fetchPatients = async () => {
        try {
            const response = await fetch(apiUrl('/api/patients'));
            setPatients(await response.json() || []);
        } catch (error) { console.error('Failed to fetch patients:', error); }
    };

    const fetchDoctors = async () => {
        try {
            const response = await fetch(apiUrl('/api/employees'));
            const allEmployees = await response.json();
            setDoctors(allEmployees.filter(emp => emp.role === 'doctor') || []);
        } catch (error) { console.error('Failed to fetch doctors:', error); }
    };

    const fetchAvailableSlots = async (doctorId, date) => {
        if (!doctorId || !date) {
            setAvailableSlots([]);
            return;
        }
        setSlotsLoading(true);
        try {
            const response = await fetch(apiUrl(`/api/schedules/available-slots/${doctorId}/${date}`));
            setAvailableSlots(await response.json());
        } catch (error) {
            console.error("Failed to fetch available slots:", error);
            setAvailableSlots([]);
        } finally {
            setSlotsLoading(false);
        }
    };

    const handleNewVirtualAppointmentChange = (e) => {
        const { name, value } = e.target;
        if (name === 'appointmentDate') {
            const currentDate = newVirtualAppointment.appointmentDate.split('T')[0];
            if (currentDate !== value) {
                setNewVirtualAppointment(prev => ({ ...prev, [name]: value, time: '' }));
            }
        } else {
            setNewVirtualAppointment(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleTimeSlotSelect = (slot) => {
        setNewVirtualAppointment(prev => ({ ...prev, appointmentDate: slot }));
    };

    const handleBookVirtualAppointment = async (e) => {
        e.preventDefault();
        if (!bookingSlot) {
            alert("Please select an available time slot.");
            return;
        }

        const appointmentData = {
            ...newVirtualAppointment,
            patientId: newVirtualAppointment.patientId,
            doctorId: user.id,
            appointmentDate: bookingSlot,
        };

        try {
            const response = await fetch(apiUrl('/api/portal/book-appointment'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(appointmentData),
            });

            const data = await response.json();

            if (data.success) {
                setModal(null);
                fetchVirtualAppointments();
                setNewVirtualAppointment({ patientId: '', appointmentDate: '', notes: '', consultationType: 'virtual' });
                setBookingDate('');
                setBookingSlot('');
                setAvailableSlots([]);
                alert('Virtual consultation scheduled successfully!');
            } else {
                alert(data.message || 'Failed to schedule virtual appointment.');
            }
        } catch (error) {
            console.error('Error booking virtual appointment:', error);
            alert('Failed to connect to the server or book appointment.');
        }
    };

    const handleJoinConsultation = async (appointment) => {
        console.log('Joining consultation for patientId:', appointment.patientId);
        // In a real app, this would fetch the room URL from your backend's virtual_consultation_rooms table
        try {
            const response = await fetch(apiUrl(`/api/virtual-consultations/appointment/${appointment.id}`));
            const data = await response.json();

            if (data && data.success && data.room && data.room.roomUrl) {
                 window.open(data.room.roomUrl, '_blank'); // Open in new tab
            } else {
                alert('Virtual room details not found for this appointment. Please ensure it was created.');
            }
        } catch (error) {
            console.error('Error joining consultation:', error);
            alert('Failed to join consultation.');
        }
    };

    const handleNewPrescriptionChange = (e) => {
        const { name, value } = e.target;
        setNewPrescription(prev => ({ ...prev, [name]: value }));
    };

    const handleEPrescribe = async (e) => {
        e.preventDefault();
        if (!selectedAppointment) return;
        console.log('Sending patientId for E-Prescribe:', selectedAppointment.patientId);
        try {
            const response = await fetch(apiUrl('/api/medical-records/add'), { // Reusing medical records add
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    patientId: selectedAppointment.patientId, 
                    doctorId: user.id, 
                    recordDate: new Date().toISOString().split('T')[0], // Today's date
                    diagnosis: 'Virtual Consultation E-Prescription', 
                    treatment: `Issued during virtual consult: ID ${selectedAppointment.id}`,
                    prescriptionNotes: newPrescription.notes 
                }),
            });
            const data = await response.json();
            if (data.success) {
                setModal(null);
                setNewPrescription({ notes: '' });
                alert('E-Prescription issued successfully!');
            } else {
                alert(data.message || 'Failed to issue E-Prescription.');
            }
        } catch (error) {
            console.error('Error issuing E-Prescription:', error);
            alert('Failed to connect to the server or issue prescription.');
        }
    };

    const handleNewMessageChange = (e) => {
        const { name, value } = e.target;
        setNewMessage(prev => ({ ...prev, [name]: value }));
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!selectedAppointment) return;
        try {
            const response = await fetch(apiUrl('/api/messaging/send'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    senderId: user.id, 
                    senderType: 'employee', 
                    receiverId: selectedAppointment.patientId, 
                    receiverType: 'patient', 
                    message: newMessage.message
                }),
            });
            const data = await response.json();
            if (data.success) {
                setModal(null);
                setNewMessage({ message: '' });
                alert('Message sent successfully!');
            } else {
                alert(data.message || 'Failed to send message.');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to connect to the server or send message.');
        }
    };

    const filteredAppointments = useMemo(() =>
        virtualAppointments.filter(appt =>
            Object.values(appt).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            )
        ),
        [virtualAppointments, searchTerm]
    );

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

    return (
        <div className={`p-8 font-sans min-h-full ${theme === 'dark' ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'}`}>

            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold">Telemedicine Consultations</h1>
                        <p className="text-gray-400 mt-2">Manage virtual patient appointments.</p>
                    </div>
                    <button onClick={() => setModal('bookVirtual')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-full transition-colors flex items-center gap-2">
                        <Plus size={20} />
                        <span>Schedule Virtual Consult</span>
                    </button>
                </div>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants}><StatCard title="Total Virtual Consults" value={virtualAppointments.length} icon={Video} color="text-blue-400"/></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Upcoming Today" value={virtualAppointments.filter(appt => new Date(appt.appointmentDate).toDateString() === new Date().toDateString()).length} icon={Calendar} color="text-yellow-400"/></motion.div>
                <motion.div variants={itemVariants}><StatCard title="Messages" value="0" icon={MessageSquare} color="text-green-400"/></motion.div>
            </motion.div>

            <div className="bg-[#1C1C1E] rounded-2xl border border-gray-800 p-6">
                <div className="relative mb-6">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                    <input type="text" placeholder="Search by patient or date..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"/>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-800">
                                <th className="text-left p-4 text-sm font-semibold text-gray-400">Patient</th>
                                <th className="text-left p-4 text-sm font-semibold text-gray-400">Date & Time</th>
                                <th className="text-left p-4 text-sm font-semibold text-gray-400">Notes</th>
                                <th className="text-right p-4 text-sm font-semibold text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <motion.tbody variants={containerVariants} initial="hidden" animate="visible">
                            {filteredAppointments.map(appt => (
                                <motion.tr key={appt.id} variants={itemVariants} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                                    <td className="p-4 font-semibold">{appt.patientName}</td>
                                    <td className="p-4 text-sm text-gray-400">{new Date(appt.appointmentDate).toLocaleString()}</td>
                                    <td className="p-4 text-sm text-gray-400">{appt.notes || 'N/A'}</td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end space-x-2">
                                            <button onClick={() => handleJoinConsultation(appt)} className="p-2 text-blue-400 hover:text-white hover:bg-blue-700 rounded-full" title="Join Consultation"><Video size={18}/></button>
                                            <button onClick={() => {setModal('history'); setSelectedAppointment(appt);}} className="p-2 text-green-400 hover:text-white hover:bg-green-700 rounded-full" title="View Patient History"><FileText size={18}/></button>
                                            <button onClick={() => {setModal('prescribe'); setSelectedAppointment(appt);}} className="p-2 text-yellow-400 hover:text-white hover:bg-yellow-700 rounded-full" title="E-Prescribe"><Pill size={18}/></button>
                                            <button onClick={() => {setModal('message'); setSelectedAppointment(appt);}} className="p-2 text-purple-400 hover:text-white hover:bg-purple-700 rounded-full" title="Message Patient"><MessageSquare size={18}/></button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </motion.tbody>
                    </table>
                    {filteredAppointments.length === 0 && <p className="text-center py-12 text-gray-500">No virtual appointments found.</p>}
                </div>
            </div>

            {modal === 'history' && selectedAppointment && (
                <PatientHistoryModal
                    patientId={selectedAppointment.patientId}
                    patientName={selectedAppointment.patientName}
                    onClose={() => setModal(null)}
                />
            )}

            {modal === 'bookVirtual' && (
                <Modal onClose={() => setModal(null)} width="max-w-md">
                    <h2 className="text-2xl font-bold mb-6">Schedule Virtual Consultation</h2>
                    <form onSubmit={handleBookVirtualAppointment} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Patient</label>
                            <select name="patientId" value={newVirtualAppointment.patientId} onChange={handleNewVirtualAppointmentChange} className="w-full p-2 bg-gray-800 border-gray-700 text-white rounded-lg" required>
                                <option value="">Select Patient</option>
                                {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Date</label>
                            <input type="date" name="appointmentDate" value={newVirtualAppointment.appointmentDate.split('T')[0]} onChange={handleNewVirtualAppointmentChange} min={new Date().toISOString().split('T')[0]} className="w-full p-2 bg-gray-800 border-gray-700 text-white rounded-lg" required />
                        </div>

                        {slotsLoading && <p className="text-center text-gray-400">Loading slots...</p>}
                        {availableSlots.length > 0 && !slotsLoading && (
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1">Available Slots</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {availableSlots.map(slot => (
                                        <button 
                                            type="button"
                                            key={slot}
                                            onClick={() => handleTimeSlotSelect(slot)}
                                            className={`p-2 rounded-lg text-sm text-center ${newVirtualAppointment.appointmentDate === slot ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                            {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!slotsLoading && availableSlots.length === 0 && newVirtualAppointment.appointmentDate && (
                            <p className="text-center text-gray-400">No available slots for this date.</p>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Notes (Optional)</label>
                            <textarea name="notes" value={newVirtualAppointment.notes} onChange={handleNewVirtualAppointmentChange} className="w-full p-2 bg-gray-800 border-gray-700 text-white rounded-lg" rows={3}></textarea>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Consultation Type</label>
                            <select name="consultationType" value={newVirtualAppointment.consultationType} onChange={handleNewVirtualAppointmentChange} className="w-full p-2 bg-gray-800 border-gray-700 text-white rounded-lg" required>
                                <option value="virtual">Virtual</option>
                                <option value="in-person">In-person</option>
                            </select>
                        </div>
                        <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-800">
                            <button type="button" onClick={() => setModal(null)} className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Schedule Consult</button>
                        </div>
                    </form>
                </Modal>
            )}

            {modal === 'prescribe' && selectedAppointment && (
                <Modal onClose={() => setModal(null)} width="max-w-xl">
                    <h2 className="text-2xl font-bold mb-6">E-Prescribe for {patients.find(p => p.id === selectedAppointment.patientId)?.firstName} {patients.find(p => p.id === selectedAppointment.patientId)?.lastName}</h2>
                    <form onSubmit={handleEPrescribe} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Prescription Notes</label>
                            <textarea name="notes" value={newPrescription.notes} onChange={handleNewPrescriptionChange} className="w-full p-2 bg-gray-800 border-gray-700 text-white rounded-lg" rows={5} required></textarea>
                        </div>
                        <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-800">
                            <button type="button" onClick={() => setModal(null)} className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700">Issue Prescription</button>
                        </div>
                    </form>
                </Modal>
            )}

            {modal === 'message' && selectedAppointment && (
                <Modal onClose={() => setModal(null)} width="max-w-md">
                    <h2 className="text-2xl font-bold mb-6">Message {patients.find(p => p.id === selectedAppointment.patientId)?.firstName} {patients.find(p => p.id === selectedAppointment.patientId)?.lastName}</h2>
                    <form onSubmit={handleSendMessage} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">Message</label>
                            <textarea name="message" value={newMessage.message} onChange={handleNewMessageChange} className="w-full p-2 bg-gray-800 border-gray-700 text-white rounded-lg" rows={5} required></textarea>
                        </div>
                        <div className="flex justify-end gap-4 pt-6 mt-4 border-t border-gray-800">
                            <button type="button" onClick={() => setModal(null)} className="px-6 py-2 bg-gray-700 rounded-lg font-semibold hover:bg-gray-600">Cancel</button>
                            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Send Message</button>
                        </div>
                    </form>
                </Modal>
            )}

        </div>
    )
}
import React, { useState, useEffect, useRef } from 'react';
import { Calendar, FileText, DollarSign, LogOut, Plus, X, User, Clock, Bell, Pill, Edit, Beaker, Sparkles, Download, ArrowRight, BookUser, ShieldCheck, HeartPulse, Sun, Moon, LayoutGrid, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useTheme } from '../../context/ThemeContext';
import { Button } from '../ui/button';
import apiUrl from '../../config/api';
import TriageChatModal from '../TriageChatModal';
import HealthTimeline from './HealthTimeline';
import MedicationTracker from './MedicationTracker';

import NewSidebar from '../NewSidebar';


export default function PatientDashboard({ patient, onLogout, updateUser }) {
    const { theme, toggleTheme } = useTheme();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [appointments, setAppointments] = useState([]);
    const [records, setRecords] = useState([]);
    const [billing, setBilling] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [labResults, setLabResults] = useState([]);
    const [prescriptions, setPrescriptions] = useState([]);
    const [showModal, setShowModal] = useState(null);
    
    // Refactored state for appointment booking
    const [newAppointment, setNewAppointment] = useState({ doctorId: '', notes: '', consultationType: 'in-person' });
    const [bookingDate, setBookingDate] = useState('');
    const [bookingSlot, setBookingSlot] = useState('');

    const fileInputRef = useRef(null);
    const [showTriageModal, setShowTriageModal] = useState(false);
    const [showSummaryModal, setShowSummaryModal] = useState(false);
    const [summaryContent, setSummaryContent] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);

    const fetchAllData = () => {
        if (!patient || !patient.id) return;
        const patientId = patient.id;
        Promise.all([
            fetch(apiUrl(`/api/portal/my-appointments/${patientId}`)).then(res => res.json()),
            fetch(apiUrl(`/api/portal/my-records/${patientId}`)).then(res => res.json()),
            fetch(apiUrl(`/api/portal/my-billing/${patientId}`)).then(res => res.json()),
            fetch(apiUrl(`/api/portal/my-lab-results/${patientId}`)).then(res => res.json()),
            fetch(apiUrl(`/api/portal/my-prescriptions/${patientId}`)).then(res => res.json()),
            fetch(apiUrl('/api/employees')).then(res => res.json())
        ]).then(([appointmentsData, recordsData, billingData, labData, prescData, doctorsData]) => {
            console.log('Appointments Data:', JSON.stringify(appointmentsData, null, 2));
            setAppointments(appointmentsData || []);
            setRecords(recordsData || []);
            setBilling(billingData || []);
            setLabResults(labData || []);
            setPrescriptions(prescData || []);
            setDoctors(doctorsData.filter(emp => emp.role === 'doctor') || []);
        }).catch(error => { console.error("Failed to fetch patient data:", error); });
    };

    useEffect(() => {
        if (patient && patient.id) {
            fetchAllData();
        }
    }, [patient]);

    const handlePhotoUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('profilePhoto', file);
        try {
            const response = await fetch(apiUrl(`/api/patients/${patient.id}/upload-photo`), {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            if (data.success) {
                updateUser({ profileImageUrl: data.profileImageUrl });
            }
        } catch (error) {
            console.error('Upload error:', error);
        }
    };
    
    const [availableSlots, setAvailableSlots] = useState([]);

    const fetchAvailableSlots = async (doctorId, date) => {
        if (!doctorId || !date) {
            setAvailableSlots([]);
            return;
        }
        try {
            const response = await fetch(apiUrl(`/api/schedules/available-slots/${doctorId}/${date}`));
            setAvailableSlots(await response.json());
        } catch (error) {
            console.error("Failed to fetch available slots:", error);
            setAvailableSlots([]);
        }
    };

    const handleBookAppointment = async (e) => {
        e.preventDefault();
        if (!bookingSlot) {
            alert("Please select an available time slot.");
            return;
        }
        try {
            const response = await fetch(apiUrl('/api/portal/book-appointment'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newAppointment, patientId: patient.id, appointmentDate: bookingSlot }),
            });
            const data = await response.json();
            if (data.success) {
                setShowModal(null);
                setNewAppointment({ doctorId: '', notes: '' });
                setBookingDate('');
                setBookingSlot('');
                setAvailableSlots([]);
                fetchAllData();
            } else {
                alert(data.message || 'Failed to book appointment.');
            }
        } catch (error) { console.error(error); }
    };

    const handleSummarizeHistory = async () => {
        setIsSummarizing(true);
        setShowSummaryModal(true);
        setSummaryContent('');

        const historyText = records.map(r => `On ${new Date(r.recordDate).toLocaleDateString()}, Dr. ${r.doctorName} diagnosed '${r.diagnosis}' and prescribed the following treatment: ${r.treatment}`).join('\n');
        const systemPrompt = "You are a helpful medical assistant. Your task is to summarize the provided medical history for a patient in simple, easy-to-understand language. Organize it chronologically if possible. Do not provide new medical advice. Start by saying 'Here is a summary of your medical history:'.";
        const userQuery = `Please summarize the following medical records:\n\n${historyText}`;

        try {
            const res = await fetch(apiUrl('/api/ai/ask'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userQuery }] }),
            });
            const data = await res.json();
            setSummaryContent(data.reply || "Could not generate summary.");
        } catch (err) {
            setSummaryContent('Error: Could not connect to the AI service.');
        } finally {
            setIsSummarizing(false);
        }
    };

    useEffect(() => {
        if (newAppointment.doctorId && bookingDate) {
            fetchAvailableSlots(newAppointment.doctorId, bookingDate);
        }
    }, [newAppointment.doctorId, bookingDate]);

    const nextAppointment = appointments.find(a => new Date(a.appointmentDate) > new Date() && a.status === 'scheduled');

    const StatCard = ({ title, value, icon: Icon }) => (
        <div className="p-4 rounded-xl border flex items-start justify-between bg-white border-gray-200 dark:bg-[#1C1C1E] dark:border-gray-800">
            <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
            </div>
            <div className="p-2 rounded-full bg-blue-100 dark:bg-gray-800">
                <Icon className="text-blue-400" size={20} />
            </div>
        </div>
    );
    
    const PrescriptionsContent = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold mb-6 text-foreground">My Prescriptions</h1>
            <div className="space-y-4">
                {prescriptions.length > 0 ? prescriptions.map(presc => (
                    <div key={presc.id} className="p-5 rounded-2xl bg-card border border-border">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2">
                            <div>
                                <p className="font-bold text-lg text-foreground">{presc.medicationName}</p>
                                <p className="text-sm text-muted-foreground">{presc.dosage}</p>
                            </div>
                            <div className="text-sm text-muted-foreground mt-2 sm:mt-0 text-right">
                                <p>Prescribed by Dr. {presc.doctorName}</p>
                                <p>on {new Date(presc.prescriptionDate).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className={`mt-2 text-xs font-semibold uppercase px-3 py-1 rounded-full inline-block ${presc.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                            {presc.status}
                        </div>
                    </div>
                )) : <p className="text-center text-muted-foreground py-12">You have no prescriptions.</p>}
            </div>
        </motion.div>
    );

    const LabResultsContent = () => {
        const handleDownloadResult = (result) => {
            const patientDetails = patient;
            const content = `
Shree Medicare Hospital - Lab Result
------------------------------------
Patient: ${patientDetails.firstName} ${patientDetails.lastName}
Test Name: ${result.testName}
Test Date: ${new Date(result.testDate).toLocaleDateString()}
Doctor: Dr. ${result.doctorName}
------------------------------------

Result:
${result.result_text}
            `;
            const element = document.createElement("a");
            const file = new Blob([content], {type: 'text/plain'});
            element.href = URL.createObjectURL(file);
            element.download = `lab_result_${result.id}.txt`;
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }

        return (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">My Lab Results</h1>
                <div className="space-y-2">
                    {labResults.filter(r => r.status === 'completed').length > 0 ? labResults.filter(r => r.status === 'completed').map(result => (
                        <div key={result.id} className="p-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2">
                                <p className="font-bold text-gray-900 dark:text-white">{result.testName}</p>
                                <p className="text-xs text-gray-400">{new Date(result.testDate).toLocaleDateString()}</p>
                            </div>
                            <p className="text-sm mt-2 p-3 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">{result.result_text}</p>
                            <div className="text-right mt-2">
                                <button onClick={() => handleDownloadResult(result)} className="text-blue-500 hover:text-blue-400 text-xs font-semibold flex items-center gap-1 ml-auto">
                                    <Download size={14} /> Download
                                </button>
                            </div>
                        </div>
                    )) : <p className="text-center text-gray-500 py-12">You have no completed lab results.</p>}
                </div>
             </motion.div>
        );
    }

    const renderContent = () => {
        switch(activeTab) {
            case 'dashboard': return <DashboardContent />;
            case 'timeline': return <HealthTimeline patient={patient} />;
            case 'appointments': return <AppointmentsContent />;
            case 'records': return <RecordsContent />;
            case 'billing': return <BillingContent />;
            case 'prescriptions': return <PrescriptionsContent />;
            case 'lab_results': return <LabResultsContent />;
            case 'medications': return <MedicationTracker patient={patient} />;
            case 'profile': return <ProfileContent />;
            default:
                return <div className="text-center py-20">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{activeTab.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</h2>
                    <p className="text-gray-500">This section is under construction.</p>
                </div>
        }
    }


    
    const DashboardContent = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold my-6 text-foreground">{`Welcome, ${patient?.firstName}!`}</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Next Appointment */}
                {nextAppointment ? (
                    <div className="p-6 rounded-2xl border bg-card border-border flex flex-col justify-between">
                        <div>
                            <h3 className="font-bold text-lg mb-3 text-foreground">Next Appointment</h3>
                            <p className="text-muted-foreground">With <span className="font-bold text-foreground">{nextAppointment.doctorName}</span></p>
                            <p className="text-4xl font-bold text-primary mt-2">{new Date(nextAppointment.appointmentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>
                            <p className="text-muted-foreground">{new Date(nextAppointment.appointmentDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        {nextAppointment.consultationType === 'virtual' && nextAppointment.roomUrl && (
                            <div className="mt-4">
                                <button onClick={() => window.open(nextAppointment.roomUrl, '_blank')} className="w-full bg-blue-600 text-white font-semibold p-3 rounded-lg hover:bg-blue-700 transition-colors">Join Virtual Consultation</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-6 rounded-2xl border bg-card border-border flex flex-col justify-center items-center text-center">
                        <h3 className="font-bold text-lg mb-2 text-foreground">No Upcoming Appointments</h3>
                        <p className="text-muted-foreground mb-4">Your schedule is clear.</p>
                        <button onClick={() => setActiveTab('appointments')} className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-full text-sm">Book a Visit</button>
                    </div>
                )}

                {/* AI Symptom Checker */}
                <div className="p-6 rounded-2xl border flex flex-col justify-center items-center text-center cursor-pointer bg-card border-border hover:border-primary/50 transition-all" onClick={() => setShowTriageModal(true)}>
                    <div className="p-3 rounded-full bg-primary/10 mb-3">
                        <Sparkles className="text-primary" size={28} />
                    </div>
                    <h3 className="font-semibold text-lg text-foreground">AI Symptom Checker</h3>
                    <p className="text-sm text-muted-foreground mt-1">Unsure about your symptoms? Get an AI-powered recommendation.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Medication Reminder */}
                <div className="lg:col-span-2 p-6 rounded-2xl border bg-card border-border">
                    <h3 className="font-bold text-lg mb-3 text-foreground">Medication Reminder</h3>
                    {prescriptions.length > 0 ? (
                        <>
                            <p className="text-muted-foreground">Your latest prescription from <span className="font-bold text-foreground">Dr. {prescriptions[0].doctorName}</span>:</p>
                            <div className="text-base mt-2 p-4 rounded-lg bg-muted/50 text-foreground">
                                <p className="font-semibold">{prescriptions[0].medicationName}</p>
                                <p className="text-sm">{prescriptions[0].dosage}</p>
                            </div>
                        </>
                    ) : (
                        <p className="text-muted-foreground">You have no active prescriptions.</p>
                    )}
                </div>

                {/* Stats */}
                <div className="space-y-4">
                    <StatCard title="Total Visits" value={appointments.length} icon={Calendar} />
                    <StatCard title="Amount Due" value={`$${billing.reduce((acc, bill) => bill.paymentStatus !== 'paid' ? acc + bill.amount : acc, 0).toFixed(2)}`} icon={DollarSign} />
                </div>
            </div>
        </motion.div>
    );

    const QuickAccessItem = ({ id, label, icon: Icon }) => (
        <button onClick={() => setActiveTab(id)} className="w-full flex items-center gap-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-700/50">
            <Icon className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <span className="font-semibold text-sm text-gray-900 dark:text-white">{label}</span>
            <ArrowRight className="w-4 h-4 text-gray-400 ml-auto" />
        </button>
    );

    const handleCancelAppointment = async (appointmentId) => {
        if (!window.confirm('Are you sure you want to cancel this appointment?')) {
            return;
        }
        try {
            const response = await fetch(apiUrl(`/api/portal/my-appointments/${appointmentId}/cancel`), {
                method: 'PUT',
            });
            const data = await response.json();
            if (data.success) {
                fetchAllData();
            } else {
                alert(data.message || 'Failed to cancel appointment.');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to connect to the server.');
        }
    };

    const AppointmentsContent = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold my-6 text-gray-900 dark:text-white">My Visits</h1>
            <div className="flex justify-between items-center mb-6">
                <div/>
                <button onClick={() => setShowModal('bookAppointment')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-full text-sm flex items-center gap-2">
                    <Plus size={16} /> Book
                </button>
            </div>
            <div className="rounded-2xl border bg-white border-gray-200 dark:bg-[#1C1C1E] dark:border-gray-800">
                <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                    {appointments.length > 0 ? appointments.map(app => (
                        <li key={app.id} className="p-4">
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-white">{new Date(app.appointmentDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                <p className="text-xs text-gray-400">with {app.doctorName} at {new Date(app.appointmentDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${app.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300' : app.status === 'canceled' ? 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'}`}>{app.status}</span>
                                {app.status === 'scheduled' && app.consultationType === 'virtual' && app.roomUrl && (
                                    <button onClick={() => window.open(app.roomUrl, '_blank')} className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Join</button>
                                )}
                                {app.status === 'scheduled' && app.consultationType !== 'virtual' && (
                                    <button onClick={() => handleCancelAppointment(app.id)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-semibold">
                                            Cancel
                                    </button>
                                )}
                            </div>
                        </li>
                    )) : <p className="text-center text-gray-500 py-12">You have no appointment history.</p>}
                </ul>
            </div>
        </motion.div>
    );
    
    const RecordsContent = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold my-6 text-gray-900 dark:text-white">Medical History</h1>
            <div className="flex justify-between items-center mb-6">
                <div/>
                <button onClick={handleSummarizeHistory} disabled={isSummarizing} className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold px-4 py-2 rounded-full text-sm flex items-center gap-2 disabled:bg-gray-500">
                    <Sparkles size={16} /> {isSummarizing ? 'Generating...' : 'AI Summary'}
                </button>
            </div>
            <div className="space-y-4">
                    {records.length > 0 ? records.map(rec => (
                        <div key={rec.id} className="p-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-800">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-bold text-gray-900 dark:text-white">{rec.diagnosis}</p>
                                <p className="text-xs text-gray-400">{new Date(rec.recordDate).toLocaleDateString()}</p>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Doctor: {rec.doctorName}</p>
                            <p className="text-sm mt-2 p-3 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-300">{rec.treatment}</p>
                        </div>
                    )) : <p className="text-center text-gray-500 py-8">You have no medical history.</p>}
            </div>
        </motion.div>
    );
    
    const BillingContent = () => (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl font-bold my-6 text-gray-900 dark:text-white">Billing</h1>
                <div className="rounded-2xl border bg-white border-gray-200 dark:bg-[#1C1C1E] dark:border-gray-800">
                <ul className="divide-y divide-gray-200 dark:divide-gray-800">
                    {billing.length > 0 ? billing.map(bill => (
                        <li key={bill.id} className="p-4">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                                <div>
                                    <p className="font-semibold text-gray-900 dark:text-white">Invoice #{bill.invoiceNumber}</p>
                                    <p className="text-xs text-gray-400">Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
                                </div>
                                <span className="text-lg font-bold text-gray-900 dark:text-white mt-2 sm:mt-0">${Number(bill.amount).toFixed(2)}</span>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${bill.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300'}`}>{bill.paymentStatus}</span>
                                {bill.paymentStatus !== 'paid' && <button className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">Pay Now</button>}
                            </div>
                        </li>
                    )) : <p className="text-center text-gray-500 py-12">You have no billing history.</p>}
                </ul>
            </div>
        </motion.div>
    );

    const ProfileContent = () => {
        const [details, setDetails] = useState(patient);

        useEffect(() => {
            setDetails(patient);
        }, [patient]);

        const handleDetailsUpdate = async (e) => {
            e.preventDefault();
            try {
                const response = await fetch(apiUrl(`/api/patients/${patient.id}`), {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(details),
                });
                const data = await response.json();
                alert(data.message || 'Profile updated!');
                updateUser(details);
            } catch (error) {
                console.error(error);
            }
        };

        return (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 className="text-3xl font-bold my-6 text-gray-900 dark:text-white">My Profile</h1>
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl border bg-white border-gray-200 dark:bg-[#1C1C1E] dark:border-gray-800">
                            <div className="flex items-center gap-4">
                                <div className="relative w-20 h-20 group">
                                    <img 
                                        src={patient?.profileImageUrl ? `${apiUrl('')}${patient.profileImageUrl}` : `https://ui-avatars.com/api/?name=${patient?.firstName}+${patient?.lastName}&background=1c1c1e&color=a0a0a0&bold=true`} 
                                        alt="Profile" 
                                        className="w-20 h-20 rounded-full object-cover" 
                                    />
                                    <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
                                    <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{patient.firstName} {patient.lastName}</h2>
                                    <p className="text-sm text-gray-500">{patient.email}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 rounded-xl border bg-white border-gray-200 dark:bg-[#1C1C1E] dark:border-gray-800">
                            <h3 className="font-bold text-md mb-3 text-gray-900 dark:text-white">Personal Details</h3>
                            <form onSubmit={handleDetailsUpdate} className="space-y-3">
                                <input value={details?.firstName || ''} onChange={e => setDetails({...details, firstName: e.target.value})} placeholder="First Name" className="w-full p-2 rounded-lg bg-gray-100 border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                <input value={details?.lastName || ''} onChange={e => setDetails({...details, lastName: e.target.value})} placeholder="Last Name" className="w-full p-2 rounded-lg bg-gray-100 border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                <input value={details?.phone || ''} onChange={e => setDetails({...details, phone: e.target.value})} placeholder="Phone" className="w-full p-2 rounded-lg bg-gray-100 border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-full font-semibold text-sm">Save Changes</button>
                            </form>
                        </div>
                    </div>
            </motion.div>
        );
    };


    return (
        <div className="flex h-screen bg-gray-900 text-white overflow-hidden font-sans">
            <NewSidebar 
                activeModule={activeTab} 
                setActiveModule={setActiveTab} 
                userType="patient" 
                onLogout={onLogout} 
                user={patient} 
                isSidebarOpen={isSidebarOpen} 
                setSidebarOpen={setSidebarOpen} 
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white dark:bg-gray-800 shadow-md lg:hidden pt-6">
                    <div className="flex justify-between items-center p-4">
                        <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Shree Medicare</h1>
                        <Button variant="ghost" size="icon" onClick={toggleTheme}>
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </div>
                </header>
                <main className={`flex-1 overflow-y-auto ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'} p-4 sm:p-6`}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                        >
                        {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Modals */}
             <AnimatePresence>
                {showModal === 'bookAppointment' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-md m-4 border border-gray-700"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-white">Book an Appointment</h2>
                                <button onClick={() => setShowModal(null)}><X className="text-gray-500 hover:text-white" /></button>
                            </div>
                            <form onSubmit={handleBookAppointment} className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Doctor</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2">
                                        {doctors.filter(doc => doc.role === 'doctor').map(doc => (
                                            <div
                                                key={doc.id}
                                                onClick={() => { setNewAppointment(p => ({...p, doctorId: doc.id })); setBookingDate(''); setBookingSlot(''); }}
                                                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200
                                                            ${newAppointment.doctorId === doc.id ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-700 hover:bg-gray-600'}`}
                                            >
                                                <img 
                                                    src={doc.profileImageUrl ? `${apiUrl('')}${doc.profileImageUrl}` : `https://ui-avatars.com/api/?name=${doc.firstName}+${doc.lastName}&background=1c1c1e&color=a0a0a0&bold=true`} 
                                                    alt={doc.firstName} 
                                                    className="w-8 h-8 rounded-full object-cover"
                                                />
                                                <div>
                                                    <p className="text-sm font-semibold">Dr. {doc.firstName} {doc.lastName}</p>
                                                    <p className="text-xs opacity-75">{doc.departmentName}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {newAppointment.doctorId && (
                                    <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                                        <h3 className="text-sm font-bold text-gray-300 mb-2">Selected Doctor</h3>
                                        <div className="flex items-center gap-4">
                                            <img 
                                                src={doctors.find(d => d.id === newAppointment.doctorId)?.profileImageUrl ? `${apiUrl('')}${doctors.find(d => d.id === newAppointment.doctorId)?.profileImageUrl}` : `https://ui-avatars.com/api/?name=${doctors.find(d => d.id === newAppointment.doctorId)?.firstName}+${doctors.find(d => d.id === newAppointment.doctorId)?.lastName}&background=1c1c1e&color=a0a0a0&bold=true`} 
                                                alt={doctors.find(d => d.id === newAppointment.doctorId)?.firstName} 
                                                className="w-16 h-16 rounded-full object-cover"
                                            />
                                            <div>
                                                <p className="text-lg font-semibold text-white">Dr. {doctors.find(d => d.id === newAppointment.doctorId)?.firstName} {doctors.find(d => d.id === newAppointment.doctorId)?.lastName}</p>
                                                <p className="text-sm text-gray-400">{doctors.find(d => d.id === newAppointment.doctorId)?.departmentName}</p>
                                                <p className="text-xs text-gray-500">{doctors.find(d => d.id === newAppointment.doctorId)?.position}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Date</label>
                                    <input type="date" name="appointmentDate" value={bookingDate} onChange={(e) => { setBookingDate(e.target.value); setBookingSlot(''); }} min={new Date().toISOString().split('T')[0]} className="w-full p-2 bg-gray-800 border-gray-700 text-white rounded-lg text-sm" required />
                                </div>

                                {availableSlots.length > 0 && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">Available Slots</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {availableSlots.map(slot => (
                                                <button 
                                                    type="button"
                                                    key={slot}
                                                    onClick={() => setBookingSlot(slot)}
                                                    className={`p-2 rounded-lg text-xs text-center ${bookingSlot === slot ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>
                                                    {new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Reason for Visit (Optional)</label>
                                    <textarea name="notes" onChange={(e) => setNewAppointment(p => ({...p, notes: e.target.value}))} className="w-full p-2 bg-gray-800 border-gray-700 text-white rounded-lg text-sm" rows={2}></textarea>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">Consultation Type</label>
                                    <select name="consultationType" value={newAppointment.consultationType} onChange={(e) => setNewAppointment(p => ({...p, consultationType: e.target.value}))} className="w-full p-2 bg-gray-800 border-gray-700 text-white rounded-lg text-sm" required>
                                        <option value="in-person">In-person</option>
                                        <option value="virtual">Virtual</option>
                                    </select>
                                </div>
                                <button type="submit" disabled={!bookingSlot} className="w-full bg-blue-600 text-white font-semibold p-2 rounded-lg hover:bg-blue-700 transition-colors text-sm disabled:bg-gray-500 disabled:cursor-not-allowed">Book Appointment</button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
             </AnimatePresence>

            {showTriageModal && <TriageChatModal onClose={() => setShowTriageModal(false)} />}

            <AnimatePresence>
                {showSummaryModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20, opacity: 0 }}
                            className="bg-[#1C1C1E] rounded-2xl p-6 w-full max-w-xl m-4 border border-gray-700"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles size={18} /> AI Medical History Summary</h2>
                                <button onClick={() => setShowSummaryModal(false)}><X className="text-gray-500 hover:text-white" /></button>
                            </div>
                            {isSummarizing ? (
                                <p className="text-center text-gray-400 animate-pulse py-10">AI is summarizing your records...</p>
                            ) : (
                                <div className="space-y-4">
                                    <p className="p-4 bg-gray-800 border-gray-700 rounded-lg text-gray-300 whitespace-pre-wrap text-sm max-h-96 overflow-y-auto">{summaryContent}</p>
                                    <div className="flex justify-end">
                                        <button onClick={() => setShowSummaryModal(false)} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 text-sm">Close</button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
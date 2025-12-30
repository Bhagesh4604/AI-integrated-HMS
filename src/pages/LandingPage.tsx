import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue, animate } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import ThreeBackground from '@/components/landing/ThreeBackground';
import {
  Calendar,
  Code,
  FileText,
  User,
  Clock,
  Sparkles,
  Moon,
  Sun,
  MapPin,
  Phone,
  Mail,
  Users as UsersIcon,
  Shield,
  Video
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useTheme } from '../context/ThemeContext';
import { AnimatedPortalCard } from '@/components/landing/AnimatedPortalCard';
import TriageChatModal from '@/components/TriageChatModal';
import AiSearchSection from '@/components/landing/AiSearchSection';
import RadialOrbitalTimeline from '@/components/ui/radial-orbital-timeline';

// Main Landing Page Component
export default function LandingPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const [showTriageModal, setShowTriageModal] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('verified') === 'true') {
      navigate('/login/patient');
    }
  }, [navigate]);

  const timelineData = [
    {
      id: 1,
      title: "Patient Registration",
      date: "Step 1",
      content: "Quick and easy patient registration process.",
      category: "Onboarding",
      icon: User,
      relatedIds: [2],
      status: "completed" as const,
      energy: 100,
    },
    {
      id: 2,
      title: "Appointment Booking",
      date: "Step 2",
      content: "Schedule appointments with doctors and specialists.",
      category: "Scheduling",
      icon: Calendar,
      relatedIds: [1, 3],
      status: "completed" as const,
      energy: 90,
    },
    {
      id: 3,
      title: "AI Symptom Check",
      date: "Step 3",
      content: "Use our AI to check symptoms and get recommendations.",
      category: "AI Features",
      icon: Sparkles,
      relatedIds: [2, 4],
      status: "in-progress" as const,
      energy: 60,
    },
    {
      id: 4,
      title: "View Medical Records",
      date: "Step 4",
      content: "Access your complete medical history securely.",
      category: "Records",
      icon: FileText,
      relatedIds: [3, 5],
      status: "pending" as const,
      energy: 30,
    },
    {
      id: 5,
      title: "Telemedicine",
      date: "Step 5",
      content: "Consult with doctors remotely via video calls.",
      category: "Consultation",
      icon: Video,
      relatedIds: [4],
      status: "pending" as const,
      energy: 10,
    },
  ];





  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const cities = [
    { name: 'Mumbai', address: '123 Marine Drive, Mumbai, Maharashtra 400001', phone: '+91 22 1234 5678' },
    { name: 'Delhi', address: '456 Connaught Place, New Delhi 110001', phone: '+91 11 8765 4321' },
    { name: 'Bangalore', address: '789 MG Road, Bangalore, Karnataka 560001', phone: '+91 80 9876 5432' },
  ];

  return (
    <div className={theme}>
      <div className="min-h-screen bg-background text-foreground">
        <Button
          variant="outline"
          size="icon"
          className="fixed right-4 z-50 rounded-full"
          onClick={toggleTheme}
          style={{ top: 'env(safe-area-inset-top, 1.5rem)' }}
        >
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
        <ThreeBackground />

        <motion.section
          ref={heroRef}
          className="relative min-h-screen flex items-center justify-center overflow-hidden p-4 z-10"
        >
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8, ease: 'easeInOut' }}
              className="space-y-6"
            >
              <img src="/logo.svg" alt="Shree Medicare Logo" className="w-24 h-24 mx-auto mb-6 rounded-2xl shadow-lg" />
              <Badge variant="secondary" className="mb-4">
                <Sparkles className="w-4 h-4 mr-2" />
                Powered by AI & Innovation
              </Badge>

              <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight">
                Shree Medicare: The Future of Healing
              </h1>

              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
                Combining Compassionate Care with Cutting-Edge Technology
              </p>

              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <GradientButton onClick={scrollToFeatures}>
                  Discover Our Services
                </GradientButton>
                <GradientButton onClick={() => document.getElementById('portals')?.scrollIntoView({ behavior: 'smooth' })}>
                  Login
                </GradientButton>
                <GradientButton onClick={() => setShowTriageModal(true)}>
                  <Sparkles className="w-5 h-5 mr-2" /> AI Symptom Checker
                </GradientButton>
              </div>
            </motion.div>
          </div>
        </motion.section>

        <AiSearchSection />


        <RadialOrbitalTimeline timelineData={timelineData} />

        <motion.section className="py-24 bg-muted/50 dark:bg-black/20 backdrop-blur-sm relative overflow-hidden z-10">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Our Location
              </h2>
              <p className="text-xl text-muted-foreground">
                Find us at our prime location
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="h-[500px] rounded-lg overflow-hidden bg-card border border-border">
                <img src="/India.jpg" alt="Map of Shree Medicare locations in India" className="w-full h-full object-cover" />
              </div>

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <Card className="backdrop-blur-sm bg-card/50 border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-primary" />
                        Shree Medicare Hospital
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground flex items-start">
                        <Mail className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        96GF+GMJ, Tolnoor, Maharashtra 413227
                      </p>
                      <p className="text-sm text-muted-foreground flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        +917483159830
                      </p>
                      <GradientButton
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent('96GF+GMJ, Tolnoor, Maharashtra 413227')}`, '_blank')}
                      >
                        Get Directions
                      </GradientButton>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section id="portals" className="py-24 relative overflow-hidden z-10">
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4">
                Access Your Portal
              </h2>
              <p className="text-xl text-muted-foreground">
                Choose your portal to get started
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <AnimatedPortalCard
                title="Patient Portal"
                description="Access your medical records, book appointments, and manage your healthcare journey."
                icon={UsersIcon}
                onClick={() => navigate('/login/patient')}
                gradientColors={["#3b82f6", "#a855f7"]}
              />
              <AnimatedPortalCard
                title="Staff Portal"
                description="Manage patient records, appointments, billing, and hospital operations efficiently."
                icon={Shield}
                onClick={() => navigate('/login/staff')}
                gradientColors={["#10b980", "#06b6d4"]}
              />
            </div>
          </div>
        </motion.section>

        <footer className="py-6 border-t border-border/50 bg-background/50 backdrop-blur-md relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
            <p className="text-sm">&copy; 2026 Shree Medicare . All Rights Reserved. Designed & Developed by 🤍 Bhagesh Biradar.</p>
          </div>
        </footer>

        <Dialog open={!!selectedCity} onOpenChange={() => setSelectedCity(null)}>
          <DialogContent>
            <DialogTitle>Shree Medicare - {selectedCity?.name}</DialogTitle>
            <p>Details for {selectedCity?.name} hospital would be shown here.</p>
          </DialogContent>
        </Dialog>

        {showTriageModal && <TriageChatModal onClose={() => setShowTriageModal(false)} />}
      </div>
    </div>
  );
};
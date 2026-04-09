/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  auth, db, handleFirestoreError, OperationType 
} from './firebase';
import { 
  onAuthStateChanged, User 
} from 'firebase/auth';
import { 
  collection, onSnapshot, query, where, addDoc, updateDoc, doc, getDocs, setDoc, getDocFromServer
} from 'firebase/firestore';
import { 
  Droplets, Heart, Hospital, Activity, LogIn, LogOut, Plus, Search, 
  Database, FileText, Info, CheckCircle2, XCircle, Clock, MapPin, Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Markdown from 'react-markdown';
import { BloodGroup, Patient, Donor, BloodBank, Donation, BloodRequest } from './types';

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Data states
  const [patients, setPatients] = useState<Patient[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [bloodBanks, setBloodBanks] = useState<BloodBank[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [requests, setRequests] = useState<BloodRequest[]>([]);

  useEffect(() => {
    // Using a default guest user for demonstration without Google Sign-In
    setUser({ uid: 'guest-user-id', displayName: 'Guest User' } as any);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;

    // Test connection as required
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    };
    testConnection();

    // Listen to patients
    const qPatients = query(collection(db, "patients"), where("uid", "==", user.uid));
    const unsubPatients = onSnapshot(qPatients, (snapshot) => {
      setPatients(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Patient)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "patients"));

    // Listen to donors
    const qDonors = query(collection(db, "donors"), where("uid", "==", user.uid));
    const unsubDonors = onSnapshot(qDonors, (snapshot) => {
      setDonors(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Donor)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "donors"));

    // Listen to blood banks
    const unsubBanks = onSnapshot(collection(db, "bloodBanks"), (snapshot) => {
      setBloodBanks(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BloodBank)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "bloodBanks"));

    // Listen to donations (own)
    const qDonations = query(collection(db, "donations"), where("donorId", "==", user.uid));
    const unsubDonations = onSnapshot(qDonations, (snapshot) => {
      setDonations(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Donation)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "donations"));

    // Listen to requests (own)
    const qRequests = query(collection(db, "requests"), where("patientId", "==", user.uid));
    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      setRequests(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BloodRequest)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, "requests"));

    return () => {
      unsubPatients();
      unsubDonors();
      unsubBanks();
      unsubDonations();
      unsubRequests();
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Droplets className="h-8 w-8 text-red-600" />
              <span className="text-xl font-bold text-slate-900 hidden sm:block">HemaConnect</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600 mr-4">
                <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                  G
                </div>
                <span>Guest User</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <div className="flex overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="bg-white border border-slate-200 p-1 h-auto">
              <TabsTrigger value="dashboard" className="px-6 py-2.5 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                <Activity className="h-4 w-4 mr-2" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="patients" className="px-6 py-2.5 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                <Hospital className="h-4 w-4 mr-2" /> Patients
              </TabsTrigger>
              <TabsTrigger value="donors" className="px-6 py-2.5 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                <Heart className="h-4 w-4 mr-2" /> Donors
              </TabsTrigger>
              <TabsTrigger value="banks" className="px-6 py-2.5 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                <Database className="h-4 w-4 mr-2" /> Blood Banks
              </TabsTrigger>
              <TabsTrigger value="design" className="px-6 py-2.5 data-[state=active]:bg-red-50 data-[state=active]:text-red-700">
                <FileText className="h-4 w-4 mr-2" /> System Design
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabsContent value="dashboard" className="mt-0 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Total Donors" value={donors.length} icon={<Heart className="text-red-500" />} />
                  <StatCard title="Total Patients" value={patients.length} icon={<Hospital className="text-blue-500" />} />
                  <StatCard title="Blood Banks" value={bloodBanks.length} icon={<Database className="text-amber-500" />} />
                  <StatCard title="Active Requests" value={requests.filter(r => r.status === 'pending').length} icon={<Clock className="text-purple-500" />} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Donations</CardTitle>
                      <CardDescription>Your contribution history</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {donations.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">No donations recorded yet.</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Bank</TableHead>
                              <TableHead>Units</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {donations.map(d => (
                              <TableRow key={d.id}>
                                <TableCell>{new Date(d.date).toLocaleDateString()}</TableCell>
                                <TableCell>{bloodBanks.find(b => b.id === d.bloodBankId)?.name || 'Unknown'}</TableCell>
                                <TableCell>{d.units} units</TableCell>
                                <TableCell><StatusBadge status={d.status} /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Requests</CardTitle>
                      <CardDescription>Status of your blood requests</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {requests.length === 0 ? (
                        <div className="text-center py-8 text-slate-400">No requests made yet.</div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Group</TableHead>
                              <TableHead>Units</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {requests.map(r => (
                              <TableRow key={r.id}>
                                <TableCell>{new Date(r.date).toLocaleDateString()}</TableCell>
                                <TableCell><Badge variant="outline">{r.bloodGroup}</Badge></TableCell>
                                <TableCell>{r.units} units</TableCell>
                                <TableCell><StatusBadge status={r.status} /></TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="patients" className="mt-0 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Patient Records</h2>
                  <AddPatientDialog onAdd={async (p) => {
                    try {
                      await addDoc(collection(db, "patients"), { ...p, uid: user.uid });
                    } catch (err) {
                      handleFirestoreError(err, OperationType.CREATE, "patients");
                    }
                  }} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {patients.map(p => (
                    <Card key={p.id} className="overflow-hidden border-slate-200 hover:border-red-200 transition-colors">
                      <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{p.name}</CardTitle>
                          <Badge className="bg-red-600">{p.bloodGroup}</Badge>
                        </div>
                        <CardDescription>{p.disease}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-2 text-sm">
                        <div className="flex items-center text-slate-600">
                          <Phone className="h-4 w-4 mr-2 opacity-70" /> {p.contact}
                        </div>
                        <div className="flex items-center text-slate-600">
                          <MapPin className="h-4 w-4 mr-2 opacity-70" /> {p.address}
                        </div>
                      </CardContent>
                      <CardFooter className="bg-slate-50/30 border-t border-slate-100 flex justify-end">
                        <BloodRequestDialog 
                          patient={p} 
                          bloodBanks={bloodBanks}
                          onAdd={async (req) => {
                            try {
                              await addDoc(collection(db, "requests"), { 
                                ...req, 
                                patientId: user.uid,
                                patientName: p.name,
                                status: 'pending',
                                date: new Date().toISOString()
                              });
                            } catch (err) {
                              handleFirestoreError(err, OperationType.CREATE, "requests");
                            }
                          }}
                        />
                      </CardFooter>
                    </Card>
                  ))}
                  {patients.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                      <Hospital className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No patient records found. Add one to get started.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="donors" className="mt-0 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Donor Profiles</h2>
                  <AddDonorDialog onAdd={async (d) => {
                    try {
                      await addDoc(collection(db, "donors"), { ...d, uid: user.uid });
                    } catch (err) {
                      handleFirestoreError(err, OperationType.CREATE, "donors");
                    }
                  }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {donors.map(d => (
                    <Card key={d.id} className="overflow-hidden border-slate-200 hover:border-red-200 transition-colors">
                      <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{d.name}</CardTitle>
                          <Badge className="bg-red-600">{d.bloodGroup}</Badge>
                        </div>
                        <CardDescription>Donor ID: {d.id?.slice(-6).toUpperCase()}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4 space-y-3 text-sm">
                        <div className="flex items-center text-slate-600">
                          <Phone className="h-4 w-4 mr-2 opacity-70" /> {d.contact}
                        </div>
                        <div className="flex items-center text-slate-600">
                          <MapPin className="h-4 w-4 mr-2 opacity-70" /> {d.address}
                        </div>
                        <div className="p-3 bg-blue-50 rounded-lg text-blue-700 text-xs">
                          <span className="font-semibold block mb-1">Medical Report Summary:</span>
                          {d.medicalReport}
                        </div>
                      </CardContent>
                      <CardFooter className="bg-slate-50/30 border-t border-slate-100 flex justify-end">
                        <DonationDialog 
                          donor={d} 
                          bloodBanks={bloodBanks}
                          onAdd={async (don) => {
                            try {
                              await addDoc(collection(db, "donations"), { 
                                ...don, 
                                donorId: user.uid,
                                donorName: d.name,
                                status: 'pending',
                                date: new Date().toISOString(),
                                bloodGroup: d.bloodGroup
                              });
                            } catch (err) {
                              handleFirestoreError(err, OperationType.CREATE, "donations");
                            }
                          }}
                        />
                      </CardFooter>
                    </Card>
                  ))}
                  {donors.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-300">
                      <Heart className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No donor profiles found. Register as a donor to save lives.</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="banks" className="mt-0 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-slate-900">Blood Bank Network</h2>
                  <AddBankDialog onAdd={async (b) => {
                    try {
                      await addDoc(collection(db, "bloodBanks"), { ...b, managerUid: user.uid });
                    } catch (err) {
                      handleFirestoreError(err, OperationType.CREATE, "bloodBanks");
                    }
                  }} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {bloodBanks.map(b => (
                    <Card key={b.id} className="border-slate-200">
                      <CardHeader>
                        <CardTitle>{b.name}</CardTitle>
                        <CardDescription className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" /> {b.address}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-4 gap-2">
                          {BLOOD_GROUPS.map(group => (
                            <div key={group} className="flex flex-col items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                              <span className="text-xs font-bold text-red-600">{group}</span>
                              <span className="text-lg font-semibold">{b.inventory?.[group] || 0}</span>
                              <span className="text-[10px] text-slate-400 uppercase">Units</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between items-center text-sm text-slate-500 border-t pt-4">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" /> {b.contact}
                        </div>
                        {b.managerUid === user.uid && (
                          <Badge variant="secondary">Managed by you</Badge>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="design" className="mt-0">
                <Card className="border-none shadow-sm">
                  <CardHeader>
                    <CardTitle>System Architecture & Design</CardTitle>
                    <CardDescription>Schema, Normalization, and ER Diagram details</CardDescription>
                  </CardHeader>
                  <CardContent className="prose prose-slate max-w-none">
                    <div className="markdown-body">
                      <Markdown>{DESIGN_DOC}</Markdown>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; 2026 HemaConnect Blood Donation System. All rights reserved.</p>
          <p className="mt-1">Built with React, Tailwind, and Firebase.</p>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <Card className="border-slate-200">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'completed':
    case 'approved':
    case 'fulfilled':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" /> {status}</Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200"><XCircle className="h-3 w-3 mr-1" /> {status}</Badge>;
    case 'pending':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200"><Clock className="h-3 w-3 mr-1" /> {status}</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

// Dialog Components
function AddPatientDialog({ onAdd }: { onAdd: (p: Omit<Patient, 'id' | 'uid'>) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', bloodGroup: 'A+' as BloodGroup, disease: '', contact: '', address: '' });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-red-600 hover:bg-red-700"><Plus className="h-4 w-4 mr-2" /> Add Patient</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Patient Record</DialogTitle>
          <DialogDescription>Enter the patient's details to track their requirements.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Blood Group</label>
              <Select value={formData.bloodGroup} onValueChange={v => setFormData({...formData, bloodGroup: v as BloodGroup})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact</label>
              <Input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="+1 234..." />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Disease/Condition</label>
            <Input value={formData.disease} onChange={e => setFormData({...formData, disease: e.target.value})} placeholder="Anemia, Surgery, etc." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="123 Main St..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => { onAdd(formData); setOpen(false); }}>Save Record</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddDonorDialog({ onAdd }: { onAdd: (d: Omit<Donor, 'id' | 'uid'>) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', bloodGroup: 'A+' as BloodGroup, medicalReport: '', contact: '', address: '' });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-red-600 hover:bg-red-700"><Plus className="h-4 w-4 mr-2" /> Register as Donor</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Donor Registration</DialogTitle>
          <DialogDescription>Register as a donor to help those in need.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Jane Smith" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Blood Group</label>
              <Select value={formData.bloodGroup} onValueChange={v => setFormData({...formData, bloodGroup: v as BloodGroup})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BLOOD_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact</label>
              <Input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="+1 234..." />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Medical History Summary</label>
            <Input value={formData.medicalReport} onChange={e => setFormData({...formData, medicalReport: e.target.value})} placeholder="Healthy, No chronic illness..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="456 Oak Ave..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => { onAdd(formData); setOpen(false); }}>Register</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddBankDialog({ onAdd }: { onAdd: (b: Omit<BloodBank, 'id' | 'managerUid'>) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', contact: '', inventory: { "A+": 0, "A-": 0, "B+": 0, "B-": 0, "AB+": 0, "AB-": 0, "O+": 0, "O-": 0 } as Record<BloodGroup, number> });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline"><Plus className="h-4 w-4 mr-2" /> Add Blood Bank</Button>} />
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Register Blood Bank</DialogTitle>
          <DialogDescription>Add a new blood bank facility to the network.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bank Name</label>
              <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="City Central Blood Bank" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contact</label>
              <Input value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} placeholder="+1 800..." />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Address</label>
            <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="789 Medical Plaza..." />
          </div>
          
          <div className="space-y-2 pt-2">
            <label className="text-sm font-medium">Initial Inventory (Units)</label>
            <div className="grid grid-cols-4 gap-3">
              {BLOOD_GROUPS.map(g => (
                <div key={g} className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-500">{g}</span>
                  <Input 
                    type="number" 
                    value={formData.inventory[g]} 
                    onChange={e => setFormData({
                      ...formData, 
                      inventory: { ...formData.inventory, [g]: parseInt(e.target.value) || 0 }
                    })} 
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => { onAdd(formData); setOpen(false); }}>Register Bank</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BloodRequestDialog({ patient, bloodBanks, onAdd }: { patient: Patient, bloodBanks: BloodBank[], onAdd: (r: Omit<BloodRequest, 'id' | 'patientId' | 'patientName' | 'status' | 'date'>) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ bloodBankId: '', bloodGroup: patient.bloodGroup, units: 1 });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">Request Blood</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Blood Request</DialogTitle>
          <DialogDescription>Request blood units for {patient.name}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Blood Bank</label>
            <Select value={formData.bloodBankId} onValueChange={v => setFormData({...formData, bloodBankId: v})}>
              <SelectTrigger><SelectValue placeholder="Choose a bank" /></SelectTrigger>
              <SelectContent>
                {bloodBanks.map(b => <SelectItem key={b.id} value={b.id!}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Blood Group</label>
              <Input value={formData.bloodGroup} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Units Required</label>
              <Input type="number" value={formData.units} onChange={e => setFormData({...formData, units: parseInt(e.target.value) || 1})} min={1} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => { onAdd(formData); setOpen(false); }}>Submit Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DonationDialog({ donor, bloodBanks, onAdd }: { donor: Donor, bloodBanks: BloodBank[], onAdd: (d: Omit<Donation, 'id' | 'donorId' | 'donorName' | 'status' | 'date' | 'bloodGroup'>) => void }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ bloodBankId: '', units: 1 });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="bg-red-600 hover:bg-red-700">Donate Now</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Donation</DialogTitle>
          <DialogDescription>Schedule a donation for {donor.name}.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Blood Bank</label>
            <Select value={formData.bloodBankId} onValueChange={v => setFormData({...formData, bloodBankId: v})}>
              <SelectTrigger><SelectValue placeholder="Choose a bank" /></SelectTrigger>
              <SelectContent>
                {bloodBanks.map(b => <SelectItem key={b.id} value={b.id!}>{b.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Units to Donate</label>
            <Input type="number" value={formData.units} onChange={e => setFormData({...formData, units: parseInt(e.target.value) || 1})} min={1} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={() => { onAdd(formData); setOpen(false); }}>Confirm Donation</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const DESIGN_DOC = `
# Blood Donation System: Database & Architecture

## 1. Database Schema (Firestore)

The system is built using a NoSQL document-oriented architecture with five primary collections.

### Entities & Attributes

#### **Patients** (\`/patients\`)
- \`id\`: Unique Identifier (Auto-generated)
- \`name\`: String (Full Name)
- \`bloodGroup\`: Enum (A+, A-, B+, B-, AB+, AB-, O+, O-)
- \`disease\`: String (Condition requiring blood)
- \`contact\`: String (Phone number)
- \`address\`: String (Physical address)
- \`uid\`: String (Owner's Auth UID)

#### **Donors** (\`/donors\`)
- \`id\`: Unique Identifier
- \`name\`: String
- \`bloodGroup\`: Enum
- \`medicalReport\`: String (Health summary)
- \`address\`: String
- \`contact\`: String
- \`uid\`: String (Donor's Auth UID)
- \`lastDonationDate\`: Timestamp

#### **Blood Banks** (\`/bloodBanks\`)
- \`id\`: Unique Identifier
- \`name\`: String
- \`address\`: String
- \`contact\`: String
- \`inventory\`: Map (Key: BloodGroup, Value: Number of Units)
- \`managerUid\`: String (Manager's Auth UID)

#### **Donations** (\`/donations\`)
- \`donorId\`: Reference to Donor UID
- \`bloodBankId\`: Reference to Blood Bank ID
- \`date\`: Timestamp
- \`units\`: Number
- \`status\`: Enum (pending, completed, rejected)
- \`bloodGroup\`: Enum

#### **Requests** (\`/requests\`)
- \`patientId\`: Reference to Patient UID
- \`bloodBankId\`: Reference to Blood Bank ID
- \`bloodGroup\`: Enum
- \`units\`: Number
- \`status\`: Enum (pending, approved, fulfilled, rejected)
- \`date\`: Timestamp

---

## 2. Normalization Strategy

While Firestore is NoSQL, we apply relational normalization principles to ensure data integrity.

### 1NF (First Normal Form)
- All attributes are atomic. For example, \`inventory\` is a map of key-value pairs rather than a comma-separated string.
- Each record has a unique identifier (Firestore Document ID).

### 2NF (Second Normal Form)
- All non-key attributes are fully functionally dependent on the primary key.
- We separate **Donations** and **Requests** from the **Donor** and **Patient** entities to avoid partial dependencies and redundant data.

### 3NF (Third Normal Form)
- We eliminate transitive dependencies. For example, we store \`bloodBankId\` in the Donation record rather than duplicating the entire Blood Bank address and contact info. We fetch bank details by reference when needed.

---

## 3. ER Diagram (Conceptual)

\`\`\`mermaid
erDiagram
    PATIENT ||--o{ REQUEST : "makes"
    DONOR ||--o{ DONATION : "performs"
    BLOOD_BANK ||--o{ DONATION : "receives"
    BLOOD_BANK ||--o{ REQUEST : "fulfills"
    
    PATIENT {
        string id PK
        string name
        string bloodGroup
        string uid FK
    }
    
    DONOR {
        string id PK
        string name
        string bloodGroup
        string uid FK
    }
    
    BLOOD_BANK {
        string id PK
        string name
        map inventory
        string managerUid FK
    }
    
    DONATION {
        string id PK
        string donorId FK
        string bloodBankId FK
        int units
        string status
    }
    
    REQUEST {
        string id PK
        string patientId FK
        string bloodBankId FK
        string bloodGroup
        int units
        string status
    }
\`\`\`

---

## 4. Interrelation Logic

1. **Donation Flow**: When a donor registers a donation, a record is created in \`donations\`. Upon manager approval, the \`inventory\` in the corresponding \`bloodBanks\` document is incremented for that blood group.
2. **Request Flow**: When a patient requests blood, a \`requests\` record is created. Upon approval, the system checks the \`bloodBanks\` inventory. If fulfilled, the inventory is decremented.
3. **Security**: Firebase Security Rules ensure that users can only modify their own records, while blood bank managers have elevated permissions to update statuses and inventory.
`;


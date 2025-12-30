import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { useAdminRole } from '@/hooks/useAdminRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, ShieldCheck, Settings, BarChart, Package, Image } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { adminService, AdminUser, ProviderRegistration, ServiceWithProvider, AdminBooking } from '@/services/adminService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';
import HomePageImageManager from '@/components/admin/HomePageImageManager';
import PopularCategoriesManager from '@/components/admin/PopularCategoriesManager';
import ServiceSectionsManager from '@/components/admin/ServiceSectionsManager';

const AdminPanel = () => {
  const navigate = useNavigate();
  const { isAdmin, loading } = useAdminRole();
  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [providers, setProviders] = useState<ProviderRegistration[]>([]);
  const [services, setServices] = useState<ServiceWithProvider[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProviders: 0,
    totalBookings: 0,
    totalRevenue: 0
  });
  const [loadingData, setLoadingData] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderRegistration | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  useEffect(() => {
    if (!loading && !isAdmin) {
      navigate('/');
    } else if (!loading && isAdmin) {
      loadAdminData();
    }
  }, [isAdmin, loading, navigate]);

  const loadAdminData = async () => {
    setLoadingData(true);
    try {
      const [usersData, providerStats, providersData, servicesData, bookingStats, bookingsData] = await Promise.all([
        adminService.getAllUsers(),
        adminService.getProviderStats(),
        adminService.getAllProviderRegistrations(),
        adminService.getAllServicesWithProviders(),
        adminService.getBookingStats(),
        adminService.getAllBookings()
      ]);

      setUsers(usersData);
      setProviders(providersData);
      setServices(servicesData);
      setBookings(bookingsData);
      
      setStats({
        totalUsers: usersData.length,
        activeProviders: Number(providerStats.approved_providers || 0),
        totalBookings: Number(bookingStats.total_bookings || 0),
        totalRevenue: Number(bookingStats.total_revenue || 0)
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleVerifyProvider = async (registrationId: string, status: 'approved' | 'rejected') => {
    try {
      await adminService.verifyProvider(registrationId, status, verificationNotes);
      toast.success(`Provider ${status} successfully`);
      setSelectedProvider(null);
      setVerificationNotes('');
      loadAdminData();
    } catch (error) {
      console.error('Error verifying provider:', error);
      toast.error('Failed to verify provider');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage your platform and monitor activity</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registered accounts</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
              <ShieldCheck className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.activeProviders}</div>
              <p className="text-xs text-muted-foreground">Verified providers</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <BarChart className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">All time bookings</p>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/40 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <Settings className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">From completed bookings</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
            <TabsTrigger value="banners">Banners</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="sections">Service Sections</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'provider' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{user.location || 'N/A'}</TableCell>
                          <TableCell>{format(new Date(user.created_at), 'MMM dd, yyyy')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="providers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Provider Management</CardTitle>
                <CardDescription>Review and verify service provider registrations</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business Name</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Applied</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {providers.map((provider) => (
                        <TableRow key={provider.id}>
                          <TableCell className="font-medium">{provider.business_name}</TableCell>
                          <TableCell>{provider.full_name}</TableCell>
                          <TableCell>{provider.email}</TableCell>
                          <TableCell>{provider.phone}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                provider.status === 'approved' ? 'default' : 
                                provider.status === 'rejected' ? 'destructive' : 
                                'secondary'
                              }
                            >
                              {provider.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(provider.created_at), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedProvider(provider)}
                            >
                              Review
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Management</CardTitle>
                <CardDescription>View all services with provider details</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Service Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Provider Email</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Price Range</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((service) => (
                        <TableRow key={service.service_id}>
                          <TableCell className="font-medium">
                            {service.master_service_name || service.custom_service_name}
                          </TableCell>
                          <TableCell>
                            {service.service_category ? (
                              <Badge variant="outline">{service.service_category}</Badge>
                            ) : 'Custom'}
                          </TableCell>
                          <TableCell>{service.provider_name || 'N/A'}</TableCell>
                          <TableCell>{service.provider_email || 'N/A'}</TableCell>
                          <TableCell>{service.provider_location || 'N/A'}</TableCell>
                          <TableCell>{service.price_range}</TableCell>
                          <TableCell>
                            <Badge variant={service.is_available ? 'default' : 'secondary'}>
                              {service.is_available ? 'Available' : 'Unavailable'}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(service.created_at), 'MMM dd, yyyy')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booking Management</CardTitle>
                <CardDescription>View and monitor all platform bookings</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{booking.customer_name || 'N/A'}</span>
                              <span className="text-xs text-muted-foreground">{booking.customer_email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{booking.provider_name || 'N/A'}</span>
                              <span className="text-xs text-muted-foreground">{booking.provider_email}</span>
                            </div>
                          </TableCell>
                          <TableCell>{booking.service_name || 'N/A'}</TableCell>
                          <TableCell>
                            {booking.scheduled_date 
                              ? format(new Date(booking.scheduled_date), 'MMM dd, yyyy')
                              : 'Not scheduled'
                            }
                          </TableCell>
                          <TableCell>₹{booking.total_amount?.toLocaleString() || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={booking.payment_status === 'paid' ? 'default' : 'secondary'}>
                              {booking.payment_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                booking.status === 'completed' ? 'default' :
                                booking.status === 'cancelled' ? 'destructive' :
                                'secondary'
                              }
                            >
                              {booking.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(booking.created_at), 'MMM dd, yyyy')}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banners" className="space-y-4">
            <HomePageImageManager />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <PopularCategoriesManager />
          </TabsContent>

          <TabsContent value="sections" className="space-y-4">
            <ServiceSectionsManager />
          </TabsContent>
        </Tabs>

        {/* Provider Verification Dialog */}
        <Dialog open={!!selectedProvider} onOpenChange={() => setSelectedProvider(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Provider Verification</DialogTitle>
              <DialogDescription>
                Review provider details and documents to approve or reject the registration
              </DialogDescription>
            </DialogHeader>
            
            {selectedProvider && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Business Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Business Name:</span> {selectedProvider.business_name}</p>
                      <p><span className="font-medium">Address:</span> {selectedProvider.business_address}</p>
                      <p><span className="font-medium">Experience:</span> {selectedProvider.experience}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-2">Contact Information</h3>
                    <div className="space-y-2 text-sm">
                      <p><span className="font-medium">Owner:</span> {selectedProvider.full_name}</p>
                      <p><span className="font-medium">Email:</span> {selectedProvider.email}</p>
                      <p><span className="font-medium">Phone:</span> {selectedProvider.phone}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Service Categories</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProvider.service_categories.map((cat, idx) => (
                      <Badge key={idx} variant="outline">{cat}</Badge>
                    ))}
                  </div>
                </div>

                {selectedProvider.description && (
                  <div>
                    <h3 className="font-semibold mb-2">Description</h3>
                    <p className="text-sm">{selectedProvider.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">Identification</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Type:</span> {selectedProvider.id_proof_type}</p>
                    <p><span className="font-medium">Number:</span> {selectedProvider.id_proof_number}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Documents</h3>
                  <div className="space-y-2">
                    {selectedProvider.id_proof_document_url && (
                      <a 
                        href={selectedProvider.id_proof_document_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm block"
                      >
                        View ID Proof Document
                      </a>
                    )}
                    {selectedProvider.business_license_url && (
                      <a 
                        href={selectedProvider.business_license_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm block"
                      >
                        View Business License
                      </a>
                    )}
                    {selectedProvider.additional_documents_urls?.map((url, idx) => (
                      <a 
                        key={idx}
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-sm block"
                      >
                        View Additional Document {idx + 1}
                      </a>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Admin Notes</h3>
                  <Textarea
                    placeholder="Add notes about your verification decision..."
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                {selectedProvider.status === 'pending' && (
                  <div className="flex gap-4 justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => handleVerifyProvider(selectedProvider.id, 'rejected')}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleVerifyProvider(selectedProvider.id, 'approved')}
                    >
                      Approve
                    </Button>
                  </div>
                )}

                {selectedProvider.status !== 'pending' && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      This provider has already been {selectedProvider.status}
                    </p>
                    {selectedProvider.admin_notes && (
                      <p className="text-sm mt-2">
                        <span className="font-medium">Previous notes:</span> {selectedProvider.admin_notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
};

export default AdminPanel;


import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Filter, Star } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { serviceService, ServiceCategory, ProviderService } from "@/services/serviceService";
import ServiceCard from "@/components/services/ServiceCard";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/contexts/AuthContext";

const Services = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isGuest = localStorage.getItem('guestMode') === 'true';

  // Read category from URL params on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchData();
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [categoriesData, servicesData] = await Promise.all([
        serviceService.getServiceCategories(),
        serviceService.getProviderServices(selectedCategory || undefined)
      ]);
      
      setCategories(categoriesData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const serviceName = service.master_service?.name || service.custom_service_name || '';
    const serviceCategory = service.master_service?.category || '';
    
    // Search filter
    const searchMatch = serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter - match category name case-insensitively
    const categoryMatch = !selectedCategory || 
                         serviceCategory.toLowerCase() === selectedCategory.toLowerCase() ||
                         serviceCategory.toLowerCase().includes(selectedCategory.toLowerCase());
    
    return searchMatch && categoryMatch;
  });

  const handleBookService = (service: ProviderService) => {
    if (!user && !isGuest) {
      setShowAuthModal(true);
      return;
    }
    
    navigate('/booking-payment', { 
      state: { 
        provider: {
          name: service.provider_profile?.full_name || 'Service Provider',
          location: service.provider_profile?.location || 'N/A',
          rating: '4.8',
          image: '🧰'
        },
        service: {
          serviceName: service.master_service?.name || service.custom_service_name,
          timeRequired: service.estimated_time,
          basePrice: service.price_range,
          id: service.id,
          providerId: service.provider_id
        }
      } 
    });
  };

  const handleShowAuth = () => {
    setShowAuthModal(true);
  };

  const handleAuthSuccess = (role: 'customer' | 'provider') => {
    setShowAuthModal(false);
  };

  const handleViewDetails = (service: ProviderService) => {
    navigate(`/provider-service-details/${service.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-foreground">Loading services...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Find the Perfect <span className="text-primary">Service</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover trusted local service providers for all your needs
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for services..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 py-3 text-lg rounded-xl"
            />
          </div>
        </div>

        {/* Categories Filter */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={selectedCategory === "" ? "default" : "outline"}
              onClick={() => {
                setSelectedCategory("");
                setSearchParams({});
              }}
            >
              All Services
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory.toLowerCase() === category.name.toLowerCase() ? "default" : "outline"}
                onClick={() => {
                  setSelectedCategory(category.name);
                  setSearchParams({ category: category.name });
                }}
              >
                {category.name.charAt(0).toUpperCase() + category.name.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No services found</h3>
            <p className="text-muted-foreground">Try adjusting your search or browse different categories</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard
                key={service.id}
                service={service}
                onBook={handleBookService}
                onViewDetails={handleViewDetails}
                onShowAuth={handleShowAuth}
              />
            ))}
          </div>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-primary to-accent text-primary-foreground">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Become a Service Provider</h3>
              <p className="text-lg mb-6 opacity-90">
                Join our network of trusted professionals and grow your business
              </p>
              <Button
                onClick={() => navigate('/become-provider')}
                variant="secondary"
                size="lg"
              >
                Start Earning Today
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
      <Footer />
    </div>
  );
};

export default Services;

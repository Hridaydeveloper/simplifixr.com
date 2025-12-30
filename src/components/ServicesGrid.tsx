import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { serviceService, ProviderService } from "@/services/serviceService";
import { serviceSectionsService, ServiceSection } from "@/services/serviceSectionsService";

const ServicesGrid = () => {
  const navigate = useNavigate();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [categoryServices, setCategoryServices] = useState<{[key: string]: ProviderService[]}>({});
  const [loading, setLoading] = useState(false);
  const [sections, setSections] = useState<ServiceSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  // Default services (fallback)
  const defaultServices = [
    {
      title: "Cleaning & Sanitation",
      description: "Deep cleaning, bathroom, kitchen & more",
      gradient: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-500",
      category: "cleaning"
    },
    {
      title: "Repairs & Maintenance",
      description: "Plumbing, electrical, AC & appliances",
      gradient: "from-orange-500/20 to-amber-500/20",
      iconColor: "text-orange-500",
      category: "repairs"
    },
    {
      title: "Education & Tech",
      description: "Home tutoring, tech support & training",
      gradient: "from-purple-500/20 to-violet-500/20",
      iconColor: "text-purple-500",
      category: "education"
    },
    {
      title: "Healthcare & Wellness",
      description: "Nursing, physiotherapy, salon at home",
      gradient: "from-pink-500/20 to-rose-500/20",
      iconColor: "text-pink-500",
      category: "healthcare"
    },
    {
      title: "Events & Religious",
      description: "Puja services, party helpers & catering",
      gradient: "from-yellow-500/20 to-orange-500/20",
      iconColor: "text-yellow-500",
      category: "events"
    },
    {
      title: "Logistics & Moving",
      description: "Packers & movers, delivery services",
      gradient: "from-green-500/20 to-emerald-500/20",
      iconColor: "text-green-500",
      category: "logistics"
    },
    {
      title: "Automotive",
      description: "Car wash, detailing & maintenance",
      gradient: "from-red-500/20 to-pink-500/20",
      iconColor: "text-red-500",
      category: "automotive"
    },
    {
      title: "Device Repair",
      description: "Mobile, laptop & electronics repair",
      gradient: "from-indigo-500/20 to-blue-500/20",
      iconColor: "text-indigo-500",
      category: "repair"
    }
  ];

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const data = await serviceSectionsService.getActiveSections();
        setSections(data);
      } catch (error) {
        console.error('Error fetching service sections:', error);
      } finally {
        setSectionsLoading(false);
      }
    };
    fetchSections();
  }, []);

  const fetchCategoryServices = async (category: string) => {
    if (categoryServices[category]) return;
    
    try {
      setLoading(true);
      const services = await serviceService.getProviderServices(category);
      setCategoryServices(prev => ({
        ...prev,
        [category]: services
      }));
    } catch (error) {
      console.error('Error fetching category services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceHover = (category: string) => {
    setHoveredCategory(category);
    fetchCategoryServices(category);
  };

  const handleServiceLeave = () => {
    setHoveredCategory(null);
  };
  
  const handleServiceClick = () => {
    navigate('/services');
  };

  // Use database sections if available, otherwise fallback to defaults
  const displaySections = sections.length > 0 ? sections : null;
  
  return (
    <section id="services" className="py-24 bg-background relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary text-sm font-semibold rounded-full uppercase tracking-wide">
            Our Services
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-display-sm font-bold text-foreground">
            All Services in{" "}
            <span className="text-gradient">One Place</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From everyday tasks to specialized services, find verified professionals for every need
          </p>
        </div>

        {/* Services Grid */}
        {sectionsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <Card key={index} className="bg-card border-border/50 animate-pulse">
                <CardContent className="p-6 sm:p-8">
                  <div className="w-14 h-14 rounded-2xl bg-muted mb-5" />
                  <div className="h-5 w-32 bg-muted rounded mb-2" />
                  <div className="h-4 w-48 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displaySections ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {displaySections.map((section, index) => (
              <Card 
                key={section.id || index} 
                className="group relative bg-card border-border/50 hover:border-primary/30 transition-all duration-500 cursor-pointer overflow-hidden card-hover" 
                onClick={handleServiceClick}
                onMouseEnter={() => handleServiceHover(section.category_link || section.title)}
                onMouseLeave={handleServiceLeave}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient || 'from-primary/20 to-accent/20'} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <CardContent className="relative p-6 sm:p-8">
                  {/* Image Icon */}
                  <div className={`w-14 h-14 rounded-2xl overflow-hidden bg-gradient-to-br ${section.gradient || 'from-primary/20 to-accent/20'} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <img 
                      src={section.image_url} 
                      alt={section.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {section.sub_points.length > 0 ? section.sub_points.join(', ') : 'Professional service available'}
                  </p>
                  
                  {/* Hover popup for category services */}
                  {hoveredCategory === (section.category_link || section.title) && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-card shadow-2xl rounded-2xl border border-border p-5 z-50 glow-effect animate-fade-in">
                      <h4 className="font-display font-semibold text-foreground mb-4">{section.title}</h4>
                      {loading ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : categoryServices[section.category_link || section.title]?.length > 0 ? (
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {categoryServices[section.category_link || section.title].slice(0, 5).map((providerService, idx) => (
                            <div key={idx} className="p-3 hover:bg-secondary/50 rounded-xl border-l-2 border-primary transition-colors">
                              <div className="font-medium text-sm text-foreground">
                                {providerService.master_service?.name || providerService.custom_service_name}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {providerService.description || 'Professional service available'}
                              </div>
                              <div className="text-xs text-primary font-semibold mt-1">
                                ₹{providerService.price_range} • {providerService.estimated_time}
                              </div>
                            </div>
                          ))}
                          {categoryServices[section.category_link || section.title].length > 5 && (
                            <div className="text-xs text-muted-foreground text-center pt-2">
                              +{categoryServices[section.category_link || section.title].length - 5} more services
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground py-4 text-center">
                          No services available yet
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {defaultServices.map((service, index) => (
              <Card 
                key={index} 
                className="group relative bg-card border-border/50 hover:border-primary/30 transition-all duration-500 cursor-pointer overflow-hidden card-hover" 
                onClick={handleServiceClick}
                onMouseEnter={() => handleServiceHover(service.category)}
                onMouseLeave={handleServiceLeave}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <CardContent className="relative p-6 sm:p-8">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-2xl">{service.title.charAt(0)}</span>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {service.description}
                  </p>
                  
                  {/* Hover popup for category services */}
                  {hoveredCategory === service.category && (
                    <div className="absolute top-full left-0 mt-2 w-80 bg-card shadow-2xl rounded-2xl border border-border p-5 z-50 glow-effect animate-fade-in">
                      <h4 className="font-display font-semibold text-foreground mb-4">{service.title}</h4>
                      {loading ? (
                        <div className="flex items-center justify-center py-6">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : categoryServices[service.category]?.length > 0 ? (
                        <div className="space-y-3 max-h-48 overflow-y-auto">
                          {categoryServices[service.category].slice(0, 5).map((providerService, idx) => (
                            <div key={idx} className="p-3 hover:bg-secondary/50 rounded-xl border-l-2 border-primary transition-colors">
                              <div className="font-medium text-sm text-foreground">
                                {providerService.master_service?.name || providerService.custom_service_name}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {providerService.description || 'Professional service available'}
                              </div>
                              <div className="text-xs text-primary font-semibold mt-1">
                                ₹{providerService.price_range} • {providerService.estimated_time}
                              </div>
                            </div>
                          ))}
                          {categoryServices[service.category].length > 5 && (
                            <div className="text-xs text-muted-foreground text-center pt-2">
                              +{categoryServices[service.category].length - 5} more services
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground py-4 text-center">
                          No services available yet
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button 
            onClick={handleServiceClick}
            variant="outline"
            size="lg"
            className="px-8 py-6 text-base font-semibold rounded-xl border-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all duration-300 group"
          >
            View All Services
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesGrid;

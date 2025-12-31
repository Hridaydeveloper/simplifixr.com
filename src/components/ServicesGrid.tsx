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
  
  const handleServiceClick = (category?: string) => {
    navigate('/services', {
      state: {
        searchQuery: category || '',
        scrollToTop: true
      }
    });
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="flex flex-col items-center animate-pulse">
                <div className="w-full aspect-[4/3] bg-muted rounded-xl mb-3" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : displaySections ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 relative">
            {displaySections.map((section, index) => (
              <div 
                key={section.id || index} 
                className="group flex flex-col cursor-pointer"
                onClick={() => handleServiceClick(section.category_link || section.title)}
                onMouseEnter={() => handleServiceHover(section.category_link || section.title)}
                onMouseLeave={handleServiceLeave}
              >
                {/* Image Card */}
                <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-secondary/30 dark:bg-secondary/50 group-hover:shadow-xl group-hover:scale-[1.02] transition-all duration-300 border border-border/30 group-hover:border-primary/50">
                  <img 
                    src={section.image_url} 
                    alt={section.title}
                    className="w-full h-full object-cover"
                  />
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                {/* Title below card */}
                <h3 className="mt-3 text-sm sm:text-base font-semibold text-foreground dark:text-foreground text-center group-hover:text-primary transition-colors">
                  {section.title}
                </h3>
                
                {/* Sub points */}
                {section.sub_points.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground text-center line-clamp-1">
                    {section.sub_points.join(' • ')}
                  </p>
                )}
                
                {/* Hover popup for category services */}
                {hoveredCategory === (section.category_link || section.title) && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-card shadow-2xl rounded-2xl border border-border p-5 z-50 glow-effect animate-fade-in">
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
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 relative">
            {defaultServices.map((service, index) => (
              <div 
                key={index} 
                className="group flex flex-col cursor-pointer"
                onClick={() => handleServiceClick(service.category)}
                onMouseEnter={() => handleServiceHover(service.category)}
                onMouseLeave={handleServiceLeave}
              >
                {/* Image Card with gradient background */}
                <div className={`relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br ${service.gradient} group-hover:shadow-xl group-hover:scale-[1.02] transition-all duration-300 border border-border/30 group-hover:border-primary/50 flex items-center justify-center`}>
                  <span className="text-5xl sm:text-6xl">{service.title.charAt(0)}</span>
                </div>
                
                {/* Title below card */}
                <h3 className="mt-3 text-sm sm:text-base font-semibold text-foreground dark:text-foreground text-center group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                
                {/* Description */}
                <p className="mt-1 text-xs text-muted-foreground text-center line-clamp-1">
                  {service.description}
                </p>
                
                {/* Hover popup for category services */}
                {hoveredCategory === service.category && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-card shadow-2xl rounded-2xl border border-border p-5 z-50 glow-effect animate-fade-in">
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
              </div>
            ))}
          </div>
        )}

        {/* View All Button */}
        <div className="text-center mt-12">
          <Button 
            onClick={() => handleServiceClick()}
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

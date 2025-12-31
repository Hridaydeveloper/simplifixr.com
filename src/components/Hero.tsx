import { Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import HeroBannerSlider from "./HeroBannerSlider";
import { popularCategoriesService, PopularCategory } from "@/services/popularCategoriesService";

const Hero = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [categories, setCategories] = useState<PopularCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Default service categories (fallback)
  const defaultCategories = [
    { icon: "👩‍💼", name: "Women's Salon & Spa", category: "salon" },
    { icon: "👨‍💼", name: "Men's Salon & Massage", category: "salon" },
    { icon: "❄️", name: "AC & Appliance Repair", category: "repair" },
    { icon: "🧹", name: "Cleaning & Pest Control", category: "cleaning" },
    { icon: "⚡", name: "Electrician & Plumber", category: "maintenance" },
    { icon: "💧", name: "Water Purifier", category: "purifier" },
    { icon: "🎨", name: "Painting & Waterproofing", category: "painting" },
    { icon: "🏗️", name: "Wall Panels & Woodwork", category: "construction" },
  ];

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await popularCategoriesService.getActiveCategories();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = () => {
    navigate('/services', {
      state: {
        searchQuery: selectedService,
        location: selectedLocation,
        scrollToTop: true
      }
    });
  };

  const handleCategoryClick = (category: string) => {
    navigate(`/services?category=${encodeURIComponent(category)}`);
  };

  // Use database categories if available, otherwise fallback to defaults
  const displayCategories = categories.length > 0 ? categories : null;

  return (
    <section id="home" className="bg-background">
      {/* Hero Banner Slider */}
      <HeroBannerSlider />

      {/* Search Bar & Categories Section */}
      <div className="relative z-20 -mt-16 pb-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Compact Search Bar */}
          <div className="bg-card p-4 sm:p-5 rounded-2xl shadow-lg border border-border/50 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="relative md:col-span-5">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
                <Input
                  placeholder={isMobile ? "What service?" : "What service do you need?"}
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 h-11 bg-secondary/50 border-border focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-sm placeholder:text-muted-foreground transition-all duration-300"
                />
              </div>
              
              <div className="relative md:col-span-4">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary w-4 h-4" />
                <Input
                  placeholder="Your location"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 h-11 bg-secondary/50 border-border focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-sm placeholder:text-muted-foreground transition-all duration-300"
                />
              </div>
              
              <div className="md:col-span-3">
                <Button
                  onClick={handleSearch}
                  size="default"
                  className="w-full h-11 rounded-lg font-medium text-sm shadow-sm transition-all duration-300"
                >
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>
          </div>

          {/* Service Categories Grid */}
          <div className="space-y-5">
            <h2 className="font-display text-xl sm:text-2xl font-bold text-foreground text-center">
              Popular <span className="text-primary">Categories</span>
            </h2>
            
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="flex flex-col items-center animate-pulse">
                    <div className="w-full aspect-square bg-muted rounded-2xl mb-3" />
                    <div className="h-4 w-20 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : displayCategories ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
                {displayCategories.map((category, index) => (
                  <button
                    key={category.id || index}
                    onClick={() => handleCategoryClick(category.category_link || category.title)}
                    className="group flex flex-col items-center transition-all duration-300"
                  >
                    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-secondary/30 dark:bg-secondary/50 group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 border border-border/30 group-hover:border-primary/50">
                      <img 
                        src={category.image_url} 
                        alt={category.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="mt-3 text-sm sm:text-base font-semibold text-foreground dark:text-foreground text-center leading-tight group-hover:text-primary transition-colors">
                      {category.title}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
                {defaultCategories.map((service, index) => (
                  <button
                    key={index}
                    onClick={() => handleCategoryClick(service.category)}
                    className="group flex flex-col items-center transition-all duration-300"
                  >
                    <div className="w-full aspect-square rounded-2xl overflow-hidden bg-secondary/30 dark:bg-secondary/50 flex items-center justify-center group-hover:shadow-xl group-hover:scale-105 transition-all duration-300 border border-border/30 group-hover:border-primary/50">
                      <span className="text-5xl sm:text-6xl">{service.icon}</span>
                    </div>
                    <span className="mt-3 text-sm sm:text-base font-semibold text-foreground dark:text-foreground text-center leading-tight group-hover:text-primary transition-colors">
                      {service.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

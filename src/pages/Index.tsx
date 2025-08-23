import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Wallet, QrCode } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import credverseIcon from "@/assets/credverse-icon.png";

export default function Index() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      navigate('/wallet');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-credverse-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-credverse-primary/5 to-credverse-accent/5"></div>
        
        <div className="relative px-4 py-16 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-background/10 backdrop-blur-sm border border-border/50">
              <img src={credverseIcon} alt="CredVerse" className="h-10 w-10" />
            </div>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Your secure education
            <span className="block gradient-text">wallet</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Store and share verified degrees with one tap. Your data stays on your device. Only proofs are shared.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              onClick={() => navigate('/auth')}
              variant="primary" 
              size="lg"
              className="text-lg px-8 py-4"
            >
              Get Started
            </Button>
            
            <Button 
              onClick={() => navigate('/auth')}
              variant="outline" 
              size="lg"
              className="text-lg px-8 py-4"
            >
              Learn More
            </Button>
          </div>

          {/* Feature Icons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-success-bg border border-success/20 mx-auto mb-3">
                <Shield size={24} className="text-success" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Secure Storage</h3>
              <p className="text-sm text-muted-foreground">Your credentials are encrypted and stored locally</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-credverse-primary/10 border border-credverse-primary/20 mx-auto mb-3">
                <Wallet size={24} className="text-credverse-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Easy Sharing</h3>
              <p className="text-sm text-muted-foreground">Share verified credentials with employers instantly</p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-credverse-accent/10 border border-credverse-accent/20 mx-auto mb-3">
                <QrCode size={24} className="text-credverse-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Quick Verify</h3>
              <p className="text-sm text-muted-foreground">Scan QR codes for instant credential verification</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
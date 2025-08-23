import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Main router component that decides which page to show
const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has a wallet setup
    // For now, always redirect to welcome for demo
    // TODO: Check localStorage for existing wallet
    const hasWallet = localStorage.getItem('credverse-wallet-setup');
    
    if (hasWallet) {
      navigate('/wallet');
    } else {
      navigate('/welcome');
    }
  }, [navigate]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 rounded-full gradient-primary animate-pulse mx-auto"></div>
        <p className="text-muted-foreground">Loading CredVerse...</p>
      </div>
    </div>
  );
};

export default Index;

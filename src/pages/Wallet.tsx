import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { CredentialCard, type Credential } from "@/components/CredentialCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, QrCode, Upload, Download } from "lucide-react";

// Mock data for demo
const mockCredentials: Credential[] = [
  {
    id: "1",
    type: "Bachelor of Computer Science",
    issuer: "MIT",
    issuerDomain: "mit.edu",
    subject: "Computer Science Degree",
    issuedDate: "2024-05-15",
    status: "valid",
    category: "degree"
  },
  {
    id: "2", 
    type: "Data Science Certificate",
    issuer: "Harvard University",
    issuerDomain: "harvard.edu",
    subject: "Professional Certificate",
    issuedDate: "2024-03-10",
    status: "valid",
    category: "certificate"
  },
  {
    id: "3",
    type: "Academic Transcript",
    issuer: "Stanford University", 
    issuerDomain: "stanford.edu",
    subject: "Official Transcript",
    issuedDate: "2023-12-20",
    status: "expired",
    category: "transcript"
  }
];

export default function Wallet() {
  const navigate = useNavigate();
  const [credentials] = useState<Credential[]>(mockCredentials);

  const handleCredentialClick = (credential: Credential) => {
    navigate(`/credential/${credential.id}`);
  };

  const handleReceiveCredential = () => {
    console.log("Receive credential flow");
    // TODO: Open receive credential modal/page
  };

  const handleBackup = () => {
    console.log("Backup wallet");
    // TODO: Open backup flow
  };

  return (
    <div className="min-h-screen bg-background">
      <Header title="My Credentials" />
      
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          <Button 
            onClick={handleReceiveCredential}
            variant="primary"
            className="h-16 flex-col gap-1"
          >
            <Plus size={20} />
            <span className="text-xs">Receive</span>
          </Button>
          
          <Button 
            variant="outline"
            className="h-16 border-border/50 hover:bg-card-hover flex-col gap-1 transition-smooth"
          >
            <QrCode size={20} />
            <span className="text-xs">Scan QR</span>
          </Button>
          
          <Button 
            onClick={handleBackup}
            variant="outline"
            className="h-16 border-border/50 hover:bg-card-hover flex-col gap-1 transition-smooth"
          >
            <Download size={20} />
            <span className="text-xs">Backup</span>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="gradient-card shadow-card p-4 border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-credverse-success">
                {credentials.filter(c => c.status === 'valid').length}
              </div>
              <div className="text-sm text-muted-foreground">Valid Credentials</div>
            </div>
          </Card>
          
          <Card className="gradient-card shadow-card p-4 border-border/50">
            <div className="text-center">
              <div className="text-2xl font-bold text-credverse-primary">
                {credentials.length}
              </div>
              <div className="text-sm text-muted-foreground">Total Stored</div>
            </div>
          </Card>
        </div>

        {/* Credentials List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your Credentials</h2>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              View All
            </Button>
          </div>
          
          {credentials.length > 0 ? (
            <div className="space-y-3">
              {credentials.map((credential) => (
                <CredentialCard
                  key={credential.id}
                  credential={credential}
                  onClick={() => handleCredentialClick(credential)}
                />
              ))}
            </div>
          ) : (
            <Card className="gradient-card shadow-card p-8 border-border/50 text-center">
              <div className="space-y-3">
                <Upload size={48} className="mx-auto text-muted-foreground" />
                <div>
                  <h3 className="font-medium text-card-foreground">No credentials yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive your first credential to get started
                  </p>
                </div>
                <Button 
                  onClick={handleReceiveCredential}
                  variant="primary"
                >
                  <Plus size={16} className="mr-2" />
                  Receive Credential
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
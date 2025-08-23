import { Header } from "@/components/Header";
import { StatusBadge, type CredentialStatus } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { QrCode, Share, Download, Calendar, Building2, CheckCircle, XCircle } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

// Mock credential data
const mockCredential = {
  id: "1",
  type: "Bachelor of Computer Science",
  issuer: "Massachusetts Institute of Technology",
  issuerDomain: "mit.edu",
  subject: "John Doe",
  issuedDate: "2024-05-15",
  expiryDate: "2029-05-15",
  status: "valid" as CredentialStatus,
  category: "degree" as const,
  details: {
    gpa: "3.85/4.0",
    honors: "Magna Cum Laude",
    major: "Computer Science",
    concentration: "Artificial Intelligence",
    credentialId: "MIT-CS-2024-0542",
    issuerSignature: "0x1a2b3c..."
  }
};

export default function CredentialDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  // In a real app, fetch credential by ID
  const credential = mockCredential;

  const handleBack = () => {
    navigate('/wallet');
  };

  const handleShare = () => {
    console.log("Share credential");
    // TODO: Open share modal
  };

  const handleDownload = () => {
    console.log("Download credential");
    // TODO: Generate PDF
  };

  const handleVerify = () => {
    console.log("Verify credential");
    // TODO: Run verification
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Credential Details" 
        showBack={true} 
        onBack={handleBack}
        showProfile={false}
      />
      
      <div className="p-4 space-y-6">
        {/* Credential Header */}
        <Card className="gradient-card shadow-card p-6 border-border/50">
          <div className="space-y-4">
            {/* Status & Actions */}
            <div className="flex items-start justify-between">
              <StatusBadge status={credential.status} className="text-sm px-3 py-1.5" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share size={14} />
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload}>
                  <Download size={14} />
                </Button>
              </div>
            </div>
            
            {/* Credential Info */}
            <div className="text-center space-y-3">
              <h1 className="text-2xl font-bold text-card-foreground">
                {credential.type}
              </h1>
              
              <div className="flex items-center justify-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="text-lg bg-muted font-semibold">
                    {credential.issuer.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-semibold text-card-foreground">
                    {credential.issuer}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {credential.issuerDomain}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Verification Status */}
        <Card className="gradient-card shadow-card p-4 border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success-bg">
                <CheckCircle size={20} className="text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-card-foreground">Verified and trusted</h3>
                <p className="text-sm text-muted-foreground">Signature valid • Issuer trusted</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleVerify}>
              Re-verify
            </Button>
          </div>
        </Card>

        {/* Credential Details */}
        <Card className="gradient-card shadow-card p-4 border-border/50">
          <h3 className="font-semibold text-card-foreground mb-4">Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subject</span>
              <span className="text-card-foreground font-medium">{credential.subject}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Major</span>
              <span className="text-card-foreground font-medium">{credential.details.major}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GPA</span>
              <span className="text-card-foreground font-medium">{credential.details.gpa}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Honors</span>
              <span className="text-card-foreground font-medium">{credential.details.honors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Credential ID</span>
              <span className="text-card-foreground font-medium font-mono text-sm">
                {credential.details.credentialId}
              </span>
            </div>
          </div>
        </Card>

        {/* Dates */}
        <Card className="gradient-card shadow-card p-4 border-border/50">
          <h3 className="font-semibold text-card-foreground mb-4">Timeline</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-card-foreground">
                  Issued on {new Date(credential.issuedDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">Original issue date</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-card-foreground">
                  Valid until {new Date(credential.expiryDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">Expiration date</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Share Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="primary" onClick={handleShare} className="h-12">
            <QrCode size={18} className="mr-2" />
            Share QR Code
          </Button>
          <Button variant="outline" onClick={handleDownload} className="h-12">
            <Download size={18} className="mr-2" />
            Download PDF
          </Button>
        </div>
      </div>
    </div>
  );
}
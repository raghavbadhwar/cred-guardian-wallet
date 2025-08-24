import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the new settings layout
    navigate('/settings', { replace: true });
  }, [navigate]);

  return null;
}
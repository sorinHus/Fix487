import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_DASHBOARDS = {
  admin: '/dashboard/admin',
  dispatcher: '/dashboard/dispatcher',
  technician: '/dashboard/technician',
  client: '/dashboard/client',
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(ROLE_DASHBOARDS[user.role] || '/login', { replace: true });
  }, [user, navigate]);

  return null;
}

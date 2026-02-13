import toast from "react-hot-toast";
import { Navigate } from "react-router";

const ProtectedRoute = ({
  children,
  isAuthenticated,
}: {
  children: React.ReactElement;
  isAuthenticated: boolean;
}) => {
  if (!isAuthenticated) {
    toast.error("Unauthorized access. Please log in");
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

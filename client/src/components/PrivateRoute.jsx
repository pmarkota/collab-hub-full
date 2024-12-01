import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { isAuthenticated } from "../utils/auth";

const PrivateRoute = ({ children }) => {
  if (!isAuthenticated()) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render children if authenticated
  return children;
};

PrivateRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default PrivateRoute;

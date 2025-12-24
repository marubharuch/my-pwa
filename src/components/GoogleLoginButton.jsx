import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function GoogleLoginButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithGoogleChecked } = useAuth();

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const { isNewUser } = await loginWithGoogleChecked();

      if (isNewUser) {
        navigate("/register", { state: { fromGoogle: true } });
      } else {
        navigate("/");
      }

    } catch (err) {
      console.error(err);
      alert("Google login failed!");
    }

    setLoading(false);
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2
                 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
    >
      <img
        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
        alt="Google"
        className="w-5 h-5"
      />
      {loading ? "Signing in..." : "Registration/Login  with Google"}
    </button>
  );
}

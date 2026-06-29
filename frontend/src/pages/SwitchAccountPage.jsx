import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Repeat } from "lucide-react";
import { api } from "../api/client";
import { clearCurrentUserCache, useCurrentUser } from "../hooks/useCurrentUser";
import { clearAuthToken, normalizeAuthResponse } from "../api/config";
import { getAvatarUrl } from "../utils/avatar";

function SwitchAccountPage() {
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/auth/linked-accounts")
      .then(({ data }) => setLinkedAccounts(Array.isArray(data) ? data : []))
      .catch(() => setLinkedAccounts([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSwitch = async (account) => {
    try {
      const { data } = await api.post("/auth/switch", { username: account.username });
      normalizeAuthResponse(data);
      clearCurrentUserCache();
      navigate("/");
    } catch {
      clearAuthToken();
      clearCurrentUserCache();
      navigate("/login");
    }
  };

  const handleLogout = () => {
    clearAuthToken();
    clearCurrentUserCache();
    navigate("/login");
  };

  return (
    <main className="mx-auto min-h-screen max-w-[500px] bg-card px-4 py-8 pb-[82px] md:pb-10">
      <h1 className="mb-6 text-2xl font-bold text-primary">Switch Accounts</h1>

      {currentUser && (
        <div className="mb-6 rounded-lg border border-primary p-4">
          <p className="mb-3 text-xs font-semibold text-secondary">CURRENT ACCOUNT</p>
          <div className="flex items-center gap-3">
            <img src={getAvatarUrl(currentUser)} alt="" className="h-11 w-11 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{currentUser.username}</p>
              <p className="text-xs text-secondary">{currentUser.fullName || ""}</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="py-8 text-center text-sm text-secondary">Loading...</p>
      ) : linkedAccounts.length > 0 ? (
        <div className="mb-6">
          <p className="mb-3 text-xs font-semibold text-secondary">LINKED ACCOUNTS</p>
          <div className="divide-y divide-[#efefef] rounded-lg border border-primary">
            {linkedAccounts.map((account) => (
              <button
                key={account.id}
                type="button"
                onClick={() => handleSwitch(account)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary"
              >
                <img
                  src={getAvatarUrl(account)}
                  alt=""
                  className="h-11 w-11 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{account.username}</p>
                  <p className="text-xs text-secondary">{account.fullName || ""}</p>
                </div>
                <Repeat className="h-5 w-5 text-secondary" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => navigate("/add-account")}
          className="flex w-full items-center gap-3 rounded-lg border border-primary px-4 py-3 text-left text-sm font-semibold hover:bg-secondary"
        >
          <Plus className="h-5 w-5" />
          Add new account
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg border border-primary px-4 py-3 text-left text-sm font-semibold text-[#ed4956] hover:bg-secondary"
        >
          Log out of {currentUser?.username || "current account"}
        </button>
      </div>
    </main>
  );
}

export default SwitchAccountPage;

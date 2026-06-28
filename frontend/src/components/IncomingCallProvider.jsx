import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { answerCall, getCallHistory, rejectCall } from "../api/callsApi";
import { getAuthToken } from "../api/config";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { getAvatarUrl } from "../utils/avatar";
import { connect, subscribeToCall } from "../hooks/useWebSocket";

const INCOMING_STATUSES = new Set(["CALLING", "RINGING", "PENDING", "STARTED", "INITIATED"]);

function IncomingCallProvider() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useCurrentUser();
  const [incomingCall, setIncomingCall] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const dismissedCallIdsRef = useRef(new Set());
  const activePopupIdRef = useRef("");
  const pollIntervalRef = useRef(null);

  const shouldPoll =
    Boolean(getAuthToken()) &&
    Boolean(currentUser?.id) &&
    location.pathname !== "/login" &&
    location.pathname !== "/register" &&
    location.pathname !== "/call";

  useEffect(() => {
    if (!shouldPoll) {
      setIncomingCall(null);
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    connect();
    const unsubCall = subscribeToCall(currentUser.id, (event) => {
      if (!event) return;
      if (event.type === "CALL_STARTED" && event.callId) {
        const normalizedCallId = String(event.callId);
        if (!dismissedCallIdsRef.current.has(normalizedCallId)) {
          activePopupIdRef.current = normalizedCallId;
          setError("");
          setIncomingCall(normalizeIncomingCall(event));
        }
        return;
      }

      const activeId = activePopupIdRef.current;
      if (activeId && (event.type === "CALL_CANCELLED" || event.type === "CALL_ENDED") && String(event.callId) === activeId) {
        dismissCall(activeId);
      }
    });

    const pollIncomingCalls = async () => {
      try {
        const history = await getCallHistory();
        const call = findLatestIncomingCall(history, currentUser.id);
        const callId = getCallId(call);
        const normalizedCallId = String(callId || "");

        if (!call || !callId) return;
        if (dismissedCallIdsRef.current.has(normalizedCallId)) return;
        if (activePopupIdRef.current === normalizedCallId) return;

        activePopupIdRef.current = normalizedCallId;
        setError("");
        setIncomingCall(normalizeIncomingCall(call));
      } catch (_err) {
      }
    };

    pollIncomingCalls();
    pollIntervalRef.current = window.setInterval(pollIncomingCalls, 4000);

    return () => {
      if (unsubCall) unsubCall();
      if (pollIntervalRef.current) {
        window.clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [shouldPoll, currentUser?.id]);

  const dismissCall = (callId) => {
    const id = String(callId);
    dismissedCallIdsRef.current.add(id);
    activePopupIdRef.current = "";
    setIncomingCall(null);
  };

  const handleAccept = async () => {
    if (!incomingCall?.id) return;
    const call = incomingCall;
    dismissCall(call.id);
    setActionLoading(true);
    setError("");

    try {
      await answerCall(call.id);
      navigate(`/call?callId=${call.id}&has_video=${call.hasVideo}`, {
        state: {
          callId: call.id,
          otherUserId: call.callerId,
          groupId: call.groupId,
          initiator: false,
          accepted: true,
          username: call.callerName,
          profilePicture: call.callerProfilePicture,
          groupName: call.groupName,
          groupProfilePicture: call.groupProfilePicture,
          groupMembers: call.groupMembers,
          participants: call.participants,
          returnTo: call.groupId ? `/messages?tab=groups&groupId=${call.groupId}` : "/messages",
        },
      });
    } catch (_err) {
      setError("Unable to answer this call right now.");
      dismissedCallIdsRef.current.delete(String(call.id));
      activePopupIdRef.current = String(call.id);
      setIncomingCall(call);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!incomingCall?.id) return;
    const call = incomingCall;
    dismissCall(call.id);
    setActionLoading(true);
    setError("");

    try {
      await rejectCall(call.id);
    } catch (_err) {
    } finally {
      setActionLoading(false);
    }
  };

  if (!incomingCall) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-[360px] rounded-lg bg-card p-6 text-center shadow-2xl">
        <img
          src={getAvatarUrl({ profilePicture: incomingCall.callerProfilePicture })}
          alt=""
          className="mx-auto h-20 w-20 rounded-full object-cover"
                  onError={(e) => { e.currentTarget.src = '/default-avatar.png'; e.currentTarget.onerror = null; }}
        />
        <h2 className="mt-4 truncate text-xl font-semibold text-primary">{incomingCall.callerName}</h2>
        <p className="mt-2 text-sm text-secondary">
          {incomingCall.groupName
            ? `${incomingCall.groupName} group ${incomingCall.hasVideo ? "video" : "audio"} call`
            : `Incoming ${incomingCall.hasVideo ? "video" : "audio"} call`}
        </p>
        {incomingCall.groupName && (
          <p className="mt-1 text-sm text-secondary">
            {incomingCall.callerName} is calling
          </p>
        )}
        {error && (
          <p className="mt-4 rounded-md bg-[#ed4956]/10 px-3 py-2 text-sm text-[#c13545]">{error}</p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleReject}
            disabled={actionLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#ed4956] text-sm font-semibold text-white hover:bg-[#d63b49] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <PhoneOff className="h-4 w-4" />
            Reject
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={actionLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#16a34a] text-sm font-semibold text-white hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {incomingCall.hasVideo ? <Video className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}

const findLatestIncomingCall = (history, currentUserId) => {
  const calls = Array.isArray(history) ? history : Array.isArray(history?.content) ? history.content : [];
  return calls
    .filter((call) => isIncomingCall(call, currentUserId))
    .sort((a, b) => getCallTime(b) - getCallTime(a))[0];
};

const isIncomingCall = (call, currentUserId) => {
  const status = String(call?.status || "").toUpperCase();
  if (!INCOMING_STATUSES.has(status)) return false;
  if (!isRecentCall(call)) return false;

  const calleeId = call?.calleeId || call?.callee?.id;
  const callerId = call?.callerId || call?.caller?.id;

  if (String(callerId) === String(currentUserId)) return false;
  if (call?.groupCall || call?.groupId) return true;

  return String(calleeId) === String(currentUserId);
};

const getCallId = (call) => call?.callId || call?.id || call?.data?.callId || call?.data?.id || "";

const getCallTime = (call) => {
  const value = call?.createdAt || call?.startedAt || call?.updatedAt || call?.timestamp || call?.time;
  const time = value ? new Date(value).getTime() : 0;
  return Number.isNaN(time) ? 0 : time;
};

const isRecentCall = (call) => {
  const time = getCallTime(call);
  if (!time) return false;
  return Date.now() - time <= 60000;
};

const normalizeIncomingCall = (call) => {
  const caller = call?.caller || {};
  const hasVideo = call?.callType === "VIDEO";
  const isGroupCall = Boolean(call?.groupCall || call?.groupId);

  return {
    id: getCallId(call),
    hasVideo,
    callerId: call?.callerId || caller.id,
    callerName: call?.callerUsername || caller.username || caller.fullName || "Instagram user",
    callerProfilePicture: isGroupCall
      ? call?.groupProfilePicture || call?.callerProfilePicture || caller.profilePicture || ""
      : call?.callerProfilePicture || caller.profilePicture || "",
    groupId: call?.groupId,
    groupName: call?.groupName,
    groupProfilePicture: call?.groupProfilePicture,
    groupMembers: call?.groupMembers || [],
    participants: call?.participants || [],
  };
};

export default IncomingCallProvider;

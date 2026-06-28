import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, UserRound, Users, Video } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { cancelCall, endCall, getCallHistory, leaveCall, startCall, startGroupCall } from "../api/callsApi";
import { getAvatarUrl } from "../utils/avatar";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  connect,
  sendCallAnswer,
  sendCallEnd,
  sendCallOffer,
  sendIceCandidate,
  subscribeToCall,
} from "../hooks/useWebSocket";

function CallPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentUser, currentUserId } = useCurrentUser();
  const hasVideo = searchParams.get("has_video") === "true";
  const urlCallId = searchParams.get("callId");
  const callState = location.state || {};
  const returnTo = callState.returnTo || "/messages";
  const groupId = callState.groupId || searchParams.get("groupId") || "";
  const isGroupCall = Boolean(groupId);
  const callType = hasVideo ? "VIDEO" : "VOICE";
  const [callId, setCallId] = useState(callState.callId || urlCallId || "");
  const initialStatus = callState.accepted ? "connected" : callState.autoStart ? "dialing" : callState.callId || urlCallId ? "ringing" : "idle";
  const [callStatus, setCallStatus] = useState(initialStatus);
  const [peerUserId, setPeerUserId] = useState(callState.otherUserId || searchParams.get("userId") || "");
  const [callerId, setCallerId] = useState(callState.callerId || callState.otherUserId || "");
  const [members, setMembers] = useState(() => normalizeUsers(callState.groupMembers || callState.participants || []));
  const [participants, setParticipants] = useState(() => normalizeUsers(callState.participants || []));
  const [remoteStreams, setRemoteStreams] = useState({});
  const [mediaError, setMediaError] = useState("");
  const [error, setError] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const localVideoRef = useRef(null);
  const streamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const pendingIceRef = useRef({});
  const pendingRemoteOffersRef = useRef([]);
  const pendingOfferTargetsRef = useRef(new Set());
  const offerTargetsRef = useRef(new Set());
  const endedRef = useRef(false);
  const startAttemptedRef = useRef(false);
  const durationTimerRef = useRef(null);

  const groupName = callState.groupName || "Group call";
  const directName = callState.username || "Instagram user";
  const title = isGroupCall ? groupName : directName;
  const callerName = callState.username || callState.callerUsername || "Instagram user";
  const displayPicture = callState.groupProfilePicture || callState.profilePicture;
  const connected = callStatus === "connected";

  const upsertMembers = useCallback((users) => {
    setMembers((prev) => mergeUsers(prev, normalizeUsers(users)));
  }, []);

  const upsertParticipants = useCallback((users) => {
    setParticipants((prev) => mergeUsers(prev, normalizeUsers(users)));
  }, []);

  const replaceParticipants = useCallback((users) => {
    setParticipants(normalizeUsers(users));
  }, []);

  const removeParticipant = useCallback((userId) => {
    setParticipants((prev) => prev.filter((user) => String(user.id) !== String(userId)));
  }, []);

  const stopPeer = useCallback((userId) => {
    const key = String(userId);
    peerConnectionsRef.current[key]?.close();
    delete peerConnectionsRef.current[key];
    delete pendingIceRef.current[key];
    pendingOfferTargetsRef.current.delete(key);
    offerTargetsRef.current.delete(key);
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const cleanupCall = useCallback(() => {
    Object.keys(peerConnectionsRef.current).forEach((id) => stopPeer(id));
    if (streamRef.current) {
      stopMediaTracks(streamRef.current);
      streamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStreams({});
    if (durationTimerRef.current) {
      window.clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  }, [stopPeer]);

  const getPeerConnection = useCallback((targetUserId) => {
    const key = String(targetUserId || "");
    if (!key) return null;
    if (peerConnectionsRef.current[key]) return peerConnectionsRef.current[key];

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.ontrack = (event) => {
      const stream = event.streams?.[0] || new MediaStream([event.track]);
      setRemoteStreams((prev) => ({ ...prev, [key]: stream }));
    };

    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected"].includes(pc.connectionState)) {
        setError("Trying to reconnect media for this call.");
      }
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate || !callId || !currentUserId) return;
      sendIceCandidate({
        type: "ICE_CANDIDATE",
        callId,
        fromId: Number(currentUserId),
        targetId: Number(key),
        candidate: event.candidate,
      });
    };

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => pc.addTrack(track, streamRef.current));
    } else {
      pc.addTransceiver("audio", { direction: "recvonly" });
      if (hasVideo) pc.addTransceiver("video", { direction: "recvonly" });
    }

    peerConnectionsRef.current[key] = pc;
    return pc;
  }, [callId, currentUserId, hasVideo]);

  const createOfferFor = useCallback(async (targetUserId) => {
    const key = String(targetUserId || "");
    if (!key || !callId || !currentUserId || key === String(currentUserId)) return;
    if (offerTargetsRef.current.has(key)) return;
    offerTargetsRef.current.add(key);

    try {
      const pc = getPeerConnection(key);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendCallOffer({
        type: "CALL_OFFER",
        callId,
        fromId: Number(currentUserId),
        calleeId: Number(key),
        offer,
      });
    } catch {
      offerTargetsRef.current.delete(key);
      setError("Unable to connect media for this call.");
    }
  }, [callId, currentUserId, getPeerConnection]);

  const handleRemoteOffer = useCallback(async (event) => {
    const senderId = event?.fromId || event?.callerId;
    if (!senderId || !event?.offer || !callId || !currentUserId) return;

    try {
      const pc = getPeerConnection(senderId);
      await pc.setRemoteDescription(new RTCSessionDescription(event.offer));
      const queued = pendingIceRef.current[String(senderId)] || [];
      pendingIceRef.current[String(senderId)] = [];
      for (const candidate of queued) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendCallAnswer({
        type: "CALL_ANSWER",
        callId,
        fromId: Number(currentUserId),
        callerId: Number(senderId),
        answer,
      });
      setCallStatus("connected");
    } catch {
      setError("Unable to connect media for this call.");
    }
  }, [callId, currentUserId, getPeerConnection]);

  const handleRemoteAnswer = useCallback(async (event) => {
    const senderId = event?.fromId || event?.participantId || event?.callerId;
    if (!senderId || !event?.answer) return;

    try {
      const pc = getPeerConnection(senderId);
      if (pc?.signalingState !== "stable") {
        await pc.setRemoteDescription(new RTCSessionDescription(event.answer));
      }
      setCallStatus("connected");
    } catch {
      setError("Unable to connect media for this call.");
    }
  }, [getPeerConnection]);

  const handleRemoteIceCandidate = useCallback(async (event) => {
    const senderId = event?.fromId || event?.callerId;
    if (!senderId || !event?.candidate) return;

    try {
      const pc = getPeerConnection(senderId);
      if (pc?.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(event.candidate));
      } else {
        const key = String(senderId);
        pendingIceRef.current[key] = [...(pendingIceRef.current[key] || []), event.candidate];
      }
    } catch {
    }
  }, [getPeerConnection]);

  useEffect(() => {
    let cancelled = false;

    const requestLocalMedia = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMediaError("Camera or microphone permission was denied.");
        return;
      }

      try {
        const constraints = hasVideo ? { video: true, audio: true } : { audio: true };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cancelled) {
          stopMediaTracks(stream);
          return;
        }
        streamRef.current = stream;
        setLocalStream(stream);
        setMediaError("");
      } catch {
        setMediaError("Camera or microphone permission was denied.");
      }
    };

    requestLocalMedia();
    return () => {
      cancelled = true;
      if (streamRef.current) stopMediaTracks(streamRef.current);
    };
  }, [hasVideo]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (!localStream || callStatus !== "connected") return;
    const targets = Array.from(pendingOfferTargetsRef.current);
    pendingOfferTargetsRef.current.clear();
    targets.forEach((targetId) => createOfferFor(targetId));
  }, [callStatus, createOfferFor, localStream]);

  useEffect(() => {
    if (!localStream) return;
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      const existing = new Set(pc.getSenders().map((sender) => sender.track?.id).filter(Boolean));
      localStream.getTracks().forEach((track) => {
        if (!existing.has(track.id)) pc.addTrack(track, localStream);
      });
    });
  }, [localStream]);

  useEffect(() => {
    if (!localStream || pendingRemoteOffersRef.current.length === 0) return;
    const offers = pendingRemoteOffersRef.current;
    pendingRemoteOffersRef.current = [];
    offers.forEach((event) => handleRemoteOffer(event));
  }, [handleRemoteOffer, localStream]);

  useEffect(() => {
    if (!currentUserId || !callId || callId === "started") return;
    connect();
    const unsub = subscribeToCall(currentUserId, (event) => {
      if (!event || String(event.callId) !== String(callId) || endedRef.current) return;
      if (event.groupMembers) upsertMembers(event.groupMembers);
      if (event.participants) replaceParticipants(event.participants);

      if (event.type === "CALL_ACCEPTED" || event.type === "CALL_ANSWERED") {
        setCallStatus("connected");
        const participantId = event.participantId;
        if (isGroupCall && participantId && String(participantId) !== String(currentUserId)) {
          window.setTimeout(() => createOfferFor(participantId), 300);
        } else if (!isGroupCall && peerUserId) {
          window.setTimeout(() => createOfferFor(peerUserId), 300);
        }
      } else if (event.type === "CALL_REJECTED" || event.type === "CALL_DECLINED") {
        if (isGroupCall && event.participantId) {
          removeParticipant(event.participantId);
          stopPeer(event.participantId);
          return;
        }
        endedRef.current = true;
        setCallStatus("declined");
        cleanupCall();
        window.setTimeout(() => navigate(returnTo, { replace: true }), 2000);
      } else if (event.type === "CALL_ENDED" || event.type === "CALL_CANCELLED") {
        endedRef.current = true;
        setCallStatus("ended");
        cleanupCall();
        window.setTimeout(() => navigate(returnTo, { replace: true }), 1500);
      } else if (event.type === "CALL_LEFT" && event.participantId) {
        removeParticipant(event.participantId);
        stopPeer(event.participantId);
      } else if (event.type === "CALL_OFFER") {
        handleRemoteOffer(event);
      } else if (event.type === "CALL_ANSWER") {
        handleRemoteAnswer(event);
      } else if (event.type === "ICE_CANDIDATE") {
        handleRemoteIceCandidate(event);
      }
    });
    return () => unsub?.();
  }, [
    callId,
    cleanupCall,
    createOfferFor,
    currentUserId,
    handleRemoteAnswer,
    handleRemoteIceCandidate,
    handleRemoteOffer,
    isGroupCall,
    navigate,
    peerUserId,
    removeParticipant,
    replaceParticipants,
    returnTo,
    stopPeer,
    upsertMembers,
  ]);

  useEffect(() => {
    if (!callId || callId === "started" || endedRef.current) return;

    const terminalStatuses = new Set(["REJECTED", "DECLINED", "CANCELLED", "ENDED"]);
    const pollCallStatus = async () => {
      try {
        const history = await getCallHistory();
        const calls = Array.isArray(history) ? history : Array.isArray(history?.content) ? history.content : [];
        const call = calls.find((item) => String(item?.id || item?.callId) === String(callId));
        if (call?.groupMembers) upsertMembers(call.groupMembers);
        if (call?.participants) replaceParticipants(call.participants);
        const status = String(call?.status || "").toUpperCase();
        if (!terminalStatuses.has(status) || endedRef.current) return;

        endedRef.current = true;
        cleanupCall();
        setCallStatus(status === "REJECTED" || status === "DECLINED" ? "declined" : "ended");
        window.setTimeout(() => navigate(returnTo, { replace: true }), status === "REJECTED" || status === "DECLINED" ? 2000 : 1500);
      } catch {
      }
    };

    const intervalId = window.setInterval(pollCallStatus, 2500);
    pollCallStatus();
    return () => window.clearInterval(intervalId);
  }, [callId, cleanupCall, navigate, replaceParticipants, returnTo, upsertMembers]);

  useEffect(() => {
    if (callStatus !== "connected") return;
    durationTimerRef.current = window.setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => {
      if (durationTimerRef.current) window.clearInterval(durationTimerRef.current);
    };
  }, [callStatus]);

  useEffect(() => {
    return () => cleanupCall();
  }, [cleanupCall]);

  const handleStartCall = async () => {
    setError("");
    if (callId) return;
    setIsStarting(true);

    try {
      if (!peerUserId && !groupId) {
        setError("Unable to find the user to call.");
        return;
      }

      const data = groupId ? await startGroupCall(groupId, callType) : await startCall(peerUserId, callType);
      const newCallId = data?.callId || data?.id || data?.data?.callId || data?.data?.id || "";
      const nextPeerUserId = data?.calleeId || data?.callee?.id || peerUserId;
      if (nextPeerUserId) setPeerUserId(String(nextPeerUserId));
      setCallerId(data?.callerId || currentUserId || "");
      if (data?.groupMembers) upsertMembers(data.groupMembers);
      if (data?.participants) upsertParticipants(data.participants);
      setCallId(newCallId || "started");
      setCallStatus("ringing");
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to start call right now.");
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (!callState.autoStart || startAttemptedRef.current || callId) return;
    startAttemptedRef.current = true;
    handleStartCall();
  }, [callState.autoStart, callId]);

  const handleEndCall = async () => {
    setError("");
    if (endedRef.current) return;
    endedRef.current = true;
    cleanupCall();

    if (!callId || callId === "started") {
      navigate(returnTo, { replace: true });
      return;
    }

    setIsEnding(true);

    try {
      const isGroupCaller = isGroupCall && String(callerId || currentUserId) === String(currentUserId);
      if (isGroupCall && !isGroupCaller) {
        await leaveCall(callId);
        navigate(returnTo, { replace: true });
        return;
      }

      const targets = isGroupCall
        ? visibleParticipants.filter((user) => String(user.id) !== String(currentUserId)).map((user) => user.id)
        : peerUserId ? [peerUserId] : [];
      targets.forEach((targetId) => {
        sendCallEnd({
          type: callStatus === "ringing" ? "CALL_CANCELLED" : "CALL_ENDED",
          callId,
          targetId: Number(targetId),
        });
      });
      if (callStatus === "ringing") await cancelCall(callId);
      else await endCall(callId);
    } catch {
    }

    navigate(returnTo, { replace: true });
  };

  const toggleMute = () => {
    if (!localStream) return;
    localStream.getAudioTracks().forEach((track) => {
      track.enabled = isMuted;
    });
    setIsMuted(!isMuted);
  };

  const toggleCamera = () => {
    if (!localStream) return;
    localStream.getVideoTracks().forEach((track) => {
      track.enabled = isCameraOff;
    });
    setIsCameraOff(!isCameraOff);
  };

  const visibleParticipants = useMemo(() => {
    const base = participants;
    const withCurrent = currentUser?.id
      ? mergeUsers(base, [currentUser])
      : base;
    return withCurrent.length ? withCurrent : [{ id: "remote", username: directName, profilePicture: displayPicture }];
  }, [currentUser, directName, displayPicture, participants]);

  const callTiles = useMemo(() => {
    const localTile = {
      id: currentUserId || "local",
      name: currentUser?.username || "You",
      profilePicture: currentUser?.profilePicture,
      stream: localStream,
      local: true,
      muted: isMuted,
      cameraOff: isCameraOff,
    };

    if (!isGroupCall) {
      const remoteUser = { id: peerUserId || "remote", username: directName, profilePicture: displayPicture };
      const remoteStream = remoteStreams[String(peerUserId)] || Object.values(remoteStreams)[0];
      return [
        { ...remoteUser, name: directName, stream: remoteStream, local: false },
        localTile,
      ];
    }

    const remoteTiles = visibleParticipants
      .filter((user) => String(user.id) !== String(currentUserId))
      .map((user) => ({
        id: user.id,
        name: user.username || user.fullName || "Participant",
        profilePicture: user.profilePicture,
        stream: remoteStreams[String(user.id)],
        local: false,
      }));
    return [localTile, ...remoteTiles];
  }, [currentUser, currentUserId, directName, displayPicture, isCameraOff, isGroupCall, isMuted, localStream, peerUserId, remoteStreams, visibleParticipants]);

  return (
    <main className="fixed inset-0 bg-black text-white">
      <div className="flex h-full flex-col">
        <header className="z-20 flex h-14 shrink-0 items-center justify-between bg-black/80 px-4">
          <div className="min-w-0">
            <h1 className="truncate text-sm font-semibold">{title}</h1>
            <p className="text-xs text-white/60">
              {isGroupCall && callerName ? `${callerName} started the call • ` : ""}
              {callStatus === "idle" && "Ready to call"}
              {callStatus === "dialing" && "Connecting..."}
              {callStatus === "ringing" && "Calling..."}
              {callStatus === "connected" && formatDuration(callDuration)}
              {callStatus === "declined" && "Call declined"}
              {callStatus === "ended" && "Call ended"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowParticipants((open) => !open)}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-white/10 px-3 text-xs font-semibold hover:bg-white/15"
          >
            <Users className="h-4 w-4" />
            {visibleParticipants.length}
          </button>
        </header>

        <section className="relative min-h-0 flex-1 bg-[#0d0d0d]">
          {hasVideo ? (
            <div
              className={`grid h-full w-full auto-rows-fr gap-1 p-1 ${getGridClass(callTiles.length)}`}
              style={{ gridTemplateRows: getGridRows(callTiles.length) }}
            >
              {callTiles.map((tile) => (
                <VideoTile key={`${tile.local ? "local" : "remote"}-${tile.id}`} tile={tile} />
              ))}
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <img
                src={getAvatarUrl({ profilePicture: displayPicture })}
                alt=""
                className="h-28 w-28 rounded-full object-cover"
                onError={(e) => { e.currentTarget.src = "/default-avatar.png"; e.currentTarget.onerror = null; }}
              />
              <h2 className="mt-5 truncate text-2xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm text-white/60">{connected ? formatDuration(callDuration) : "Audio call"}</p>
            </div>
          )}

          {!hasVideo && Object.entries(remoteStreams).map(([userId, stream]) => (
            <RemoteAudio key={`audio-${userId}`} stream={stream} />
          ))}

          {(mediaError || error) && (
            <div className="absolute left-1/2 top-20 z-30 w-[min(420px,calc(100vw-32px))] -translate-x-1/2 rounded-lg bg-[#1f1f1f]/95 px-4 py-3 text-center text-sm text-[#ff8a96] shadow-xl">
              {mediaError || error}
            </div>
          )}

          {showParticipants && (
            <aside className="absolute right-4 top-4 z-30 w-[min(320px,calc(100vw-32px))] rounded-lg bg-[#181818]/95 p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold">Participants</h2>
                <span className="text-xs text-white/50">{visibleParticipants.length}</span>
              </div>
              <div className="max-h-[360px] space-y-2 overflow-y-auto">
                {visibleParticipants.map((user) => (
                  <div key={user.id} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-white/5">
                    <img
                      src={getAvatarUrl(user)}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                      onError={(e) => { e.currentTarget.src = "/default-avatar.png"; e.currentTarget.onerror = null; }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{String(user.id) === String(currentUserId) ? "You" : user.username || user.fullName || "Participant"}</p>
                      <p className="text-xs text-white/45">{remoteStreams[String(user.id)] || String(user.id) === String(currentUserId) ? "In call" : "Waiting"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          )}

          <div className="absolute bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/45 px-4 py-3 backdrop-blur">
            {(callStatus === "idle" || callStatus === "dialing") && (
              <button
                type="button"
                onClick={handleStartCall}
                disabled={isStarting}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#16a34a] text-white hover:bg-[#15803d] disabled:opacity-60"
                aria-label="Start call"
              >
                {hasVideo ? <Video className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
            )}

            {(callStatus === "connected" || callStatus === "ringing") && (
              <>
                <button
                  type="button"
                  onClick={toggleMute}
                  disabled={!localStream}
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${isMuted ? "bg-white/25" : "bg-white/12 hover:bg-white/20"} disabled:opacity-50`}
                  aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
                >
                  {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                {hasVideo && (
                  <button
                    type="button"
                    onClick={toggleCamera}
                    disabled={!localStream}
                    className={`flex h-12 w-12 items-center justify-center rounded-full text-white ${isCameraOff ? "bg-white/25" : "bg-white/12 hover:bg-white/20"} disabled:opacity-50`}
                    aria-label={isCameraOff ? "Turn camera on" : "Turn camera off"}
                  >
                    {isCameraOff ? <CameraOff className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handleEndCall}
              disabled={isEnding}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ed4956] text-white hover:bg-[#d63b49] disabled:opacity-60"
              aria-label={callStatus === "ringing" ? "Decline call" : "End call"}
            >
              <PhoneOff className="h-5 w-5" />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

function VideoTile({ tile }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && tile.stream) {
      videoRef.current.srcObject = tile.stream;
    }
  }, [tile.stream]);

  const hasVideoTrack = tile.stream?.getVideoTracks?.().length > 0 && !tile.cameraOff;

  return (
    <div className="relative min-h-0 overflow-hidden rounded-sm bg-[#181818]">
      {tile.stream && hasVideoTrack ? (
        <video
          ref={videoRef}
          autoPlay
          muted={tile.local}
          playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#202020]">
          {tile.stream && !tile.local && <RemoteAudio stream={tile.stream} />}
          {tile.profilePicture ? (
            <img
              src={getAvatarUrl({ profilePicture: tile.profilePicture })}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
              onError={(e) => { e.currentTarget.src = "/default-avatar.png"; e.currentTarget.onerror = null; }}
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/10">
              <UserRound className="h-9 w-9 text-white/50" />
            </div>
          )}
          <p className="max-w-[80%] truncate text-sm font-semibold text-white/80">{tile.local ? "You" : tile.name}</p>
        </div>
      )}
      <div className="absolute bottom-2 left-2 rounded bg-black/55 px-2 py-1 text-xs font-semibold">
        {tile.local ? "You" : tile.name}
      </div>
      {tile.local && tile.muted && (
        <div className="absolute right-2 top-2 rounded-full bg-black/55 p-1.5">
          <MicOff className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function RemoteAudio({ stream }) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  if (!stream) return null;
  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
}

function getGridClass(count) {
  if (count <= 1) return "grid-cols-1";
  if (count === 2) return "grid-cols-1 md:grid-cols-2";
  if (count <= 4) return "grid-cols-2";
  if (count <= 6) return "grid-cols-2 md:grid-cols-3";
  return "grid-cols-2 md:grid-cols-3 xl:grid-cols-4";
}

function getGridRows(count) {
  if (count <= 2) return "repeat(1, minmax(0, 1fr))";
  if (count <= 6) return "repeat(2, minmax(0, 1fr))";
  return "repeat(3, minmax(0, 1fr))";
}

function normalizeUsers(users) {
  return (Array.isArray(users) ? users : [])
    .map((user) => ({
      ...user,
      id: user?.id ?? user?.userId,
      username: user?.username || user?.fullName || "",
      profilePicture: user?.profilePicture || user?.callerProfilePicture || "",
    }))
    .filter((user) => user.id !== undefined && user.id !== null);
}

function mergeUsers(...groups) {
  const byId = new Map();
  groups.flat().forEach((user) => {
    if (!user?.id) return;
    byId.set(String(user.id), { ...(byId.get(String(user.id)) || {}), ...user });
  });
  return Array.from(byId.values());
}

function formatDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function stopMediaTracks(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export default CallPage;

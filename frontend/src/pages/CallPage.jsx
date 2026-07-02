import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Camera, CameraOff, Mic, MicOff, PhoneOff, UserRound, Users, Video } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { cancelCall, endCall, getCallById, leaveCall, startCall, startGroupCall } from "../api/callsApi";
import { getAvatarUrl } from "../utils/avatar";
import { useCurrentUser } from "../hooks/useCurrentUser";
import {
  connect,
  drainCallSignals,
  sendCallAnswer,
  sendCallEnd,
  sendCallOffer,
  sendIceCandidate,
  subscribeToCall,
} from "../hooks/useWebSocket";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
];

const ACTIVE_CALL_STORAGE_KEY = "activeCall";

function CallPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { currentUser, currentUserId } = useCurrentUser();
  const hasVideo = searchParams.get("has_video") === "true";
  const urlCallId = searchParams.get("callId");
  const callState = location.state || {};
  const groupId = callState.groupId || searchParams.get("groupId") || "";
  const isGroupCall = Boolean(groupId);
  const callType = hasVideo ? "VIDEO" : "VOICE";
  const savedCallState = (() => {
    try {
      const saved = sessionStorage.getItem(ACTIVE_CALL_STORAGE_KEY);
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      if (urlCallId && String(parsed.callId) === String(urlCallId)) return parsed;
      if (groupId && String(parsed.groupId) === String(groupId)) return parsed;
      const userId = searchParams.get("userId") || callState.otherUserId;
      if (userId && String(parsed.otherUserId) === String(userId)) return parsed;
      return null;
    } catch {
      return null;
    }
  })();
  const [callId, setCallId] = useState(callState.callId || urlCallId || savedCallState?.callId || "");
  const initialStatus = callState.accepted ? "connected" : callState.autoStart ? "dialing" : callState.callId || urlCallId || savedCallState?.callId ? "ringing" : "idle";
  const [callStatus, setCallStatus] = useState(initialStatus);
  const [peerUserId, setPeerUserId] = useState(callState.otherUserId || searchParams.get("userId") || savedCallState?.otherUserId || "");
  const [callerId, setCallerId] = useState(callState.callerId || savedCallState?.callerId || callState.otherUserId || "");

  const prevCallIdRef = useRef(null);
  useEffect(() => {
    if (!callId || callId === "started") return;
    if (prevCallIdRef.current && prevCallIdRef.current !== callId) {
      endedRef.current = false;
      pollCancelledRef.current = true;
      pollGenRef.current += 1;
      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
      peerConnectionsRef.current = {};
      pendingIceRef.current = {};
      pendingRemoteOffersRef.current = [];
      pendingOfferTargetsRef.current = new Set();
      offerTargetsRef.current = new Set();
      setRemoteStreams({});
    }
    prevCallIdRef.current = callId;
  }, [callId]);

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
  const callIdRef = useRef(callId);
  const callStatusRef = useRef(callStatus);
  const userIdRef = useRef(currentUserId);
  const peerUserIdRef = useRef(peerUserId);
  const pollCancelledRef = useRef(false);
  const pollGenRef = useRef(0);
  const hasVideoRef = useRef(hasVideo);
  const offerCreatorRef = useRef(new Set());
  useEffect(() => { callIdRef.current = callId; }, [callId]);
  useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);
  useEffect(() => { userIdRef.current = currentUserId; }, [currentUserId]);
  useEffect(() => { peerUserIdRef.current = peerUserId; }, [peerUserId]);
  useEffect(() => { hasVideoRef.current = hasVideo; }, [hasVideo]);

  const groupName = callState.groupName || savedCallState?.groupName || "Group call";
  const directName = callState.username || savedCallState?.username || "Instagram user";
  const title = isGroupCall ? groupName : directName;
  const callerName = callState.username || callState.callerUsername || savedCallState?.username || "Instagram user";
  const displayPicture = callState.groupProfilePicture || savedCallState?.groupProfilePicture || callState.profilePicture || savedCallState?.profilePicture;
  const returnTo = callState.returnTo || savedCallState?.returnTo || "/messages";
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
    offerCreatorRef.current.delete(key);
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const cleanupCall = useCallback(() => {
    Object.keys(peerConnectionsRef.current).forEach((id) => stopPeer(id));
    offerCreatorRef.current.clear();
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

  const clearSavedActiveCall = useCallback(() => {
    try { sessionStorage.removeItem(ACTIVE_CALL_STORAGE_KEY); } catch {}
  }, []);

  const handleRemoteOfferRef = useRef(null);
  const handleRemoteAnswerRef = useRef(null);
  const handleRemoteIceCandidateRef = useRef(null);
  const createOfferForRef = useRef(null);
  const cleanupCallRef = useRef(null);
  const stopPeerRef = useRef(null);
  const removeParticipantRef = useRef(null);
  const replaceParticipantsRef = useRef(null);
  const upsertMembersRef = useRef(null);
  const navigateRef = useRef(navigate);
  const returnToRef = useRef(returnTo);
  const isGroupCallRef = useRef(isGroupCall);

  const getPeerConnection = useCallback((targetUserId) => {
    const key = String(targetUserId || "");
    if (!key) return null;
    if (peerConnectionsRef.current[key]) return peerConnectionsRef.current[key];

    const cId = callIdRef.current;
    const uId = userIdRef.current;

    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    });

    pc.ontrack = (event) => {
      const stream = event.streams?.[0] || new MediaStream([event.track]);
      setRemoteStreams((prev) => ({ ...prev, [key]: stream }));
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "failed") {
        try { pc.restartIce(); } catch {}
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        setError("");
      } else if (pc.connectionState === "failed") {
        const wasOfferer = offerCreatorRef.current.has(key);
        offerTargetsRef.current.delete(key);
        offerCreatorRef.current.delete(key);
        peerConnectionsRef.current[key]?.close();
        delete peerConnectionsRef.current[key];
        delete pendingIceRef.current[key];
        setRemoteStreams((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        if (!endedRef.current && wasOfferer) {
          window.setTimeout(() => { createOfferForRef.current?.(key); }, 2000);
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (!event.candidate || !cId || !uId) return;
      sendIceCandidate({
        type: "ICE_CANDIDATE",
        callId: cId,
        fromId: Number(uId),
        targetId: Number(key),
        candidate: event.candidate,
      });
    };

    const stream = streamRef.current;
    const liveTracks = stream ? stream.getTracks().filter((t) => t.readyState === "live") : [];
    if (liveTracks.length > 0) {
      liveTracks.forEach((track) => pc.addTrack(track, stream));
    }

    peerConnectionsRef.current[key] = pc;
    return pc;
  }, []);

  const createOfferFor = useCallback(async (targetUserId) => {
    const key = String(targetUserId || "");
    const cId = callIdRef.current;
    const uId = userIdRef.current;
    if (!key || !cId || !uId || key === String(uId)) return;

    const s = streamRef.current;
    const hasActive = s && s.getTracks().some((t) => t.readyState === "live");
    if (!hasActive) {
      pendingOfferTargetsRef.current.add(key);
      return;
    }
    if (offerTargetsRef.current.has(key)) return;
    offerTargetsRef.current.add(key);

    try {
      const pc = getPeerConnection(key);
      if (pc.signalingState !== "stable") {
        offerTargetsRef.current.delete(key);
        window.setTimeout(() => { createOfferForRef.current?.(key); }, 500);
        return;
      }
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: hasVideoRef.current,
      });
      await pc.setLocalDescription(offer);
      offerCreatorRef.current.add(key);
      sendCallOffer({
        type: "CALL_OFFER",
        callId: cId,
        fromId: Number(uId),
        calleeId: Number(key),
        offer,
      });
    } catch {
      offerTargetsRef.current.delete(key);
      setError("Unable to connect media for this call.");
    }
  }, [getPeerConnection]);

  const flushQueuedIceCandidates = useCallback(async (pc, senderId) => {
    const key = String(senderId);
    const queued = pendingIceRef.current[key] || [];
    pendingIceRef.current[key] = [];
    for (const candidate of queued) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
      }
    }
  }, []);

  const handleRemoteOffer = useCallback(async (event) => {
    const senderId = event?.fromId || event?.callerId;
    const cId = callIdRef.current;
    const uId = userIdRef.current;
    const s = streamRef.current;
    const hasActive = s && s.getTracks().some((t) => t.readyState === "live");
    if (!senderId || !event?.offer || !cId || !uId) return;
    if (!hasActive) {
      pendingRemoteOffersRef.current.push(event);
      return;
    }

    try {
      const pc = getPeerConnection(senderId);
      if (pc.signalingState !== "stable") {
        const retry = () => {
          if (!endedRef.current && handleRemoteOfferRef.current) {
            handleRemoteOfferRef.current(event);
          }
        };
        pc.addEventListener("signalingstatechange", retry, { once: true });
        return;
      }
      await pc.setRemoteDescription(new RTCSessionDescription(event.offer));
      await flushQueuedIceCandidates(pc, senderId);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendCallAnswer({
        type: "CALL_ANSWER",
        callId: cId,
        fromId: Number(uId),
        callerId: Number(senderId),
        answer,
      });
      setCallStatus("connected");
    } catch {
      setError("Unable to connect media for this call.");
    }
  }, [flushQueuedIceCandidates, getPeerConnection]);

  const handleRemoteAnswer = useCallback(async (event) => {
    const senderId = event?.fromId || event?.participantId || event?.callerId;
    if (!senderId || !event?.answer) return;

    try {
      const pc = getPeerConnection(senderId);
      if (pc?.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(event.answer));
        await flushQueuedIceCandidates(pc, senderId);
        setCallStatus("connected");
      } else if (pc?.signalingState === "stable") {
        setCallStatus("connected");
      }
    } catch {
      setError("Unable to connect media for this call.");
    }
  }, [flushQueuedIceCandidates, getPeerConnection]);

  const handleRemoteIceCandidate = useCallback(async (event) => {
    const senderId = event?.fromId || event?.callerId;
    if (!senderId || !event?.candidate) return;
    const key = String(senderId);

    try {
      const pc = peerConnectionsRef.current[key];
      if (!pc) {
        pendingIceRef.current[key] = [...(pendingIceRef.current[key] || []), event.candidate];
        return;
      }
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(event.candidate));
      } else {
        pendingIceRef.current[key] = [...(pendingIceRef.current[key] || []), event.candidate];
      }
    } catch {
    }
  }, []);

  useEffect(() => { navigateRef.current = navigate; }, [navigate]);
  useEffect(() => { returnToRef.current = returnTo; }, [returnTo]);
  useEffect(() => { isGroupCallRef.current = isGroupCall; }, [isGroupCall]);

  useEffect(() => {
    if (!callId || callId === "started" || !isGroupCall) return;
    try {
      sessionStorage.setItem(ACTIVE_CALL_STORAGE_KEY, JSON.stringify({
        callId,
        groupId,
        groupName,
        groupProfilePicture: callState.groupProfilePicture || savedCallState?.groupProfilePicture || "",
        returnTo,
      }));
    } catch {}
  }, [callId, isGroupCall, groupId, groupName, returnTo]);

  useEffect(() => {
    if (!callId || callId === "started" || isGroupCall) return;
    try {
      sessionStorage.setItem(ACTIVE_CALL_STORAGE_KEY, JSON.stringify({
        callId,
        otherUserId: peerUserId,
        callerId,
        username: directName,
        profilePicture: displayPicture || "",
        returnTo,
      }));
    } catch {}
  }, [callId, callerId, directName, displayPicture, isGroupCall, peerUserId, returnTo]);
  useEffect(() => { handleRemoteOfferRef.current = handleRemoteOffer; }, [handleRemoteOffer]);
  useEffect(() => { handleRemoteAnswerRef.current = handleRemoteAnswer; }, [handleRemoteAnswer]);
  useEffect(() => { handleRemoteIceCandidateRef.current = handleRemoteIceCandidate; }, [handleRemoteIceCandidate]);
  useEffect(() => { createOfferForRef.current = createOfferFor; }, [createOfferFor]);
  useEffect(() => { cleanupCallRef.current = cleanupCall; }, [cleanupCall]);
  useEffect(() => { stopPeerRef.current = stopPeer; }, [stopPeer]);
  useEffect(() => { removeParticipantRef.current = removeParticipant; }, [removeParticipant]);
  useEffect(() => { replaceParticipantsRef.current = replaceParticipants; }, [replaceParticipants]);
  useEffect(() => { upsertMembersRef.current = upsertMembers; }, [upsertMembers]);

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
      if (streamRef.current) {
        stopMediaTracks(streamRef.current);
        streamRef.current = null;
        setLocalStream(null);
      }
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
        if (!existing.has(track.id)) {
          pc.addTrack(track, localStream);
        }
      });
    });
  }, [localStream]);

  useEffect(() => {
    if (!localStream || pendingRemoteOffersRef.current.length === 0) return;
    const offers = pendingRemoteOffersRef.current.splice(0);
    offers.forEach((ev) => handleRemoteOffer(ev));
  }, [handleRemoteOffer, localStream]);

  useEffect(() => {
    if (!currentUserId) return;
    const currentCId = callIdRef.current;

    connect();

    if (currentCId && currentCId !== "started") {
      const drained = drainCallSignals(currentCId);
      for (const sig of drained) {
        if (sig.type === "CALL_OFFER") {
          const dStream = streamRef.current;
          const dActive = dStream && dStream.getTracks().some((t) => t.readyState === "live");
          if (dActive && handleRemoteOfferRef.current) handleRemoteOfferRef.current(sig);
          else pendingRemoteOffersRef.current.push(sig);
        }
      }
    }

    const unsub = subscribeToCall(currentUserId, (event) => {
      if (!event) return;

      const cId = callIdRef.current;
      const uId = userIdRef.current;
      const pId = peerUserIdRef.current;
      const iGc = isGroupCallRef.current;
      const nFn = navigateRef.current;
      const rTo = returnToRef.current;

      if (endedRef.current || (cId && String(event.callId) !== String(cId))) return;

      if (event.groupMembers && upsertMembersRef.current) upsertMembersRef.current(event.groupMembers);
      if (event.participants && replaceParticipantsRef.current) replaceParticipantsRef.current(event.participants);

      if (event.type === "CALL_ACCEPTED" || event.type === "CALL_ANSWERED") {
        setCallStatus("connected");
        const participantId = event.participantId;
        if (iGc && participantId && String(participantId) !== String(uId)) {
          window.setTimeout(() => { createOfferForRef.current?.(participantId); }, 1500);
        } else if (!iGc && pId) {
          window.setTimeout(() => { createOfferForRef.current?.(pId); }, 1500);
        }
      } else if (event.type === "CALL_REJECTED" || event.type === "CALL_DECLINED") {
        if (iGc && event.participantId) {
          removeParticipantRef.current?.(event.participantId);
          stopPeerRef.current?.(event.participantId);
          return;
        }
        endedRef.current = true;
        setCallStatus("declined");
        cleanupCallRef.current?.();
        clearSavedActiveCall();
        window.setTimeout(() => nFn(rTo, { replace: true }), 2000);
      } else if (event.type === "CALL_ENDED" || event.type === "CALL_CANCELLED") {
        endedRef.current = true;
        setCallStatus("ended");
        cleanupCallRef.current?.();
        clearSavedActiveCall();
        window.setTimeout(() => nFn(rTo, { replace: true }), 1500);
      } else if (event.type === "CALL_LEFT" && event.participantId) {
        offerTargetsRef.current.delete(String(event.participantId));
        removeParticipantRef.current?.(event.participantId);
        stopPeerRef.current?.(event.participantId);
      } else if (event.type === "CALL_OFFER") {
        const evStream = streamRef.current;
        const evActive = evStream && evStream.getTracks().some((t) => t.readyState === "live");
        if (evActive && handleRemoteOfferRef.current) handleRemoteOfferRef.current(event);
        else pendingRemoteOffersRef.current.push(event);
      } else if (event.type === "CALL_ANSWER") {
        handleRemoteAnswerRef.current?.(event);
      } else if (event.type === "ICE_CANDIDATE") {
        handleRemoteIceCandidateRef.current?.(event);
      }
    });
    return () => { unsub?.(); };
  }, [clearSavedActiveCall, currentUserId]);

  useEffect(() => {
    if (!callId || callId === "started") return;
    const bufferedSignals = drainCallSignals(callId);
    for (const sig of bufferedSignals) {
      if (sig.type === "CALL_OFFER") {
        const bStream = streamRef.current;
        const bActive = bStream && bStream.getTracks().some((t) => t.readyState === "live");
        if (bActive && handleRemoteOfferRef.current) handleRemoteOfferRef.current(sig);
        else pendingRemoteOffersRef.current.push(sig);
      }
    }
  }, [callId]);

  useEffect(() => {
    if (!callId || callId === "started" || endedRef.current) return;

    pollCancelledRef.current = false;
    const thisCallId = callId;
    const thisGen = pollGenRef.current;
    const terminalStatuses = new Set(["REJECTED", "DECLINED", "CANCELLED", "ENDED"]);

    const pollCallStatus = async () => {
      try {
        const call = await getCallById(thisCallId);
        if (pollCancelledRef.current || pollGenRef.current !== thisGen || callIdRef.current !== thisCallId) return;
        const curStatus = callStatusRef.current;
        const curPeerId = peerUserIdRef.current;
        const uId = userIdRef.current;

        if (!call && curStatus === "ringing") {
          endedRef.current = true;
          cleanupCallRef.current?.();
          setCallStatus("ended");
          window.setTimeout(() => navigateRef.current?.(returnToRef.current, { replace: true }), 1500);
          return;
        }

        if (call?.groupMembers && upsertMembersRef.current) upsertMembersRef.current(call.groupMembers);
        if (call?.participants && replaceParticipantsRef.current) replaceParticipantsRef.current(call.participants);
        const status = String(call?.status || "").toUpperCase();

        if (status === "ANSWERED") {
          const elapsed = getElapsedSeconds(call.startedAt);
          if (elapsed > 0) setCallDuration(elapsed);
        }

        if (status === "ANSWERED" && curStatus !== "connected") {
          setCallStatus("connected");
          if (isGroupCallRef.current) {
            const pts = Array.isArray(call.participants) ? call.participants : [];
            pts.forEach((p, i) => {
              const pid = String(p.id);
              if (pid !== String(uId)) {
                window.setTimeout(() => createOfferForRef.current?.(pid), 1500 + i * 300);
              }
            });
          } else if (curPeerId) {
            window.setTimeout(() => createOfferForRef.current?.(curPeerId), 300);
          }
          return;
        }

        if (!terminalStatuses.has(status) || endedRef.current) return;
        if (pollCancelledRef.current || pollGenRef.current !== thisGen) return;

        endedRef.current = true;
        cleanupCallRef.current?.();
        clearSavedActiveCall();
        setCallStatus(status === "REJECTED" || status === "DECLINED" ? "declined" : "ended");
        window.setTimeout(() => navigateRef.current?.(returnToRef.current, { replace: true }), status === "REJECTED" || status === "DECLINED" ? 2000 : 1500);
      } catch {
      }
    };

    const intervalId = window.setInterval(pollCallStatus, 2500);
    pollCallStatus();
    return () => {
      pollCancelledRef.current = true;
      window.clearInterval(intervalId);
    };
  }, [callId, clearSavedActiveCall]);

  useEffect(() => {
    if (!callId || callId === "started") return;
    let cancelled = false;

    const hydrateCall = async () => {
      try {
        const call = await getCallById(callId);
        if (cancelled) return;
        if (!call) return;

        const status = String(call.status || "").toUpperCase();
        if (call.callerId) setCallerId(call.callerId);
        if (call.groupMembers) upsertMembers(call.groupMembers);
        if (call.participants) replaceParticipants(call.participants);
        if (!isGroupCall && !peerUserId) {
          const otherId = String(call.callerId) === String(currentUserId) ? call.calleeId : call.callerId;
          if (otherId) setPeerUserId(String(otherId));
        }
        if (status === "ANSWERED") {
          setCallStatus("connected");
          setCallDuration(getElapsedSeconds(call.startedAt));
        } else if (status === "CALLING" && callStatusRef.current === "idle") {
          setCallStatus("ringing");
        }
      } catch {
      }
    };

    hydrateCall();
    return () => { cancelled = true; };
  }, [callId, currentUserId, isGroupCall, peerUserId, replaceParticipants, upsertMembers]);

  useEffect(() => {
    if (callStatus !== "connected") return;
    if (durationTimerRef.current) window.clearInterval(durationTimerRef.current);
    durationTimerRef.current = window.setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    return () => {
      if (durationTimerRef.current) {
        window.clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
    };
  }, [callStatus]);

  useEffect(() => {
    const shouldBlockBack = ["dialing", "ringing", "connected"].includes(callStatus);
    if (!shouldBlockBack) return;

    window.history.pushState({ callBackGuard: true }, "", window.location.href);
    const handlePopState = () => {
      if (["dialing", "ringing", "connected"].includes(callStatusRef.current)) {
        window.history.pushState({ callBackGuard: true }, "", window.location.href);
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [callStatus]);

  useEffect(() => {
    return () => cleanupCallRef.current?.();
  }, []);

  const handleStartCall = async () => {
    setError("");
    if (callId) return;
    endedRef.current = false;
    pollCancelledRef.current = true;
    pollGenRef.current += 1;
    Object.values(peerConnectionsRef.current).forEach((pc) => pc.close());
    peerConnectionsRef.current = {};
    pendingIceRef.current = {};
    pendingRemoteOffersRef.current = [];
    pendingOfferTargetsRef.current = new Set();
    offerTargetsRef.current = new Set();
    setRemoteStreams({});
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
      if (newCallId) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set("callId", newCallId);
        if (groupId) nextParams.set("groupId", groupId);
        else if (nextPeerUserId) nextParams.set("userId", nextPeerUserId);
        navigate(`/call?${nextParams.toString()}`, { replace: true, state: { ...callState, callId: newCallId } });
      }
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
    cleanupCallRef.current?.();

    if (!callId || callId === "started") {
      clearSavedActiveCall();
      navigateRef.current(returnToRef.current, { replace: true });
      return;
    }

    setIsEnding(true);

    try {
      const isGroupCaller = isGroupCallRef.current && String(callerId || currentUserId) === String(currentUserId);
      if (isGroupCallRef.current && !isGroupCaller) {
        await leaveCall(callId);
        clearSavedActiveCall();
        navigateRef.current(returnToRef.current, { replace: true });
        return;
      }

      const targets = isGroupCallRef.current
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

    clearSavedActiveCall();
    navigateRef.current(returnToRef.current, { replace: true });
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
    const withCurrent = currentUser?.id ? mergeUsers(base, [currentUser]) : base;
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

function getElapsedSeconds(startedAt) {
  if (!startedAt) return 0;
  const started = new Date(startedAt).getTime();
  if (!Number.isFinite(started)) return 0;
  return Math.max(0, Math.floor((Date.now() - started) / 1000));
}

function stopMediaTracks(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export default CallPage;

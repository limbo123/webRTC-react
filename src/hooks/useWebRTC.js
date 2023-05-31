import freeice from "freeice";
import { useEffect, useRef } from "react";
import socket from "../socket";
import Actions from "../socket/action";
import { useStateWithCallback } from "./useStateWithCallback";

export const LOCAL_VIDEO = "LOCAL_VIDEO";

export const useWebRTC = (roomId) => {
  const [clients, setClients] = useStateWithCallback([]);
  const peerConnections = useRef({});
  const localMediaStream = useRef(null);
  const peerMediaElements = useRef({
    [LOCAL_VIDEO]: null,
  });

  const addNewClient = (newClient, callback) => {
    if (!clients.includes(newClient)) {
      setClients((prev) => [...prev, newClient], callback);
    }
  };

  useEffect(() => {
    const handleNewPeer = async ({ peerID, createOffer }) => {
      if (peerID in peerConnections.current)
        return console.warn("peer is already added");

      peerConnections.current[peerID] = new RTCPeerConnection({
        iceServers: freeice(),
      });

      peerConnections.current[peerID].onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit(Actions.RELAY_ICE, {
            peerID,
            iceCandidate: event.candidate,
          });
        }
      };
      let tracksNumber = 0;
      peerConnections.current[peerID].ontrack = ({
        streams: [remoteStream],
      }) => {
        tracksNumber++;
        if (tracksNumber !== 2) return;
        addNewClient(peerID, () => {
          peerMediaElements.current[peerID].srcObject = remoteStream;
        });
      };
      localMediaStream.current.getTracks().forEach((track) => {
        peerConnections.current[peerID].addTrack(
          track,
          localMediaStream.current
        );
      });

      if (createOffer) {
        const offer = await peerConnections.current[peerID].createOffer();

        await peerConnections.current[peerID].setLocalDescription(offer);

        socket.emit(Actions.RELAY_SDP, {
          peerID,
          sessionDescription: offer,
        });
      }
    };
    socket.on(Actions.ADD_PEER, handleNewPeer);
  }, []);

  useEffect(() => {
    const handleRemovePeer = ({ peerID }) => {
      if (peerConnections.current[peerID]) {
        peerConnections.current[peerID].close();
      }

      delete peerConnections.current[peerID];
      delete peerMediaElements.current[peerID];
      setClients((list) => list.filter((item) => item !== peerID));
    };
    socket.on(Actions.REMOVE_PEER, handleRemovePeer);
  }, []);

  useEffect(() => {
    const handleIceCandidate = async ({ peerID, iceCandidate }) => {
      peerConnections.current[peerID].addIceCandidate(
        new RTCIceCandidate(iceCandidate)
      );
    };
    socket.on(Actions.ICE_CANDIDATE, handleIceCandidate);
  }, []);

  useEffect(() => {
    const handleSessionDescription = async ({
      peerID,
      sessionDescription: remoteDescription,
    }) => {
      await peerConnections.current[peerID].setRemoteDescription(
        remoteDescription
      );

      if (remoteDescription.type === "offer") {
        const answer = await peerConnections.current[peerID].createAnswer();

        await peerConnections.current[peerID].setLocalDescription(answer);
        socket.emit(Actions.RELAY_SDP, {
          peerID,
          sessionDescription: answer,
        });
      }
    };
    socket.on(Actions.SESSION_DESCRIPTION, handleSessionDescription);
  }, []);

  useEffect(() => {
    const startCapture = async () => {
      localMediaStream.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: {
          width: 1280,
          height: 720,
        },
      });

      addNewClient(LOCAL_VIDEO, () => {
        const localVideoElem = peerMediaElements.current[LOCAL_VIDEO];

        if (localVideoElem) {
          localVideoElem.volume = 0;
          localVideoElem.srcObject = localMediaStream.current;
        }
      });
    };
    startCapture()
      .then(() => socket.emit(Actions.JOIN, { room: roomId }))
      .catch((err) => console.log(err));

    return () => {
      localMediaStream.current.getTracks().forEach((track) => track.stop());
      socket.emit(Actions.LEAVE);
    };
  }, [roomId]);

  const provideMediaRef = (clientId, instanceNode) => {
    peerMediaElements.current[clientId] = instanceNode;
  };
  return { clients, provideMediaRef };
};

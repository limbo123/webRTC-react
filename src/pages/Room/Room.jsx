import React from "react";
import { useParams } from "react-router";
import { LOCAL_VIDEO, useWebRTC } from "../../hooks/useWebRTC";
import "./Room.css";

const Room = () => {
  const { id: currentRoomId } = useParams();
  const { clients, provideMediaRef } = useWebRTC(currentRoomId);
  console.log(clients);

  return (
    <div>
      {clients.map((clientId) => {
        const isMe = clientId === LOCAL_VIDEO;
        return (
          <div key={clientId}>
            <video
              ref={(instance) => provideMediaRef(clientId, instance)}
              className={isMe ? "my-video" : ""}
              autoPlay
              playsInline
              muted={isMe}
            />
          </div>
        );
      })}
    </div>
  );
};

export default Room;

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import socket from "../../socket";
import Actions from "../../socket/action";
import { v4 } from "uuid";

const Main = () => {
  const [rooms, setRooms] = useState([]);
  const navigate = useNavigate();

  const rootNode = useRef();

  useEffect(() => {
    socket.on(Actions.SHARE_ROOMS, (data) => {
      if (rootNode.current) {
        setRooms(data.rooms);
      }
    });
  }, []);

  const joinRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  const createRoom = () => {
    const roomId = v4();
    navigate(`/room/${roomId}`);
  };

  return (
    <div ref={rootNode}>
      <button type="button" onClick={createRoom}>
        Create new room
      </button>
      <div className="rooms-list">
        {rooms.map((roomId) => (
          <div key={roomId} className="rooms-list__item">
            <p>{roomId}</p>
            <button type="button" onClick={() => joinRoom(roomId)}>
              Join
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Main;
